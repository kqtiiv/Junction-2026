// The companion's turn flow (L2), independent of UI and of the DAT SDK:
//   session → consent → device-state publishing → (capture →) turn → confirmation.
// The UI layer wraps this; tests and `companion-smoke` drive it directly.
import Foundation
import Contracts

public struct CompanionConfig {
    public var baseURL: URL
    public var token: String
    /// Must match the user the token authenticates (the backend checks).
    public var userRef: String
    public var locale: String
    public var capabilityID = "sbank.coach"

    public init(baseURL: URL, token: String, userRef: String, locale: String) {
        self.baseURL = baseURL; self.token = token; self.userRef = userRef; self.locale = locale
    }
}

/// What a finished turn produced, ready for speech and the phone UI.
public struct TurnOutcome {
    public var speech: String?
    public var epistemic: Epistemic?
    public var status: DomainResponseStatus?
    public var cards: [InsightCard] = []
    public var proposal: ActionProposal?
    public var error: ErrorEnvelope?
    /// Parsed `x_debug` (backend, mock, verified, latency) for the debug overlay.
    public var debug: [String: Any] = [:]
    /// True when the turn was aborted (no final delivered, DEC-011).
    public var aborted = false
}

public enum CaptureSource { case glasses, phoneCamera }

public enum ConfirmMethod {
    case phoneTap(uiEventID: String)
    case glassesGesture(GlassesInput)
    case voice(Transcript)
}

public enum CompanionError: Error, Equatable {
    case notStarted
    case noConsent
    case glassesUnavailable
    case nothingToConfirm
}

public final class CompanionCoordinator {
    public let config: CompanionConfig
    public let client: OrchestratorClient
    public let bridge: GlassesBridge
    public private(set) var session: SessionInfo?
    public private(set) var tracker: DeviceStateTracker?
    public private(set) var consent: ConsentGrantInfo?
    public private(set) var pendingProposal: ActionProposal?
    public private(set) var lastOutcome: TurnOutcome?
    public var discreetMode = false
    /// Replaced on iOS by `ImageMinimiser.minimise` (it is the default where ImageIO exists).
    public var minimise: (Data) throws -> MinimisedImage = { try ImageMinimiser.minimise($0) }
    /// Called whenever device state is published (for the debug overlay).
    public var onDeviceState: ((DeviceSessionState) -> Void)?

    private var recentTurns: [ConversationTurn] = []
    private var eventsTask: Task<Void, Never>?

    public init(config: CompanionConfig, bridge: GlassesBridge, client: OrchestratorClient? = nil) {
        self.config = config
        self.bridge = bridge
        self.client = client ?? OrchestratorClient(baseURL: config.baseURL, token: config.token)
    }

    deinit { eventsTask?.cancel() }

    // MARK: Lifecycle

    /// Creates the platform session and starts mirroring glasses events into DeviceSessionState.
    public func start(mode: Mode = .glasses) async throws {
        let info = try await client.createSession(mode: mode, capabilities: bridge.deviceCapabilities, locale: config.locale)
        session = info
        let tracker = DeviceStateTracker(sessionID: info.sessionID, bridge: bridge)
        self.tracker = tracker
        let events = bridge.events
        eventsTask = Task { [weak self] in
            for await event in events {
                guard let self, let tracker = self.tracker else { return }
                if tracker.apply(event) { await self.publishDeviceState() }
            }
        }
        await bridge.configure()
        await publishDeviceState()
    }

    /// Records the combined consent from the first-launch consent screen.
    public func recordConsent(dataClasses: [String], purposes: [String]) async throws {
        consent = try await client.grantConsent(capabilityID: config.capabilityID, dataClasses: dataClasses, purposes: purposes)
    }

    public func setAudioRoute(_ route: AudioRoute) async {
        tracker?.mutate { $0.audioRoute = route }
        await publishDeviceState()
    }

    public func chooseGlasses(_ useGlasses: Bool) async {
        tracker?.mutate { $0.userChosePhone = !useGlasses }
        await publishDeviceState()
    }

    public func publishDeviceState() async {
        guard let tracker else { return }
        let snap = tracker.snapshot()
        onDeviceState?(snap)
        do { try await client.putDeviceState(snap) } catch { /* the next change publishes again */ }
    }

    public var mode: Mode { tracker?.currentMode() ?? .phoneOnly }

    // MARK: Turns

    /// Asks a question. If `capture` is set, a photo is taken first and attached (user-initiated only).
    public func ask(_ transcript: Transcript, invocation: Invocation = .phonePushToTalk,
                    capture: CaptureSource? = nil, purpose: String = "price_label",
                    phonePhoto: Data? = nil) async throws -> TurnOutcome {
        guard let session, let tracker else { throw CompanionError.notStarted }
        var captureIDs: [String] = []
        if let capture {
            guard let consent else { throw CompanionError.noConsent }
            let raw: Data
            let source: String
            switch capture {
            case .glasses:
                guard tracker.degradedReasons().isEmpty else { throw CompanionError.glassesUnavailable }
                tracker.mutate { $0.interaction = .capturePending }
                await publishDeviceState()
                raw = try await bridge.captureStill()
                source = "glasses_photo"
            case .phoneCamera:
                raw = phonePhoto ?? Data()
                source = "phone_camera"
            }
            let clean = try minimise(raw)
            let meta = CaptureMeta(sessionID: session.sessionID, source: source,
                                   trigger: capture == .glasses ? "voice_command" : "phone_tap", purpose: purpose,
                                   minimisation: clean.steps, consentGrantID: consent.consentGrantID, locale: config.locale)
            let uploaded = try await client.uploadCapture(image: clean.data, mime: clean.mime, meta: meta)
            captureIDs.append(uploaded.captureID)
        }

        tracker.mutate { $0.interaction = .processing }
        await publishDeviceState()
        let outcome = try await runTurn(intent(transcript: transcript, invocation: invocation, captureIDs: captureIDs))
        recentTurns.append(ConversationTurn(role: .user, text: transcript.text))
        if let speech = outcome.speech { recentTurns.append(ConversationTurn(role: .assistant, text: speech)) }
        recentTurns = Array(recentTurns.suffix(10))
        if outcome.error == nil, !outcome.aborted { pendingProposal = outcome.proposal }
        let next: Interaction = pendingProposal != nil ? .awaitingConfirmation : .idle
        tracker.mutate { $0.interaction = next }
        await publishDeviceState()
        return outcome
    }

    /// Confirms or rejects the pending proposal. Gesture confirmation is refused by the backend
    /// while a camera stream is active (DEC-007); the phone tap always works.
    public func decide(_ decision: PlatformIntent = .confirm, by method: ConfirmMethod) async throws -> TurnOutcome {
        guard let proposal = pendingProposal else { throw CompanionError.nothingToConfirm }
        let decisionWord = decision == .reject ? "reject" : "confirm"
        var outcome = TurnOutcome()
        switch method {
        case .phoneTap(let uiEventID):
            do {
                let result = try await client.confirm(proposalID: proposal.proposalID, decision: decisionWord,
                                                      channel: .phoneTap, evidence: ["ui_event_id": uiEventID])
                let fi = config.locale.hasPrefix("fi")
                switch result.status {
                case .applied: outcome.speech = fi ? "Tehty. Voit perua sen puhelimessa." : "Done. You can undo it on your phone."
                case .rejectedByUser: outcome.speech = fi ? "Selvä, en tee sitä." : "OK, I won't."
                default: outcome.speech = fi ? "Jokin meni vikaan." : "Something went wrong."
                }
            } catch OrchestratorError.api(let env, _) {
                outcome.error = env
            }
        case .glassesGesture(let input):
            outcome = try await runTurn(intent(transcript: nil, invocation: .glassesInput, input: input, platformIntent: decision))
        case .voice(let transcript):
            outcome = try await runTurn(intent(transcript: transcript, invocation: .phonePushToTalk, platformIntent: decision))
        }
        if outcome.error == nil { pendingProposal = nil }
        tracker?.mutate { $0.interaction = .idle }
        await publishDeviceState()
        return outcome
    }

    /// Platform intents other than confirm/reject (stop, repeat, show on phone, next card).
    public func platformIntent(_ pi: PlatformIntent, transcript: Transcript? = nil) async throws -> TurnOutcome {
        try await runTurn(intent(transcript: transcript, invocation: transcript == nil ? .typed : .phonePushToTalk, platformIntent: pi))
    }

    // MARK: Internals

    private func intent(transcript: Transcript?, invocation: Invocation, captureIDs: [String] = [],
                        input: GlassesInput? = nil, platformIntent: PlatformIntent? = nil) -> VoiceIntent {
        // A typed platform intent still needs a transcript (the schema requires it for typed turns).
        let t = transcript ?? (invocation == .glassesInput ? nil : Transcript(asrProvider: nil, confidence: nil, lang: config.locale, text: platformIntent?.rawValue ?? ""))
        return VoiceIntent(
            attachedCaptureIDS: captureIDs,
            capabilityHint: nil,
            context: TurnContext(activeCapability: config.capabilityID, conversationRef: session?.conversationRef ?? "",
                                 pendingProposalID: pendingProposal?.proposalID, recentTurns: recentTurns),
            deviceCapabilities: bridge.deviceCapabilities,
            input: input,
            invocation: invocation,
            output: OutputPreferences(discreetMode: discreetMode, display: .phone, speech: true),
            platformIntent: platformIntent,
            schema: .platformVoiceIntentV1,
            sessionID: session?.sessionID ?? "",
            transcript: t,
            turnID: "t_\(UUID().uuidString.prefix(12).lowercased())",
            userRef: config.userRef
        )
    }

    private func runTurn(_ intent: VoiceIntent) async throws -> TurnOutcome {
        var outcome = TurnOutcome()
        var sawFinal = false
        do {
            for try await event in client.turn(intent) {
                switch event {
                case .error(let env):
                    outcome.error = env
                case .event(let e, let raw):
                    switch e.type {
                    case .card: if let c = e.card { outcome.cards.append(c) }
                    case .proposal: if let p = e.proposal { outcome.proposal = p }
                    case .progress: break
                    case .typeFinal:
                        sawFinal = true
                        if let r = e.response {
                            outcome.speech = r.speech.text
                            outcome.epistemic = r.speech.epistemic
                            outcome.status = r.status
                            outcome.cards = r.cards
                            outcome.proposal = r.proposals.first
                        }
                        if let obj = try? JSONSerialization.jsonObject(with: raw) as? [String: Any],
                           let resp = obj["response"] as? [String: Any], let dbg = resp["x_debug"] as? [String: Any] {
                            outcome.debug = dbg
                        }
                    }
                }
            }
        } catch OrchestratorError.api(let env, _) {
            outcome.error = env
        }
        if let env = outcome.error, outcome.speech == nil {
            outcome.speech = OrchestratorError.api(env, status: 0).userMessage(locale: config.locale)
        }
        outcome.aborted = !sawFinal && outcome.error == nil
        lastOutcome = outcome
        return outcome
    }
}
