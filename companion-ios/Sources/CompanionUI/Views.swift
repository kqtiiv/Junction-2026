// SwiftUI views: a generic, schema-driven card renderer (any capability's InsightCard),
// the docked confirm panel, consent, and the debug overlay. iOS only.
// Look (DEC-027): one bold element — the answer's main figure on a shelf-price-tag yellow —
// on a quiet aisle-white ground with spruce ink. System fonts only.
#if os(iOS)
import SwiftUI
import UIKit
import Contracts
import CompanionCore

// MARK: Look

enum Look {
    static let aisle = dynamic(light: 0xF3F5F4, dark: 0x101714)   // background
    static let shelf = dynamic(light: 0xFFFFFF, dark: 0x19221E)   // card surface
    static let ink = dynamic(light: 0x1F2D27, dark: 0xE6EDE9)     // text and primary fill
    static let onInk = dynamic(light: 0xFFFFFF, dark: 0x101714)   // text on a primary fill
    static let slate = dynamic(light: 0x56625C, dark: 0xA3B0A9)   // secondary text
    static let line = dynamic(light: 0xDCE2DF, dark: 0x2A3530)    // hairlines
    static let quiet = dynamic(light: 0xE6EBE8, dark: 0x1F2924)   // debug strip
    static let notice = dynamic(light: 0xFFF3C4, dark: 0x3A3418)  // phone-only banner
    static let alert = dynamic(light: 0xB3261E, dark: 0xFF8A80)
    static let tag = Color(hex: 0xFFDA3D)                         // price-tag yellow, both modes
    static let tagInk = Color(hex: 0x1F2D27)

    /// The tag figure: compressed heavy numerals, like a shelf-edge price label.
    static let figure = Font.system(size: 60, weight: .heavy).width(.compressed)

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
    }
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
    }
}

private extension Color {
    init(hex: UInt32) { self.init(uiColor: UIColor(hex: hex)) }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(Look.onInk)
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(Look.ink, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct QuietButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Look.ink)
            .frame(maxWidth: .infinity, minHeight: 44)
            .contentShape(Rectangle())
            .opacity(configuration.isPressed ? 0.6 : 1)
    }
}

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

/// Epistemic label: users always see what kind of claim a number is. A coloured dot plus the
/// word, so the meaning never rests on colour alone.
struct EpistemicChip: View {
    let epistemic: Epistemic
    var body: some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label)
        }
        .font(.caption.weight(.medium))
        .foregroundStyle(Look.slate)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Kind of value: \(label)")
    }
    private var label: String {
        switch epistemic {
        case .fact: "Fact"
        case .calculated: "Calculated"
        case .estimate: "Estimate"
        case .educational: "General info"
        case .observed: "Read by camera"
        }
    }
    private var color: Color {
        switch epistemic {
        case .fact, .calculated: Color(hex: 0x2F7D52)
        case .estimate: Color(hex: 0xC07A12)
        case .educational: Color(hex: 0x2D6CB5)
        case .observed: Color(hex: 0x6A4FB3)
        }
    }
}

// MARK: Cards

/// The card's main figure, set like a shelf-edge price tag.
struct PriceTag: View {
    let value: String
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(Look.figure).monospacedDigit()
                .lineLimit(1).minimumScaleFactor(0.5)
            Text(label).font(.subheadline.weight(.semibold))
        }
        .foregroundStyle(Look.tagInk)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Look.tag, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

public struct CardView: View {
    let card: InsightCard
    let locale: String
    @State private var showBasis = false

    public init(card: InsightCard, locale: String) { self.card = card; self.locale = locale }

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .firstTextBaseline) {
                Text(Display.text(card.title, locale: locale)).font(.headline).foregroundStyle(Look.ink)
                Spacer(minLength: 12)
                EpistemicChip(epistemic: card.epistemic)
            }
            if let primary = card.primary {
                PriceTag(value: Display.value(primary.value, locale: locale), label: Display.text(primary.label, locale: locale))
            }
            let rows = card.rows ?? []
            if !rows.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.offset) { i, row in
                        if i > 0 { Rectangle().fill(Look.line).frame(height: 1) }
                        rowView(row)
                    }
                }
            }
            if let body = card.body {
                Text(Display.text(body, locale: locale)).font(.callout).foregroundStyle(Look.ink)
            }
            if !card.assumptions.isEmpty || !card.basis.calcIDS.isEmpty { basis }
        }
        .padding(18)
        .background(Look.shelf, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(Look.line, lineWidth: 1))
        .accessibilityElement(children: .combine)
    }

    private func rowView(_ row: CardRow) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(Display.text(row.label, locale: locale)).font(.subheadline).foregroundStyle(Look.ink)
                EpistemicChip(epistemic: row.epistemic)
                if let note = row.note {
                    Text(Display.text(note, locale: locale)).font(.caption).foregroundStyle(Look.slate)
                }
            }
            Spacer(minLength: 8)
            Text(Display.value(row.value, locale: locale))
                .font(.subheadline.weight(.semibold)).monospacedDigit()
                .foregroundStyle(Look.ink)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 11)
    }

    private var basis: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { showBasis.toggle() }
            } label: {
                HStack(spacing: 6) {
                    Text(showBasis ? "Hide calculation" : "How was this calculated?")
                    Image(systemName: "chevron.down").font(.caption.weight(.bold))
                        .rotationEffect(.degrees(showBasis ? 180 : 0))
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Look.ink)
            }
            if showBasis {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(card.assumptions.enumerated()), id: \.offset) { _, a in
                        Text("• \(Display.text(a, locale: locale))").font(.caption)
                    }
                    Text("Calculations: \(card.basis.calcIDS.joined(separator: ", "))").font(.caption2.monospaced())
                }
                .foregroundStyle(Look.slate)
                .transition(.opacity)
            }
        }
    }
}

// MARK: Confirmation

/// Docked above the input bar while a proposal waits, so the card it changes stays in view.
public struct ProposalPanel: View {
    let proposal: ActionProposal
    let locale: String
    let onDecide: (PlatformIntent) -> Void

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(Display.text(proposal.summary.text, locale: locale))
                .font(.headline).foregroundStyle(Look.ink)
                .fixedSize(horizontal: false, vertical: true)
            ForEach(Array(proposal.details.enumerated()), id: \.offset) { _, d in
                HStack(spacing: 8) {
                    Text(Display.text(d.label, locale: locale)).foregroundStyle(Look.slate)
                    Spacer(minLength: 8)
                    if let before = d.before {
                        Text(Display.detail(before, locale: locale)).strikethrough().foregroundStyle(Look.slate)
                        Image(systemName: "arrow.right").font(.caption.weight(.semibold)).foregroundStyle(Look.slate)
                            .accessibilityLabel("becomes")
                    }
                    Text(Display.detail(d.after, locale: locale)).fontWeight(.semibold).foregroundStyle(Look.ink)
                }
                .font(.subheadline).monospacedDigit()
            }
            VStack(spacing: 2) {
                Button { onDecide(.confirm) } label: { Text("Confirm") }
                    .buttonStyle(PrimaryButtonStyle())
                    .accessibilityIdentifier("confirmProposal")
                Button("Not now") { onDecide(.reject) }.buttonStyle(QuietButtonStyle())
            }
            .padding(.top, 4)
            Text(proposal.reversible ? "Nothing is bought or paid. You can undo this later." : "Nothing is bought or paid.")
                .font(.caption).foregroundStyle(Look.slate)
                .frame(maxWidth: .infinity)
        }
        .padding(18)
        .background(Look.shelf, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(Look.line, lineWidth: 1))
    }
}

// MARK: Consent

public struct ConsentView: View {
    let onAllow: () -> Void
    public init(onAllow: @escaping () -> Void) { self.onAllow = onAllow }

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                Image(systemName: "eyeglasses")
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(Look.onInk)
                    .frame(width: 60, height: 60)
                    .background(Look.ink, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 10) {
                    Text("Before we start").font(.largeTitle.bold()).foregroundStyle(Look.ink)
                    Text("Spendtacles tells you what a purchase would leave you with, before you buy it.")
                        .foregroundStyle(Look.slate)
                }
                VStack(spacing: 0) {
                    row("list.bullet.rectangle", "Your transactions",
                        "To answer questions about your money. Every number is labelled as a fact or an estimate.")
                    Rectangle().fill(Look.line).frame(height: 1)
                    row("camera", "Photos only when you ask",
                        "One photo of the price label. It's deleted as soon as the price is read.")
                    Rectangle().fill(Look.line).frame(height: 1)
                    row("hand.raised", "Nothing happens without your OK",
                        "Nothing is bought or paid on your behalf. You can withdraw this permission at any time.")
                }
                .padding(.horizontal, 16)
                .background(Look.shelf, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(Look.line, lineWidth: 1))
            }
            .padding(.horizontal, 24)
            .padding(.top, 40)
            .padding(.bottom, 24)
        }
        .safeAreaInset(edge: .bottom) {
            Button(action: onAllow) { Text("Allow and continue") }
                .buttonStyle(PrimaryButtonStyle())
                .accessibilityIdentifier("allowConsent")
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Look.aisle)
        }
        .background(Look.aisle.ignoresSafeArea())
    }

    private func row(_ icon: String, _ title: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Look.ink)
                .frame(width: 36, height: 36)
                .background(Look.aisle, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.body.weight(.semibold)).foregroundStyle(Look.ink)
                Text(text).font(.subheadline).foregroundStyle(Look.slate)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 16)
        .accessibilityElement(children: .combine)
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
        .foregroundStyle(Look.slate)
        .accessibilityIdentifier("debugOverlay")
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Look.quiet, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: Main screen

/// Where the glasses stand, in words: the header pill. A mock is always named (DEC-005).
struct GlassesStatus: View {
    let mode: Contracts.Mode?
    let backend: String
    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(dot).frame(width: 8, height: 8)
            Text(label)
        }
        .font(.footnote.weight(.semibold))
        .foregroundStyle(Look.ink)
        .padding(.horizontal, 12)
        .frame(height: 32)
        .background(Look.shelf, in: Capsule())
        .overlay(Capsule().strokeBorder(Look.line, lineWidth: 1))
    }
    private var connected: Bool { mode == .glasses }
    private var label: String {
        guard connected else { return "Phone only" }
        return backend == "mock" ? "Simulated glasses" : "Glasses connected"
    }
    private var dot: Color {
        guard connected else { return Look.slate }
        return backend == "mock" ? Color(hex: 0xC07A12) : Color(hex: 0x2F7D52)
    }
}

public struct CompanionScreen: View {
    @ObservedObject var model: CompanionViewModel
    @State private var typed = ""
    @State private var showDebug = true
    @FocusState private var typing: Bool

    public init(model: CompanionViewModel) { self.model = model }

    private var locale: String { model.coordinator.config.locale }
    private var onGlasses: Bool { model.deviceState?.mode == .glasses }

    public var body: some View {
        if !model.hasConsent {
            ConsentView { Task { await model.grantConsent() } }
                .tint(Look.ink)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if !model.lastQuestion.isEmpty { question }
                    if !model.lastSpeech.isEmpty { spokenLine }
                    if let err = model.errorText {
                        Label(err, systemImage: "exclamationmark.triangle.fill")
                            .font(.callout).foregroundStyle(Look.alert)
                    }
                    if model.cards.isEmpty && model.lastSpeech.isEmpty && model.errorText == nil { emptyState }
                    ForEach(model.cards, id: \.cardID) { CardView(card: $0, locale: locale) }
                    if showDebug {
                        DebugOverlay(state: model.deviceState, glassesBackend: model.glassesBackend, debug: model.debug)
                            .padding(.top, 8)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 24)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(Look.aisle.ignoresSafeArea())
            .safeAreaInset(edge: .top, spacing: 0) { header }
            .safeAreaInset(edge: .bottom, spacing: 0) { dock }
            .animation(.snappy(duration: 0.3), value: model.proposal?.proposalID)
            .tint(Look.ink)
            .task { if !model.started { await model.start() } }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            Text("Spendtacles")
                .font(.system(size: 28, weight: .heavy).width(.compressed))
                .foregroundStyle(Look.ink)
                .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 8)
            Button { if !onGlasses { Task { await model.connectGlasses() } } } label: {
                GlassesStatus(mode: model.deviceState?.mode, backend: model.glassesBackend)
            }
            .accessibilityHint(onGlasses ? "" : "Connects your glasses")
            Menu {
                Button("Connect glasses") { Task { await model.connectGlasses() } }.accessibilityIdentifier("connectGlasses")
                Button("Use phone only") { Task { await model.useGlasses(false) } }
                Toggle("Discreet mode (no amounts spoken)", isOn: $model.discreetMode)
                Toggle("Debug overlay", isOn: $showDebug)
            } label: {
                Image(systemName: "ellipsis")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Look.ink)
                    .frame(width: 32, height: 32)
                    .background(Look.shelf, in: Circle())
                    .overlay(Circle().strokeBorder(Look.line, lineWidth: 1))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
                    .accessibilityIdentifier("menu")
            }
            .accessibilityLabel("More")
            .accessibilityIdentifier("menu")
        }
        .padding(.leading, 20)
        .padding(.trailing, 10)
        .padding(.vertical, 6)
        .background(Look.aisle)
    }

    /// The user's own words, right-aligned like a sent message.
    private var question: some View {
        Text(model.lastQuestion)
            .font(.body)
            .foregroundStyle(Look.onInk)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Look.ink, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(.leading, 48)
            .accessibilityLabel("You asked: \(model.lastQuestion)")
    }

    private var spokenLine: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: "speaker.wave.2.fill").font(.subheadline).foregroundStyle(Look.slate)
                .accessibilityHidden(true)
            Text("“\(model.lastSpeech)”")
                .font(.title3.weight(.medium)).foregroundStyle(Look.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("lastSpeech")
        }
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(onGlasses ? "Look at a price and ask “Can I afford this?”" : "Ask before you buy.")
                .font(.system(size: 34, weight: .heavy).width(.compressed))
                .foregroundStyle(Look.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(onGlasses
                 ? "Your glasses read the label. You hear what buying it would leave you until Sunday."
                 : "Say a price, or connect your glasses to read the label for you.")
                .font(.body).foregroundStyle(Look.slate)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 40)
    }

    /// Questions the coach answers today, as one-tap starters.
    private var suggestions: [String] {
        let fi = locale.hasPrefix("fi")
        let afford = onGlasses ? (fi ? "Onko minulla varaa tähän?" : "Can I afford this?")
                               : (fi ? "Onko minulla varaa 25 euroon?" : "Can I afford 25 euros?")
        return [afford, fi ? "Paljonko voin käyttää tällä viikolla?" : "What's safe to spend this week?"]
    }

    /// The decision, when one is waiting, sits directly above the input bar.
    private var dock: some View {
        VStack(spacing: 0) {
            if let proposal = model.proposal {
                ProposalPanel(proposal: proposal, locale: locale) { decision in Task { await model.confirmByTap(decision) } }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 10)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            controls
        }
        .background(Look.aisle)
    }

    private var controls: some View {
        VStack(spacing: 10) {
            if model.listening {
                Label(model.partial.isEmpty ? "Listening…" : model.partial, systemImage: "waveform")
                    .symbolEffect(.variableColor.iterative, isActive: model.listening)
                    .font(.callout).foregroundStyle(Look.slate)
            } else if model.busy {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text("Working on it…")
                }
                .font(.callout).foregroundStyle(Look.slate)
            } else if model.proposal == nil && !typing && model.cards.isEmpty && model.lastQuestion.isEmpty {
            // Starters only before the first question; after that the screen is about the item asked about (DEC-028).
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(suggestions, id: \.self) { s in
                            Button(s) { Task { await model.ask(typed: s) } }
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Look.ink)
                                .padding(.horizontal, 14)
                                .frame(height: 36)
                                .background(Look.shelf, in: Capsule())
                                .overlay(Capsule().strokeBorder(Look.line, lineWidth: 1))
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.horizontal, -16)
            }
            HStack(spacing: 10) {
                TextField("Type a question", text: $typed)
                    .focused($typing)
                    .submitLabel(.send)
                    .padding(.horizontal, 16)
                    .frame(height: 48)
                    .background(Look.shelf, in: Capsule())
                    .overlay(Capsule().strokeBorder(Look.line, lineWidth: 1))
                    .accessibilityIdentifier("askField")
                    .onSubmit { let t = typed; typed = ""; Task { await model.ask(typed: t) } }
                if model.listening || model.busy {
                    Button { Task { await model.stop() } } label: {
                        Image(systemName: "stop.fill")
                            .font(.title3)
                            .foregroundStyle(Look.ink)
                            .frame(width: 56, height: 56)
                            .background(Look.shelf, in: Circle())
                            .overlay(Circle().strokeBorder(Look.ink, lineWidth: 2))
                    }
                    .accessibilityLabel("Stop")
                } else {
                    Button { typing = false; model.pushToTalk() } label: {
                        Image(systemName: "mic.fill")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(Look.onInk)
                            .frame(width: 56, height: 56)
                            .background(Look.ink, in: Circle())
                    }
                    .accessibilityLabel("Ask out loud")
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .overlay(alignment: .top) { Rectangle().fill(Look.line).frame(height: 1) }
    }
}
#endif
