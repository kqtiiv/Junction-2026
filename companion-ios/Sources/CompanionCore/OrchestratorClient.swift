// HTTP client for contracts/http/orchestrator.openapi.yaml.
// Every non-2xx body is decoded as an ErrorEnvelope (DEC-008); its `user_message` is safe to speak.
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import Contracts

/// Result of POST /v1/receipts/verify.
public struct ReceiptCheck: Codable, Equatable {
    public let valid: Bool
    public let signatureValid: Bool
    public let digestMatches: Bool
    public let grounded: Bool
    public let checkedValues: Int?
    public let reason: String?

    enum CodingKeys: String, CodingKey {
        case valid, grounded, reason
        case signatureValid = "signature_valid"
        case digestMatches = "digest_matches"
        case checkedValues = "checked_values"
    }
}

public struct SessionInfo: Codable, Equatable {
    public let sessionID: String
    public let conversationRef: String
    enum CodingKeys: String, CodingKey { case sessionID = "session_id", conversationRef = "conversation_ref" }
}

public struct ConsentGrantInfo: Codable, Equatable {
    public let consentGrantID: String
    public let capabilityID: String
    public let dataClasses: [String]
    public let purposes: [String]
    enum CodingKeys: String, CodingKey {
        case consentGrantID = "consent_grant_id", capabilityID = "capability_id", dataClasses = "data_classes", purposes
    }
}

/// Metadata the phone sends with a capture upload.
public struct CaptureMeta: Encodable {
    public var sessionID: String
    public var source: String          // glasses_photo | glasses_stream_frame | phone_camera | phone_upload
    public var trigger: String         // voice_command | glasses_input | phone_tap
    public var purpose: String         // e.g. price_label, receipt
    public var minimisation: [String]  // must include exif_stripped
    public var consentGrantID: String
    public var capturedAt: Date
    public var locale: String

    public init(sessionID: String, source: String, trigger: String, purpose: String, minimisation: [String],
                consentGrantID: String, capturedAt: Date = Date(), locale: String) {
        self.sessionID = sessionID; self.source = source; self.trigger = trigger; self.purpose = purpose
        self.minimisation = minimisation; self.consentGrantID = consentGrantID; self.capturedAt = capturedAt; self.locale = locale
    }

    enum CodingKeys: String, CodingKey {
        case sessionID = "session_id", source, trigger, purpose, minimisation
        case consentGrantID = "consent_grant_id", capturedAt = "captured_at", locale
    }
}

public enum TurnEvent {
    /// A DomainResponseEvent plus its raw JSON (for `x_` extension fields such as `x_debug`).
    case event(DomainResponseEvent, raw: Data)
    case error(ErrorEnvelope)
}

public enum OrchestratorError: Error {
    case api(ErrorEnvelope, status: Int)
    case http(status: Int, body: String)
    case decoding(String)

    /// Something safe to show or speak.
    public func userMessage(locale: String) -> String {
        if case .api(let env, _) = self {
            let lang = String(locale.prefix(2))
            return env.userMessage[lang] ?? env.userMessage["en"] ?? "Something went wrong."
        }
        return locale.hasPrefix("fi") ? "Jokin meni vikaan." : "Something went wrong."
    }
}

public final class OrchestratorClient {
    public let baseURL: URL
    private let token: String
    private let session: URLSession

    public init(baseURL: URL, token: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.token = token
        self.session = session
    }

    // MARK: Endpoints

    public func createSession(mode: Mode, capabilities: [DeviceCapability], locale: String) async throws -> SessionInfo {
        let body: [String: Any] = ["mode": mode.rawValue, "device_capabilities": capabilities.map(\.rawValue), "locale": locale]
        return try await send("POST", "/v1/sessions", json: try JSONSerialization.data(withJSONObject: body), expect: 200)
    }

    public func putDeviceState(_ state: DeviceSessionState) async throws {
        let data = try ContractsCoding.encoder().encode(state)
        let _: Empty = try await send("PUT", "/v1/sessions/\(state.sessionID)/device-state", json: data, expect: 204)
    }

    public func grantConsent(capabilityID: String, dataClasses: [String], purposes: [String]) async throws -> ConsentGrantInfo {
        let body: [String: Any] = ["capability_id": capabilityID, "data_classes": dataClasses, "purposes": purposes]
        return try await send("POST", "/v1/consents", json: try JSONSerialization.data(withJSONObject: body), expect: 201)
    }

    public func revokeConsent(_ id: String) async throws {
        let _: Empty = try await send("DELETE", "/v1/consents/\(id)", json: nil, expect: 204)
    }

    public func uploadCapture(image: Data, mime: String = "image/jpeg", meta: CaptureMeta) async throws -> ContextCapture {
        let metaJSON = try ContractsCoding.encoder().encode(meta)
        let form = Multipart(parts: [
            .field(name: "meta", value: String(decoding: metaJSON, as: UTF8.self)),
            .file(name: "image", filename: "capture.jpg", mime: mime, data: image),
        ])
        var req = request("POST", "/v1/captures")
        req.setValue(form.contentType, forHTTPHeaderField: "content-type")
        req.httpBody = form.body
        return try await perform(req, expect: 201)
    }

    public func confirm(proposalID: String, decision: String, channel: ConfirmChannel, evidence: [String: Any]) async throws -> ActionResult {
        let body: [String: Any] = ["proposal_id": proposalID, "decision": decision, "channel": channel.rawValue, "evidence": evidence]
        return try await send("POST", "/v1/confirmations", json: try JSONSerialization.data(withJSONObject: body), expect: 200)
    }

    /// Independent check of a card's receipt (DEC-029): signature, digest, and every figure against
    /// this user's calculation log. `rawCard` is the card's JSON exactly as it was received.
    public func verifyReceipt(rawCard: Data) async throws -> ReceiptCheck {
        let card = try JSONSerialization.jsonObject(with: rawCard)
        let body = try JSONSerialization.data(withJSONObject: ["card": card])
        return try await send("POST", "/v1/receipts/verify", json: body, expect: 200)
    }

    /// Sends one turn and streams its events. Cancelling the consuming task cancels the request.
    public func turn(_ intent: VoiceIntent) -> AsyncThrowingStream<TurnEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    var req = self.request("POST", "/v1/turns")
                    req.setValue("application/json", forHTTPHeaderField: "content-type")
                    req.setValue("text/event-stream", forHTTPHeaderField: "accept")
                    req.httpBody = try ContractsCoding.encode(intent)
                    for try await message in self.sse(req) {
                        continuation.yield(try Self.decodeTurnMessage(message))
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    public static func decodeTurnMessage(_ m: SSEMessage) throws -> TurnEvent {
        let data = Data(m.data.utf8)
        do {
            if m.event == "error" { return .error(try ContractsCoding.decoder().decode(ErrorEnvelope.self, from: data)) }
            return .event(try ContractsCoding.decoder().decode(DomainResponseEvent.self, from: data), raw: data)
        } catch {
            throw OrchestratorError.decoding("\(m.event): \(error)")
        }
    }

    // MARK: Plumbing

    private struct Empty: Decodable {}

    private func request(_ method: String, _ path: String) -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(String(path.dropFirst())))
        req.httpMethod = method
        req.setValue("Bearer \(token)", forHTTPHeaderField: "authorization")
        req.timeoutInterval = 30
        return req
    }

    private func send<T: Decodable>(_ method: String, _ path: String, json: Data?, expect: Int) async throws -> T {
        var req = request(method, path)
        if let json {
            req.setValue("application/json", forHTTPHeaderField: "content-type")
            req.httpBody = json
        }
        return try await perform(req, expect: expect)
    }

    private func perform<T: Decodable>(_ req: URLRequest, expect: Int) async throws -> T {
        let (data, status) = try await dataTask(req)
        guard status == expect else { throw Self.error(status: status, body: data) }
        if T.self == Empty.self { return Empty() as! T }
        do { return try ContractsCoding.decoder().decode(T.self, from: data) }
        catch { throw OrchestratorError.decoding("\(T.self): \(error)") }
    }

    private static func error(status: Int, body: Data) -> OrchestratorError {
        if let env = try? ContractsCoding.decoder().decode(ErrorEnvelope.self, from: body) { return .api(env, status: status) }
        return .http(status: status, body: String(decoding: body, as: UTF8.self))
    }

    private func dataTask(_ req: URLRequest) async throws -> (Data, Int) {
        try await withCheckedThrowingContinuation { cont in
            session.dataTask(with: req) { data, response, error in
                if let error { return cont.resume(throwing: error) }
                cont.resume(returning: (data ?? Data(), (response as? HTTPURLResponse)?.statusCode ?? 0))
            }.resume()
        }
    }

    /// Streams SSE messages. Apple platforms stream line by line; elsewhere the body is read whole.
    private func sse(_ req: URLRequest) -> AsyncThrowingStream<SSEMessage, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    #if canImport(FoundationNetworking)
                    let (data, status) = try await self.dataTask(req)
                    guard status == 200 else { throw Self.error(status: status, body: data) }
                    for m in SSEParser.parse(String(decoding: data, as: UTF8.self)) { continuation.yield(m) }
                    #else
                    let (bytes, response) = try await self.session.bytes(for: req)
                    let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                    guard status == 200 else {
                        var body = Data()
                        for try await b in bytes { body.append(b) }
                        throw Self.error(status: status, body: body)
                    }
                    var parser = SSEParser()
                    for try await line in bytes.lines {
                        if let m = parser.feed(line: line) { continuation.yield(m) }
                        // `lines` drops blank separators, so treat each data line's block as complete.
                        if line.hasPrefix("data:"), let m = parser.feed(line: "") { continuation.yield(m) }
                    }
                    if let m = parser.finish() { continuation.yield(m) }
                    #endif
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}
