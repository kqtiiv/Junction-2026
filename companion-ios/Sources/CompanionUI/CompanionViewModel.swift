// UI state for the companion, wrapping CompanionCoordinator. iOS only.
#if os(iOS)
import Foundation
import SwiftUI
import Contracts
import CompanionCore

@MainActor
public final class CompanionViewModel: ObservableObject {
    @Published public private(set) var cards: [InsightCard] = []
    @Published public private(set) var proposal: ActionProposal?
    @Published public private(set) var lastSpeech = ""
    @Published public private(set) var partial = ""
    @Published public private(set) var listening = false
    @Published public private(set) var busy = false
    @Published public private(set) var deviceState: DeviceSessionState?
    @Published public private(set) var debug: [String: String] = [:]
    @Published public private(set) var errorText: String?
    @Published public private(set) var started = false
    @Published public var hasConsent = false
    @Published public var discreetMode = false { didSet { coordinator.discreetMode = discreetMode } }

    public let coordinator: CompanionCoordinator
    private let audio = AudioRouteManager()
    private let speechIn = SpeechInput()
    private let speechOut = SpeechOutput()
    private var turnTask: Task<Void, Never>?
    private var locale: String { coordinator.config.locale }

    public init(coordinator: CompanionCoordinator) {
        self.coordinator = coordinator
        coordinator.onDeviceState = { [weak self] s in Task { @MainActor in self?.deviceState = s } }
    }

    public var glassesBackend: String { coordinator.bridge.backend.rawValue }

    // MARK: Lifecycle

    public func start() async {
        do {
            // UI tests type their questions; system permission alerts would block them.
            if !ProcessInfo.processInfo.arguments.contains("-uiTesting") { _ = await SpeechInput.requestPermissions() }
            try await coordinator.start()
            started = true
            await coordinator.setAudioRoute((try? audio.activateHFP()) ?? .phone)
        } catch { show(error) }
    }

    /// The combined first-launch consent (ARCHITECTURE.md §2.5). Data classes and purposes are
    /// the S-Bank Coach manifest's; the consent screen lists them in plain words.
    public func grantConsent() async {
        do {
            try await coordinator.recordConsent(dataClasses: ["financial_transactions", "observed_prices"], purposes: ["price_label"])
            hasConsent = true
        } catch { show(error) }
    }

    public func connectGlasses() async {
        do {
            // Already registered (e.g. Meta's Mock Device Kit starts registered): don't hand off to the Meta AI app again.
            if coordinator.tracker?.registration != .registered { try await coordinator.bridge.startRegistration() }
            try await coordinator.bridge.startSession()
            await coordinator.setAudioRoute(audio.currentRoute())
        } catch { show(error) }
    }

    public func useGlasses(_ on: Bool) async { await coordinator.chooseGlasses(on) }

    // MARK: Turns

    /// Push-to-talk (the publishable fallback for "Hey Meta", DEC-004/DEC-021).
    public func pushToTalk(invocation: Invocation = .phonePushToTalk) {
        guard !listening else { return }
        speechOut.stop() // barge-in
        listening = true
        partial = ""
        turnTask = Task {
            defer { listening = false }
            do {
                let transcript = try await speechIn.listen(locale: locale) { [weak self] text in
                    Task { @MainActor in self?.partial = text }
                }
                listening = false
                await handle(transcript, invocation: invocation)
            } catch { show(error) }
        }
    }

    public func ask(typed text: String) async {
        await handle(Transcript(asrProvider: nil, confidence: nil, lang: locale, text: text), invocation: .typed)
    }

    private func handle(_ transcript: Transcript, invocation: Invocation) async {
        busy = true
        defer { busy = false }
        do {
            let outcome: TurnOutcome
            if let pi = PlatformIntentGrammar.match(transcript.text) {
                switch pi {
                case .confirm, .reject:
                    outcome = try await coordinator.decide(pi, by: .voice(transcript))
                    proposal = nil
                case .stop, .cancel:
                    speechOut.stop()
                    outcome = try await coordinator.platformIntent(pi, transcript: transcript)
                default:
                    outcome = try await coordinator.platformIntent(pi, transcript: transcript)
                }
            } else {
                // The user starts every capture: only when they say "this…" and the glasses are usable.
                let capture: CaptureSource? = PlatformIntentGrammar.wantsCapture(transcript.text) && coordinator.mode == .glasses ? .glasses : nil
                outcome = try await coordinator.ask(transcript, invocation: invocation, capture: capture)
                cards = outcome.cards
                proposal = outcome.proposal
            }
            apply(outcome)
        } catch { show(error) }
    }

    /// Phone tap: the default, always-available confirmation (DEC-007).
    public func confirmByTap(_ decision: PlatformIntent = .confirm) async {
        do {
            apply(try await coordinator.decide(decision, by: .phoneTap(uiEventID: "ui_\(UUID().uuidString.prefix(8))")))
            proposal = nil
        } catch { show(error) }
    }

    /// Glasses tap (experimental Inputs, flag-gated). The backend refuses it during a stream.
    public func confirmByGesture(_ input: GlassesInput) async {
        guard coordinator.bridge.flags.inputs, proposal != nil else { return }
        do {
            apply(try await coordinator.decide(.confirm, by: .glassesGesture(input)))
            proposal = nil
        } catch { show(error) }
    }

    /// Hides the confirm sheet. The proposal stays pending until it expires or is decided.
    public func dismissProposal() { proposal = nil }

    public func stop() async {
        speechOut.stop()
        speechIn.stop()
        turnTask?.cancel()
        _ = try? await coordinator.platformIntent(.stop)
    }

    private func apply(_ outcome: TurnOutcome) {
        errorText = outcome.error.map { _ in outcome.speech ?? "" }
        debug = outcome.debug.mapValues { "\($0)" }
        if let speech = outcome.speech {
            lastSpeech = speech
            Task { await speechOut.speak(speech, locale: locale) }
        }
    }

    private func show(_ error: Error) {
        errorText = (error as? OrchestratorError)?.userMessage(locale: locale) ?? "\(error)"
    }
}
#endif
