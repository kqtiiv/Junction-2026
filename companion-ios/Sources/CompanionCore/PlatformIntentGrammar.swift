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
    /// so it overlaps with ASR finalisation (ARCHITECTURE.md §4.3).
    private static let captureWords: Set<String> = ["this", "these", "scan", "tämä", "tämän", "nämä", "skannaa", "den", "det", "skanna"]

    public static func wantsCapture(_ partial: String) -> Bool {
        let words = normalise(partial).split(whereSeparator: { !$0.isLetter }).map(String.init)
        return words.contains(where: captureWords.contains)
    }
}
