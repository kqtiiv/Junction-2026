// Platform-intent grammar (L2). Only whole-utterance matches count, so "stop by the shop"
// is a question, not a stop. Confirmation is deliberately narrow: the exact confirm word
// (DEC-007/DEC-018); "yeah sure" is not a confirmation.
import Foundation
import Contracts

public enum PlatformIntentGrammar {
    private static let phrases: [PlatformIntent: Set<String>] = [
        .confirm: ["confirm", "vahvista", "bekräfta"],
        .reject: ["no", "don't", "do not", "reject", "ei", "älä", "nej", "avböj"],
        .stop: ["stop", "lopeta", "seis", "stopp", "sluta"],
        .cancel: ["cancel", "peru", "peruuta", "avbryt"],
        .platformIntentRepeat: ["repeat", "say again", "say that again", "toista", "upprepa"],
        .showOnPhone: ["show on phone", "show me on the phone", "näytä puhelimessa", "visa på telefonen"],
        .nextCard: ["next", "seuraava", "nästa"],
    ]

    public static func normalise(_ text: String) -> String {
        text.lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: ".!?,"))
            .trimmingCharacters(in: .whitespaces)
    }

    public static func match(_ text: String) -> PlatformIntent? {
        let t = normalise(text)
        return phrases.first(where: { $0.value.contains(t) })?.key
    }

    /// Words in a *partial* transcript that mean "look at this": start the camera stream early
    /// so it overlaps with ASR finalisation (ARCHITECTURE.md §4.3). The user starts every capture,
    /// so this must only fire when they point at an object: "does this fit", "scan this",
    /// "mahtuuko tämä", "får den här plats", never "this week" / "tällä viikolla".
    private static let scanWords: Set<String> = ["scan", "skannaa", "skanna"]
    private static let objectWords: Set<String> = ["this", "these", "tämä", "tämän", "nämä"]
    private static let timeWords: Set<String> = [
        "week", "weekend", "month", "year", "morning", "evening", "afternoon", "time", "weeks",
        "viikko", "viikolla", "viikon", "viikkona", "kuu", "kuussa", "kuun", "vuonna", "vuoden", "aamuna", "iltana",
        "veckan", "veckor", "månaden", "året", "gången",
    ]

    public static func wantsCapture(_ partial: String) -> Bool {
        let words = normalise(partial).split(whereSeparator: { !$0.isLetter }).map(String.init)
        if words.contains(where: scanWords.contains) { return true }
        for (i, w) in words.enumerated() {
            let next = i + 1 < words.count ? words[i + 1] : nil
            if objectWords.contains(w), next.map({ !timeWords.contains($0) }) ?? true { return true }
            // Swedish "den här" / "det här" (this one), but not "den här veckan" (this week)
            if (w == "den" || w == "det"), next == "här" {
                let after = i + 2 < words.count ? words[i + 2] : nil
                if after.map({ !timeWords.contains($0) }) ?? true { return true }
            }
        }
        return false
    }
}
