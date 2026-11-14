// Incremental Server-Sent Events parser for the orchestrator's turn stream.
// Feed it lines as they arrive; it emits one message per blank-line-terminated block.
import Foundation

public struct SSEMessage: Equatable {
    public var event: String
    public var data: String
}

public struct SSEParser {
    private var event = "message"
    private var dataLines: [String] = []

    public init() {}

    /// Feeds one line (without its newline). Returns a message when a block completes.
    public mutating func feed(line raw: String) -> SSEMessage? {
        let line = raw.hasSuffix("\r") ? String(raw.dropLast()) : raw
        if line.isEmpty {
            defer { event = "message"; dataLines = [] }
            return dataLines.isEmpty ? nil : SSEMessage(event: event, data: dataLines.joined(separator: "\n"))
        }
        if line.hasPrefix(":") { return nil } // comment / keep-alive
        let (field, value) = Self.split(line)
        switch field {
        case "event": event = value
        case "data": dataLines.append(value)
        default: break // id, retry: unused
        }
        return nil
    }

    /// Call at end of stream to flush a final block that had no trailing blank line.
    public mutating func finish() -> SSEMessage? {
        feed(line: "")
    }

    /// Parses a complete body at once (used where streaming is unavailable).
    public static func parse(_ body: String) -> [SSEMessage] {
        var p = SSEParser()
        var out: [SSEMessage] = []
        // In Swift "\r\n" is a single Character, so normalise before splitting on "\n".
        let normalised = body.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n")
        for line in normalised.split(separator: "\n", omittingEmptySubsequences: false) {
            if let m = p.feed(line: String(line)) { out.append(m) }
        }
        if let m = p.finish() { out.append(m) }
        return out
    }

    private static func split(_ line: String) -> (String, String) {
        guard let idx = line.firstIndex(of: ":") else { return (line, "") }
        var value = line[line.index(after: idx)...]
        if value.hasPrefix(" ") { value = value.dropFirst() }
        return (String(line[..<idx]), String(value))
    }
}
