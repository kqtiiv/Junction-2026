// JSON coding for contract messages.
// - Dates: the backend emits RFC 3339 with milliseconds ("2026-11-19T17:52:07.123Z").
//   Foundation's `.iso8601` strategy rejects fractional seconds, so we accept both forms.
// - Required-but-nullable fields: Swift's synthesized Codable omits nil optionals, but the
//   VoiceIntent schema requires `platform_intent`, `capability_hint`,
//   `context.active_capability` and `context.pending_proposal_id` to be present (as null).
import Foundation
import Contracts

public enum ContractsCoding {
    public static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            if let date = parseDate(s) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Bad date: \(s)"))
        }
        return d
    }

    public static func encoder() -> JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .custom { date, encoder in
            var c = encoder.singleValueContainer()
            try c.encode(formatDate(date))
        }
        e.outputFormatting = [.sortedKeys]
        return e
    }

    public static func parseDate(_ s: String) -> Date? {
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = withFraction.date(from: s) { return d }
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        return plain.date(from: s)
    }

    public static func formatDate(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: date)
    }

    /// Encodes a VoiceIntent with explicit nulls where the schema requires the key.
    public static func encode(_ intent: VoiceIntent) throws -> Data {
        let data = try encoder().encode(intent)
        guard var root = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { return data }
        for key in ["platform_intent", "capability_hint"] where root[key] == nil { root[key] = NSNull() }
        if var context = root["context"] as? [String: Any] {
            for key in ["active_capability", "pending_proposal_id"] where context[key] == nil { context[key] = NSNull() }
            root["context"] = context
        }
        return try JSONSerialization.data(withJSONObject: root, options: [.sortedKeys])
    }
}
