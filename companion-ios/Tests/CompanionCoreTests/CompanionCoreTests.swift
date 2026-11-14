import XCTest
import Contracts
@testable import CompanionCore

final class SSEParserTests: XCTestCase {
    func testParsesEventsAndData() {
        let body = "event: card\ndata: {\"a\":1}\n\nevent: final\ndata: {\"b\":2}\n\n"
        XCTAssertEqual(SSEParser.parse(body), [SSEMessage(event: "card", data: "{\"a\":1}"), SSEMessage(event: "final", data: "{\"b\":2}")])
    }

    func testCommentsCRLFAndUnterminatedLastBlock() {
        let body = ": keep-alive\r\nevent: error\r\ndata: {}\r\n"
        XCTAssertEqual(SSEParser.parse(body), [SSEMessage(event: "error", data: "{}")])
    }
}

final class GrammarTests: XCTestCase {
    func testWholeUtteranceOnly() {
        XCTAssertEqual(PlatformIntentGrammar.match("Confirm."), .confirm)
        XCTAssertEqual(PlatformIntentGrammar.match("vahvista"), .confirm)
        XCTAssertEqual(PlatformIntentGrammar.match("Stop!"), .stop)
        XCTAssertEqual(PlatformIntentGrammar.match("toista"), .platformIntentRepeat)
        XCTAssertNil(PlatformIntentGrammar.match("yeah sure"), "casual yes is not a confirmation")
        XCTAssertNil(PlatformIntentGrammar.match("stop by the shop"))
    }

    func testCaptureKeywords() {
        XCTAssertTrue(PlatformIntentGrammar.wantsCapture("does this fit"))
        XCTAssertTrue(PlatformIntentGrammar.wantsCapture("mahtuuko tämä"))
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("what's safe to spend"))
    }
}

final class VoiceIntentEncodingTests: XCTestCase {
    func testRequiredNullableKeysArePresentAsNull() throws {
        let intent = VoiceIntent(
            attachedCaptureIDS: [], capabilityHint: nil,
            context: TurnContext(activeCapability: nil, conversationRef: "c", pendingProposalID: nil, recentTurns: []),
            deviceCapabilities: [], input: nil, invocation: .typed,
            output: OutputPreferences(discreetMode: false, display: .phone, speech: true),
            platformIntent: nil, schema: .platformVoiceIntentV1, sessionID: "s",
            transcript: Transcript(asrProvider: nil, confidence: nil, lang: "en", text: "hi"), turnID: "t", userRef: "u")
        let obj = try JSONSerialization.jsonObject(with: ContractsCoding.encode(intent)) as! [String: Any]
        XCTAssertTrue(obj["platform_intent"] is NSNull)
        XCTAssertTrue(obj["capability_hint"] is NSNull)
        let ctx = obj["context"] as! [String: Any]
        XCTAssertTrue(ctx["active_capability"] is NSNull)
        XCTAssertTrue(ctx["pending_proposal_id"] is NSNull)
        XCTAssertNil(obj["input"], "optional, not required: omitted")
    }

    func testDatesWithAndWithoutMilliseconds() {
        XCTAssertNotNil(ContractsCoding.parseDate("2026-11-19T17:52:07.123Z"))
        XCTAssertNotNil(ContractsCoding.parseDate("2026-11-19T17:52:07+02:00"))
    }
}

final class ContractExampleTests: XCTestCase {
    /// contracts/examples/v1/valid, relative to this file.
    static let examples = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent().appendingPathComponent("contracts/examples/v1/valid")

    func decode<T: Decodable>(_ type: T.Type, _ file: String) throws -> T {
        try ContractsCoding.decoder().decode(T.self, from: Data(contentsOf: Self.examples.appendingPathComponent(file)))
    }

    func testExamplesDecodeWithGeneratedTypes() throws {
        XCTAssertEqual(try decode(DeviceSessionState.self, "device_session_state.glasses_capture.json").seq, 17)
        XCTAssertEqual(try decode(VoiceIntent.self, "voice_intent.gesture_confirm.json").platformIntent, .confirm)
        XCTAssertEqual(try decode(InsightCard.self, "insight_card.affordability.json").epistemic, .estimate)
        XCTAssertEqual(try decode(ActionProposal.self, "action_proposal.plan_add.json").kind, "finance.plan.add")
        XCTAssertEqual(try decode(DomainResponseEvent.self, "domain_response_event.final.json").type, .typeFinal)
        XCTAssertEqual(try decode(ErrorEnvelope.self, "error_envelope.proposal_expired.json").code, "PROPOSAL_EXPIRED")
        XCTAssertEqual(try decode(ContextCapture.self, "context_capture.price_label.json").purpose, "price_label")
    }
}

final class DeviceStateTrackerTests: XCTestCase {
    func testPhoneOnlyUntilEverythingIsReady() {
        let bridge = MockGlassesBridge()
        let t = DeviceStateTracker(sessionID: "s", bridge: bridge)
        var snap = t.snapshot()
        XCTAssertEqual(snap.mode, .phoneOnly)
        XCTAssertFalse(snap.degradedReasons.isEmpty, "phone_only must give a reason")
        XCTAssertEqual(snap.glassesBackend, .mock)

        t.apply(.registration(.registered)); t.apply(.availability(.available))
        t.apply(.session(.starting)); t.apply(.session(.started)); t.audioRoute = .glassesHfp
        snap = t.snapshot()
        XCTAssertEqual(snap.mode, .glasses)
        XCTAssertEqual(snap.degradedReasons, [])
        XCTAssertEqual(snap.seq, 2, "seq is monotonic")
    }

    func testStreamOnlyInsideStartedSessionAndCaptureNeedsStream() {
        let t = DeviceStateTracker(sessionID: "s", bridge: MockGlassesBridge())
        t.apply(.registration(.registered)); t.apply(.availability(.available)); t.audioRoute = .glassesHfp
        t.apply(.session(.started))
        t.apply(.camera(permission: .grantedAlways, stream: .streaming))
        t.interaction = .capturePending
        XCTAssertEqual(t.snapshot().interaction, .capturePending)
        t.apply(.session(.paused))
        let paused = t.snapshot()
        XCTAssertEqual(paused.camera.stream, .stopped, "no stream outside a started session")
        XCTAssertEqual(paused.interaction, .processing, "capture_pending needs an active stream")
    }

    func testHingesClosedIsTerminalAndExplained() {
        let t = DeviceStateTracker(sessionID: "s", bridge: MockGlassesBridge())
        t.apply(.registration(.registered)); t.apply(.availability(.available)); t.apply(.session(.started)); t.audioRoute = .glassesHfp
        t.apply(.degraded(.hingesClosed)); t.apply(.session(.stopped))
        let snap = t.snapshot()
        XCTAssertEqual(snap.mode, .phoneOnly)
        XCTAssertTrue(snap.degradedReasons.contains(.hingesClosed))
        XCTAssertTrue(snap.degradedReasons.contains(.sessionStopped))
        t.apply(.session(.starting)); t.apply(.session(.started))
        XCTAssertEqual(t.snapshot().mode, .glasses, "a new session recovers")
    }

    func testLongPauseDropsToPhone() {
        let t = DeviceStateTracker(sessionID: "s", bridge: MockGlassesBridge())
        t.apply(.registration(.registered)); t.apply(.availability(.available)); t.apply(.session(.started)); t.audioRoute = .glassesHfp
        let start = Date()
        t.apply(.session(.paused), now: start)
        XCTAssertEqual(t.snapshot(now: start.addingTimeInterval(5)).mode, .glasses)
        XCTAssertEqual(t.snapshot(now: start.addingTimeInterval(31)).mode, .phoneOnly)
    }

    func testExperimentalFeaturesDeclared() {
        let t = DeviceStateTracker(sessionID: "s", bridge: MockGlassesBridge(flags: ExperimentalFlags(voiceInvocation: true, inputs: true)))
        let snap = t.snapshot()
        XCTAssertTrue(snap.deviceCapabilities.contains(.voiceInvocation))
        XCTAssertTrue(snap.experimentalFeatures.contains(.voiceInvocation))
        XCTAssertTrue(snap.experimentalFeatures.contains(.inputs))
    }
}

final class CaptureTests: XCTestCase {
    func testSampleJPEGHasNoEXIFAndMultipartCarriesIt() throws {
        let jpeg = MockGlassesBridge.sampleJPEG()
        XCTAssertFalse(containsEXIF(jpeg))
        let m = Multipart(parts: [.field(name: "meta", value: "{}"), .file(name: "image", filename: "c.jpg", mime: "image/jpeg", data: jpeg)], boundary: "B")
        let text = String(decoding: m.body, as: UTF8.self)
        XCTAssertTrue(text.hasPrefix("--B\r\nContent-Disposition: form-data; name=\"meta\""))
        XCTAssertTrue(text.hasSuffix("--B--\r\n"))
        XCTAssertEqual(m.contentType, "multipart/form-data; boundary=B")
    }

    func testMockCaptureNeedsASessionAndStopsTheStream() async throws {
        let bridge = MockGlassesBridge()
        do { _ = try await bridge.captureStill(); XCTFail("no session") } catch {}
        try await bridge.startSession()
        let photo = try await bridge.captureStill()
        XCTAssertEqual(photo, MockGlassesBridge.sampleJPEG())
    }
}
