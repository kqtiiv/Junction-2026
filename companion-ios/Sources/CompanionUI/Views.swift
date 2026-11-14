// SwiftUI views: a generic, schema-driven card renderer (any capability's InsightCard),
// the confirm sheet, consent, and the debug overlay. iOS only.
#if os(iOS)
import SwiftUI
import Contracts
import CompanionCore

// MARK: Formatting

enum Display {
    static func text(_ l: [String: String], locale: String) -> String {
        l[String(locale.prefix(2))] ?? l["en"] ?? l.values.first ?? ""
    }

    /// Exact decimal → localised currency. Never goes through Double.
    static func money(_ m: Money, locale: String) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "EUR"
        f.locale = Locale(identifier: locale)
        return f.string(from: NSDecimalNumber(string: m.amount)) ?? "€\(m.amount)"
    }

    /// Detail values that are plain decimals ("90.16") are money: format them like card values.
    static func detail(_ s: String, locale: String) -> String {
        s.range(of: #"^-?\d+\.\d{2}$"#, options: .regularExpression) != nil
            ? money(Money(amount: s, currency: .eur), locale: locale) : s
    }

    static func value(_ v: Value, locale: String) -> String {
        switch v {
        case .money(let m): return money(m, locale: locale)
        case .string(let s): return s
        }
    }
}

/// Epistemic label chip: users always see what kind of claim a number is.
struct EpistemicChip: View {
    let epistemic: Epistemic
    var body: some View {
        Text(label).font(.caption2.weight(.semibold)).padding(.horizontal, 6).padding(.vertical, 2)
            .background(color.opacity(0.15), in: Capsule()).foregroundStyle(color)
            .accessibilityLabel("Kind of value: \(label)")
    }
    private var label: String {
        switch epistemic {
        case .fact: "fact"
        case .calculated: "calculated"
        case .estimate: "estimate"
        case .educational: "general info"
        case .observed: "read by camera"
        }
    }
    private var color: Color {
        switch epistemic {
        case .fact, .calculated: .green
        case .estimate: .orange
        case .educational: .blue
        case .observed: .purple
        }
    }
}

// MARK: Cards

public struct CardView: View {
    let card: InsightCard
    let locale: String
    @State private var showBasis = false

    public init(card: InsightCard, locale: String) { self.card = card; self.locale = locale }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(Display.text(card.title, locale: locale)).font(.headline)
                Spacer()
                EpistemicChip(epistemic: card.epistemic)
            }
            if let primary = card.primary {
                Text(Display.value(primary.value, locale: locale)).font(.system(size: 34, weight: .bold, design: .rounded))
                Text(Display.text(primary.label, locale: locale)).font(.subheadline).foregroundStyle(.secondary)
            }
            ForEach(Array((card.rows ?? []).enumerated()), id: \.offset) { _, row in
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(Display.text(row.label, locale: locale))
                        if let note = row.note { Text(Display.text(note, locale: locale)).font(.caption).foregroundStyle(.secondary) }
                    }
                    Spacer()
                    Text(Display.value(row.value, locale: locale)).monospacedDigit()
                    EpistemicChip(epistemic: row.epistemic)
                }
            }
            if let body = card.body { Text(Display.text(body, locale: locale)).font(.callout) }
            if !card.assumptions.isEmpty || !card.basis.calcIDS.isEmpty {
                Button(showBasis ? "Hide calculation" : "How was this calculated?") { showBasis.toggle() }.font(.callout)
                if showBasis {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(Array(card.assumptions.enumerated()), id: \.offset) { _, a in
                            Text("• \(Display.text(a, locale: locale))").font(.caption)
                        }
                        Text("Calculations: \(card.basis.calcIDS.joined(separator: ", "))").font(.caption2.monospaced()).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(16)
        .background(.background.secondary, in: RoundedRectangle(cornerRadius: 16))
        .accessibilityElement(children: .combine)
    }
}

// MARK: Confirmation

public struct ProposalSheet: View {
    let proposal: ActionProposal
    let locale: String
    let onDecide: (PlatformIntent) -> Void

    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(Display.text(proposal.summary.text, locale: locale)).font(.headline)
            ForEach(Array(proposal.details.enumerated()), id: \.offset) { _, d in
                HStack {
                    Text(Display.text(d.label, locale: locale))
                    Spacer()
                    if let before = d.before { Text(Display.detail(before, locale: locale)).strikethrough().foregroundStyle(.secondary) }
                    Text(Display.detail(d.after, locale: locale)).bold()
                }
            }
            if proposal.reversible { Text("You can undo this later.").font(.caption).foregroundStyle(.secondary) }
            HStack {
                Button("Not now") { onDecide(.reject) }.buttonStyle(.bordered)
                Spacer()
                Button("Confirm") { onDecide(.confirm) }.buttonStyle(.borderedProminent).accessibilityIdentifier("confirmProposal")
            }
        }
        .padding(20)
    }
}

// MARK: Consent

public struct ConsentView: View {
    let onAllow: () -> Void
    public init(onAllow: @escaping () -> Void) { self.onAllow = onAllow }

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Before we start").font(.largeTitle.bold())
            Text("Spendtacles uses:")
            Label("Your transactions, to answer questions about your money", systemImage: "list.bullet.rectangle")
            Label("Prices read from photos you choose to take. The photo is deleted as soon as the price is read.", systemImage: "camera")
            Text("Answers are calculated from your data and labelled as facts or estimates. Nothing is bought or paid on your behalf. You can withdraw this permission at any time.")
                .font(.callout).foregroundStyle(.secondary)
            Spacer()
            Button("Allow", action: onAllow).buttonStyle(.borderedProminent).frame(maxWidth: .infinity).accessibilityIdentifier("allowConsent")
        }
        .padding(24)
    }
}

// MARK: Debug overlay (mocks are never hidden, DEC-005)

struct DebugOverlay: View {
    let state: DeviceSessionState?
    let glassesBackend: String
    let debug: [String: String]

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("glasses: \(glassesBackend) · mode: \(state?.mode.rawValue ?? "–") · seq \(state?.seq ?? 0)")
            if let s = state, !s.degradedReasons.isEmpty { Text("why: \(s.degradedReasons.map(\.rawValue).joined(separator: ", "))") }
            if let s = state, !s.experimentalFeatures.isEmpty { Text("experimental: \(s.experimentalFeatures.map(\.rawValue).joined(separator: ", "))") }
            if !debug.isEmpty {
                Text("answer: \(debug["backend"] ?? "?") · mock \(debug["mock"] ?? "?") · verified \(debug["verified"] ?? "?") · \(debug["latency_ms"] ?? "?") ms")
            }
        }
        .font(.caption2.monospaced())
        .accessibilityIdentifier("debugOverlay")
        .padding(8)
        .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 8))
        .foregroundStyle(.white)
    }
}

// MARK: Main screen

public struct CompanionScreen: View {
    @ObservedObject var model: CompanionViewModel
    @State private var typed = ""
    @State private var showDebug = true

    public init(model: CompanionViewModel) { self.model = model }

    private var locale: String { model.coordinator.config.locale }

    public var body: some View {
        if !model.hasConsent {
            ConsentView { Task { await model.grantConsent() } }
        } else {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        if model.deviceState?.mode == .phoneOnly {
                            Label("Glasses not connected · continuing on phone", systemImage: "iphone")
                                .font(.callout).padding(10).frame(maxWidth: .infinity, alignment: .leading)
                                .background(.yellow.opacity(0.2), in: RoundedRectangle(cornerRadius: 10))
                        }
                        if !model.lastSpeech.isEmpty { Text("“\(model.lastSpeech)”").font(.title3).accessibilityIdentifier("lastSpeech") }
                        if let err = model.errorText { Text(err).foregroundStyle(.red) }
                        ForEach(model.cards, id: \.cardID) { CardView(card: $0, locale: locale) }
                    }
                    .padding()
                }
                .safeAreaInset(edge: .top, spacing: 0) {
                    if showDebug {
                        DebugOverlay(state: model.deviceState, glassesBackend: model.glassesBackend, debug: model.debug)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal)
                    }
                }
                .safeAreaInset(edge: .bottom) { controls }
                .navigationTitle("Spendtacles")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button("Connect glasses") { Task { await model.connectGlasses() } }.accessibilityIdentifier("connectGlasses")
                            Button("Use phone only") { Task { await model.useGlasses(false) } }
                            Toggle("Discreet mode (no amounts spoken)", isOn: $model.discreetMode)
                            Toggle("Debug overlay", isOn: $showDebug)
                        } label: { Image(systemName: "ellipsis.circle") }.accessibilityIdentifier("menu")
                    }
                }
                .sheet(item: Binding(get: { model.proposal.map(Identified.init) }, set: { if $0 == nil { model.dismissProposal() } })) { item in
                    ProposalSheet(proposal: item.value, locale: locale) { decision in Task { await model.confirmByTap(decision) } }
                        .presentationDetents([.medium])
                }
            }
            .task { if !model.started { await model.start() } }
        }
    }

    private var controls: some View {
        VStack(spacing: 8) {
            if model.listening { Text(model.partial.isEmpty ? "Listening…" : model.partial).foregroundStyle(.secondary) }
            HStack {
                TextField("Ask about your money", text: $typed).textFieldStyle(.roundedBorder).accessibilityIdentifier("askField")
                    .onSubmit { let t = typed; typed = ""; Task { await model.ask(typed: t) } }
                Button { model.pushToTalk() } label: {
                    Image(systemName: model.listening ? "waveform" : "mic.fill").font(.title2)
                }
                .disabled(model.busy)
                .accessibilityLabel("Hold to ask")
                Button { Task { await model.stop() } } label: { Image(systemName: "stop.fill") }.accessibilityLabel("Stop")
            }
        }
        .padding()
        .background(.bar)
    }
}

private struct Identified: Identifiable {
    let value: ActionProposal
    var id: String { value.proposalID }
}
#endif
