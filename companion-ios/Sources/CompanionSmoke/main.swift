// End-to-end smoke test of the companion flow against a running backend, using the mock
// glasses. Exercises the same code the app uses (CompanionCoordinator) and the backend's
// schema validation of everything the companion sends.
//
//   BACKEND_URL=http://localhost:8787 TOKEN=demo-token USER_REF=u_7f3a swift run companion-smoke
// Needs a freshly started backend: the fixture engine keeps planned purchases in memory.
import Foundation
import Contracts
import CompanionCore

let env = ProcessInfo.processInfo.environment
let config = CompanionConfig(
    baseURL: URL(string: env["BACKEND_URL"] ?? "http://localhost:8787")!,
    token: env["TOKEN"] ?? "demo-token",
    userRef: env["USER_REF"] ?? "u_7f3a",
    locale: env["LOCALE"] ?? "en-FI"
)

func say(_ label: String, _ o: TurnOutcome) {
    print("  \(label)")
    if let s = o.speech { print("    speech:   \(s)") }
    if let e = o.error { print("    error:    \(e.code)") }
    for c in o.cards {
        if case .money(let m)? = c.primary?.value { print("    card:     \(c.title["en"] ?? "") = €\(m.amount) [\(c.epistemic.rawValue)]") }
    }
    if let p = o.proposal { print("    proposal: \(p.kind) via \(p.confirmChannels.map(\.rawValue).joined(separator: ", "))") }
    if !o.debug.isEmpty { print("    debug:    backend=\(o.debug["backend"] ?? "?") mock=\(o.debug["mock"] ?? "?") verified=\(o.debug["verified"] ?? "?")") }
}

func transcript(_ text: String) -> Transcript {
    Transcript(asrProvider: "asr.smoke", confidence: 0.95, lang: config.locale, text: text)
}

let bridge = MockGlassesBridge(flags: ExperimentalFlags(voiceInvocation: false, inputs: true))
let companion = CompanionCoordinator(config: config, bridge: bridge)
companion.onDeviceState = { s in print("  device-state seq=\(s.seq) mode=\(s.mode.rawValue) backend=\(s.glassesBackend.rawValue) reasons=\(s.degradedReasons.map(\.rawValue))") }

do {
    print("1. session + consent + glasses")
    try await companion.start()
    try await companion.recordConsent(dataClasses: ["financial_transactions", "observed_prices"], purposes: ["price_label", "receipt"])
    try await bridge.startRegistration()
    try await bridge.startSession()
    await companion.setAudioRoute(.glassesHfp)
    try await Task.sleep(nanoseconds: 200_000_000)

    print("2. voice question")
    say("what's safe to spend this week", try await companion.ask(transcript("what's safe to spend this week")))

    print("3. price label from the glasses")
    let aff = try await companion.ask(transcript("does this fit my week"), invocation: .heyMeta, capture: .glasses)
    say("does this fit my week (+ capture)", aff)

    guard aff.proposal != nil else {
        print("FAILED: no plan proposal. The backend keeps fixture state in memory; restart it before re-running the smoke test.")
        exit(1)
    }

    print("4. confirm with a glasses tap")
    say("tap", try await companion.decide(.confirm, by: .glassesGesture(GlassesInput(deviceEventID: "smoke_tap", kind: .tap))))

    print("5. allowance after planning")
    say("what's safe to spend this week", try await companion.ask(transcript("what's safe to spend this week")))

    print("6. glasses taken off → phone only")
    bridge.simulateHingesClosed()
    try await Task.sleep(nanoseconds: 200_000_000)
    let refused = try? await companion.ask(transcript("does this fit my week"), capture: .glasses)
    print("    glasses capture while phone_only: \(refused == nil ? "refused locally" : "UNEXPECTEDLY ALLOWED")")
    say("same question on the phone", try await companion.ask(transcript("what's safe to spend this week")))
    print("OK")
} catch {
    print("FAILED: \(error)")
    exit(1)
}
