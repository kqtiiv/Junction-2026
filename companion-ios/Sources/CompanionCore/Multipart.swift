// multipart/form-data body builder for capture uploads.
import Foundation

public struct Multipart {
    public enum Part {
        case field(name: String, value: String)
        case file(name: String, filename: String, mime: String, data: Data)
    }

    public let boundary: String
    public let body: Data
    public var contentType: String { "multipart/form-data; boundary=\(boundary)" }

    public init(parts: [Part], boundary: String = "companion-\(UUID().uuidString)") {
        self.boundary = boundary
        var body = Data()
        func append(_ s: String) { body.append(Data(s.utf8)) }
        for part in parts {
            append("--\(boundary)\r\n")
            switch part {
            case let .field(name, value):
                append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n")
            case let .file(name, filename, mime, data):
                append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(filename)\"\r\n")
                append("Content-Type: \(mime)\r\n\r\n")
                body.append(data)
                append("\r\n")
            }
        }
        append("--\(boundary)--\r\n")
        self.body = body
    }
}
