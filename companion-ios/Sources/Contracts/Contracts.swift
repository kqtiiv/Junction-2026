// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let contractsIndex = try ContractsIndex(json)

import Foundation

// MARK: - ContractsIndex
public struct ContractsIndex: Codable {
    public let actionKind: String?
    public let actionProposal: ActionProposal?
    public let actionResult: ActionResult?
    public let affordabilityResult: AffordabilityResult?
    public let capabilityID: String?
    public let confidence: Risk?
    public let confirmChannel: ConfirmChannel?
    public let contextCapture: ContextCapture?
    public let conversationTurn: ConversationTurn?
    public let dataMode: DataMode?
    public let date: String?
    public let decimalString: String?
    public let deterministicTool: DeterministicTool?
    public let deviceCapability: DeviceCapability?
    public let deviceSessionState: DeviceSessionState?
    public let domainCapability: DomainCapability?
    public let domainEvent: DomainEvent?
    public let domainRequest: DomainRequest?
    public let domainResponse: DomainResponse?
    public let domainResponseEvent: DomainResponseEvent?
    public let epistemic: Epistemic?
    public let errorEnvelope: ErrorEnvelope?
    public let errorInfo: ErrorInfo?
    public let financeActionKind: FinanceActionKind?
    public let financeIntent: FinanceIntent?
    public let financeToolName: FinanceToolName?
    public let glassesInput: GlassesInput?
    public let goldenCase: GoldenCase?
    public let insightCard: InsightCard?
    public let intentID: String?
    public let locale: String?
    public let lText: [String: String]?
    public let mediaURI: String?
    public let missingData: MissingData?
    public let missingDataCode: MissingDataCode?
    public let modelProvider: ModelProvider?
    public let money: Money?
    public let observation: Observation?
    public let outputDisplay: OutputDisplay?
    public let paydaySafeToSpendResult: PaydaySafeToSpendResult?
    public let probability: Double?
    public let ref: String?
    public let risk: Risk?
    public let safeToSpendResult: SafeToSpendResult?
    public let sha256: String?
    public let timestamp: Date?
    public let toolResult: ToolResult?
    public let userConfirmation: UserConfirmation?
    public let voiceIntent: VoiceIntent?

    public enum CodingKeys: String, CodingKey {
        case actionKind = "ActionKind"
        case actionProposal = "ActionProposal"
        case actionResult = "ActionResult"
        case affordabilityResult = "AffordabilityResult"
        case capabilityID = "CapabilityId"
        case confidence = "Confidence"
        case confirmChannel = "ConfirmChannel"
        case contextCapture = "ContextCapture"
        case conversationTurn = "ConversationTurn"
        case dataMode = "DataMode"
        case date = "Date"
        case decimalString = "DecimalString"
        case deterministicTool = "DeterministicTool"
        case deviceCapability = "DeviceCapability"
        case deviceSessionState = "DeviceSessionState"
        case domainCapability = "DomainCapability"
        case domainEvent = "DomainEvent"
        case domainRequest = "DomainRequest"
        case domainResponse = "DomainResponse"
        case domainResponseEvent = "DomainResponseEvent"
        case epistemic = "Epistemic"
        case errorEnvelope = "ErrorEnvelope"
        case errorInfo = "ErrorInfo"
        case financeActionKind = "FinanceActionKind"
        case financeIntent = "FinanceIntent"
        case financeToolName = "FinanceToolName"
        case glassesInput = "GlassesInput"
        case goldenCase = "GoldenCase"
        case insightCard = "InsightCard"
        case intentID = "IntentId"
        case locale = "Locale"
        case lText = "LText"
        case mediaURI = "MediaUri"
        case missingData = "MissingData"
        case missingDataCode = "MissingDataCode"
        case modelProvider = "ModelProvider"
        case money = "Money"
        case observation = "Observation"
        case outputDisplay = "OutputDisplay"
        case paydaySafeToSpendResult = "PaydaySafeToSpendResult"
        case probability = "Probability"
        case ref = "Ref"
        case risk = "Risk"
        case safeToSpendResult = "SafeToSpendResult"
        case sha256 = "Sha256"
        case timestamp = "Timestamp"
        case toolResult = "ToolResult"
        case userConfirmation = "UserConfirmation"
        case voiceIntent = "VoiceIntent"
    }

    public init(actionKind: String?, actionProposal: ActionProposal?, actionResult: ActionResult?, affordabilityResult: AffordabilityResult?, capabilityID: String?, confidence: Risk?, confirmChannel: ConfirmChannel?, contextCapture: ContextCapture?, conversationTurn: ConversationTurn?, dataMode: DataMode?, date: String?, decimalString: String?, deterministicTool: DeterministicTool?, deviceCapability: DeviceCapability?, deviceSessionState: DeviceSessionState?, domainCapability: DomainCapability?, domainEvent: DomainEvent?, domainRequest: DomainRequest?, domainResponse: DomainResponse?, domainResponseEvent: DomainResponseEvent?, epistemic: Epistemic?, errorEnvelope: ErrorEnvelope?, errorInfo: ErrorInfo?, financeActionKind: FinanceActionKind?, financeIntent: FinanceIntent?, financeToolName: FinanceToolName?, glassesInput: GlassesInput?, goldenCase: GoldenCase?, insightCard: InsightCard?, intentID: String?, locale: String?, lText: [String: String]?, mediaURI: String?, missingData: MissingData?, missingDataCode: MissingDataCode?, modelProvider: ModelProvider?, money: Money?, observation: Observation?, outputDisplay: OutputDisplay?, paydaySafeToSpendResult: PaydaySafeToSpendResult?, probability: Double?, ref: String?, risk: Risk?, safeToSpendResult: SafeToSpendResult?, sha256: String?, timestamp: Date?, toolResult: ToolResult?, userConfirmation: UserConfirmation?, voiceIntent: VoiceIntent?) {
        self.actionKind = actionKind
        self.actionProposal = actionProposal
        self.actionResult = actionResult
        self.affordabilityResult = affordabilityResult
        self.capabilityID = capabilityID
        self.confidence = confidence
        self.confirmChannel = confirmChannel
        self.contextCapture = contextCapture
        self.conversationTurn = conversationTurn
        self.dataMode = dataMode
        self.date = date
        self.decimalString = decimalString
        self.deterministicTool = deterministicTool
        self.deviceCapability = deviceCapability
        self.deviceSessionState = deviceSessionState
        self.domainCapability = domainCapability
        self.domainEvent = domainEvent
        self.domainRequest = domainRequest
        self.domainResponse = domainResponse
        self.domainResponseEvent = domainResponseEvent
        self.epistemic = epistemic
        self.errorEnvelope = errorEnvelope
        self.errorInfo = errorInfo
        self.financeActionKind = financeActionKind
        self.financeIntent = financeIntent
        self.financeToolName = financeToolName
        self.glassesInput = glassesInput
        self.goldenCase = goldenCase
        self.insightCard = insightCard
        self.intentID = intentID
        self.locale = locale
        self.lText = lText
        self.mediaURI = mediaURI
        self.missingData = missingData
        self.missingDataCode = missingDataCode
        self.modelProvider = modelProvider
        self.money = money
        self.observation = observation
        self.outputDisplay = outputDisplay
        self.paydaySafeToSpendResult = paydaySafeToSpendResult
        self.probability = probability
        self.ref = ref
        self.risk = risk
        self.safeToSpendResult = safeToSpendResult
        self.sha256 = sha256
        self.timestamp = timestamp
        self.toolResult = toolResult
        self.userConfirmation = userConfirmation
        self.voiceIntent = voiceIntent
    }
}

// MARK: ContractsIndex convenience initializers and mutators

public extension ContractsIndex {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ContractsIndex.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        actionKind: String?? = nil,
        actionProposal: ActionProposal?? = nil,
        actionResult: ActionResult?? = nil,
        affordabilityResult: AffordabilityResult?? = nil,
        capabilityID: String?? = nil,
        confidence: Risk?? = nil,
        confirmChannel: ConfirmChannel?? = nil,
        contextCapture: ContextCapture?? = nil,
        conversationTurn: ConversationTurn?? = nil,
        dataMode: DataMode?? = nil,
        date: String?? = nil,
        decimalString: String?? = nil,
        deterministicTool: DeterministicTool?? = nil,
        deviceCapability: DeviceCapability?? = nil,
        deviceSessionState: DeviceSessionState?? = nil,
        domainCapability: DomainCapability?? = nil,
        domainEvent: DomainEvent?? = nil,
        domainRequest: DomainRequest?? = nil,
        domainResponse: DomainResponse?? = nil,
        domainResponseEvent: DomainResponseEvent?? = nil,
        epistemic: Epistemic?? = nil,
        errorEnvelope: ErrorEnvelope?? = nil,
        errorInfo: ErrorInfo?? = nil,
        financeActionKind: FinanceActionKind?? = nil,
        financeIntent: FinanceIntent?? = nil,
        financeToolName: FinanceToolName?? = nil,
        glassesInput: GlassesInput?? = nil,
        goldenCase: GoldenCase?? = nil,
        insightCard: InsightCard?? = nil,
        intentID: String?? = nil,
        locale: String?? = nil,
        lText: [String: String]?? = nil,
        mediaURI: String?? = nil,
        missingData: MissingData?? = nil,
        missingDataCode: MissingDataCode?? = nil,
        modelProvider: ModelProvider?? = nil,
        money: Money?? = nil,
        observation: Observation?? = nil,
        outputDisplay: OutputDisplay?? = nil,
        paydaySafeToSpendResult: PaydaySafeToSpendResult?? = nil,
        probability: Double?? = nil,
        ref: String?? = nil,
        risk: Risk?? = nil,
        safeToSpendResult: SafeToSpendResult?? = nil,
        sha256: String?? = nil,
        timestamp: Date?? = nil,
        toolResult: ToolResult?? = nil,
        userConfirmation: UserConfirmation?? = nil,
        voiceIntent: VoiceIntent?? = nil
    ) -> ContractsIndex {
        return ContractsIndex(
            actionKind: actionKind ?? self.actionKind,
            actionProposal: actionProposal ?? self.actionProposal,
            actionResult: actionResult ?? self.actionResult,
            affordabilityResult: affordabilityResult ?? self.affordabilityResult,
            capabilityID: capabilityID ?? self.capabilityID,
            confidence: confidence ?? self.confidence,
            confirmChannel: confirmChannel ?? self.confirmChannel,
            contextCapture: contextCapture ?? self.contextCapture,
            conversationTurn: conversationTurn ?? self.conversationTurn,
            dataMode: dataMode ?? self.dataMode,
            date: date ?? self.date,
            decimalString: decimalString ?? self.decimalString,
            deterministicTool: deterministicTool ?? self.deterministicTool,
            deviceCapability: deviceCapability ?? self.deviceCapability,
            deviceSessionState: deviceSessionState ?? self.deviceSessionState,
            domainCapability: domainCapability ?? self.domainCapability,
            domainEvent: domainEvent ?? self.domainEvent,
            domainRequest: domainRequest ?? self.domainRequest,
            domainResponse: domainResponse ?? self.domainResponse,
            domainResponseEvent: domainResponseEvent ?? self.domainResponseEvent,
            epistemic: epistemic ?? self.epistemic,
            errorEnvelope: errorEnvelope ?? self.errorEnvelope,
            errorInfo: errorInfo ?? self.errorInfo,
            financeActionKind: financeActionKind ?? self.financeActionKind,
            financeIntent: financeIntent ?? self.financeIntent,
            financeToolName: financeToolName ?? self.financeToolName,
            glassesInput: glassesInput ?? self.glassesInput,
            goldenCase: goldenCase ?? self.goldenCase,
            insightCard: insightCard ?? self.insightCard,
            intentID: intentID ?? self.intentID,
            locale: locale ?? self.locale,
            lText: lText ?? self.lText,
            mediaURI: mediaURI ?? self.mediaURI,
            missingData: missingData ?? self.missingData,
            missingDataCode: missingDataCode ?? self.missingDataCode,
            modelProvider: modelProvider ?? self.modelProvider,
            money: money ?? self.money,
            observation: observation ?? self.observation,
            outputDisplay: outputDisplay ?? self.outputDisplay,
            paydaySafeToSpendResult: paydaySafeToSpendResult ?? self.paydaySafeToSpendResult,
            probability: probability ?? self.probability,
            ref: ref ?? self.ref,
            risk: risk ?? self.risk,
            safeToSpendResult: safeToSpendResult ?? self.safeToSpendResult,
            sha256: sha256 ?? self.sha256,
            timestamp: timestamp ?? self.timestamp,
            toolResult: toolResult ?? self.toolResult,
            userConfirmation: userConfirmation ?? self.userConfirmation,
            voiceIntent: voiceIntent ?? self.voiceIntent
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// A persistent change a capability proposes. The capability keeps the payload; the platform
/// keeps only its hash and owns the confirmation. Nothing is applied without a signed
/// UserConfirmation.
// MARK: - ActionProposal
public struct ActionProposal: Codable {
    public let capabilityID: String
    public let confirmChannels: [ConfirmChannel]
    public let details: [ProposalDetail]
    public let expiresAt: Date
    public let kind: String
    public let payloadHash: String
    public let proposalID: String
    public let reversible: Bool
    public let risk: Risk
    public let schema: ActionProposalSchema
    public let summary: ProposalSummary
    public let undoWindowS: Int?

    public enum CodingKeys: String, CodingKey {
        case capabilityID = "capability_id"
        case confirmChannels = "confirm_channels"
        case details
        case expiresAt = "expires_at"
        case kind
        case payloadHash = "payload_hash"
        case proposalID = "proposal_id"
        case reversible, risk, schema, summary
        case undoWindowS = "undo_window_s"
    }

    public init(capabilityID: String, confirmChannels: [ConfirmChannel], details: [ProposalDetail], expiresAt: Date, kind: String, payloadHash: String, proposalID: String, reversible: Bool, risk: Risk, schema: ActionProposalSchema, summary: ProposalSummary, undoWindowS: Int?) {
        self.capabilityID = capabilityID
        self.confirmChannels = confirmChannels
        self.details = details
        self.expiresAt = expiresAt
        self.kind = kind
        self.payloadHash = payloadHash
        self.proposalID = proposalID
        self.reversible = reversible
        self.risk = risk
        self.schema = schema
        self.summary = summary
        self.undoWindowS = undoWindowS
    }
}

// MARK: ActionProposal convenience initializers and mutators

public extension ActionProposal {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ActionProposal.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        capabilityID: String? = nil,
        confirmChannels: [ConfirmChannel]? = nil,
        details: [ProposalDetail]? = nil,
        expiresAt: Date? = nil,
        kind: String? = nil,
        payloadHash: String? = nil,
        proposalID: String? = nil,
        reversible: Bool? = nil,
        risk: Risk? = nil,
        schema: ActionProposalSchema? = nil,
        summary: ProposalSummary? = nil,
        undoWindowS: Int?? = nil
    ) -> ActionProposal {
        return ActionProposal(
            capabilityID: capabilityID ?? self.capabilityID,
            confirmChannels: confirmChannels ?? self.confirmChannels,
            details: details ?? self.details,
            expiresAt: expiresAt ?? self.expiresAt,
            kind: kind ?? self.kind,
            payloadHash: payloadHash ?? self.payloadHash,
            proposalID: proposalID ?? self.proposalID,
            reversible: reversible ?? self.reversible,
            risk: risk ?? self.risk,
            schema: schema ?? self.schema,
            summary: summary ?? self.summary,
            undoWindowS: undoWindowS ?? self.undoWindowS
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// How a user may confirm a proposal. voice_readback and glasses_gesture are allowed only
/// for low-risk, reversible actions after the summary has been read back.
public enum ConfirmChannel: String, Codable {
    case glassesGesture = "glasses_gesture"
    case phoneBiometric = "phone_biometric"
    case phoneTap = "phone_tap"
    case voiceReadback = "voice_readback"
}

// MARK: - ProposalDetail
public struct ProposalDetail: Codable {
    public let after: String
    public let before: String?
    public let label: [String: String]

    public init(after: String, before: String?, label: [String: String]) {
        self.after = after
        self.before = before
        self.label = label
    }
}

// MARK: ProposalDetail convenience initializers and mutators

public extension ProposalDetail {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ProposalDetail.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        after: String? = nil,
        before: String?? = nil,
        label: [String: String]? = nil
    ) -> ProposalDetail {
        return ProposalDetail(
            after: after ?? self.after,
            before: before ?? self.before,
            label: label ?? self.label
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Deterministic data-coverage confidence, not a model self-report.
public enum Risk: String, Codable {
    case high = "high"
    case low = "low"
    case medium = "medium"
}

public enum ActionProposalSchema: String, Codable {
    case platformActionProposalV1 = "platform.action_proposal/v1"
}

// MARK: - ProposalSummary
public struct ProposalSummary: Codable {
    public let spoken, text: [String: String]

    public init(spoken: [String: String], text: [String: String]) {
        self.spoken = spoken
        self.text = text
    }
}

// MARK: ProposalSummary convenience initializers and mutators

public extension ProposalSummary {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ProposalSummary.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        spoken: [String: String]? = nil,
        text: [String: String]? = nil
    ) -> ProposalSummary {
        return ProposalSummary(
            spoken: spoken ?? self.spoken,
            text: text ?? self.text
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// What a capability returns after receiving a UserConfirmation.
// MARK: - ActionResult
public struct ActionResult: Codable {
    public let appliedAt: Date?
    public let card: InsightCard?
    public let confirmationID: String
    public let error: ErrorInfo?
    public let proposalID: String
    public let schema: ActionResultSchema
    public let status: ActionResultStatus
    public let undoExpiresAt: Date?
    public let undoToken: String?

    public enum CodingKeys: String, CodingKey {
        case appliedAt = "applied_at"
        case card
        case confirmationID = "confirmation_id"
        case error
        case proposalID = "proposal_id"
        case schema, status
        case undoExpiresAt = "undo_expires_at"
        case undoToken = "undo_token"
    }

    public init(appliedAt: Date?, card: InsightCard?, confirmationID: String, error: ErrorInfo?, proposalID: String, schema: ActionResultSchema, status: ActionResultStatus, undoExpiresAt: Date?, undoToken: String?) {
        self.appliedAt = appliedAt
        self.card = card
        self.confirmationID = confirmationID
        self.error = error
        self.proposalID = proposalID
        self.schema = schema
        self.status = status
        self.undoExpiresAt = undoExpiresAt
        self.undoToken = undoToken
    }
}

// MARK: ActionResult convenience initializers and mutators

public extension ActionResult {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ActionResult.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        appliedAt: Date?? = nil,
        card: InsightCard?? = nil,
        confirmationID: String? = nil,
        error: ErrorInfo?? = nil,
        proposalID: String? = nil,
        schema: ActionResultSchema? = nil,
        status: ActionResultStatus? = nil,
        undoExpiresAt: Date?? = nil,
        undoToken: String?? = nil
    ) -> ActionResult {
        return ActionResult(
            appliedAt: appliedAt ?? self.appliedAt,
            card: card ?? self.card,
            confirmationID: confirmationID ?? self.confirmationID,
            error: error ?? self.error,
            proposalID: proposalID ?? self.proposalID,
            schema: schema ?? self.schema,
            status: status ?? self.status,
            undoExpiresAt: undoExpiresAt ?? self.undoExpiresAt,
            undoToken: undoToken ?? self.undoToken
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Schema-driven card rendered generically by the phone (and optionally the glasses
/// display). Every value carries an epistemic label; calculated and estimated cards must
/// cite calc_ids, observed cards must cite observations, educational cards must cite sources.
// MARK: - InsightCard
public struct InsightCard: Codable {
    public let assumptions: [[String: String]]
    public let basis: CardBasis
    public let body: [String: String]?
    public let capabilityID: String
    public let cardID: String
    public let dataMode: String?
    public let epistemic: Epistemic
    public let missingData: [[String: String]]
    public let primary: CardValue?
    public let proposalIDS: [String]?
    public let receipt: Receipt?
    public let renderHints: RenderHints?
    public let rows: [CardRow]?
    public let schema: InsightCardSchema
    public let title: [String: String]
    public let type: InsightCardType

    public enum CodingKeys: String, CodingKey {
        case assumptions, basis, body
        case capabilityID = "capability_id"
        case cardID = "card_id"
        case dataMode = "data_mode"
        case epistemic
        case missingData = "missing_data"
        case primary
        case proposalIDS = "proposal_ids"
        case receipt
        case renderHints = "render_hints"
        case rows, schema, title, type
    }

    public init(assumptions: [[String: String]], basis: CardBasis, body: [String: String]?, capabilityID: String, cardID: String, dataMode: String?, epistemic: Epistemic, missingData: [[String: String]], primary: CardValue?, proposalIDS: [String]?, receipt: Receipt?, renderHints: RenderHints?, rows: [CardRow]?, schema: InsightCardSchema, title: [String: String], type: InsightCardType) {
        self.assumptions = assumptions
        self.basis = basis
        self.body = body
        self.capabilityID = capabilityID
        self.cardID = cardID
        self.dataMode = dataMode
        self.epistemic = epistemic
        self.missingData = missingData
        self.primary = primary
        self.proposalIDS = proposalIDS
        self.receipt = receipt
        self.renderHints = renderHints
        self.rows = rows
        self.schema = schema
        self.title = title
        self.type = type
    }
}

// MARK: InsightCard convenience initializers and mutators

public extension InsightCard {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(InsightCard.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        assumptions: [[String: String]]? = nil,
        basis: CardBasis? = nil,
        body: [String: String]?? = nil,
        capabilityID: String? = nil,
        cardID: String? = nil,
        dataMode: String?? = nil,
        epistemic: Epistemic? = nil,
        missingData: [[String: String]]? = nil,
        primary: CardValue?? = nil,
        proposalIDS: [String]?? = nil,
        receipt: Receipt?? = nil,
        renderHints: RenderHints?? = nil,
        rows: [CardRow]?? = nil,
        schema: InsightCardSchema? = nil,
        title: [String: String]? = nil,
        type: InsightCardType? = nil
    ) -> InsightCard {
        return InsightCard(
            assumptions: assumptions ?? self.assumptions,
            basis: basis ?? self.basis,
            body: body ?? self.body,
            capabilityID: capabilityID ?? self.capabilityID,
            cardID: cardID ?? self.cardID,
            dataMode: dataMode ?? self.dataMode,
            epistemic: epistemic ?? self.epistemic,
            missingData: missingData ?? self.missingData,
            primary: primary ?? self.primary,
            proposalIDS: proposalIDS ?? self.proposalIDS,
            receipt: receipt ?? self.receipt,
            renderHints: renderHints ?? self.renderHints,
            rows: rows ?? self.rows,
            schema: schema ?? self.schema,
            title: title ?? self.title,
            type: type ?? self.type
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - CardBasis
public struct CardBasis: Codable {
    public let asOf: Date
    public let calcIDS: [String]
    public let observationIDS: [String]?
    public let sources: [CardSource]?

    public enum CodingKeys: String, CodingKey {
        case asOf = "as_of"
        case calcIDS = "calc_ids"
        case observationIDS = "observation_ids"
        case sources
    }

    public init(asOf: Date, calcIDS: [String], observationIDS: [String]?, sources: [CardSource]?) {
        self.asOf = asOf
        self.calcIDS = calcIDS
        self.observationIDS = observationIDS
        self.sources = sources
    }
}

// MARK: CardBasis convenience initializers and mutators

public extension CardBasis {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CardBasis.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        asOf: Date? = nil,
        calcIDS: [String]? = nil,
        observationIDS: [String]?? = nil,
        sources: [CardSource]?? = nil
    ) -> CardBasis {
        return CardBasis(
            asOf: asOf ?? self.asOf,
            calcIDS: calcIDS ?? self.calcIDS,
            observationIDS: observationIDS ?? self.observationIDS,
            sources: sources ?? self.sources
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - CardSource
public struct CardSource: Codable {
    public let kind: SourceKind
    public let ref: String
    public let title: String?

    public init(kind: SourceKind, ref: String, title: String?) {
        self.kind = kind
        self.ref = ref
        self.title = title
    }
}

// MARK: CardSource convenience initializers and mutators

public extension CardSource {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CardSource.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        kind: SourceKind? = nil,
        ref: String? = nil,
        title: String?? = nil
    ) -> CardSource {
        return CardSource(
            kind: kind ?? self.kind,
            ref: ref ?? self.ref,
            title: title ?? self.title
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum SourceKind: String, Codable {
    case calculation = "calculation"
    case document = "document"
    case observation = "observation"
}

/// What kind of claim this is. fact = read from a record; calculated = deterministic from
/// facts; estimate = deterministic but depends on assumptions or forecasts; educational =
/// general content, not about the user's data; observed = perceived from a camera capture
/// and may be misread.
public enum Epistemic: String, Codable {
    case calculated = "calculated"
    case educational = "educational"
    case estimate = "estimate"
    case fact = "fact"
    case observed = "observed"
}

// MARK: - CardValue
public struct CardValue: Codable {
    public let epistemic: Epistemic
    public let label: [String: String]
    public let value: Value

    public init(epistemic: Epistemic, label: [String: String], value: Value) {
        self.epistemic = epistemic
        self.label = label
        self.value = value
    }
}

// MARK: CardValue convenience initializers and mutators

public extension CardValue {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CardValue.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        epistemic: Epistemic? = nil,
        label: [String: String]? = nil,
        value: Value? = nil
    ) -> CardValue {
        return CardValue(
            epistemic: epistemic ?? self.epistemic,
            label: label ?? self.label,
            value: value ?? self.value
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Value: Codable {
    case money(Money)
    case string(String)

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let x = try? container.decode(String.self) {
            self = .string(x)
            return
        }
        if let x = try? container.decode(Money.self) {
            self = .money(x)
            return
        }
        throw DecodingError.typeMismatch(Value.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Wrong type for Value"))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .money(let x):
            try container.encode(x)
        case .string(let x):
            try container.encode(x)
        }
    }
}

/// remaining_after spread over the days to payday, rounded down to the cent.
///
/// Confirmed plans already subtracted from free_until_payday.
///
/// Confirmed plans counted against the stated weekly amount this week.
///
/// The weekly amount the user said (user_stated source, no bank data). Shown as 'your
/// figure'.
// MARK: - Money
public struct Money: Codable {
    public let amount: String
    public let currency: Currency

    public init(amount: String, currency: Currency) {
        self.amount = amount
        self.currency = currency
    }
}

// MARK: Money convenience initializers and mutators

public extension Money {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Money.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        amount: String? = nil,
        currency: Currency? = nil
    ) -> Money {
        return Money(
            amount: amount ?? self.amount,
            currency: currency ?? self.currency
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Currency: String, Codable {
    case eur = "EUR"
}

/// The evidence behind a card (DEC-029): every input and result as a line with its source,
/// how sure the answer is and why, how fresh the data is, and the platform's verification.
/// The capability writes lines, confidence and freshness; only the platform writes
/// verification, after the grounding verifier has passed.
// MARK: - Receipt
public struct Receipt: Codable {
    public let confidence: ReceiptConfidence
    public let freshness: ReceiptFreshness
    public let lines: [ReceiptLine]
    public let verification: ReceiptVerification?

    public init(confidence: ReceiptConfidence, freshness: ReceiptFreshness, lines: [ReceiptLine], verification: ReceiptVerification?) {
        self.confidence = confidence
        self.freshness = freshness
        self.lines = lines
        self.verification = verification
    }
}

// MARK: Receipt convenience initializers and mutators

public extension Receipt {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Receipt.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        confidence: ReceiptConfidence? = nil,
        freshness: ReceiptFreshness? = nil,
        lines: [ReceiptLine]? = nil,
        verification: ReceiptVerification?? = nil
    ) -> Receipt {
        return Receipt(
            confidence: confidence ?? self.confidence,
            freshness: freshness ?? self.freshness,
            lines: lines ?? self.lines,
            verification: verification ?? self.verification
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ReceiptConfidence
public struct ReceiptConfidence: Codable {
    public let reasons: [ReceiptReason]
    /// confident: answered without reservations. caveated: answered, with reasons shown.
    /// abstained: no verdict was given, because the data could not support one.
    public let state: ReceiptConfidenceState

    public init(reasons: [ReceiptReason], state: ReceiptConfidenceState) {
        self.reasons = reasons
        self.state = state
    }
}

// MARK: ReceiptConfidence convenience initializers and mutators

public extension ReceiptConfidence {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ReceiptConfidence.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        reasons: [ReceiptReason]? = nil,
        state: ReceiptConfidenceState? = nil
    ) -> ReceiptConfidence {
        return ReceiptConfidence(
            reasons: reasons ?? self.reasons,
            state: state ?? self.state
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ReceiptReason
public struct ReceiptReason: Codable {
    public let blocksVerdict: Bool
    public let code: String
    public let text: [String: String]

    public enum CodingKeys: String, CodingKey {
        case blocksVerdict = "blocks_verdict"
        case code, text
    }

    public init(blocksVerdict: Bool, code: String, text: [String: String]) {
        self.blocksVerdict = blocksVerdict
        self.code = code
        self.text = text
    }
}

// MARK: ReceiptReason convenience initializers and mutators

public extension ReceiptReason {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ReceiptReason.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        blocksVerdict: Bool? = nil,
        code: String? = nil,
        text: [String: String]? = nil
    ) -> ReceiptReason {
        return ReceiptReason(
            blocksVerdict: blocksVerdict ?? self.blocksVerdict,
            code: code ?? self.code,
            text: text ?? self.text
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// confident: answered without reservations. caveated: answered, with reasons shown.
/// abstained: no verdict was given, because the data could not support one.
public enum ReceiptConfidenceState: String, Codable {
    case abstained = "abstained"
    case caveated = "caveated"
    case confident = "confident"
}

// MARK: - ReceiptFreshness
public struct ReceiptFreshness: Codable {
    public let asOf: Date
    /// True for synthetic or fixture data, and for a simulated date.
    public let simulated: Bool
    public let source: String

    public enum CodingKeys: String, CodingKey {
        case asOf = "as_of"
        case simulated, source
    }

    public init(asOf: Date, simulated: Bool, source: String) {
        self.asOf = asOf
        self.simulated = simulated
        self.source = source
    }
}

// MARK: ReceiptFreshness convenience initializers and mutators

public extension ReceiptFreshness {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ReceiptFreshness.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        asOf: Date? = nil,
        simulated: Bool? = nil,
        source: String? = nil
    ) -> ReceiptFreshness {
        return ReceiptFreshness(
            asOf: asOf ?? self.asOf,
            simulated: simulated ?? self.simulated,
            source: source ?? self.source
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ReceiptLine
public struct ReceiptLine: Codable {
    public let epistemic: Epistemic
    public let key: String
    public let label: [String: String]
    public let money: Money?
    public let note: [String: String]?
    public let ref: String?
    public let source: ReceiptLineSource
    public let text: String?

    public init(epistemic: Epistemic, key: String, label: [String: String], money: Money?, note: [String: String]?, ref: String?, source: ReceiptLineSource, text: String?) {
        self.epistemic = epistemic
        self.key = key
        self.label = label
        self.money = money
        self.note = note
        self.ref = ref
        self.source = source
        self.text = text
    }
}

// MARK: ReceiptLine convenience initializers and mutators

public extension ReceiptLine {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ReceiptLine.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        epistemic: Epistemic? = nil,
        key: String? = nil,
        label: [String: String]? = nil,
        money: Money?? = nil,
        note: [String: String]?? = nil,
        ref: String?? = nil,
        source: ReceiptLineSource? = nil,
        text: String?? = nil
    ) -> ReceiptLine {
        return ReceiptLine(
            epistemic: epistemic ?? self.epistemic,
            key: key ?? self.key,
            label: label ?? self.label,
            money: money ?? self.money,
            note: note ?? self.note,
            ref: ref ?? self.ref,
            source: source ?? self.source,
            text: text ?? self.text
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ReceiptLineSource: String, Codable {
    case camera = "camera"
    case coach = "coach"
    case engine = "engine"
    case fixture = "fixture"
    case platform = "platform"
    case user = "user"
}

// MARK: - ReceiptVerification
public struct ReceiptVerification: Codable {
    public let calcIDS: [String]
    public let checkedValues: Int
    public let digest: String
    public let keyID: String
    /// Compact JWS (ES256) by the platform over {card_id, digest, calc_ids, status, signed_at}.
    public let signature: String
    public let signedAt: Date
    public let status: ReceiptVerificationStatus

    public enum CodingKeys: String, CodingKey {
        case calcIDS = "calc_ids"
        case checkedValues = "checked_values"
        case digest
        case keyID = "key_id"
        case signature
        case signedAt = "signed_at"
        case status
    }

    public init(calcIDS: [String], checkedValues: Int, digest: String, keyID: String, signature: String, signedAt: Date, status: ReceiptVerificationStatus) {
        self.calcIDS = calcIDS
        self.checkedValues = checkedValues
        self.digest = digest
        self.keyID = keyID
        self.signature = signature
        self.signedAt = signedAt
        self.status = status
    }
}

// MARK: ReceiptVerification convenience initializers and mutators

public extension ReceiptVerification {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ReceiptVerification.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        calcIDS: [String]? = nil,
        checkedValues: Int? = nil,
        digest: String? = nil,
        keyID: String? = nil,
        signature: String? = nil,
        signedAt: Date? = nil,
        status: ReceiptVerificationStatus? = nil
    ) -> ReceiptVerification {
        return ReceiptVerification(
            calcIDS: calcIDS ?? self.calcIDS,
            checkedValues: checkedValues ?? self.checkedValues,
            digest: digest ?? self.digest,
            keyID: keyID ?? self.keyID,
            signature: signature ?? self.signature,
            signedAt: signedAt ?? self.signedAt,
            status: status ?? self.status
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ReceiptVerificationStatus: String, Codable {
    case failed = "failed"
    case verified = "verified"
}

// MARK: - RenderHints
public struct RenderHints: Codable {
    public let glassesDisplayLines: [String]?
    public let sensitive: Bool?
    public let voiceSummary: [String: String]?

    public enum CodingKeys: String, CodingKey {
        case glassesDisplayLines = "glasses_display_lines"
        case sensitive
        case voiceSummary = "voice_summary"
    }

    public init(glassesDisplayLines: [String]?, sensitive: Bool?, voiceSummary: [String: String]?) {
        self.glassesDisplayLines = glassesDisplayLines
        self.sensitive = sensitive
        self.voiceSummary = voiceSummary
    }
}

// MARK: RenderHints convenience initializers and mutators

public extension RenderHints {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(RenderHints.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        glassesDisplayLines: [String]?? = nil,
        sensitive: Bool?? = nil,
        voiceSummary: [String: String]?? = nil
    ) -> RenderHints {
        return RenderHints(
            glassesDisplayLines: glassesDisplayLines ?? self.glassesDisplayLines,
            sensitive: sensitive ?? self.sensitive,
            voiceSummary: voiceSummary ?? self.voiceSummary
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - CardRow
public struct CardRow: Codable {
    public let epistemic: Epistemic
    public let label: [String: String]
    public let note: [String: String]?
    public let value: Value

    public init(epistemic: Epistemic, label: [String: String], note: [String: String]?, value: Value) {
        self.epistemic = epistemic
        self.label = label
        self.note = note
        self.value = value
    }
}

// MARK: CardRow convenience initializers and mutators

public extension CardRow {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CardRow.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        epistemic: Epistemic? = nil,
        label: [String: String]? = nil,
        note: [String: String]?? = nil,
        value: Value? = nil
    ) -> CardRow {
        return CardRow(
            epistemic: epistemic ?? self.epistemic,
            label: label ?? self.label,
            note: note ?? self.note,
            value: value ?? self.value
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum InsightCardSchema: String, Codable {
    case platformInsightCardV1 = "platform.insight_card/v1"
}

public enum InsightCardType: String, Codable {
    case breakdown = "breakdown"
    case comparison = "comparison"
    case consent = "consent"
    case explanation = "explanation"
    case list = "list"
    case metric = "metric"
}

// MARK: - ErrorInfo
public struct ErrorInfo: Codable {
    public let code: String
    public let message: String
    public let retryable: Bool

    public init(code: String, message: String, retryable: Bool) {
        self.code = code
        self.message = message
        self.retryable = retryable
    }
}

// MARK: ErrorInfo convenience initializers and mutators

public extension ErrorInfo {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ErrorInfo.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        code: String? = nil,
        message: String? = nil,
        retryable: Bool? = nil
    ) -> ErrorInfo {
        return ErrorInfo(
            code: code ?? self.code,
            message: message ?? self.message,
            retryable: retryable ?? self.retryable
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ActionResultSchema: String, Codable {
    case platformActionResultV1 = "platform.action_result/v1"
}

public enum ActionResultStatus: String, Codable {
    case applied = "applied"
    case expired = "expired"
    case failed = "failed"
    case hashMismatch = "hash_mismatch"
    case rejectedByUser = "rejected_by_user"
    case signatureInvalid = "signature_invalid"
}

// MARK: - AffordabilityResult
public struct AffordabilityResult: Codable {
    public let amountChecked: Money
    public let category: String?
    public let daysToPayday: Int?
    public let differenceVsUsual, freeUntilPayday: Money?
    public let nextPayday: String?
    public let observationID: String?
    /// What remaining_after covers: this week (fixture, user_stated) or until payday (S-Bank
    /// Coach engine, DEC-025). Absent means week.
    public let period: Period?
    /// Where the amount came from. 'observation' = read from a capture; the answer must say the
    /// price was read, not known.
    public let priceSource: PriceSource
    public let remainingAfter: Money?
    /// remaining_after spread over the days to payday, rounded down to the cent.
    public let safePerDayAfter: Money?
    public let safeToSpendWeek: Money?
    public let usualWeekMedian: Money?
    public let verdict: Verdict

    public enum CodingKeys: String, CodingKey {
        case amountChecked = "amount_checked"
        case category
        case daysToPayday = "days_to_payday"
        case differenceVsUsual = "difference_vs_usual"
        case freeUntilPayday = "free_until_payday"
        case nextPayday = "next_payday"
        case observationID = "observation_id"
        case period
        case priceSource = "price_source"
        case remainingAfter = "remaining_after"
        case safePerDayAfter = "safe_per_day_after"
        case safeToSpendWeek = "safe_to_spend_week"
        case usualWeekMedian = "usual_week_median"
        case verdict
    }

    public init(amountChecked: Money, category: String?, daysToPayday: Int?, differenceVsUsual: Money?, freeUntilPayday: Money?, nextPayday: String?, observationID: String?, period: Period?, priceSource: PriceSource, remainingAfter: Money?, safePerDayAfter: Money?, safeToSpendWeek: Money?, usualWeekMedian: Money?, verdict: Verdict) {
        self.amountChecked = amountChecked
        self.category = category
        self.daysToPayday = daysToPayday
        self.differenceVsUsual = differenceVsUsual
        self.freeUntilPayday = freeUntilPayday
        self.nextPayday = nextPayday
        self.observationID = observationID
        self.period = period
        self.priceSource = priceSource
        self.remainingAfter = remainingAfter
        self.safePerDayAfter = safePerDayAfter
        self.safeToSpendWeek = safeToSpendWeek
        self.usualWeekMedian = usualWeekMedian
        self.verdict = verdict
    }
}

// MARK: AffordabilityResult convenience initializers and mutators

public extension AffordabilityResult {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(AffordabilityResult.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        amountChecked: Money? = nil,
        category: String?? = nil,
        daysToPayday: Int?? = nil,
        differenceVsUsual: Money?? = nil,
        freeUntilPayday: Money?? = nil,
        nextPayday: String?? = nil,
        observationID: String?? = nil,
        period: Period?? = nil,
        priceSource: PriceSource? = nil,
        remainingAfter: Money?? = nil,
        safePerDayAfter: Money?? = nil,
        safeToSpendWeek: Money?? = nil,
        usualWeekMedian: Money?? = nil,
        verdict: Verdict? = nil
    ) -> AffordabilityResult {
        return AffordabilityResult(
            amountChecked: amountChecked ?? self.amountChecked,
            category: category ?? self.category,
            daysToPayday: daysToPayday ?? self.daysToPayday,
            differenceVsUsual: differenceVsUsual ?? self.differenceVsUsual,
            freeUntilPayday: freeUntilPayday ?? self.freeUntilPayday,
            nextPayday: nextPayday ?? self.nextPayday,
            observationID: observationID ?? self.observationID,
            period: period ?? self.period,
            priceSource: priceSource ?? self.priceSource,
            remainingAfter: remainingAfter ?? self.remainingAfter,
            safePerDayAfter: safePerDayAfter ?? self.safePerDayAfter,
            safeToSpendWeek: safeToSpendWeek ?? self.safeToSpendWeek,
            usualWeekMedian: usualWeekMedian ?? self.usualWeekMedian,
            verdict: verdict ?? self.verdict
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// What remaining_after covers: this week (fixture, user_stated) or until payday (S-Bank
/// Coach engine, DEC-025). Absent means week.
public enum Period: String, Codable {
    case untilPayday = "until_payday"
    case week = "week"
}

/// Where the amount came from. 'observation' = read from a capture; the answer must say the
/// price was read, not known.
public enum PriceSource: String, Codable {
    case basket = "basket"
    case observation = "observation"
    case statedAmount = "stated_amount"
}

public enum Verdict: String, Codable {
    case exceeds = "EXCEEDS"
    case fits = "FITS"
    case tight = "TIGHT"
    case unknown = "UNKNOWN"
}

/// A user-initiated photo from the glasses or phone, minimised on the phone before upload.
/// Capabilities receive raw media only if their manifest declares delivery 'media' for this
/// purpose; otherwise they receive Observations.
// MARK: - ContextCapture
public struct ContextCapture: Codable {
    public let captureID: String
    public let capturedAt: Date
    public let consentGrantID: String
    public let locale: String
    public let media: CaptureMedia
    /// What the phone did before upload. EXIF stripping is mandatory. orientation_applied = the
    /// image was rotated upright from its EXIF orientation before EXIF was stripped (DEC-006).
    public let minimisation: [Minimisation]
    /// A purpose declared in some capability manifest's capture_purposes, e.g. 'price_label',
    /// 'receipt'.
    public let purpose: String
    public let schema: ContextCaptureSchema
    public let sessionID: String
    public let source: Source
    public let trigger: Trigger
    public let userRef: String

    public enum CodingKeys: String, CodingKey {
        case captureID = "capture_id"
        case capturedAt = "captured_at"
        case consentGrantID = "consent_grant_id"
        case locale, media, minimisation, purpose, schema
        case sessionID = "session_id"
        case source, trigger
        case userRef = "user_ref"
    }

    public init(captureID: String, capturedAt: Date, consentGrantID: String, locale: String, media: CaptureMedia, minimisation: [Minimisation], purpose: String, schema: ContextCaptureSchema, sessionID: String, source: Source, trigger: Trigger, userRef: String) {
        self.captureID = captureID
        self.capturedAt = capturedAt
        self.consentGrantID = consentGrantID
        self.locale = locale
        self.media = media
        self.minimisation = minimisation
        self.purpose = purpose
        self.schema = schema
        self.sessionID = sessionID
        self.source = source
        self.trigger = trigger
        self.userRef = userRef
    }
}

// MARK: ContextCapture convenience initializers and mutators

public extension ContextCapture {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ContextCapture.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        captureID: String? = nil,
        capturedAt: Date? = nil,
        consentGrantID: String? = nil,
        locale: String? = nil,
        media: CaptureMedia? = nil,
        minimisation: [Minimisation]? = nil,
        purpose: String? = nil,
        schema: ContextCaptureSchema? = nil,
        sessionID: String? = nil,
        source: Source? = nil,
        trigger: Trigger? = nil,
        userRef: String? = nil
    ) -> ContextCapture {
        return ContextCapture(
            captureID: captureID ?? self.captureID,
            capturedAt: capturedAt ?? self.capturedAt,
            consentGrantID: consentGrantID ?? self.consentGrantID,
            locale: locale ?? self.locale,
            media: media ?? self.media,
            minimisation: minimisation ?? self.minimisation,
            purpose: purpose ?? self.purpose,
            schema: schema ?? self.schema,
            sessionID: sessionID ?? self.sessionID,
            source: source ?? self.source,
            trigger: trigger ?? self.trigger,
            userRef: userRef ?? self.userRef
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - CaptureMedia
public struct CaptureMedia: Codable {
    public let expiresAt: Date
    public let height: Int
    public let kind: MediaKind
    public let mime: MIME
    public let sha256: String
    public let uri: String
    public let width: Int

    public enum CodingKeys: String, CodingKey {
        case expiresAt = "expires_at"
        case height, kind, mime, sha256, uri, width
    }

    public init(expiresAt: Date, height: Int, kind: MediaKind, mime: MIME, sha256: String, uri: String, width: Int) {
        self.expiresAt = expiresAt
        self.height = height
        self.kind = kind
        self.mime = mime
        self.sha256 = sha256
        self.uri = uri
        self.width = width
    }
}

// MARK: CaptureMedia convenience initializers and mutators

public extension CaptureMedia {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CaptureMedia.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        expiresAt: Date? = nil,
        height: Int? = nil,
        kind: MediaKind? = nil,
        mime: MIME? = nil,
        sha256: String? = nil,
        uri: String? = nil,
        width: Int? = nil
    ) -> CaptureMedia {
        return CaptureMedia(
            expiresAt: expiresAt ?? self.expiresAt,
            height: height ?? self.height,
            kind: kind ?? self.kind,
            mime: mime ?? self.mime,
            sha256: sha256 ?? self.sha256,
            uri: uri ?? self.uri,
            width: width ?? self.width
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum MediaKind: String, Codable {
    case image = "image"
}

public enum MIME: String, Codable {
    case imageJPEG = "image/jpeg"
    case imagePNG = "image/png"
}

public enum Minimisation: String, Codable {
    case cropped = "cropped"
    case downscaled = "downscaled"
    case exifStripped = "exif_stripped"
    case facesBlurred = "faces_blurred"
    case gpsRemoved = "gps_removed"
    case orientationApplied = "orientation_applied"
}

public enum ContextCaptureSchema: String, Codable {
    case platformContextCaptureV1 = "platform.context_capture/v1"
}

public enum Source: String, Codable {
    case glassesPhoto = "glasses_photo"
    case glassesStreamFrame = "glasses_stream_frame"
    case phoneCamera = "phone_camera"
    case phoneUpload = "phone_upload"
}

public enum Trigger: String, Codable {
    case glassesInput = "glasses_input"
    case phoneTap = "phone_tap"
    case voiceCommand = "voice_command"
}

// MARK: - ConversationTurn
public struct ConversationTurn: Codable {
    public let role: Role
    public let text: String

    public init(role: Role, text: String) {
        self.role = role
        self.text = text
    }
}

// MARK: ConversationTurn convenience initializers and mutators

public extension ConversationTurn {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ConversationTurn.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        role: Role? = nil,
        text: String? = nil
    ) -> ConversationTurn {
        return ConversationTurn(
            role: role ?? self.role,
            text: text ?? self.text
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Role: String, Codable {
    case assistant = "assistant"
    case user = "user"
}

/// balance = actual balance + income date; budget = detected income and bills, no balance;
/// pace = spending history only (no affordability yes/no allowed).
public enum DataMode: String, Codable {
    case balance = "balance"
    case budget = "budget"
    case pace = "pace"
}

/// Descriptor every domain publishes for its deterministic functions. The agent, the
/// deterministic fast path and the verifier all use the same tools, so each tool can be
/// tested without any model.
// MARK: - DeterministicTool
public struct DeterministicTool: Codable {
    public let description: String
    public let deterministic: Bool
    public let goldenFixtures: String
    /// JSON Schema for the tool input.
    public let inputSchema: [String: JSONAny]
    public let name: String
    /// JSON Schema for ToolResult.result.
    public let outputSchema: [String: JSONAny]
    public let owner: String
    public let resultEnvelope: ResultEnvelope
    public let schema: DeterministicToolSchema
    /// Tools never write persistent state directly. 'proposal_only' tools may create an
    /// ActionProposal.
    public let sideEffects: SideEffects
    public let version: String

    public enum CodingKeys: String, CodingKey {
        case description, deterministic
        case goldenFixtures = "golden_fixtures"
        case inputSchema = "input_schema"
        case name
        case outputSchema = "output_schema"
        case owner
        case resultEnvelope = "result_envelope"
        case schema
        case sideEffects = "side_effects"
        case version
    }

    public init(description: String, deterministic: Bool, goldenFixtures: String, inputSchema: [String: JSONAny], name: String, outputSchema: [String: JSONAny], owner: String, resultEnvelope: ResultEnvelope, schema: DeterministicToolSchema, sideEffects: SideEffects, version: String) {
        self.description = description
        self.deterministic = deterministic
        self.goldenFixtures = goldenFixtures
        self.inputSchema = inputSchema
        self.name = name
        self.outputSchema = outputSchema
        self.owner = owner
        self.resultEnvelope = resultEnvelope
        self.schema = schema
        self.sideEffects = sideEffects
        self.version = version
    }
}

// MARK: DeterministicTool convenience initializers and mutators

public extension DeterministicTool {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DeterministicTool.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        description: String? = nil,
        deterministic: Bool? = nil,
        goldenFixtures: String? = nil,
        inputSchema: [String: JSONAny]? = nil,
        name: String? = nil,
        outputSchema: [String: JSONAny]? = nil,
        owner: String? = nil,
        resultEnvelope: ResultEnvelope? = nil,
        schema: DeterministicToolSchema? = nil,
        sideEffects: SideEffects? = nil,
        version: String? = nil
    ) -> DeterministicTool {
        return DeterministicTool(
            description: description ?? self.description,
            deterministic: deterministic ?? self.deterministic,
            goldenFixtures: goldenFixtures ?? self.goldenFixtures,
            inputSchema: inputSchema ?? self.inputSchema,
            name: name ?? self.name,
            outputSchema: outputSchema ?? self.outputSchema,
            owner: owner ?? self.owner,
            resultEnvelope: resultEnvelope ?? self.resultEnvelope,
            schema: schema ?? self.schema,
            sideEffects: sideEffects ?? self.sideEffects,
            version: version ?? self.version
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ResultEnvelope: String, Codable {
    case platformToolResultV1 = "platform.tool_result/v1"
}

public enum DeterministicToolSchema: String, Codable {
    case platformToolDescriptorV1 = "platform.tool_descriptor/v1"
}

/// Tools never write persistent state directly. 'proposal_only' tools may create an
/// ActionProposal.
public enum SideEffects: String, Codable {
    case none = "none"
    case proposalOnly = "proposal_only"
}

/// Capabilities negotiated with the connected glasses at session start. Availability varies
/// by device and SDK version.
public enum DeviceCapability: String, Codable {
    case audioStream = "audio_stream"
    case cameraStream = "camera_stream"
    case display = "display"
    case imu = "imu"
    case inputs = "inputs"
    case onDeviceSpeech = "on_device_speech"
    case photoCapture = "photo_capture"
    case voiceInvocation = "voice_invocation"
}

/// Snapshot of the glasses link as the companion sees it, published on every change (seq
/// increases monotonically). Four independent lifecycles are reported separately rather than
/// as one state chain, because the Meta Wearables Device Access Toolkit changes them
/// independently: registration with the Meta AI app, the device session, the camera stream,
/// and the platform's own conversation state. Values are platform names; GlassesBridge maps
/// SDK enums onto them, so SDK changes never reach this contract. See
/// docs/ARCHITECTURE_DECISION_LOG.md DEC-005.
// MARK: - DeviceSessionState
public struct DeviceSessionState: Codable {
    /// glasses_hfp = two-way narrow-band mono (mic + speech out); glasses_a2dp = output only;
    /// phone = phone mic/speaker; none = no usable audio.
    public let audioRoute: AudioRoute
    public let camera: CameraState
    /// Why the experience is reduced. Empty when everything requested is available.
    public let degradedReasons: [DegradedReason]
    /// Whether an eligible device is selected. update_required = the glasses need a firmware or
    /// on-glasses app update.
    public let deviceAvailability: DeviceAvailability
    public let deviceCapabilities: [DeviceCapability]
    /// Device session state. paused is device-driven and carries no reason; stopped is terminal
    /// and a new session must be created.
    public let deviceSession: DeviceSession
    /// SDK features in use that the vendor marks experimental or preview. A non-empty list means
    /// this build cannot be published; each feature has a non-experimental fallback (DEC-004).
    public let experimentalFeatures: [ExperimentalFeature]
    /// Which implementation GlassesBridge is running. Always explicit: a mock must never stand
    /// in silently for real hardware.
    public let glassesBackend: GlassesBackend
    /// The platform's conversation state, independent of the device lifecycles above.
    public let interaction: Interaction
    /// glasses = the glasses are usable for this turn; phone_only = every interaction continues
    /// on the phone.
    public let mode: Mode
    public let observedAt: Date
    /// Registration of this app with the Meta AI app.
    public let registration: Registration
    public let schema: DeviceSessionStateSchema
    /// Monotonic per session. Consumers drop snapshots with a lower seq than the last one seen.
    public let seq: Int
    public let sessionID: String

    public enum CodingKeys: String, CodingKey {
        case audioRoute = "audio_route"
        case camera
        case degradedReasons = "degraded_reasons"
        case deviceAvailability = "device_availability"
        case deviceCapabilities = "device_capabilities"
        case deviceSession = "device_session"
        case experimentalFeatures = "experimental_features"
        case glassesBackend = "glasses_backend"
        case interaction, mode
        case observedAt = "observed_at"
        case registration, schema, seq
        case sessionID = "session_id"
    }

    public init(audioRoute: AudioRoute, camera: CameraState, degradedReasons: [DegradedReason], deviceAvailability: DeviceAvailability, deviceCapabilities: [DeviceCapability], deviceSession: DeviceSession, experimentalFeatures: [ExperimentalFeature], glassesBackend: GlassesBackend, interaction: Interaction, mode: Mode, observedAt: Date, registration: Registration, schema: DeviceSessionStateSchema, seq: Int, sessionID: String) {
        self.audioRoute = audioRoute
        self.camera = camera
        self.degradedReasons = degradedReasons
        self.deviceAvailability = deviceAvailability
        self.deviceCapabilities = deviceCapabilities
        self.deviceSession = deviceSession
        self.experimentalFeatures = experimentalFeatures
        self.glassesBackend = glassesBackend
        self.interaction = interaction
        self.mode = mode
        self.observedAt = observedAt
        self.registration = registration
        self.schema = schema
        self.seq = seq
        self.sessionID = sessionID
    }
}

// MARK: DeviceSessionState convenience initializers and mutators

public extension DeviceSessionState {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DeviceSessionState.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        audioRoute: AudioRoute? = nil,
        camera: CameraState? = nil,
        degradedReasons: [DegradedReason]? = nil,
        deviceAvailability: DeviceAvailability? = nil,
        deviceCapabilities: [DeviceCapability]? = nil,
        deviceSession: DeviceSession? = nil,
        experimentalFeatures: [ExperimentalFeature]? = nil,
        glassesBackend: GlassesBackend? = nil,
        interaction: Interaction? = nil,
        mode: Mode? = nil,
        observedAt: Date? = nil,
        registration: Registration? = nil,
        schema: DeviceSessionStateSchema? = nil,
        seq: Int? = nil,
        sessionID: String? = nil
    ) -> DeviceSessionState {
        return DeviceSessionState(
            audioRoute: audioRoute ?? self.audioRoute,
            camera: camera ?? self.camera,
            degradedReasons: degradedReasons ?? self.degradedReasons,
            deviceAvailability: deviceAvailability ?? self.deviceAvailability,
            deviceCapabilities: deviceCapabilities ?? self.deviceCapabilities,
            deviceSession: deviceSession ?? self.deviceSession,
            experimentalFeatures: experimentalFeatures ?? self.experimentalFeatures,
            glassesBackend: glassesBackend ?? self.glassesBackend,
            interaction: interaction ?? self.interaction,
            mode: mode ?? self.mode,
            observedAt: observedAt ?? self.observedAt,
            registration: registration ?? self.registration,
            schema: schema ?? self.schema,
            seq: seq ?? self.seq,
            sessionID: sessionID ?? self.sessionID
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// glasses_hfp = two-way narrow-band mono (mic + speech out); glasses_a2dp = output only;
/// phone = phone mic/speaker; none = no usable audio.
public enum AudioRoute: String, Codable {
    case glassesA2DP = "glasses_a2dp"
    case glassesHfp = "glasses_hfp"
    case none = "none"
    case phone = "phone"
}

// MARK: - CameraState
public struct CameraState: Codable {
    /// Camera permission is granted in the Meta AI app, not through an OS dialog.
    public let permission: Permission
    public let stream: Stream

    public init(permission: Permission, stream: Stream) {
        self.permission = permission
        self.stream = stream
    }
}

// MARK: CameraState convenience initializers and mutators

public extension CameraState {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CameraState.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        permission: Permission? = nil,
        stream: Stream? = nil
    ) -> CameraState {
        return CameraState(
            permission: permission ?? self.permission,
            stream: stream ?? self.stream
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Camera permission is granted in the Meta AI app, not through an OS dialog.
public enum Permission: String, Codable {
    case denied = "denied"
    case grantedAlways = "granted_always"
    case grantedOnce = "granted_once"
    case unknown = "unknown"
}

public enum Stream: String, Codable {
    case paused = "paused"
    case starting = "starting"
    case stopped = "stopped"
    case stopping = "stopping"
    case streaming = "streaming"
}

public enum DegradedReason: String, Codable {
    case appBackgrounded = "APP_BACKGROUNDED"
    case batteryLow = "BATTERY_LOW"
    case bluetoothRouteUnavailable = "BLUETOOTH_ROUTE_UNAVAILABLE"
    case cameraPermissionDenied = "CAMERA_PERMISSION_DENIED"
    case deviceUpdateRequired = "DEVICE_UPDATE_REQUIRED"
    case doffed = "DOFFED"
    case hingesClosed = "HINGES_CLOSED"
    case metaAIAppMissing = "META_AI_APP_MISSING"
    case micPermissionDenied = "MIC_PERMISSION_DENIED"
    case noDevice = "NO_DEVICE"
    case notRegistered = "NOT_REGISTERED"
    case sdkUpdateRequired = "SDK_UPDATE_REQUIRED"
    case sessionStopped = "SESSION_STOPPED"
    case thermal = "THERMAL"
    case userChosePhone = "USER_CHOSE_PHONE"
}

/// Whether an eligible device is selected. update_required = the glasses need a firmware or
/// on-glasses app update.
public enum DeviceAvailability: String, Codable {
    case available = "available"
    case none = "none"
    case updateRequired = "update_required"
}

/// Device session state. paused is device-driven and carries no reason; stopped is terminal
/// and a new session must be created.
public enum DeviceSession: String, Codable {
    case idle = "idle"
    case paused = "paused"
    case started = "started"
    case starting = "starting"
    case stopped = "stopped"
    case stopping = "stopping"
}

public enum ExperimentalFeature: String, Codable {
    case display = "display"
    case inputs = "inputs"
    case motion = "motion"
    case speech = "speech"
    case standalonePhoto = "standalone_photo"
    case streamAudio = "stream_audio"
    case voiceInvocation = "voice_invocation"
}

/// Which implementation GlassesBridge is running. Always explicit: a mock must never stand
/// in silently for real hardware.
public enum GlassesBackend: String, Codable {
    case dat = "dat"
    case mock = "mock"
    case none = "none"
}

/// The platform's conversation state, independent of the device lifecycles above.
public enum Interaction: String, Codable {
    case awaitingConfirmation = "awaiting_confirmation"
    case capturePending = "capture_pending"
    case idle = "idle"
    case listening = "listening"
    case processing = "processing"
    case speaking = "speaking"
}

/// glasses = the glasses are usable for this turn; phone_only = every interaction continues
/// on the phone.
public enum Mode: String, Codable {
    case glasses = "glasses"
    case phoneOnly = "phone_only"
}

/// Registration of this app with the Meta AI app.
public enum Registration: String, Codable {
    case notRegistered = "not_registered"
    case registered = "registered"
    case registering = "registering"
    case unavailable = "unavailable"
}

public enum DeviceSessionStateSchema: String, Codable {
    case platformDeviceSessionStateV1 = "platform.device_session_state/v1"
}

/// What a capability declares to the platform. The platform loads nothing it cannot
/// validate: intents, capture purposes, data classes (for consent), action kinds (for
/// confirmation policy), events, transport and SLOs.
// MARK: - DomainCapability
public struct DomainCapability: Codable {
    public let actionKinds: [ActionKindDeclaration]
    public let capabilityID: String
    public let capturePurposes: [CapturePurpose]
    public let contractVersion: ContractVersion
    /// Data classes this capability touches; the consent registry asks for each.
    public let dataClasses: [String]
    public let displayName: [String: String]
    public let eventsEmitted: [String]
    public let fixturesURI: String
    public let healthURI: String?
    public let intents: [IntentDeclaration]
    public let schema: DomainCapabilitySchema
    public let slo: LatencySlo
    public let transport: CapabilityTransport
    public let version: String

    public enum CodingKeys: String, CodingKey {
        case actionKinds = "action_kinds"
        case capabilityID = "capability_id"
        case capturePurposes = "capture_purposes"
        case contractVersion = "contract_version"
        case dataClasses = "data_classes"
        case displayName = "display_name"
        case eventsEmitted = "events_emitted"
        case fixturesURI = "fixtures_uri"
        case healthURI = "health_uri"
        case intents, schema, slo, transport, version
    }

    public init(actionKinds: [ActionKindDeclaration], capabilityID: String, capturePurposes: [CapturePurpose], contractVersion: ContractVersion, dataClasses: [String], displayName: [String: String], eventsEmitted: [String], fixturesURI: String, healthURI: String?, intents: [IntentDeclaration], schema: DomainCapabilitySchema, slo: LatencySlo, transport: CapabilityTransport, version: String) {
        self.actionKinds = actionKinds
        self.capabilityID = capabilityID
        self.capturePurposes = capturePurposes
        self.contractVersion = contractVersion
        self.dataClasses = dataClasses
        self.displayName = displayName
        self.eventsEmitted = eventsEmitted
        self.fixturesURI = fixturesURI
        self.healthURI = healthURI
        self.intents = intents
        self.schema = schema
        self.slo = slo
        self.transport = transport
        self.version = version
    }
}

// MARK: DomainCapability convenience initializers and mutators

public extension DomainCapability {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DomainCapability.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        actionKinds: [ActionKindDeclaration]? = nil,
        capabilityID: String? = nil,
        capturePurposes: [CapturePurpose]? = nil,
        contractVersion: ContractVersion? = nil,
        dataClasses: [String]? = nil,
        displayName: [String: String]? = nil,
        eventsEmitted: [String]? = nil,
        fixturesURI: String? = nil,
        healthURI: String?? = nil,
        intents: [IntentDeclaration]? = nil,
        schema: DomainCapabilitySchema? = nil,
        slo: LatencySlo? = nil,
        transport: CapabilityTransport? = nil,
        version: String? = nil
    ) -> DomainCapability {
        return DomainCapability(
            actionKinds: actionKinds ?? self.actionKinds,
            capabilityID: capabilityID ?? self.capabilityID,
            capturePurposes: capturePurposes ?? self.capturePurposes,
            contractVersion: contractVersion ?? self.contractVersion,
            dataClasses: dataClasses ?? self.dataClasses,
            displayName: displayName ?? self.displayName,
            eventsEmitted: eventsEmitted ?? self.eventsEmitted,
            fixturesURI: fixturesURI ?? self.fixturesURI,
            healthURI: healthURI ?? self.healthURI,
            intents: intents ?? self.intents,
            schema: schema ?? self.schema,
            slo: slo ?? self.slo,
            transport: transport ?? self.transport,
            version: version ?? self.version
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ActionKindDeclaration
public struct ActionKindDeclaration: Codable {
    public let confirmChannels: [ConfirmChannel]
    public let kind: String
    public let reversible: Bool
    public let risk: Risk

    public enum CodingKeys: String, CodingKey {
        case confirmChannels = "confirm_channels"
        case kind, reversible, risk
    }

    public init(confirmChannels: [ConfirmChannel], kind: String, reversible: Bool, risk: Risk) {
        self.confirmChannels = confirmChannels
        self.kind = kind
        self.reversible = reversible
        self.risk = risk
    }
}

// MARK: ActionKindDeclaration convenience initializers and mutators

public extension ActionKindDeclaration {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ActionKindDeclaration.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        confirmChannels: [ConfirmChannel]? = nil,
        kind: String? = nil,
        reversible: Bool? = nil,
        risk: Risk? = nil
    ) -> ActionKindDeclaration {
        return ActionKindDeclaration(
            confirmChannels: confirmChannels ?? self.confirmChannels,
            kind: kind ?? self.kind,
            reversible: reversible ?? self.reversible,
            risk: risk ?? self.risk
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - CapturePurpose
public struct CapturePurpose: Codable {
    /// 'observation' (default, preferred): the capability receives only what the platform read.
    /// 'media': it receives the minimised image via a short-lived reference.
    public let delivery: Delivery
    public let purpose: String
    /// Maximum time the capability may keep the image. Capped at 30 days.
    public let retentionMaxS: Int

    public enum CodingKeys: String, CodingKey {
        case delivery, purpose
        case retentionMaxS = "retention_max_s"
    }

    public init(delivery: Delivery, purpose: String, retentionMaxS: Int) {
        self.delivery = delivery
        self.purpose = purpose
        self.retentionMaxS = retentionMaxS
    }
}

// MARK: CapturePurpose convenience initializers and mutators

public extension CapturePurpose {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CapturePurpose.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        delivery: Delivery? = nil,
        purpose: String? = nil,
        retentionMaxS: Int? = nil
    ) -> CapturePurpose {
        return CapturePurpose(
            delivery: delivery ?? self.delivery,
            purpose: purpose ?? self.purpose,
            retentionMaxS: retentionMaxS ?? self.retentionMaxS
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// 'observation' (default, preferred): the capability receives only what the platform read.
/// 'media': it receives the minimised image via a short-lived reference.
public enum Delivery: String, Codable {
    case media = "media"
    case observation = "observation"
}

public enum ContractVersion: String, Codable {
    case the1 = "1"
}

// MARK: - IntentDeclaration
public struct IntentDeclaration: Codable {
    /// Capture purposes this intent can use; each must appear in capture_purposes.
    public let acceptsCapture: [String]
    public let examples: [[String: String]]
    public let id: String
    public let voiceOk: Bool

    public enum CodingKeys: String, CodingKey {
        case acceptsCapture = "accepts_capture"
        case examples, id
        case voiceOk = "voice_ok"
    }

    public init(acceptsCapture: [String], examples: [[String: String]], id: String, voiceOk: Bool) {
        self.acceptsCapture = acceptsCapture
        self.examples = examples
        self.id = id
        self.voiceOk = voiceOk
    }
}

// MARK: IntentDeclaration convenience initializers and mutators

public extension IntentDeclaration {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(IntentDeclaration.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        acceptsCapture: [String]? = nil,
        examples: [[String: String]]? = nil,
        id: String? = nil,
        voiceOk: Bool? = nil
    ) -> IntentDeclaration {
        return IntentDeclaration(
            acceptsCapture: acceptsCapture ?? self.acceptsCapture,
            examples: examples ?? self.examples,
            id: id ?? self.id,
            voiceOk: voiceOk ?? self.voiceOk
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum DomainCapabilitySchema: String, Codable {
    case platformCapabilityManifestV1 = "platform.capability_manifest/v1"
}

// MARK: - LatencySlo
public struct LatencySlo: Codable {
    public let p50MS, p95MS: Int

    public enum CodingKeys: String, CodingKey {
        case p50MS = "p50_ms"
        case p95MS = "p95_ms"
    }

    public init(p50MS: Int, p95MS: Int) {
        self.p50MS = p50MS
        self.p95MS = p95MS
    }
}

// MARK: LatencySlo convenience initializers and mutators

public extension LatencySlo {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(LatencySlo.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        p50MS: Int? = nil,
        p95MS: Int? = nil
    ) -> LatencySlo {
        return LatencySlo(
            p50MS: p50MS ?? self.p50MS,
            p95MS: p95MS ?? self.p95MS
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - CapabilityTransport
public struct CapabilityTransport: Codable {
    public let endpoint: String?
    public let kind: TransportKind

    public init(endpoint: String?, kind: TransportKind) {
        self.endpoint = endpoint
        self.kind = kind
    }
}

// MARK: CapabilityTransport convenience initializers and mutators

public extension CapabilityTransport {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(CapabilityTransport.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        endpoint: String?? = nil,
        kind: TransportKind? = nil
    ) -> CapabilityTransport {
        return CapabilityTransport(
            endpoint: endpoint ?? self.endpoint,
            kind: kind ?? self.kind
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum TransportKind: String, Codable {
    case httpsJSON = "https_json"
    case httpsSSE = "https_sse"
    case inProcess = "in_process"
}

/// Emitted by a capability for possible proactive delivery. The platform's notification
/// policy decides whether, when and where to deliver it (rate limits, quiet hours, active
/// session). Amounts are never spoken proactively: open-ear speakers can be overheard. The
/// summary must be safe to show on a lock screen: no amounts, merchants or item names.
// MARK: - DomainEvent
public struct DomainEvent: Codable {
    public let capabilityID: String
    public let cardRef: String?
    public let dedupeKey: String
    public let deliveryPrefs: DeliveryPrefs
    public let eventID: String
    public let expiresAt, occurredAt: Date
    public let schema: DomainEventSchema
    public let severity: Severity
    public let summary: [String: String]
    public let type: String
    public let userRef: String

    public enum CodingKeys: String, CodingKey {
        case capabilityID = "capability_id"
        case cardRef = "card_ref"
        case dedupeKey = "dedupe_key"
        case deliveryPrefs = "delivery_prefs"
        case eventID = "event_id"
        case expiresAt = "expires_at"
        case occurredAt = "occurred_at"
        case schema, severity, summary, type
        case userRef = "user_ref"
    }

    public init(capabilityID: String, cardRef: String?, dedupeKey: String, deliveryPrefs: DeliveryPrefs, eventID: String, expiresAt: Date, occurredAt: Date, schema: DomainEventSchema, severity: Severity, summary: [String: String], type: String, userRef: String) {
        self.capabilityID = capabilityID
        self.cardRef = cardRef
        self.dedupeKey = dedupeKey
        self.deliveryPrefs = deliveryPrefs
        self.eventID = eventID
        self.expiresAt = expiresAt
        self.occurredAt = occurredAt
        self.schema = schema
        self.severity = severity
        self.summary = summary
        self.type = type
        self.userRef = userRef
    }
}

// MARK: DomainEvent convenience initializers and mutators

public extension DomainEvent {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DomainEvent.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        capabilityID: String? = nil,
        cardRef: String?? = nil,
        dedupeKey: String? = nil,
        deliveryPrefs: DeliveryPrefs? = nil,
        eventID: String? = nil,
        expiresAt: Date? = nil,
        occurredAt: Date? = nil,
        schema: DomainEventSchema? = nil,
        severity: Severity? = nil,
        summary: [String: String]? = nil,
        type: String? = nil,
        userRef: String? = nil
    ) -> DomainEvent {
        return DomainEvent(
            capabilityID: capabilityID ?? self.capabilityID,
            cardRef: cardRef ?? self.cardRef,
            dedupeKey: dedupeKey ?? self.dedupeKey,
            deliveryPrefs: deliveryPrefs ?? self.deliveryPrefs,
            eventID: eventID ?? self.eventID,
            expiresAt: expiresAt ?? self.expiresAt,
            occurredAt: occurredAt ?? self.occurredAt,
            schema: schema ?? self.schema,
            severity: severity ?? self.severity,
            summary: summary ?? self.summary,
            type: type ?? self.type,
            userRef: userRef ?? self.userRef
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - DeliveryPrefs
public struct DeliveryPrefs: Codable {
    public let glassesAudio: GlassesAudio
    public let phoneNotification: Bool
    /// Reserved. Always false in v1.
    public let spokenAmounts: Bool

    public enum CodingKeys: String, CodingKey {
        case glassesAudio = "glasses_audio"
        case phoneNotification = "phone_notification"
        case spokenAmounts = "spoken_amounts"
    }

    public init(glassesAudio: GlassesAudio, phoneNotification: Bool, spokenAmounts: Bool) {
        self.glassesAudio = glassesAudio
        self.phoneNotification = phoneNotification
        self.spokenAmounts = spokenAmounts
    }
}

// MARK: DeliveryPrefs convenience initializers and mutators

public extension DeliveryPrefs {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DeliveryPrefs.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        glassesAudio: GlassesAudio? = nil,
        phoneNotification: Bool? = nil,
        spokenAmounts: Bool? = nil
    ) -> DeliveryPrefs {
        return DeliveryPrefs(
            glassesAudio: glassesAudio ?? self.glassesAudio,
            phoneNotification: phoneNotification ?? self.phoneNotification,
            spokenAmounts: spokenAmounts ?? self.spokenAmounts
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum GlassesAudio: String, Codable {
    case inSessionOnly = "in_session_only"
    case never = "never"
}

public enum DomainEventSchema: String, Codable {
    case platformDomainEventV1 = "platform.domain_event/v1"
}

public enum Severity: String, Codable {
    case important = "important"
    case info = "info"
    case nudge = "nudge"
}

/// What the orchestrator sends to a capability (and what the S-Bank Coach agent receives on
/// POST /v1/turn). Self-contained: the capability may be stateless.
// MARK: - DomainRequest
public struct DomainRequest: Codable {
    public let capabilityID: String
    /// Raw minimised captures, only for purposes with delivery 'media'.
    public let captures: [ContextCapture]
    public let conversation: ConversationContext
    /// The capability must answer (or the adapter falls back) within this time.
    public let deadlineMS: Int
    public let deviceCapabilities: [DeviceCapability]?
    /// Optional pre-classification (e.g. from an on-device router). Capabilities may ignore it.
    public let intentHint: IntentHint?
    public let locale: String
    /// What the platform read from captures (for purposes with delivery 'observation').
    public let observations: [Observation]
    public let outputConstraints: OutputConstraints
    public let requestID: String
    public let schema: DomainRequestSchema
    public let sessionID, turnID, userRef: String
    public let utterance: String?

    public enum CodingKeys: String, CodingKey {
        case capabilityID = "capability_id"
        case captures, conversation
        case deadlineMS = "deadline_ms"
        case deviceCapabilities = "device_capabilities"
        case intentHint = "intent_hint"
        case locale, observations
        case outputConstraints = "output_constraints"
        case requestID = "request_id"
        case schema
        case sessionID = "session_id"
        case turnID = "turn_id"
        case userRef = "user_ref"
        case utterance
    }

    public init(capabilityID: String, captures: [ContextCapture], conversation: ConversationContext, deadlineMS: Int, deviceCapabilities: [DeviceCapability]?, intentHint: IntentHint?, locale: String, observations: [Observation], outputConstraints: OutputConstraints, requestID: String, schema: DomainRequestSchema, sessionID: String, turnID: String, userRef: String, utterance: String?) {
        self.capabilityID = capabilityID
        self.captures = captures
        self.conversation = conversation
        self.deadlineMS = deadlineMS
        self.deviceCapabilities = deviceCapabilities
        self.intentHint = intentHint
        self.locale = locale
        self.observations = observations
        self.outputConstraints = outputConstraints
        self.requestID = requestID
        self.schema = schema
        self.sessionID = sessionID
        self.turnID = turnID
        self.userRef = userRef
        self.utterance = utterance
    }
}

// MARK: DomainRequest convenience initializers and mutators

public extension DomainRequest {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DomainRequest.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        capabilityID: String? = nil,
        captures: [ContextCapture]? = nil,
        conversation: ConversationContext? = nil,
        deadlineMS: Int? = nil,
        deviceCapabilities: [DeviceCapability]?? = nil,
        intentHint: IntentHint?? = nil,
        locale: String? = nil,
        observations: [Observation]? = nil,
        outputConstraints: OutputConstraints? = nil,
        requestID: String? = nil,
        schema: DomainRequestSchema? = nil,
        sessionID: String? = nil,
        turnID: String? = nil,
        userRef: String? = nil,
        utterance: String?? = nil
    ) -> DomainRequest {
        return DomainRequest(
            capabilityID: capabilityID ?? self.capabilityID,
            captures: captures ?? self.captures,
            conversation: conversation ?? self.conversation,
            deadlineMS: deadlineMS ?? self.deadlineMS,
            deviceCapabilities: deviceCapabilities ?? self.deviceCapabilities,
            intentHint: intentHint ?? self.intentHint,
            locale: locale ?? self.locale,
            observations: observations ?? self.observations,
            outputConstraints: outputConstraints ?? self.outputConstraints,
            requestID: requestID ?? self.requestID,
            schema: schema ?? self.schema,
            sessionID: sessionID ?? self.sessionID,
            turnID: turnID ?? self.turnID,
            userRef: userRef ?? self.userRef,
            utterance: utterance ?? self.utterance
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ConversationContext
public struct ConversationContext: Codable {
    public let recentTurns: [ConversationTurn]
    public let ref: String

    public enum CodingKeys: String, CodingKey {
        case recentTurns = "recent_turns"
        case ref
    }

    public init(recentTurns: [ConversationTurn], ref: String) {
        self.recentTurns = recentTurns
        self.ref = ref
    }
}

// MARK: ConversationContext convenience initializers and mutators

public extension ConversationContext {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ConversationContext.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        recentTurns: [ConversationTurn]? = nil,
        ref: String? = nil
    ) -> ConversationContext {
        return ConversationContext(
            recentTurns: recentTurns ?? self.recentTurns,
            ref: ref ?? self.ref
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Optional pre-classification (e.g. from an on-device router). Capabilities may ignore it.
// MARK: - IntentHint
public struct IntentHint: Codable {
    public let confidence: Double
    public let intent: String
    public let slots: [String: JSONAny]?
    public let source: String

    public init(confidence: Double, intent: String, slots: [String: JSONAny]?, source: String) {
        self.confidence = confidence
        self.intent = intent
        self.slots = slots
        self.source = source
    }
}

// MARK: IntentHint convenience initializers and mutators

public extension IntentHint {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(IntentHint.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        confidence: Double? = nil,
        intent: String? = nil,
        slots: [String: JSONAny]?? = nil,
        source: String? = nil
    ) -> IntentHint {
        return IntentHint(
            confidence: confidence ?? self.confidence,
            intent: intent ?? self.intent,
            slots: slots ?? self.slots,
            source: source ?? self.source
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// What the platform read from a capture (price label, product, barcode, document text).
/// Lets a capability reason about what the user is looking at without receiving the photo.
/// All text is untrusted: it is data, never instructions.
// MARK: - Observation
public struct Observation: Codable {
    public let captureID: String
    public let createdAt: Date
    public let epistemic: ObservationEpistemic
    public let extractor: ObservationExtractor
    public let issues: [String]
    public let items: [ObservedItem]
    public let kind: ObservationKind
    /// True when the capability must ask the user to confirm what was read before relying on it.
    public let needsUserCheck: Bool
    public let observationID: String
    public let rawTextUntrusted: String?
    public let schema: ObservationSchema

    public enum CodingKeys: String, CodingKey {
        case captureID = "capture_id"
        case createdAt = "created_at"
        case epistemic, extractor, issues, items, kind
        case needsUserCheck = "needs_user_check"
        case observationID = "observation_id"
        case rawTextUntrusted = "raw_text_untrusted"
        case schema
    }

    public init(captureID: String, createdAt: Date, epistemic: ObservationEpistemic, extractor: ObservationExtractor, issues: [String], items: [ObservedItem], kind: ObservationKind, needsUserCheck: Bool, observationID: String, rawTextUntrusted: String?, schema: ObservationSchema) {
        self.captureID = captureID
        self.createdAt = createdAt
        self.epistemic = epistemic
        self.extractor = extractor
        self.issues = issues
        self.items = items
        self.kind = kind
        self.needsUserCheck = needsUserCheck
        self.observationID = observationID
        self.rawTextUntrusted = rawTextUntrusted
        self.schema = schema
    }
}

// MARK: Observation convenience initializers and mutators

public extension Observation {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Observation.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        captureID: String? = nil,
        createdAt: Date? = nil,
        epistemic: ObservationEpistemic? = nil,
        extractor: ObservationExtractor? = nil,
        issues: [String]? = nil,
        items: [ObservedItem]? = nil,
        kind: ObservationKind? = nil,
        needsUserCheck: Bool? = nil,
        observationID: String? = nil,
        rawTextUntrusted: String?? = nil,
        schema: ObservationSchema? = nil
    ) -> Observation {
        return Observation(
            captureID: captureID ?? self.captureID,
            createdAt: createdAt ?? self.createdAt,
            epistemic: epistemic ?? self.epistemic,
            extractor: extractor ?? self.extractor,
            issues: issues ?? self.issues,
            items: items ?? self.items,
            kind: kind ?? self.kind,
            needsUserCheck: needsUserCheck ?? self.needsUserCheck,
            observationID: observationID ?? self.observationID,
            rawTextUntrusted: rawTextUntrusted ?? self.rawTextUntrusted,
            schema: schema ?? self.schema
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ObservationEpistemic: String, Codable {
    case observed = "observed"
}

// MARK: - ObservationExtractor
public struct ObservationExtractor: Codable {
    public let providerID: String
    public let version: String

    public enum CodingKeys: String, CodingKey {
        case providerID = "provider_id"
        case version
    }

    public init(providerID: String, version: String) {
        self.providerID = providerID
        self.version = version
    }
}

// MARK: ObservationExtractor convenience initializers and mutators

public extension ObservationExtractor {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ObservationExtractor.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        providerID: String? = nil,
        version: String? = nil
    ) -> ObservationExtractor {
        return ObservationExtractor(
            providerID: providerID ?? self.providerID,
            version: version ?? self.version
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ObservedItem
public struct ObservedItem: Codable {
    public let barcode: String?
    public let confidence: Double
    public let labelUntrusted: String
    public let price: Money?
    public let unitPrice: ObservedUnitPrice?

    public enum CodingKeys: String, CodingKey {
        case barcode, confidence
        case labelUntrusted = "label_untrusted"
        case price
        case unitPrice = "unit_price"
    }

    public init(barcode: String?, confidence: Double, labelUntrusted: String, price: Money?, unitPrice: ObservedUnitPrice?) {
        self.barcode = barcode
        self.confidence = confidence
        self.labelUntrusted = labelUntrusted
        self.price = price
        self.unitPrice = unitPrice
    }
}

// MARK: ObservedItem convenience initializers and mutators

public extension ObservedItem {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ObservedItem.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        barcode: String?? = nil,
        confidence: Double? = nil,
        labelUntrusted: String? = nil,
        price: Money?? = nil,
        unitPrice: ObservedUnitPrice?? = nil
    ) -> ObservedItem {
        return ObservedItem(
            barcode: barcode ?? self.barcode,
            confidence: confidence ?? self.confidence,
            labelUntrusted: labelUntrusted ?? self.labelUntrusted,
            price: price ?? self.price,
            unitPrice: unitPrice ?? self.unitPrice
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ObservedUnitPrice
public struct ObservedUnitPrice: Codable {
    public let amount: Money
    public let per: Per

    public init(amount: Money, per: Per) {
        self.amount = amount
        self.per = per
    }
}

// MARK: ObservedUnitPrice convenience initializers and mutators

public extension ObservedUnitPrice {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ObservedUnitPrice.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        amount: Money? = nil,
        per: Per? = nil
    ) -> ObservedUnitPrice {
        return ObservedUnitPrice(
            amount: amount ?? self.amount,
            per: per ?? self.per
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Per: String, Codable {
    case kg = "kg"
    case l = "l"
    case pcs = "pcs"
}

public enum ObservationKind: String, Codable {
    case barcode = "barcode"
    case documentText = "document_text"
    case priceLabel = "price_label"
    case product = "product"
    case receipt = "receipt"
}

public enum ObservationSchema: String, Codable {
    case platformObservationV1 = "platform.observation/v1"
}

// MARK: - OutputConstraints
public struct OutputConstraints: Codable {
    public let discreetMode: Bool
    public let display: OutputDisplay
    public let speechMaxWords: Int

    public enum CodingKeys: String, CodingKey {
        case discreetMode = "discreet_mode"
        case display
        case speechMaxWords = "speech_max_words"
    }

    public init(discreetMode: Bool, display: OutputDisplay, speechMaxWords: Int) {
        self.discreetMode = discreetMode
        self.display = display
        self.speechMaxWords = speechMaxWords
    }
}

// MARK: OutputConstraints convenience initializers and mutators

public extension OutputConstraints {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(OutputConstraints.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        discreetMode: Bool? = nil,
        display: OutputDisplay? = nil,
        speechMaxWords: Int? = nil
    ) -> OutputConstraints {
        return OutputConstraints(
            discreetMode: discreetMode ?? self.discreetMode,
            display: display ?? self.display,
            speechMaxWords: speechMaxWords ?? self.speechMaxWords
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum OutputDisplay: String, Codable {
    case glasses = "glasses"
    case none = "none"
    case phone = "phone"
}

public enum DomainRequestSchema: String, Codable {
    case platformDomainRequestV1 = "platform.domain_request/v1"
}

/// A capability's complete answer to one DomainRequest: one short spoken line, cards for the
/// phone, optional proposals, and a trace. The agent sends trace.verified=false; only the
/// adapter sets it to true after checking every number against the engine.
// MARK: - DomainResponse
public struct DomainResponse: Codable {
    public let cards: [InsightCard]
    public let error: ErrorInfo?
    /// Suggested follow-up questions shown as chips.
    public let followups: [[String: String]]?
    public let proposals: [ActionProposal]
    public let requestID: String
    public let schema: DomainResponseSchema
    public let speech: SpokenLine
    public let status: DomainResponseStatus
    public let trace: ResponseTrace

    public enum CodingKeys: String, CodingKey {
        case cards, error, followups, proposals
        case requestID = "request_id"
        case schema, speech, status, trace
    }

    public init(cards: [InsightCard], error: ErrorInfo?, followups: [[String: String]]?, proposals: [ActionProposal], requestID: String, schema: DomainResponseSchema, speech: SpokenLine, status: DomainResponseStatus, trace: ResponseTrace) {
        self.cards = cards
        self.error = error
        self.followups = followups
        self.proposals = proposals
        self.requestID = requestID
        self.schema = schema
        self.speech = speech
        self.status = status
        self.trace = trace
    }
}

// MARK: DomainResponse convenience initializers and mutators

public extension DomainResponse {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DomainResponse.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        cards: [InsightCard]? = nil,
        error: ErrorInfo?? = nil,
        followups: [[String: String]]?? = nil,
        proposals: [ActionProposal]? = nil,
        requestID: String? = nil,
        schema: DomainResponseSchema? = nil,
        speech: SpokenLine? = nil,
        status: DomainResponseStatus? = nil,
        trace: ResponseTrace? = nil
    ) -> DomainResponse {
        return DomainResponse(
            cards: cards ?? self.cards,
            error: error ?? self.error,
            followups: followups ?? self.followups,
            proposals: proposals ?? self.proposals,
            requestID: requestID ?? self.requestID,
            schema: schema ?? self.schema,
            speech: speech ?? self.speech,
            status: status ?? self.status,
            trace: trace ?? self.trace
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum DomainResponseSchema: String, Codable {
    case platformDomainResponseV1 = "platform.domain_response/v1"
}

// MARK: - SpokenLine
public struct SpokenLine: Codable {
    public let epistemic: Epistemic
    public let text: String

    public init(epistemic: Epistemic, text: String) {
        self.epistemic = epistemic
        self.text = text
    }
}

// MARK: SpokenLine convenience initializers and mutators

public extension SpokenLine {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(SpokenLine.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        epistemic: Epistemic? = nil,
        text: String? = nil
    ) -> SpokenLine {
        return SpokenLine(
            epistemic: epistemic ?? self.epistemic,
            text: text ?? self.text
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum DomainResponseStatus: String, Codable {
    case answered = "answered"
    case clarify = "clarify"
    case error = "error"
    case partial = "partial"
    case unsupported = "unsupported"
}

// MARK: - ResponseTrace
public struct ResponseTrace: Codable {
    /// Opaque backend id for telemetry only, e.g. 'remote_agent@0.4', 'fast_path@1'. The
    /// platform never branches on it.
    public let backend: String
    public let calcIDS: [String]
    public let observationIDS: [String]?
    public let tools: [ToolCallTrace]
    public let verification: VerificationReport?
    public let verified: Bool

    public enum CodingKeys: String, CodingKey {
        case backend
        case calcIDS = "calc_ids"
        case observationIDS = "observation_ids"
        case tools, verification, verified
    }

    public init(backend: String, calcIDS: [String], observationIDS: [String]?, tools: [ToolCallTrace], verification: VerificationReport?, verified: Bool) {
        self.backend = backend
        self.calcIDS = calcIDS
        self.observationIDS = observationIDS
        self.tools = tools
        self.verification = verification
        self.verified = verified
    }
}

// MARK: ResponseTrace convenience initializers and mutators

public extension ResponseTrace {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ResponseTrace.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        backend: String? = nil,
        calcIDS: [String]? = nil,
        observationIDS: [String]?? = nil,
        tools: [ToolCallTrace]? = nil,
        verification: VerificationReport?? = nil,
        verified: Bool? = nil
    ) -> ResponseTrace {
        return ResponseTrace(
            backend: backend ?? self.backend,
            calcIDS: calcIDS ?? self.calcIDS,
            observationIDS: observationIDS ?? self.observationIDS,
            tools: tools ?? self.tools,
            verification: verification ?? self.verification,
            verified: verified ?? self.verified
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - ToolCallTrace
public struct ToolCallTrace: Codable {
    public let ms: Int
    public let name: String
    public let ok: Bool

    public init(ms: Int, name: String, ok: Bool) {
        self.ms = ms
        self.name = name
        self.ok = ok
    }
}

// MARK: ToolCallTrace convenience initializers and mutators

public extension ToolCallTrace {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ToolCallTrace.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        ms: Int? = nil,
        name: String? = nil,
        ok: Bool? = nil
    ) -> ToolCallTrace {
        return ToolCallTrace(
            ms: ms ?? self.ms,
            name: name ?? self.name,
            ok: ok ?? self.ok
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - VerificationReport
public struct VerificationReport: Codable {
    public let checkedValues: Int
    public let unverified: [String]

    public enum CodingKeys: String, CodingKey {
        case checkedValues = "checked_values"
        case unverified
    }

    public init(checkedValues: Int, unverified: [String]) {
        self.checkedValues = checkedValues
        self.unverified = unverified
    }
}

// MARK: VerificationReport convenience initializers and mutators

public extension VerificationReport {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(VerificationReport.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        checkedValues: Int? = nil,
        unverified: [String]? = nil
    ) -> VerificationReport {
        return VerificationReport(
            checkedValues: checkedValues ?? self.checkedValues,
            unverified: unverified ?? self.unverified
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// One event in a streamed answer (SSE). Exactly one 'final' event ends the stream; cards
/// and proposals in earlier events are repeated in the final response so non-streaming
/// consumers lose nothing.
// MARK: - DomainResponseEvent
public struct DomainResponseEvent: Codable {
    public let speechHint: [String: String]?
    public let stage: String?
    public let type: DomainResponseEventType
    public let card: InsightCard?
    public let proposal: ActionProposal?
    public let response: DomainResponse?

    public enum CodingKeys: String, CodingKey {
        case speechHint = "speech_hint"
        case stage, type, card, proposal, response
    }

    public init(speechHint: [String: String]?, stage: String?, type: DomainResponseEventType, card: InsightCard?, proposal: ActionProposal?, response: DomainResponse?) {
        self.speechHint = speechHint
        self.stage = stage
        self.type = type
        self.card = card
        self.proposal = proposal
        self.response = response
    }
}

// MARK: DomainResponseEvent convenience initializers and mutators

public extension DomainResponseEvent {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DomainResponseEvent.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        speechHint: [String: String]?? = nil,
        stage: String?? = nil,
        type: DomainResponseEventType? = nil,
        card: InsightCard?? = nil,
        proposal: ActionProposal?? = nil,
        response: DomainResponse?? = nil
    ) -> DomainResponseEvent {
        return DomainResponseEvent(
            speechHint: speechHint ?? self.speechHint,
            stage: stage ?? self.stage,
            type: type ?? self.type,
            card: card ?? self.card,
            proposal: proposal ?? self.proposal,
            response: response ?? self.response
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum DomainResponseEventType: String, Codable {
    case card = "card"
    case progress = "progress"
    case proposal = "proposal"
    case typeFinal = "final"
}

/// Body of every non-2xx HTTP response on the platform's public APIs, and of SSE 'error'
/// events. user_message is safe to show or speak; diagnostics belong in logs keyed by
/// correlation_id, never in this object. Small in-body errors inside ToolResult and
/// DomainResponse keep using common ErrorInfo. See DEC-008.
// MARK: - ErrorEnvelope
public struct ErrorEnvelope: Codable {
    public let capabilityID: String?
    /// UPPER_SNAKE code. Open set: clients must treat unknown codes by their retryable and
    /// effect_state flags. Registry: docs/contracts/README.md#error-codes.
    public let code: String
    public let correlationID: String
    /// Fallback the platform has already switched to, if any.
    public let degradedTo: DegradedTo?
    /// Whether the request had a persistent effect. unknown = it may have been applied (e.g. a
    /// timeout while applying a confirmed proposal); clients must not replay it and must re-read
    /// state first.
    public let effectState: EffectState
    public let occurredAt: Date
    public let retryAfterMS: Int?
    /// true = the same request may be sent again automatically (honour retry_after_ms).
    public let retryable: Bool
    public let schema: ErrorEnvelopeSchema
    /// Short, non-technical, safe to speak aloud: no amounts, no account data, no stack traces.
    public let userMessage: [String: String]

    public enum CodingKeys: String, CodingKey {
        case capabilityID = "capability_id"
        case code
        case correlationID = "correlation_id"
        case degradedTo = "degraded_to"
        case effectState = "effect_state"
        case occurredAt = "occurred_at"
        case retryAfterMS = "retry_after_ms"
        case retryable, schema
        case userMessage = "user_message"
    }

    public init(capabilityID: String?, code: String, correlationID: String, degradedTo: DegradedTo?, effectState: EffectState, occurredAt: Date, retryAfterMS: Int?, retryable: Bool, schema: ErrorEnvelopeSchema, userMessage: [String: String]) {
        self.capabilityID = capabilityID
        self.code = code
        self.correlationID = correlationID
        self.degradedTo = degradedTo
        self.effectState = effectState
        self.occurredAt = occurredAt
        self.retryAfterMS = retryAfterMS
        self.retryable = retryable
        self.schema = schema
        self.userMessage = userMessage
    }
}

// MARK: ErrorEnvelope convenience initializers and mutators

public extension ErrorEnvelope {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ErrorEnvelope.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        capabilityID: String?? = nil,
        code: String? = nil,
        correlationID: String? = nil,
        degradedTo: DegradedTo?? = nil,
        effectState: EffectState? = nil,
        occurredAt: Date? = nil,
        retryAfterMS: Int?? = nil,
        retryable: Bool? = nil,
        schema: ErrorEnvelopeSchema? = nil,
        userMessage: [String: String]? = nil
    ) -> ErrorEnvelope {
        return ErrorEnvelope(
            capabilityID: capabilityID ?? self.capabilityID,
            code: code ?? self.code,
            correlationID: correlationID ?? self.correlationID,
            degradedTo: degradedTo ?? self.degradedTo,
            effectState: effectState ?? self.effectState,
            occurredAt: occurredAt ?? self.occurredAt,
            retryAfterMS: retryAfterMS ?? self.retryAfterMS,
            retryable: retryable ?? self.retryable,
            schema: schema ?? self.schema,
            userMessage: userMessage ?? self.userMessage
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Fallback the platform has already switched to, if any.
public enum DegradedTo: String, Codable {
    case cachedCards = "cached_cards"
    case fastPath = "fast_path"
    case none = "none"
    case phoneOnly = "phone_only"
}

/// Whether the request had a persistent effect. unknown = it may have been applied (e.g. a
/// timeout while applying a confirmed proposal); clients must not replay it and must re-read
/// state first.
public enum EffectState: String, Codable {
    case applied = "applied"
    case none = "none"
    case unknown = "unknown"
}

public enum ErrorEnvelopeSchema: String, Codable {
    case platformErrorV1 = "platform.error/v1"
}

public enum FinanceActionKind: String, Codable {
    case financeClassificationUpdate = "finance.classification.update"
    case financeDataDelete = "finance.data.delete"
    case financeGoalUpdate = "finance.goal.update"
    case financePlanAdd = "finance.plan.add"
    case financeReceiptLink = "finance.receipt.link"
    case financeSettingsBufferUpdate = "finance.settings.buffer.update"
}

public enum FinanceIntent: String, Codable {
    case financeBasketAffordability = "finance.basket.affordability"
    case financeClassificationCorrect = "finance.classification.correct"
    case financeCommitmentsUpcoming = "finance.commitments.upcoming"
    case financeEducation = "finance.education"
    case financeExplain = "finance.explain"
    case financeGoalProjection = "finance.goal.projection"
    case financeReceiptScan = "finance.receipt.scan"
    case financeSafeToSpend = "finance.safe_to_spend"
    case financeSimulateChange = "finance.simulate_change"
    case financeSpendQuery = "finance.spend.query"
    case financeSpenderProfile = "finance.spender_profile"
}

public enum FinanceToolName: String, Codable {
    case financeCalculateAffordability = "finance.calculate_affordability"
    case financeGetBasketBreakdown = "finance.get_basket_breakdown"
    case financeGetCalculation = "finance.get_calculation"
    case financeGetSafeToSpend = "finance.get_safe_to_spend"
    case financeGetSafeToSpendUntilPayday = "finance.get_safe_to_spend_until_payday"
    case financeGetSavingsProjection = "finance.get_savings_projection"
    case financeGetSpendingSummary = "finance.get_spending_summary"
    case financeGetTransactions = "finance.get_transactions"
    case financeGetUpcomingCommitments = "finance.get_upcoming_commitments"
    case financeProcessReceipt = "finance.process_receipt"
    case financeProposeClassificationChange = "finance.propose_classification_change"
    case financeSimulateSpendingChange = "finance.simulate_spending_change"
    case financeSummarizeDecisions = "finance.summarize_decisions"
}

/// Normalised glasses input. The companion maps device-specific events (touchpad, capture
/// button, Neural Band) onto these.
// MARK: - GlassesInput
public struct GlassesInput: Codable {
    public let deviceEventID: String
    public let kind: GlassesInputKind

    public enum CodingKeys: String, CodingKey {
        case deviceEventID = "device_event_id"
        case kind
    }

    public init(deviceEventID: String, kind: GlassesInputKind) {
        self.deviceEventID = deviceEventID
        self.kind = kind
    }
}

// MARK: GlassesInput convenience initializers and mutators

public extension GlassesInput {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(GlassesInput.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        deviceEventID: String? = nil,
        kind: GlassesInputKind? = nil
    ) -> GlassesInput {
        return GlassesInput(
            deviceEventID: deviceEventID ?? self.deviceEventID,
            kind: kind ?? self.kind
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum GlassesInputKind: String, Codable {
    case captureButton = "capture_button"
    case doubleTap = "double_tap"
    case longPress = "long_press"
    case pinch = "pinch"
    case swipeBack = "swipe_back"
    case swipeForward = "swipe_forward"
    case tap = "tap"
}

/// A test case a capability ships in its fixtures. The platform's fixture runner replays it
/// through the adapter (any backend) and the deterministic fast path; registration fails if
/// expected values differ or any spoken/card number is unverified.
// MARK: - GoldenCase
public struct GoldenCase: Codable {
    public let capabilityID: String
    public let caseID: String
    public let description: String?
    public let expected: GoldenExpectation
    public let input: GoldenInput
    public let locale: String
    /// Path to a persona fixture, relative to the fixtures root.
    public let persona: String
    public let schema: GoldenCaseSchema
    public let tags: [Tag]
    public let today: Date

    public enum CodingKeys: String, CodingKey {
        case capabilityID = "capability_id"
        case caseID = "case_id"
        case description, expected, input, locale, persona, schema, tags, today
    }

    public init(capabilityID: String, caseID: String, description: String?, expected: GoldenExpectation, input: GoldenInput, locale: String, persona: String, schema: GoldenCaseSchema, tags: [Tag], today: Date) {
        self.capabilityID = capabilityID
        self.caseID = caseID
        self.description = description
        self.expected = expected
        self.input = input
        self.locale = locale
        self.persona = persona
        self.schema = schema
        self.tags = tags
        self.today = today
    }
}

// MARK: GoldenCase convenience initializers and mutators

public extension GoldenCase {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(GoldenCase.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        capabilityID: String? = nil,
        caseID: String? = nil,
        description: String?? = nil,
        expected: GoldenExpectation? = nil,
        input: GoldenInput? = nil,
        locale: String? = nil,
        persona: String? = nil,
        schema: GoldenCaseSchema? = nil,
        tags: [Tag]? = nil,
        today: Date? = nil
    ) -> GoldenCase {
        return GoldenCase(
            capabilityID: capabilityID ?? self.capabilityID,
            caseID: caseID ?? self.caseID,
            description: description ?? self.description,
            expected: expected ?? self.expected,
            input: input ?? self.input,
            locale: locale ?? self.locale,
            persona: persona ?? self.persona,
            schema: schema ?? self.schema,
            tags: tags ?? self.tags,
            today: today ?? self.today
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - GoldenExpectation
public struct GoldenExpectation: Codable {
    public let dataMode: String?
    public let epistemic: Epistemic
    public let intent: String
    public let proposalKinds: [String]?
    public let speechMaxWords: Int?
    /// Concepts the spoken line must convey, as machine codes the evaluator maps to checks (e.g.
    /// PRICE_IS_OBSERVED, ESTIMATE).
    public let speechMustMention: [String]?
    public let status: DomainResponseStatus
    public let tools: [String]
    /// Map of dotted path in the tool result (e.g. 'result.remaining_after.amount') to the exact
    /// expected string.
    public let values: [String: String]

    public enum CodingKeys: String, CodingKey {
        case dataMode = "data_mode"
        case epistemic, intent
        case proposalKinds = "proposal_kinds"
        case speechMaxWords = "speech_max_words"
        case speechMustMention = "speech_must_mention"
        case status, tools, values
    }

    public init(dataMode: String?, epistemic: Epistemic, intent: String, proposalKinds: [String]?, speechMaxWords: Int?, speechMustMention: [String]?, status: DomainResponseStatus, tools: [String], values: [String: String]) {
        self.dataMode = dataMode
        self.epistemic = epistemic
        self.intent = intent
        self.proposalKinds = proposalKinds
        self.speechMaxWords = speechMaxWords
        self.speechMustMention = speechMustMention
        self.status = status
        self.tools = tools
        self.values = values
    }
}

// MARK: GoldenExpectation convenience initializers and mutators

public extension GoldenExpectation {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(GoldenExpectation.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        dataMode: String?? = nil,
        epistemic: Epistemic? = nil,
        intent: String? = nil,
        proposalKinds: [String]?? = nil,
        speechMaxWords: Int?? = nil,
        speechMustMention: [String]?? = nil,
        status: DomainResponseStatus? = nil,
        tools: [String]? = nil,
        values: [String: String]? = nil
    ) -> GoldenExpectation {
        return GoldenExpectation(
            dataMode: dataMode ?? self.dataMode,
            epistemic: epistemic ?? self.epistemic,
            intent: intent ?? self.intent,
            proposalKinds: proposalKinds ?? self.proposalKinds,
            speechMaxWords: speechMaxWords ?? self.speechMaxWords,
            speechMustMention: speechMustMention ?? self.speechMustMention,
            status: status ?? self.status,
            tools: tools ?? self.tools,
            values: values ?? self.values
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - GoldenInput
public struct GoldenInput: Codable {
    public let captureFiles: [String]?
    public let observations: [Observation]?
    public let utterance: String?

    public enum CodingKeys: String, CodingKey {
        case captureFiles = "capture_files"
        case observations, utterance
    }

    public init(captureFiles: [String]?, observations: [Observation]?, utterance: String?) {
        self.captureFiles = captureFiles
        self.observations = observations
        self.utterance = utterance
    }
}

// MARK: GoldenInput convenience initializers and mutators

public extension GoldenInput {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(GoldenInput.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        captureFiles: [String]?? = nil,
        observations: [Observation]?? = nil,
        utterance: String?? = nil
    ) -> GoldenInput {
        return GoldenInput(
            captureFiles: captureFiles ?? self.captureFiles,
            observations: observations ?? self.observations,
            utterance: utterance ?? self.utterance
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum GoldenCaseSchema: String, Codable {
    case platformGoldenCaseV1 = "platform.golden_case/v1"
}

public enum Tag: String, Codable {
    case capture = "capture"
    case confirmation = "confirmation"
    case degraded = "degraded"
    case golden = "golden"
    case injection = "injection"
    case locale = "locale"
}

// MARK: - MissingData
public struct MissingData: Codable {
    public let code: String
    public let detail: String?

    public init(code: String, detail: String?) {
        self.code = code
        self.detail = detail
    }
}

// MARK: MissingData convenience initializers and mutators

public extension MissingData {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(MissingData.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        code: String? = nil,
        detail: String?? = nil
    ) -> MissingData {
        return MissingData(
            code: code ?? self.code,
            detail: detail ?? self.detail
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum MissingDataCode: String, Codable {
    case balanceStale = "BALANCE_STALE"
    case commitmentEstimated = "COMMITMENT_ESTIMATED"
    case commitmentUnknown = "COMMITMENT_UNKNOWN"
    case historyLt4_Weeks = "HISTORY_LT_4_WEEKS"
    case incomeNotDetected = "INCOME_NOT_DETECTED"
    case noBalance = "NO_BALANCE"
    case priceUncertain = "PRICE_UNCERTAIN"
    case receiptUnmatched = "RECEIPT_UNMATCHED"
    case sourceConflict = "SOURCE_CONFLICT"
}

/// Registry entry for a model the platform uses (ASR, TTS, router, OCR, embeddings, LLM),
/// wherever it runs. Swapping cloud for on-device means changing registry entries, not
/// contracts.
// MARK: - ModelProvider
public struct ModelProvider: Codable {
    public let dataPolicy: DataPolicy
    public let fallbackProviderID: String?
    public let kind: ModelProviderKind
    public let languages: [String]
    public let location: Location
    /// Opaque to callers.
    public let modelRef: String
    public let providerID: String
    public let schema: ModelProviderSchema
    public let slo: ProviderSlo
    public let status: ModelProviderStatus
    public let version: String

    public enum CodingKeys: String, CodingKey {
        case dataPolicy = "data_policy"
        case fallbackProviderID = "fallback_provider_id"
        case kind, languages, location
        case modelRef = "model_ref"
        case providerID = "provider_id"
        case schema, slo, status, version
    }

    public init(dataPolicy: DataPolicy, fallbackProviderID: String?, kind: ModelProviderKind, languages: [String], location: Location, modelRef: String, providerID: String, schema: ModelProviderSchema, slo: ProviderSlo, status: ModelProviderStatus, version: String) {
        self.dataPolicy = dataPolicy
        self.fallbackProviderID = fallbackProviderID
        self.kind = kind
        self.languages = languages
        self.location = location
        self.modelRef = modelRef
        self.providerID = providerID
        self.schema = schema
        self.slo = slo
        self.status = status
        self.version = version
    }
}

// MARK: ModelProvider convenience initializers and mutators

public extension ModelProvider {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ModelProvider.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        dataPolicy: DataPolicy? = nil,
        fallbackProviderID: String?? = nil,
        kind: ModelProviderKind? = nil,
        languages: [String]? = nil,
        location: Location? = nil,
        modelRef: String? = nil,
        providerID: String? = nil,
        schema: ModelProviderSchema? = nil,
        slo: ProviderSlo? = nil,
        status: ModelProviderStatus? = nil,
        version: String? = nil
    ) -> ModelProvider {
        return ModelProvider(
            dataPolicy: dataPolicy ?? self.dataPolicy,
            fallbackProviderID: fallbackProviderID ?? self.fallbackProviderID,
            kind: kind ?? self.kind,
            languages: languages ?? self.languages,
            location: location ?? self.location,
            modelRef: modelRef ?? self.modelRef,
            providerID: providerID ?? self.providerID,
            schema: schema ?? self.schema,
            slo: slo ?? self.slo,
            status: status ?? self.status,
            version: version ?? self.version
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - DataPolicy
public struct DataPolicy: Codable {
    public let leavesDevice: Bool
    public let region: String?
    public let retention: String

    public enum CodingKeys: String, CodingKey {
        case leavesDevice = "leaves_device"
        case region, retention
    }

    public init(leavesDevice: Bool, region: String?, retention: String) {
        self.leavesDevice = leavesDevice
        self.region = region
        self.retention = retention
    }
}

// MARK: DataPolicy convenience initializers and mutators

public extension DataPolicy {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(DataPolicy.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        leavesDevice: Bool? = nil,
        region: String?? = nil,
        retention: String? = nil
    ) -> DataPolicy {
        return DataPolicy(
            leavesDevice: leavesDevice ?? self.leavesDevice,
            region: region ?? self.region,
            retention: retention ?? self.retention
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ModelProviderKind: String, Codable {
    case asr = "asr"
    case embedding = "embedding"
    case llm = "llm"
    case router = "router"
    case tts = "tts"
    case visionOcr = "vision_ocr"
}

public enum Location: String, Codable {
    case backend = "backend"
    case cloud = "cloud"
    case device = "device"
}

public enum ModelProviderSchema: String, Codable {
    case platformModelProviderV1 = "platform.model_provider/v1"
}

// MARK: - ProviderSlo
public struct ProviderSlo: Codable {
    public let p50MS, p95MS: Int

    public enum CodingKeys: String, CodingKey {
        case p50MS = "p50_ms"
        case p95MS = "p95_ms"
    }

    public init(p50MS: Int, p95MS: Int) {
        self.p50MS = p50MS
        self.p95MS = p95MS
    }
}

// MARK: ProviderSlo convenience initializers and mutators

public extension ProviderSlo {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ProviderSlo.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        p50MS: Int? = nil,
        p95MS: Int? = nil
    ) -> ProviderSlo {
        return ProviderSlo(
            p50MS: p50MS ?? self.p50MS,
            p95MS: p95MS ?? self.p95MS
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ModelProviderStatus: String, Codable {
    case active = "active"
    case canary = "canary"
    case disabled = "disabled"
    case shadow = "shadow"
}

/// Safe to spend from the S-Bank Coach engine (DEC-025): balance minus what is reserved
/// until payday, spread over the days to payday. Per day, not per week.
// MARK: - PaydaySafeToSpendResult
public struct PaydaySafeToSpendResult: Codable {
    public let asOfDate: String
    public let balance: Money
    public let daysToPayday: Int
    public let flexibleSpentThisCycle: Money?
    public let freeUntilPayday: Money
    public let nextPayday: String
    /// Confirmed plans already subtracted from free_until_payday.
    public let plannedTotal: Money
    /// Money held back until payday. Keys are the engine's reserve names.
    public let reserved: [String: Money]
    public let safeToSpendToday: Money
    /// at_risk: the money reserved for bills exceeds the balance.
    public let status: PaydaySafeToSpendResultStatus

    public enum CodingKeys: String, CodingKey {
        case asOfDate = "as_of_date"
        case balance
        case daysToPayday = "days_to_payday"
        case flexibleSpentThisCycle = "flexible_spent_this_cycle"
        case freeUntilPayday = "free_until_payday"
        case nextPayday = "next_payday"
        case plannedTotal = "planned_total"
        case reserved
        case safeToSpendToday = "safe_to_spend_today"
        case status
    }

    public init(asOfDate: String, balance: Money, daysToPayday: Int, flexibleSpentThisCycle: Money?, freeUntilPayday: Money, nextPayday: String, plannedTotal: Money, reserved: [String: Money], safeToSpendToday: Money, status: PaydaySafeToSpendResultStatus) {
        self.asOfDate = asOfDate
        self.balance = balance
        self.daysToPayday = daysToPayday
        self.flexibleSpentThisCycle = flexibleSpentThisCycle
        self.freeUntilPayday = freeUntilPayday
        self.nextPayday = nextPayday
        self.plannedTotal = plannedTotal
        self.reserved = reserved
        self.safeToSpendToday = safeToSpendToday
        self.status = status
    }
}

// MARK: PaydaySafeToSpendResult convenience initializers and mutators

public extension PaydaySafeToSpendResult {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(PaydaySafeToSpendResult.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        asOfDate: String? = nil,
        balance: Money? = nil,
        daysToPayday: Int? = nil,
        flexibleSpentThisCycle: Money?? = nil,
        freeUntilPayday: Money? = nil,
        nextPayday: String? = nil,
        plannedTotal: Money? = nil,
        reserved: [String: Money]? = nil,
        safeToSpendToday: Money? = nil,
        status: PaydaySafeToSpendResultStatus? = nil
    ) -> PaydaySafeToSpendResult {
        return PaydaySafeToSpendResult(
            asOfDate: asOfDate ?? self.asOfDate,
            balance: balance ?? self.balance,
            daysToPayday: daysToPayday ?? self.daysToPayday,
            flexibleSpentThisCycle: flexibleSpentThisCycle ?? self.flexibleSpentThisCycle,
            freeUntilPayday: freeUntilPayday ?? self.freeUntilPayday,
            nextPayday: nextPayday ?? self.nextPayday,
            plannedTotal: plannedTotal ?? self.plannedTotal,
            reserved: reserved ?? self.reserved,
            safeToSpendToday: safeToSpendToday ?? self.safeToSpendToday,
            status: status ?? self.status
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// at_risk: the money reserved for bills exceeds the balance.
public enum PaydaySafeToSpendResultStatus: String, Codable {
    case atRisk = "at_risk"
    case ok = "ok"
}

// MARK: - SafeToSpendResult
public struct SafeToSpendResult: Codable {
    public let daysLeftInWeek: Int
    public let daysToIncome: Int
    public let flexibleUntilPayday: Money
    public let nextIncomeDate: String?
    /// Confirmed plans counted against the stated weekly amount this week.
    public let plannedThisWeek: Money?
    public let safeToSpendWeek: Money
    public let shortfall: Money?
    /// The weekly amount the user said (user_stated source, no bank data). Shown as 'your
    /// figure'.
    public let statedWeeklyAmount: Money?

    public enum CodingKeys: String, CodingKey {
        case daysLeftInWeek = "days_left_in_week"
        case daysToIncome = "days_to_income"
        case flexibleUntilPayday = "flexible_until_payday"
        case nextIncomeDate = "next_income_date"
        case plannedThisWeek = "planned_this_week"
        case safeToSpendWeek = "safe_to_spend_week"
        case shortfall
        case statedWeeklyAmount = "stated_weekly_amount"
    }

    public init(daysLeftInWeek: Int, daysToIncome: Int, flexibleUntilPayday: Money, nextIncomeDate: String?, plannedThisWeek: Money?, safeToSpendWeek: Money, shortfall: Money?, statedWeeklyAmount: Money?) {
        self.daysLeftInWeek = daysLeftInWeek
        self.daysToIncome = daysToIncome
        self.flexibleUntilPayday = flexibleUntilPayday
        self.nextIncomeDate = nextIncomeDate
        self.plannedThisWeek = plannedThisWeek
        self.safeToSpendWeek = safeToSpendWeek
        self.shortfall = shortfall
        self.statedWeeklyAmount = statedWeeklyAmount
    }
}

// MARK: SafeToSpendResult convenience initializers and mutators

public extension SafeToSpendResult {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(SafeToSpendResult.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        daysLeftInWeek: Int? = nil,
        daysToIncome: Int? = nil,
        flexibleUntilPayday: Money? = nil,
        nextIncomeDate: String?? = nil,
        plannedThisWeek: Money?? = nil,
        safeToSpendWeek: Money? = nil,
        shortfall: Money?? = nil,
        statedWeeklyAmount: Money?? = nil
    ) -> SafeToSpendResult {
        return SafeToSpendResult(
            daysLeftInWeek: daysLeftInWeek ?? self.daysLeftInWeek,
            daysToIncome: daysToIncome ?? self.daysToIncome,
            flexibleUntilPayday: flexibleUntilPayday ?? self.flexibleUntilPayday,
            nextIncomeDate: nextIncomeDate ?? self.nextIncomeDate,
            plannedThisWeek: plannedThisWeek ?? self.plannedThisWeek,
            safeToSpendWeek: safeToSpendWeek ?? self.safeToSpendWeek,
            shortfall: shortfall ?? self.shortfall,
            statedWeeklyAmount: statedWeeklyAmount ?? self.statedWeeklyAmount
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Envelope every deterministic tool returns. A successful non-educational result must carry
/// a resolvable calc_id so the adapter can verify every number shown or spoken.
// MARK: - ToolResult
public struct ToolResult: Codable {
    public let asOf: Date
    public let assumptions: [String]
    public let calcID: String?
    public let confidence: Risk?
    public let dataMode: String?
    public let epistemic: Epistemic?
    public let error: ErrorInfo?
    public let missingData: [MissingData]
    public let ok: Bool
    /// Tool-specific payload. Domains publish its schema in the tool descriptor (and may tighten
    /// it in a domain overlay).
    public let result: [String: JSONAny]?
    public let schema: ResultEnvelope
    public let tool: String
    public let toolVersion: String
    public let warnings: [String]

    public enum CodingKeys: String, CodingKey {
        case asOf = "as_of"
        case assumptions
        case calcID = "calc_id"
        case confidence
        case dataMode = "data_mode"
        case epistemic, error
        case missingData = "missing_data"
        case ok, result, schema, tool
        case toolVersion = "tool_version"
        case warnings
    }

    public init(asOf: Date, assumptions: [String], calcID: String?, confidence: Risk?, dataMode: String?, epistemic: Epistemic?, error: ErrorInfo?, missingData: [MissingData], ok: Bool, result: [String: JSONAny]?, schema: ResultEnvelope, tool: String, toolVersion: String, warnings: [String]) {
        self.asOf = asOf
        self.assumptions = assumptions
        self.calcID = calcID
        self.confidence = confidence
        self.dataMode = dataMode
        self.epistemic = epistemic
        self.error = error
        self.missingData = missingData
        self.ok = ok
        self.result = result
        self.schema = schema
        self.tool = tool
        self.toolVersion = toolVersion
        self.warnings = warnings
    }
}

// MARK: ToolResult convenience initializers and mutators

public extension ToolResult {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ToolResult.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        asOf: Date? = nil,
        assumptions: [String]? = nil,
        calcID: String?? = nil,
        confidence: Risk?? = nil,
        dataMode: String?? = nil,
        epistemic: Epistemic?? = nil,
        error: ErrorInfo?? = nil,
        missingData: [MissingData]? = nil,
        ok: Bool? = nil,
        result: [String: JSONAny]?? = nil,
        schema: ResultEnvelope? = nil,
        tool: String? = nil,
        toolVersion: String? = nil,
        warnings: [String]? = nil
    ) -> ToolResult {
        return ToolResult(
            asOf: asOf ?? self.asOf,
            assumptions: assumptions ?? self.assumptions,
            calcID: calcID ?? self.calcID,
            confidence: confidence ?? self.confidence,
            dataMode: dataMode ?? self.dataMode,
            epistemic: epistemic ?? self.epistemic,
            error: error ?? self.error,
            missingData: missingData ?? self.missingData,
            ok: ok ?? self.ok,
            result: result ?? self.result,
            schema: schema ?? self.schema,
            tool: tool ?? self.tool,
            toolVersion: toolVersion ?? self.toolVersion,
            warnings: warnings ?? self.warnings
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

/// Created only by the companion from a real user input, then signed by the platform (L3).
/// Capabilities verify the signature and that payload_hash matches the payload they hold
/// before applying anything. Capabilities can never create one.
// MARK: - UserConfirmation
public struct UserConfirmation: Codable {
    public let channel: ConfirmChannel
    public let confirmationID: String
    public let confirmedAt: Date
    public let decision: Decision
    public let evidence: ConfirmationEvidence
    public let payloadHash: String
    public let proposalID: String
    public let schema: UserConfirmationSchema
    public let sessionID: String
    /// Compact JWS over the other fields, signed by the platform key.
    public let signature: String
    public let userRef: String

    public enum CodingKeys: String, CodingKey {
        case channel
        case confirmationID = "confirmation_id"
        case confirmedAt = "confirmed_at"
        case decision, evidence
        case payloadHash = "payload_hash"
        case proposalID = "proposal_id"
        case schema
        case sessionID = "session_id"
        case signature
        case userRef = "user_ref"
    }

    public init(channel: ConfirmChannel, confirmationID: String, confirmedAt: Date, decision: Decision, evidence: ConfirmationEvidence, payloadHash: String, proposalID: String, schema: UserConfirmationSchema, sessionID: String, signature: String, userRef: String) {
        self.channel = channel
        self.confirmationID = confirmationID
        self.confirmedAt = confirmedAt
        self.decision = decision
        self.evidence = evidence
        self.payloadHash = payloadHash
        self.proposalID = proposalID
        self.schema = schema
        self.sessionID = sessionID
        self.signature = signature
        self.userRef = userRef
    }
}

// MARK: UserConfirmation convenience initializers and mutators

public extension UserConfirmation {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(UserConfirmation.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        channel: ConfirmChannel? = nil,
        confirmationID: String? = nil,
        confirmedAt: Date? = nil,
        decision: Decision? = nil,
        evidence: ConfirmationEvidence? = nil,
        payloadHash: String? = nil,
        proposalID: String? = nil,
        schema: UserConfirmationSchema? = nil,
        sessionID: String? = nil,
        signature: String? = nil,
        userRef: String? = nil
    ) -> UserConfirmation {
        return UserConfirmation(
            channel: channel ?? self.channel,
            confirmationID: confirmationID ?? self.confirmationID,
            confirmedAt: confirmedAt ?? self.confirmedAt,
            decision: decision ?? self.decision,
            evidence: evidence ?? self.evidence,
            payloadHash: payloadHash ?? self.payloadHash,
            proposalID: proposalID ?? self.proposalID,
            schema: schema ?? self.schema,
            sessionID: sessionID ?? self.sessionID,
            signature: signature ?? self.signature,
            userRef: userRef ?? self.userRef
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Decision: String, Codable {
    case confirm = "confirm"
    case reject = "reject"
}

// MARK: - ConfirmationEvidence
public struct ConfirmationEvidence: Codable {
    public let asrConfidence: Double?
    public let input: GlassesInput?
    public let readbackPlayed: Bool?
    public let uiEventID: String?
    public let utterance: String?

    public enum CodingKeys: String, CodingKey {
        case asrConfidence = "asr_confidence"
        case input
        case readbackPlayed = "readback_played"
        case uiEventID = "ui_event_id"
        case utterance
    }

    public init(asrConfidence: Double?, input: GlassesInput?, readbackPlayed: Bool?, uiEventID: String?, utterance: String?) {
        self.asrConfidence = asrConfidence
        self.input = input
        self.readbackPlayed = readbackPlayed
        self.uiEventID = uiEventID
        self.utterance = utterance
    }
}

// MARK: ConfirmationEvidence convenience initializers and mutators

public extension ConfirmationEvidence {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(ConfirmationEvidence.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        asrConfidence: Double?? = nil,
        input: GlassesInput?? = nil,
        readbackPlayed: Bool?? = nil,
        uiEventID: String?? = nil,
        utterance: String?? = nil
    ) -> ConfirmationEvidence {
        return ConfirmationEvidence(
            asrConfidence: asrConfidence ?? self.asrConfidence,
            input: input ?? self.input,
            readbackPlayed: readbackPlayed ?? self.readbackPlayed,
            uiEventID: uiEventID ?? self.uiEventID,
            utterance: utterance ?? self.utterance
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum UserConfirmationSchema: String, Codable {
    case platformUserConfirmationV1 = "platform.user_confirmation/v1"
}

/// One user turn from the companion: an utterance (transcribed on the phone) and/or a
/// glasses input. The platform only recognises platform intents (confirm, cancel, ...);
/// domain intent recognition belongs to the capability.
// MARK: - VoiceIntent
public struct VoiceIntent: Codable {
    public let attachedCaptureIDS: [String]
    public let capabilityHint: String?
    public let context: TurnContext
    public let deviceCapabilities: [DeviceCapability]
    public let input: GlassesInput?
    public let invocation: Invocation
    public let output: OutputPreferences
    public let platformIntent: PlatformIntent?
    public let schema: VoiceIntentSchema
    public let sessionID: String
    public let transcript: Transcript?
    public let turnID, userRef: String

    public enum CodingKeys: String, CodingKey {
        case attachedCaptureIDS = "attached_capture_ids"
        case capabilityHint = "capability_hint"
        case context
        case deviceCapabilities = "device_capabilities"
        case input, invocation, output
        case platformIntent = "platform_intent"
        case schema
        case sessionID = "session_id"
        case transcript
        case turnID = "turn_id"
        case userRef = "user_ref"
    }

    public init(attachedCaptureIDS: [String], capabilityHint: String?, context: TurnContext, deviceCapabilities: [DeviceCapability], input: GlassesInput?, invocation: Invocation, output: OutputPreferences, platformIntent: PlatformIntent?, schema: VoiceIntentSchema, sessionID: String, transcript: Transcript?, turnID: String, userRef: String) {
        self.attachedCaptureIDS = attachedCaptureIDS
        self.capabilityHint = capabilityHint
        self.context = context
        self.deviceCapabilities = deviceCapabilities
        self.input = input
        self.invocation = invocation
        self.output = output
        self.platformIntent = platformIntent
        self.schema = schema
        self.sessionID = sessionID
        self.transcript = transcript
        self.turnID = turnID
        self.userRef = userRef
    }
}

// MARK: VoiceIntent convenience initializers and mutators

public extension VoiceIntent {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(VoiceIntent.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        attachedCaptureIDS: [String]? = nil,
        capabilityHint: String?? = nil,
        context: TurnContext? = nil,
        deviceCapabilities: [DeviceCapability]? = nil,
        input: GlassesInput?? = nil,
        invocation: Invocation? = nil,
        output: OutputPreferences? = nil,
        platformIntent: PlatformIntent?? = nil,
        schema: VoiceIntentSchema? = nil,
        sessionID: String? = nil,
        transcript: Transcript?? = nil,
        turnID: String? = nil,
        userRef: String? = nil
    ) -> VoiceIntent {
        return VoiceIntent(
            attachedCaptureIDS: attachedCaptureIDS ?? self.attachedCaptureIDS,
            capabilityHint: capabilityHint ?? self.capabilityHint,
            context: context ?? self.context,
            deviceCapabilities: deviceCapabilities ?? self.deviceCapabilities,
            input: input ?? self.input,
            invocation: invocation ?? self.invocation,
            output: output ?? self.output,
            platformIntent: platformIntent ?? self.platformIntent,
            schema: schema ?? self.schema,
            sessionID: sessionID ?? self.sessionID,
            transcript: transcript ?? self.transcript,
            turnID: turnID ?? self.turnID,
            userRef: userRef ?? self.userRef
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - TurnContext
public struct TurnContext: Codable {
    public let activeCapability: String?
    public let conversationRef: String
    public let pendingProposalID: String?
    public let recentTurns: [ConversationTurn]

    public enum CodingKeys: String, CodingKey {
        case activeCapability = "active_capability"
        case conversationRef = "conversation_ref"
        case pendingProposalID = "pending_proposal_id"
        case recentTurns = "recent_turns"
    }

    public init(activeCapability: String?, conversationRef: String, pendingProposalID: String?, recentTurns: [ConversationTurn]) {
        self.activeCapability = activeCapability
        self.conversationRef = conversationRef
        self.pendingProposalID = pendingProposalID
        self.recentTurns = recentTurns
    }
}

// MARK: TurnContext convenience initializers and mutators

public extension TurnContext {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(TurnContext.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        activeCapability: String?? = nil,
        conversationRef: String? = nil,
        pendingProposalID: String?? = nil,
        recentTurns: [ConversationTurn]? = nil
    ) -> TurnContext {
        return TurnContext(
            activeCapability: activeCapability ?? self.activeCapability,
            conversationRef: conversationRef ?? self.conversationRef,
            pendingProposalID: pendingProposalID ?? self.pendingProposalID,
            recentTurns: recentTurns ?? self.recentTurns
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Invocation: String, Codable {
    case glassesInput = "glasses_input"
    case heyMeta = "hey_meta"
    case phonePushToTalk = "phone_push_to_talk"
    case typed = "typed"
}

// MARK: - OutputPreferences
public struct OutputPreferences: Codable {
    /// When true, spoken output must not contain amounts; details go to the phone.
    public let discreetMode: Bool
    public let display: OutputDisplay
    public let speech: Bool

    public enum CodingKeys: String, CodingKey {
        case discreetMode = "discreet_mode"
        case display, speech
    }

    public init(discreetMode: Bool, display: OutputDisplay, speech: Bool) {
        self.discreetMode = discreetMode
        self.display = display
        self.speech = speech
    }
}

// MARK: OutputPreferences convenience initializers and mutators

public extension OutputPreferences {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(OutputPreferences.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        discreetMode: Bool? = nil,
        display: OutputDisplay? = nil,
        speech: Bool? = nil
    ) -> OutputPreferences {
        return OutputPreferences(
            discreetMode: discreetMode ?? self.discreetMode,
            display: display ?? self.display,
            speech: speech ?? self.speech
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum PlatformIntent: String, Codable {
    case cancel = "cancel"
    case confirm = "confirm"
    case nextCard = "next_card"
    case platformIntentRepeat = "repeat"
    case reject = "reject"
    case showOnPhone = "show_on_phone"
    case stop = "stop"
}

public enum VoiceIntentSchema: String, Codable {
    case platformVoiceIntentV1 = "platform.voice_intent/v1"
}

// MARK: - Transcript
public struct Transcript: Codable {
    public let asrProvider: String?
    public let confidence: Double?
    public let lang: String
    public let text: String

    public enum CodingKeys: String, CodingKey {
        case asrProvider = "asr_provider"
        case confidence, lang, text
    }

    public init(asrProvider: String?, confidence: Double?, lang: String, text: String) {
        self.asrProvider = asrProvider
        self.confidence = confidence
        self.lang = lang
        self.text = text
    }
}

// MARK: Transcript convenience initializers and mutators

public extension Transcript {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Transcript.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        asrProvider: String?? = nil,
        confidence: Double?? = nil,
        lang: String? = nil,
        text: String? = nil
    ) -> Transcript {
        return Transcript(
            asrProvider: asrProvider ?? self.asrProvider,
            confidence: confidence ?? self.confidence,
            lang: lang ?? self.lang,
            text: text ?? self.text
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Helper functions for creating encoders and decoders

func newJSONDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        decoder.dateDecodingStrategy = .iso8601
    }
    return decoder
}

func newJSONEncoder() -> JSONEncoder {
    let encoder = JSONEncoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        encoder.dateEncodingStrategy = .iso8601
    }
    return encoder
}

// MARK: - Encode/decode helpers

public class JSONNull: Codable, Hashable {

    public static func == (lhs: JSONNull, rhs: JSONNull) -> Bool {
            return true
    }

    public var hashValue: Int {
            return 0
    }

    public init() {}

    public required init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if !container.decodeNil() {
                    throw DecodingError.typeMismatch(JSONNull.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Wrong type for JSONNull"))
            }
    }

    public func encode(to encoder: Encoder) throws {
            var container = encoder.singleValueContainer()
            try container.encodeNil()
    }
}

class JSONCodingKey: CodingKey {
    let key: String

    required init?(intValue: Int) {
            return nil
    }

    required init?(stringValue: String) {
            key = stringValue
    }

    var intValue: Int? {
            return nil
    }

    var stringValue: String {
            return key
    }
}

public class JSONAny: Codable {

    public let value: Any

    static func decodingError(forCodingPath codingPath: [CodingKey]) -> DecodingError {
            let context = DecodingError.Context(codingPath: codingPath, debugDescription: "Cannot decode JSONAny")
            return DecodingError.typeMismatch(JSONAny.self, context)
    }

    static func encodingError(forValue value: Any, codingPath: [CodingKey]) -> EncodingError {
            let context = EncodingError.Context(codingPath: codingPath, debugDescription: "Cannot encode JSONAny")
            return EncodingError.invalidValue(value, context)
    }

    static func decode(from container: SingleValueDecodingContainer) throws -> Any {
            if let value = try? container.decode(Bool.self) {
                    return value
            }
            if let value = try? container.decode(Int64.self) {
                    return value
            }
            if let value = try? container.decode(Double.self) {
                    return value
            }
            if let value = try? container.decode(String.self) {
                    return value
            }
            if container.decodeNil() {
                    return JSONNull()
            }
            throw decodingError(forCodingPath: container.codingPath)
    }

    static func decode(from container: inout UnkeyedDecodingContainer) throws -> Any {
            if let value = try? container.decode(Bool.self) {
                    return value
            }
            if let value = try? container.decode(Int64.self) {
                    return value
            }
            if let value = try? container.decode(Double.self) {
                    return value
            }
            if let value = try? container.decode(String.self) {
                    return value
            }
            if let value = try? container.decodeNil() {
                    if value {
                            return JSONNull()
                    }
            }
            if var container = try? container.nestedUnkeyedContainer() {
                    return try decodeArray(from: &container)
            }
            if var container = try? container.nestedContainer(keyedBy: JSONCodingKey.self) {
                    return try decodeDictionary(from: &container)
            }
            throw decodingError(forCodingPath: container.codingPath)
    }

    static func decode(from container: inout KeyedDecodingContainer<JSONCodingKey>, forKey key: JSONCodingKey) throws -> Any {
            if let value = try? container.decode(Bool.self, forKey: key) {
                    return value
            }
            if let value = try? container.decode(Int64.self, forKey: key) {
                    return value
            }
            if let value = try? container.decode(Double.self, forKey: key) {
                    return value
            }
            if let value = try? container.decode(String.self, forKey: key) {
                    return value
            }
            if let value = try? container.decodeNil(forKey: key) {
                    if value {
                            return JSONNull()
                    }
            }
            if var container = try? container.nestedUnkeyedContainer(forKey: key) {
                    return try decodeArray(from: &container)
            }
            if var container = try? container.nestedContainer(keyedBy: JSONCodingKey.self, forKey: key) {
                    return try decodeDictionary(from: &container)
            }
            throw decodingError(forCodingPath: container.codingPath)
    }

    static func decodeArray(from container: inout UnkeyedDecodingContainer) throws -> [Any] {
            var arr: [Any] = []
            while !container.isAtEnd {
                    let value = try decode(from: &container)
                    arr.append(value)
            }
            return arr
    }

    static func decodeDictionary(from container: inout KeyedDecodingContainer<JSONCodingKey>) throws -> [String: Any] {
            var dict = [String: Any]()
            for key in container.allKeys {
                    let value = try decode(from: &container, forKey: key)
                    dict[key.stringValue] = value
            }
            return dict
    }

    static func encode(to container: inout UnkeyedEncodingContainer, array: [Any]) throws {
            for value in array {
                    if let value = value as? Bool {
                            try container.encode(value)
                    } else if let value = value as? Int64 {
                            try container.encode(value)
                    } else if let value = value as? Double {
                            try container.encode(value)
                    } else if let value = value as? String {
                            try container.encode(value)
                    } else if value is JSONNull {
                            try container.encodeNil()
                    } else if let value = value as? [Any] {
                            var container = container.nestedUnkeyedContainer()
                            try encode(to: &container, array: value)
                    } else if let value = value as? [String: Any] {
                            var container = container.nestedContainer(keyedBy: JSONCodingKey.self)
                            try encode(to: &container, dictionary: value)
                    } else {
                            throw encodingError(forValue: value, codingPath: container.codingPath)
                    }
            }
    }

    static func encode(to container: inout KeyedEncodingContainer<JSONCodingKey>, dictionary: [String: Any]) throws {
            for (key, value) in dictionary {
                    let key = JSONCodingKey(stringValue: key)!
                    if let value = value as? Bool {
                            try container.encode(value, forKey: key)
                    } else if let value = value as? Int64 {
                            try container.encode(value, forKey: key)
                    } else if let value = value as? Double {
                            try container.encode(value, forKey: key)
                    } else if let value = value as? String {
                            try container.encode(value, forKey: key)
                    } else if value is JSONNull {
                            try container.encodeNil(forKey: key)
                    } else if let value = value as? [Any] {
                            var container = container.nestedUnkeyedContainer(forKey: key)
                            try encode(to: &container, array: value)
                    } else if let value = value as? [String: Any] {
                            var container = container.nestedContainer(keyedBy: JSONCodingKey.self, forKey: key)
                            try encode(to: &container, dictionary: value)
                    } else {
                            throw encodingError(forValue: value, codingPath: container.codingPath)
                    }
            }
    }

    static func encode(to container: inout SingleValueEncodingContainer, value: Any) throws {
            if let value = value as? Bool {
                    try container.encode(value)
            } else if let value = value as? Int64 {
                    try container.encode(value)
            } else if let value = value as? Double {
                    try container.encode(value)
            } else if let value = value as? String {
                    try container.encode(value)
            } else if value is JSONNull {
                    try container.encodeNil()
            } else {
                    throw encodingError(forValue: value, codingPath: container.codingPath)
            }
    }

    public required init(from decoder: Decoder) throws {
            if var arrayContainer = try? decoder.unkeyedContainer() {
                    self.value = try JSONAny.decodeArray(from: &arrayContainer)
            } else if var container = try? decoder.container(keyedBy: JSONCodingKey.self) {
                    self.value = try JSONAny.decodeDictionary(from: &container)
            } else {
                    let container = try decoder.singleValueContainer()
                    self.value = try JSONAny.decode(from: container)
            }
    }

    public func encode(to encoder: Encoder) throws {
            if let arr = self.value as? [Any] {
                    var container = encoder.unkeyedContainer()
                    try JSONAny.encode(to: &container, array: arr)
            } else if let dict = self.value as? [String: Any] {
                    var container = encoder.container(keyedBy: JSONCodingKey.self)
                    try JSONAny.encode(to: &container, dictionary: dict)
            } else {
                    var container = encoder.singleValueContainer()
                    try JSONAny.encode(to: &container, value: self.value)
            }
    }
}
