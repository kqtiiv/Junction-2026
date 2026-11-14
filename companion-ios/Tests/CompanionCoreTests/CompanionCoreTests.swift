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
        XCTAssertTrue(PlatformIntentGrammar.wantsCapture("does this fit my week"))
        XCTAssertTrue(PlatformIntentGrammar.wantsCapture("mahtuuko tämä"))
        XCTAssertTrue(PlatformIntentGrammar.wantsCapture("scan the receipt"))
        XCTAssertTrue(PlatformIntentGrammar.wantsCapture("får den här plats"))
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("what's safe to spend"))
    }

    /// Review finding: the demo's main question took an unrequested photo.
    func testTimePhrasesNeverTriggerACapture() {
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("what's safe to spend this week"))
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("how much did I spend this month"))
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("paljonko voin käyttää tällä viikolla"))
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("hur mycket har jag kvar den här veckan"))
        XCTAssertFalse(PlatformIntentGrammar.wantsCapture("det är dyrt"), "Swedish 'det' alone is not a capture")
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

    func testSimulatedGlassesWorkWithPhoneAudio() {
        let t = DeviceStateTracker(sessionID: "s", bridge: MockGlassesBridge())
        t.apply(.registration(.registered)); t.apply(.availability(.available)); t.apply(.session(.started))
        t.audioRoute = .phone // the iOS Simulator has no Bluetooth route
        let snap = t.snapshot()
        XCTAssertEqual(snap.mode, .glasses)
        XCTAssertEqual(snap.glassesBackend, .mock)
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

    func testThermalRecoveryEndsPhoneOnly() {
        let t = DeviceStateTracker(sessionID: "s", bridge: MockGlassesBridge())
        t.apply(.registration(.registered)); t.apply(.availability(.available)); t.apply(.session(.started))
        t.apply(.degraded(.thermal))
        XCTAssertEqual(t.snapshot().mode, .phoneOnly)
        t.apply(.recovered(.thermal))
        XCTAssertEqual(t.snapshot().mode, .glasses, "cooled down: back to glasses without a new session")
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

final class JPEGMetadataStripperTests: XCTestCase {
    /// Inserts segments after SOI of the sample JPEG.
    private func jpeg(with segments: [[UInt8]]) -> Data {
        var b = [UInt8](MockGlassesBridge.sampleJPEG())
        b.insert(contentsOf: segments.flatMap { $0 }, at: 2)
        return Data(b)
    }
    private func seg(_ marker: UInt8, _ body: [UInt8]) -> [UInt8] {
        let len = body.count + 2
        return [0xFF, marker, UInt8(len >> 8), UInt8(len & 0xFF)] + body
    }

    func testRemovesExifXmpIptcAndComments() throws {
        let exif = seg(0xE1, Array("Exif\0\0MM\0*GPSDATA".utf8))
        let xmp = seg(0xE1, Array("http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>".utf8))
        let iptc = seg(0xED, Array("Photoshop 3.0\0".utf8))
        let comment = seg(0xFE, Array("shot at home".utf8))
        let icc = seg(0xE2, Array("ICC_PROFILE\0".utf8))
        let dirty = jpeg(with: [exif, xmp, iptc, comment, icc])
        XCTAssertTrue(containsEXIF(dirty))

        let clean = try JPEGMetadataStripper.strip(dirty)
        XCTAssertFalse(containsEXIF(clean))
        XCTAssertNil(clean.range(of: Data("xmpmeta".utf8)))
        XCTAssertNil(clean.range(of: Data("Photoshop".utf8)))
        XCTAssertNil(clean.range(of: Data("shot at home".utf8)))
        XCTAssertNotNil(clean.range(of: Data("ICC_PROFILE".utf8)), "colour profile is kept")
        XCTAssertEqual(clean, MockGlassesBridge.sampleJPEG().prefix(2) + Data(icc) + MockGlassesBridge.sampleJPEG().dropFirst(2),
                       "only metadata segments are removed; everything else is byte-identical")
    }

    func testCleanJPEGIsUnchangedAndScanDataIsCopiedVerbatim() throws {
        var b = [UInt8](MockGlassesBridge.sampleJPEG())
        // Replace EOI with a start-of-scan segment followed by entropy data that contains 0xFF 0xE1.
        b.removeLast(2)
        b += [0xFF, 0xDA, 0x00, 0x02, 0x12, 0xFF, 0xE1, 0x00, 0x34, 0xFF, 0xD9]
        let input = Data(b)
        XCTAssertEqual(try JPEGMetadataStripper.strip(input), input)
    }

    func testRejectsNonJPEG() {
        XCTAssertThrowsError(try JPEGMetadataStripper.strip(Data("not a jpeg".utf8)))
    }

    /// On macOS this runs the real ImageIO re-encode (which adds its own Exif block) + strip:
    /// exactly the path that failed in the iOS Simulator before the stripper existed.
    func testMinimiserOutputHasNoEXIF() throws {
        let photo = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent("App/Resources/demo_price_label.jpg")
        var b = [UInt8](try Data(contentsOf: photo))
        b.insert(contentsOf: seg(0xE1, Array("Exif\0\0MM\0*".utf8)), at: 2)
        let dirty = Data(b)
        XCTAssertTrue(containsEXIF(dirty))
        let out = try ImageMinimiser.minimise(dirty)
        XCTAssertFalse(containsEXIF(out.data))
        XCTAssertTrue(out.steps.contains("exif_stripped"))
    }
}
