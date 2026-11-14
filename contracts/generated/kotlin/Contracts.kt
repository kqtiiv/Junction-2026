// To parse the JSON, install kotlin's serialization plugin and do:
//
// val json           = Json { allowStructuredMapKeys = true }
// val contractsIndex = json.parse(ContractsIndex.serializer(), jsonString)

package platform.contracts

import kotlinx.serialization.*
import kotlinx.serialization.json.*
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*

@Serializable
data class ContractsIndex (
    @SerialName("ActionKind")
    val actionKind: String? = null,

    @SerialName("ActionProposal")
    val actionProposal: ActionProposal? = null,

    @SerialName("ActionResult")
    val actionResult: ActionResult? = null,

    @SerialName("AffordabilityResult")
    val affordabilityResult: AffordabilityResult? = null,

    @SerialName("CapabilityId")
    val capabilityID: String? = null,

    @SerialName("Confidence")
    val confidence: Risk? = null,

    @SerialName("ConfirmChannel")
    val confirmChannel: ConfirmChannel? = null,

    @SerialName("ContextCapture")
    val contextCapture: ContextCapture? = null,

    @SerialName("ConversationTurn")
    val conversationTurn: ConversationTurn? = null,

    @SerialName("DataMode")
    val dataMode: DataMode? = null,

    @SerialName("Date")
    val date: String? = null,

    @SerialName("DecimalString")
    val decimalString: String? = null,

    @SerialName("DeterministicTool")
    val deterministicTool: DeterministicTool? = null,

    @SerialName("DeviceCapability")
    val deviceCapability: DeviceCapability? = null,

    @SerialName("DeviceSessionState")
    val deviceSessionState: DeviceSessionState? = null,

    @SerialName("DomainCapability")
    val domainCapability: DomainCapability? = null,

    @SerialName("DomainEvent")
    val domainEvent: DomainEvent? = null,

    @SerialName("DomainRequest")
    val domainRequest: DomainRequest? = null,

    @SerialName("DomainResponse")
    val domainResponse: DomainResponse? = null,

    @SerialName("DomainResponseEvent")
    val domainResponseEvent: DomainResponseEvent? = null,

    @SerialName("Epistemic")
    val epistemic: Epistemic? = null,

    @SerialName("ErrorEnvelope")
    val errorEnvelope: ErrorEnvelope? = null,

    @SerialName("ErrorInfo")
    val errorInfo: ErrorInfo? = null,

    @SerialName("FinanceActionKind")
    val financeActionKind: FinanceActionKind? = null,

    @SerialName("FinanceIntent")
    val financeIntent: FinanceIntent? = null,

    @SerialName("FinanceToolName")
    val financeToolName: FinanceToolName? = null,

    @SerialName("GlassesInput")
    val glassesInput: GlassesInput? = null,

    @SerialName("GoldenCase")
    val goldenCase: GoldenCase? = null,

    @SerialName("InsightCard")
    val insightCard: InsightCard? = null,

    @SerialName("IntentId")
    val intentID: String? = null,

    @SerialName("Locale")
    val locale: String? = null,

    @SerialName("LText")
    val lText: Map<String, String>? = null,

    @SerialName("MediaUri")
    val mediaURI: String? = null,

    @SerialName("MissingData")
    val missingData: MissingData? = null,

    @SerialName("MissingDataCode")
    val missingDataCode: MissingDataCode? = null,

    @SerialName("ModelProvider")
    val modelProvider: ModelProvider? = null,

    @SerialName("Money")
    val money: Money? = null,

    @SerialName("Observation")
    val observation: Observation? = null,

    @SerialName("OutputDisplay")
    val outputDisplay: OutputDisplay? = null,

    @SerialName("Probability")
    val probability: Double? = null,

    @SerialName("Ref")
    val ref: String? = null,

    @SerialName("Risk")
    val risk: Risk? = null,

    @SerialName("SafeToSpendResult")
    val safeToSpendResult: SafeToSpendResult? = null,

    @SerialName("Sha256")
    val sha256: String? = null,

    @SerialName("Timestamp")
    val timestamp: String? = null,

    @SerialName("ToolResult")
    val toolResult: ToolResult? = null,

    @SerialName("UserConfirmation")
    val userConfirmation: UserConfirmation? = null,

    @SerialName("VoiceIntent")
    val voiceIntent: VoiceIntent? = null
)

/**
 * A persistent change a capability proposes. The capability keeps the payload; the platform
 * keeps only its hash and owns the confirmation. Nothing is applied without a signed
 * UserConfirmation.
 */
@Serializable
data class ActionProposal (
    @SerialName("capability_id")
    val capabilityID: String,

    @SerialName("confirm_channels")
    val confirmChannels: List<ConfirmChannel>,

    val details: List<ProposalDetail>,

    @SerialName("expires_at")
    val expiresAt: String,

    val kind: String,

    @SerialName("payload_hash")
    val payloadHash: String,

    @SerialName("proposal_id")
    val proposalID: String,

    val reversible: Boolean,
    val risk: Risk,
    val schema: ActionProposalSchema,
    val summary: ProposalSummary,

    @SerialName("undo_window_s")
    val undoWindowS: Long? = null
)

/**
 * How a user may confirm a proposal. voice_readback and glasses_gesture are allowed only
 * for low-risk, reversible actions after the summary has been read back.
 */
@Serializable
enum class ConfirmChannel(val value: String) {
    @SerialName("glasses_gesture") GlassesGesture("glasses_gesture"),
    @SerialName("phone_biometric") PhoneBiometric("phone_biometric"),
    @SerialName("phone_tap") PhoneTap("phone_tap"),
    @SerialName("voice_readback") VoiceReadback("voice_readback");
}

@Serializable
data class ProposalDetail (
    val after: String,
    val before: String? = null,
    val label: Map<String, String>
)

/**
 * Deterministic data-coverage confidence, not a model self-report.
 */
@Serializable
enum class Risk(val value: String) {
    @SerialName("high") High("high"),
    @SerialName("low") Low("low"),
    @SerialName("medium") Medium("medium");
}

@Serializable
enum class ActionProposalSchema(val value: String) {
    @SerialName("platform.action_proposal/v1") PlatformActionProposalV1("platform.action_proposal/v1");
}

@Serializable
data class ProposalSummary (
    val spoken: Map<String, String>,
    val text: Map<String, String>
)

/**
 * What a capability returns after receiving a UserConfirmation.
 */
@Serializable
data class ActionResult (
    @SerialName("applied_at")
    val appliedAt: String? = null,

    val card: InsightCard? = null,

    @SerialName("confirmation_id")
    val confirmationID: String,

    val error: ErrorInfo? = null,

    @SerialName("proposal_id")
    val proposalID: String,

    val schema: ActionResultSchema,
    val status: ActionResultStatus,

    @SerialName("undo_expires_at")
    val undoExpiresAt: String? = null,

    @SerialName("undo_token")
    val undoToken: String? = null
)

/**
 * Schema-driven card rendered generically by the phone (and optionally the glasses
 * display). Every value carries an epistemic label; calculated and estimated cards must
 * cite calc_ids, observed cards must cite observations, educational cards must cite sources.
 */
@Serializable
data class InsightCard (
    val assumptions: List<Map<String, String>>,
    val basis: CardBasis,
    val body: Map<String, String>? = null,

    @SerialName("capability_id")
    val capabilityID: String,

    @SerialName("card_id")
    val cardID: String,

    @SerialName("data_mode")
    val dataMode: String? = null,

    val epistemic: Epistemic,

    @SerialName("missing_data")
    val missingData: List<Map<String, String>>,

    val primary: CardValue? = null,

    @SerialName("proposal_ids")
    val proposalIDS: List<String>? = null,

    @SerialName("render_hints")
    val renderHints: RenderHints? = null,

    val rows: List<CardRow>? = null,
    val schema: InsightCardSchema,
    val title: Map<String, String>,
    val type: InsightCardType
)

@Serializable
data class CardBasis (
    @SerialName("as_of")
    val asOf: String,

    @SerialName("calc_ids")
    val calcIDS: List<String>,

    @SerialName("observation_ids")
    val observationIDS: List<String>? = null,

    val sources: List<CardSource>? = null
)

@Serializable
data class CardSource (
    val kind: SourceKind,
    val ref: String,
    val title: String? = null
)

@Serializable
enum class SourceKind(val value: String) {
    @SerialName("calculation") Calculation("calculation"),
    @SerialName("document") Document("document"),
    @SerialName("observation") Observation("observation");
}

/**
 * What kind of claim this is. fact = read from a record; calculated = deterministic from
 * facts; estimate = deterministic but depends on assumptions or forecasts; educational =
 * general content, not about the user's data; observed = perceived from a camera capture
 * and may be misread.
 */
@Serializable
enum class Epistemic(val value: String) {
    @SerialName("calculated") Calculated("calculated"),
    @SerialName("educational") Educational("educational"),
    @SerialName("estimate") Estimate("estimate"),
    @SerialName("fact") Fact("fact"),
    @SerialName("observed") Observed("observed");
}

@Serializable
data class CardValue (
    val epistemic: Epistemic,
    val label: Map<String, String>,
    val value: Value
)

@Serializable
sealed class Value {
    class MoneyValue(val value: Money)   : Value()
    class StringValue(val value: String) : Value()
}

@Serializable
data class Money (
    val amount: String,
    val currency: Currency
)

@Serializable
enum class Currency(val value: String) {
    @SerialName("EUR") Eur("EUR");
}

@Serializable
data class RenderHints (
    @SerialName("glasses_display_lines")
    val glassesDisplayLines: List<String>? = null,

    val sensitive: Boolean? = null,

    @SerialName("voice_summary")
    val voiceSummary: Map<String, String>? = null
)

@Serializable
data class CardRow (
    val epistemic: Epistemic,
    val label: Map<String, String>,
    val note: Map<String, String>? = null,
    val value: Value
)

@Serializable
enum class InsightCardSchema(val value: String) {
    @SerialName("platform.insight_card/v1") PlatformInsightCardV1("platform.insight_card/v1");
}

@Serializable
enum class InsightCardType(val value: String) {
    @SerialName("breakdown") Breakdown("breakdown"),
    @SerialName("comparison") Comparison("comparison"),
    @SerialName("consent") Consent("consent"),
    @SerialName("explanation") Explanation("explanation"),
    @SerialName("metric") Metric("metric"),
    @SerialName("list") TypeList("list");
}

@Serializable
data class ErrorInfo (
    val code: String,
    val message: String,
    val retryable: Boolean
)

@Serializable
enum class ActionResultSchema(val value: String) {
    @SerialName("platform.action_result/v1") PlatformActionResultV1("platform.action_result/v1");
}

@Serializable
enum class ActionResultStatus(val value: String) {
    @SerialName("applied") Applied("applied"),
    @SerialName("expired") Expired("expired"),
    @SerialName("failed") Failed("failed"),
    @SerialName("hash_mismatch") HashMismatch("hash_mismatch"),
    @SerialName("rejected_by_user") RejectedByUser("rejected_by_user"),
    @SerialName("signature_invalid") SignatureInvalid("signature_invalid");
}

@Serializable
data class AffordabilityResult (
    @SerialName("amount_checked")
    val amountChecked: Money,

    val category: String? = null,

    @SerialName("difference_vs_usual")
    val differenceVsUsual: Money? = null,

    @SerialName("observation_id")
    val observationID: String? = null,

    /**
     * Where the amount came from. 'observation' = read from a capture; the answer must say the
     * price was read, not known.
     */
    @SerialName("price_source")
    val priceSource: PriceSource,

    @SerialName("remaining_after")
    val remainingAfter: Money? = null,

    @SerialName("safe_to_spend_week")
    val safeToSpendWeek: Money? = null,

    @SerialName("usual_week_median")
    val usualWeekMedian: Money? = null,

    val verdict: Verdict
)

/**
 * Where the amount came from. 'observation' = read from a capture; the answer must say the
 * price was read, not known.
 */
@Serializable
enum class PriceSource(val value: String) {
    @SerialName("basket") Basket("basket"),
    @SerialName("observation") Observation("observation"),
    @SerialName("stated_amount") StatedAmount("stated_amount");
}

@Serializable
enum class Verdict(val value: String) {
    @SerialName("EXCEEDS") Exceeds("EXCEEDS"),
    @SerialName("FITS") Fits("FITS"),
    @SerialName("TIGHT") Tight("TIGHT"),
    @SerialName("UNKNOWN") Unknown("UNKNOWN");
}

/**
 * A user-initiated photo from the glasses or phone, minimised on the phone before upload.
 * Capabilities receive raw media only if their manifest declares delivery 'media' for this
 * purpose; otherwise they receive Observations.
 */
@Serializable
data class ContextCapture (
    @SerialName("capture_id")
    val captureID: String,

    @SerialName("captured_at")
    val capturedAt: String,

    @SerialName("consent_grant_id")
    val consentGrantID: String,

    val locale: String,
    val media: CaptureMedia,

    /**
     * What the phone did before upload. EXIF stripping is mandatory. orientation_applied = the
     * image was rotated upright from its EXIF orientation before EXIF was stripped (DEC-006).
     */
    val minimisation: List<Minimisation>,

    /**
     * A purpose declared in some capability manifest's capture_purposes, e.g. 'price_label',
     * 'receipt'.
     */
    val purpose: String,

    val schema: ContextCaptureSchema,

    @SerialName("session_id")
    val sessionID: String,

    val source: Source,
    val trigger: Trigger,

    @SerialName("user_ref")
    val userRef: String
)

@Serializable
data class CaptureMedia (
    @SerialName("expires_at")
    val expiresAt: String,

    val height: Long,
    val kind: MediaKind,
    val mime: MIME,
    val sha256: String,
    val uri: String,
    val width: Long
)

@Serializable
enum class MediaKind(val value: String) {
    @SerialName("image") Image("image");
}

@Serializable
enum class MIME(val value: String) {
    @SerialName("image/jpeg") ImageJPEG("image/jpeg"),
    @SerialName("image/png") ImagePNG("image/png");
}

@Serializable
enum class Minimisation(val value: String) {
    @SerialName("cropped") Cropped("cropped"),
    @SerialName("downscaled") Downscaled("downscaled"),
    @SerialName("exif_stripped") ExifStripped("exif_stripped"),
    @SerialName("faces_blurred") FacesBlurred("faces_blurred"),
    @SerialName("gps_removed") GpsRemoved("gps_removed"),
    @SerialName("orientation_applied") OrientationApplied("orientation_applied");
}

@Serializable
enum class ContextCaptureSchema(val value: String) {
    @SerialName("platform.context_capture/v1") PlatformContextCaptureV1("platform.context_capture/v1");
}

@Serializable
enum class Source(val value: String) {
    @SerialName("glasses_photo") GlassesPhoto("glasses_photo"),
    @SerialName("glasses_stream_frame") GlassesStreamFrame("glasses_stream_frame"),
    @SerialName("phone_camera") PhoneCamera("phone_camera"),
    @SerialName("phone_upload") PhoneUpload("phone_upload");
}

@Serializable
enum class Trigger(val value: String) {
    @SerialName("glasses_input") GlassesInput("glasses_input"),
    @SerialName("phone_tap") PhoneTap("phone_tap"),
    @SerialName("voice_command") VoiceCommand("voice_command");
}

@Serializable
data class ConversationTurn (
    val role: Role,
    val text: String
)

@Serializable
enum class Role(val value: String) {
    @SerialName("assistant") Assistant("assistant"),
    @SerialName("user") User("user");
}

/**
 * balance = actual balance + income date; budget = detected income and bills, no balance;
 * pace = spending history only (no affordability yes/no allowed).
 */
@Serializable
enum class DataMode(val value: String) {
    @SerialName("balance") Balance("balance"),
    @SerialName("budget") Budget("budget"),
    @SerialName("pace") Pace("pace");
}

/**
 * Descriptor every domain publishes for its deterministic functions. The agent, the
 * deterministic fast path and the verifier all use the same tools, so each tool can be
 * tested without any model.
 */
@Serializable
data class DeterministicTool (
    val description: String,
    val deterministic: Boolean,

    @SerialName("golden_fixtures")
    val goldenFixtures: String,

    /**
     * JSON Schema for the tool input.
     */
    @SerialName("input_schema")
    val inputSchema: JsonObject,

    val name: String,

    /**
     * JSON Schema for ToolResult.result.
     */
    @SerialName("output_schema")
    val outputSchema: JsonObject,

    val owner: String,

    @SerialName("result_envelope")
    val resultEnvelope: ResultEnvelope,

    val schema: DeterministicToolSchema,

    /**
     * Tools never write persistent state directly. 'proposal_only' tools may create an
     * ActionProposal.
     */
    @SerialName("side_effects")
    val sideEffects: SideEffects,

    val version: String
)

@Serializable
enum class ResultEnvelope(val value: String) {
    @SerialName("platform.tool_result/v1") PlatformToolResultV1("platform.tool_result/v1");
}

@Serializable
enum class DeterministicToolSchema(val value: String) {
    @SerialName("platform.tool_descriptor/v1") PlatformToolDescriptorV1("platform.tool_descriptor/v1");
}

/**
 * Tools never write persistent state directly. 'proposal_only' tools may create an
 * ActionProposal.
 */
@Serializable
enum class SideEffects(val value: String) {
    @SerialName("none") None("none"),
    @SerialName("proposal_only") ProposalOnly("proposal_only");
}

/**
 * Capabilities negotiated with the connected glasses at session start. Availability varies
 * by device and SDK version.
 */
@Serializable
enum class DeviceCapability(val value: String) {
    @SerialName("audio_stream") AudioStream("audio_stream"),
    @SerialName("camera_stream") CameraStream("camera_stream"),
    @SerialName("display") Display("display"),
    @SerialName("imu") Imu("imu"),
    @SerialName("inputs") Inputs("inputs"),
    @SerialName("on_device_speech") OnDeviceSpeech("on_device_speech"),
    @SerialName("photo_capture") PhotoCapture("photo_capture"),
    @SerialName("voice_invocation") VoiceInvocation("voice_invocation");
}

/**
 * Snapshot of the glasses link as the companion sees it, published on every change (seq
 * increases monotonically). Four independent lifecycles are reported separately rather than
 * as one state chain, because the Meta Wearables Device Access Toolkit changes them
 * independently: registration with the Meta AI app, the device session, the camera stream,
 * and the platform's own conversation state. Values are platform names; GlassesBridge maps
 * SDK enums onto them, so SDK changes never reach this contract. See
 * docs/ARCHITECTURE_DECISION_LOG.md DEC-005.
 */
@Serializable
data class DeviceSessionState (
    /**
     * glasses_hfp = two-way narrow-band mono (mic + speech out); glasses_a2dp = output only;
     * phone = phone mic/speaker; none = no usable audio.
     */
    @SerialName("audio_route")
    val audioRoute: AudioRoute,

    val camera: CameraState,

    /**
     * Why the experience is reduced. Empty when everything requested is available.
     */
    @SerialName("degraded_reasons")
    val degradedReasons: List<DegradedReason>,

    /**
     * Whether an eligible device is selected. update_required = the glasses need a firmware or
     * on-glasses app update.
     */
    @SerialName("device_availability")
    val deviceAvailability: DeviceAvailability,

    @SerialName("device_capabilities")
    val deviceCapabilities: List<DeviceCapability>,

    /**
     * Device session state. paused is device-driven and carries no reason; stopped is terminal
     * and a new session must be created.
     */
    @SerialName("device_session")
    val deviceSession: DeviceSession,

    /**
     * SDK features in use that the vendor marks experimental or preview. A non-empty list means
     * this build cannot be published; each feature has a non-experimental fallback (DEC-004).
     */
    @SerialName("experimental_features")
    val experimentalFeatures: List<ExperimentalFeature>,

    /**
     * Which implementation GlassesBridge is running. Always explicit: a mock must never stand
     * in silently for real hardware.
     */
    @SerialName("glasses_backend")
    val glassesBackend: GlassesBackend,

    /**
     * The platform's conversation state, independent of the device lifecycles above.
     */
    val interaction: Interaction,

    /**
     * glasses = the glasses are usable for this turn; phone_only = every interaction continues
     * on the phone.
     */
    val mode: Mode,

    @SerialName("observed_at")
    val observedAt: String,

    /**
     * Registration of this app with the Meta AI app.
     */
    val registration: Registration,

    val schema: DeviceSessionStateSchema,

    /**
     * Monotonic per session. Consumers drop snapshots with a lower seq than the last one seen.
     */
    val seq: Long,

    @SerialName("session_id")
    val sessionID: String
)

/**
 * glasses_hfp = two-way narrow-band mono (mic + speech out); glasses_a2dp = output only;
 * phone = phone mic/speaker; none = no usable audio.
 */
@Serializable
enum class AudioRoute(val value: String) {
    @SerialName("glasses_a2dp") GlassesA2DP("glasses_a2dp"),
    @SerialName("glasses_hfp") GlassesHfp("glasses_hfp"),
    @SerialName("none") None("none"),
    @SerialName("phone") Phone("phone");
}

@Serializable
data class CameraState (
    /**
     * Camera permission is granted in the Meta AI app, not through an OS dialog.
     */
    val permission: Permission,

    val stream: Stream
)

/**
 * Camera permission is granted in the Meta AI app, not through an OS dialog.
 */
@Serializable
enum class Permission(val value: String) {
    @SerialName("denied") Denied("denied"),
    @SerialName("granted_always") GrantedAlways("granted_always"),
    @SerialName("granted_once") GrantedOnce("granted_once"),
    @SerialName("unknown") Unknown("unknown");
}

@Serializable
enum class Stream(val value: String) {
    @SerialName("paused") Paused("paused"),
    @SerialName("starting") Starting("starting"),
    @SerialName("stopped") Stopped("stopped"),
    @SerialName("stopping") Stopping("stopping"),
    @SerialName("streaming") Streaming("streaming");
}

@Serializable
enum class DegradedReason(val value: String) {
    @SerialName("APP_BACKGROUNDED") AppBackgrounded("APP_BACKGROUNDED"),
    @SerialName("BATTERY_LOW") BatteryLow("BATTERY_LOW"),
    @SerialName("BLUETOOTH_ROUTE_UNAVAILABLE") BluetoothRouteUnavailable("BLUETOOTH_ROUTE_UNAVAILABLE"),
    @SerialName("CAMERA_PERMISSION_DENIED") CameraPermissionDenied("CAMERA_PERMISSION_DENIED"),
    @SerialName("DEVICE_UPDATE_REQUIRED") DeviceUpdateRequired("DEVICE_UPDATE_REQUIRED"),
    @SerialName("DOFFED") Doffed("DOFFED"),
    @SerialName("HINGES_CLOSED") HingesClosed("HINGES_CLOSED"),
    @SerialName("META_AI_APP_MISSING") MetaAIAppMissing("META_AI_APP_MISSING"),
    @SerialName("MIC_PERMISSION_DENIED") MicPermissionDenied("MIC_PERMISSION_DENIED"),
    @SerialName("NO_DEVICE") NoDevice("NO_DEVICE"),
    @SerialName("NOT_REGISTERED") NotRegistered("NOT_REGISTERED"),
    @SerialName("SDK_UPDATE_REQUIRED") SDKUpdateRequired("SDK_UPDATE_REQUIRED"),
    @SerialName("SESSION_STOPPED") SessionStopped("SESSION_STOPPED"),
    @SerialName("THERMAL") Thermal("THERMAL"),
    @SerialName("USER_CHOSE_PHONE") UserChosePhone("USER_CHOSE_PHONE");
}

/**
 * Whether an eligible device is selected. update_required = the glasses need a firmware or
 * on-glasses app update.
 */
@Serializable
enum class DeviceAvailability(val value: String) {
    @SerialName("available") Available("available"),
    @SerialName("none") None("none"),
    @SerialName("update_required") UpdateRequired("update_required");
}

/**
 * Device session state. paused is device-driven and carries no reason; stopped is terminal
 * and a new session must be created.
 */
@Serializable
enum class DeviceSession(val value: String) {
    @SerialName("idle") Idle("idle"),
    @SerialName("paused") Paused("paused"),
    @SerialName("started") Started("started"),
    @SerialName("starting") Starting("starting"),
    @SerialName("stopped") Stopped("stopped"),
    @SerialName("stopping") Stopping("stopping");
}

@Serializable
enum class ExperimentalFeature(val value: String) {
    @SerialName("display") Display("display"),
    @SerialName("inputs") Inputs("inputs"),
    @SerialName("motion") Motion("motion"),
    @SerialName("speech") Speech("speech"),
    @SerialName("standalone_photo") StandalonePhoto("standalone_photo"),
    @SerialName("stream_audio") StreamAudio("stream_audio"),
    @SerialName("voice_invocation") VoiceInvocation("voice_invocation");
}

/**
 * Which implementation GlassesBridge is running. Always explicit: a mock must never stand
 * in silently for real hardware.
 */
@Serializable
enum class GlassesBackend(val value: String) {
    @SerialName("dat") DAT("dat"),
    @SerialName("mock") Mock("mock"),
    @SerialName("none") None("none");
}

/**
 * The platform's conversation state, independent of the device lifecycles above.
 */
@Serializable
enum class Interaction(val value: String) {
    @SerialName("awaiting_confirmation") AwaitingConfirmation("awaiting_confirmation"),
    @SerialName("capture_pending") CapturePending("capture_pending"),
    @SerialName("idle") Idle("idle"),
    @SerialName("listening") Listening("listening"),
    @SerialName("processing") Processing("processing"),
    @SerialName("speaking") Speaking("speaking");
}

/**
 * glasses = the glasses are usable for this turn; phone_only = every interaction continues
 * on the phone.
 */
@Serializable
enum class Mode(val value: String) {
    @SerialName("glasses") Glasses("glasses"),
    @SerialName("phone_only") PhoneOnly("phone_only");
}

/**
 * Registration of this app with the Meta AI app.
 */
@Serializable
enum class Registration(val value: String) {
    @SerialName("not_registered") NotRegistered("not_registered"),
    @SerialName("registered") Registered("registered"),
    @SerialName("registering") Registering("registering"),
    @SerialName("unavailable") Unavailable("unavailable");
}

@Serializable
enum class DeviceSessionStateSchema(val value: String) {
    @SerialName("platform.device_session_state/v1") PlatformDeviceSessionStateV1("platform.device_session_state/v1");
}

/**
 * What a capability declares to the platform. The platform loads nothing it cannot
 * validate: intents, capture purposes, data classes (for consent), action kinds (for
 * confirmation policy), events, transport and SLOs.
 */
@Serializable
data class DomainCapability (
    @SerialName("action_kinds")
    val actionKinds: List<ActionKindDeclaration>,

    @SerialName("capability_id")
    val capabilityID: String,

    @SerialName("capture_purposes")
    val capturePurposes: List<CapturePurpose>,

    @SerialName("contract_version")
    val contractVersion: ContractVersion,

    /**
     * Data classes this capability touches; the consent registry asks for each.
     */
    @SerialName("data_classes")
    val dataClasses: List<String>,

    @SerialName("display_name")
    val displayName: Map<String, String>,

    @SerialName("events_emitted")
    val eventsEmitted: List<String>,

    @SerialName("fixtures_uri")
    val fixturesURI: String,

    @SerialName("health_uri")
    val healthURI: String? = null,

    val intents: List<IntentDeclaration>,
    val schema: DomainCapabilitySchema,
    val slo: LatencySlo,
    val transport: CapabilityTransport,
    val version: String
)

@Serializable
data class ActionKindDeclaration (
    @SerialName("confirm_channels")
    val confirmChannels: List<ConfirmChannel>,

    val kind: String,
    val reversible: Boolean,
    val risk: Risk
)

@Serializable
data class CapturePurpose (
    /**
     * 'observation' (default, preferred): the capability receives only what the platform read.
     * 'media': it receives the minimised image via a short-lived reference.
     */
    val delivery: Delivery,

    val purpose: String,

    /**
     * Maximum time the capability may keep the image. Capped at 30 days.
     */
    @SerialName("retention_max_s")
    val retentionMaxS: Long
)

/**
 * 'observation' (default, preferred): the capability receives only what the platform read.
 * 'media': it receives the minimised image via a short-lived reference.
 */
@Serializable
enum class Delivery(val value: String) {
    @SerialName("media") Media("media"),
    @SerialName("observation") Observation("observation");
}

@Serializable
enum class ContractVersion(val value: String) {
    @SerialName("1") The1("1");
}

@Serializable
data class IntentDeclaration (
    /**
     * Capture purposes this intent can use; each must appear in capture_purposes.
     */
    @SerialName("accepts_capture")
    val acceptsCapture: List<String>,

    val examples: List<Map<String, String>>,
    val id: String,

    @SerialName("voice_ok")
    val voiceOk: Boolean
)

@Serializable
enum class DomainCapabilitySchema(val value: String) {
    @SerialName("platform.capability_manifest/v1") PlatformCapabilityManifestV1("platform.capability_manifest/v1");
}

@Serializable
data class LatencySlo (
    @SerialName("p50_ms")
    val p50MS: Long,

    @SerialName("p95_ms")
    val p95MS: Long
)

@Serializable
data class CapabilityTransport (
    val endpoint: String? = null,
    val kind: TransportKind
)

@Serializable
enum class TransportKind(val value: String) {
    @SerialName("https_json") HTTPSJSON("https_json"),
    @SerialName("https_sse") HTTPSSSE("https_sse"),
    @SerialName("in_process") InProcess("in_process");
}

/**
 * Emitted by a capability for possible proactive delivery. The platform's notification
 * policy decides whether, when and where to deliver it (rate limits, quiet hours, active
 * session). Amounts are never spoken proactively: open-ear speakers can be overheard. The
 * summary must be safe to show on a lock screen: no amounts, merchants or item names.
 */
@Serializable
data class DomainEvent (
    @SerialName("capability_id")
    val capabilityID: String,

    @SerialName("card_ref")
    val cardRef: String? = null,

    @SerialName("dedupe_key")
    val dedupeKey: String,

    @SerialName("delivery_prefs")
    val deliveryPrefs: DeliveryPrefs,

    @SerialName("event_id")
    val eventID: String,

    @SerialName("expires_at")
    val expiresAt: String,

    @SerialName("occurred_at")
    val occurredAt: String,

    val schema: DomainEventSchema,
    val severity: Severity,
    val summary: Map<String, String>,
    val type: String,

    @SerialName("user_ref")
    val userRef: String
)

@Serializable
data class DeliveryPrefs (
    @SerialName("glasses_audio")
    val glassesAudio: GlassesAudio,

    @SerialName("phone_notification")
    val phoneNotification: Boolean,

    /**
     * Reserved. Always false in v1.
     */
    @SerialName("spoken_amounts")
    val spokenAmounts: Boolean
)

@Serializable
enum class GlassesAudio(val value: String) {
    @SerialName("in_session_only") InSessionOnly("in_session_only"),
    @SerialName("never") Never("never");
}

@Serializable
enum class DomainEventSchema(val value: String) {
    @SerialName("platform.domain_event/v1") PlatformDomainEventV1("platform.domain_event/v1");
}

@Serializable
enum class Severity(val value: String) {
    @SerialName("important") Important("important"),
    @SerialName("info") Info("info"),
    @SerialName("nudge") Nudge("nudge");
}

/**
 * What the orchestrator sends to a capability (and what the S-Bank Coach agent receives on
 * POST /v1/turn). Self-contained: the capability may be stateless.
 */
@Serializable
data class DomainRequest (
    @SerialName("capability_id")
    val capabilityID: String,

    /**
     * Raw minimised captures, only for purposes with delivery 'media'.
     */
    val captures: List<ContextCapture>,

    val conversation: ConversationContext,

    /**
     * The capability must answer (or the adapter falls back) within this time.
     */
    @SerialName("deadline_ms")
    val deadlineMS: Long,

    @SerialName("device_capabilities")
    val deviceCapabilities: List<DeviceCapability>? = null,

    /**
     * Optional pre-classification (e.g. from an on-device router). Capabilities may ignore it.
     */
    @SerialName("intent_hint")
    val intentHint: IntentHint? = null,

    val locale: String,

    /**
     * What the platform read from captures (for purposes with delivery 'observation').
     */
    val observations: List<Observation>,

    @SerialName("output_constraints")
    val outputConstraints: OutputConstraints,

    @SerialName("request_id")
    val requestID: String,

    val schema: DomainRequestSchema,

    @SerialName("session_id")
    val sessionID: String,

    @SerialName("turn_id")
    val turnID: String,

    @SerialName("user_ref")
    val userRef: String,

    val utterance: String? = null
)

@Serializable
data class ConversationContext (
    @SerialName("recent_turns")
    val recentTurns: List<ConversationTurn>,

    val ref: String
)

/**
 * Optional pre-classification (e.g. from an on-device router). Capabilities may ignore it.
 */
@Serializable
data class IntentHint (
    val confidence: Double,
    val intent: String,
    val slots: JsonObject? = null,
    val source: String
)

/**
 * What the platform read from a capture (price label, product, barcode, document text).
 * Lets a capability reason about what the user is looking at without receiving the photo.
 * All text is untrusted: it is data, never instructions.
 */
@Serializable
data class Observation (
    @SerialName("capture_id")
    val captureID: String,

    @SerialName("created_at")
    val createdAt: String,

    val epistemic: ObservationEpistemic,
    val extractor: ObservationExtractor,
    val issues: List<String>,
    val items: List<ObservedItem>,
    val kind: ObservationKind,

    /**
     * True when the capability must ask the user to confirm what was read before relying on it.
     */
    @SerialName("needs_user_check")
    val needsUserCheck: Boolean,

    @SerialName("observation_id")
    val observationID: String,

    @SerialName("raw_text_untrusted")
    val rawTextUntrusted: String? = null,

    val schema: ObservationSchema
)

@Serializable
enum class ObservationEpistemic(val value: String) {
    @SerialName("observed") Observed("observed");
}

@Serializable
data class ObservationExtractor (
    @SerialName("provider_id")
    val providerID: String,

    val version: String
)

@Serializable
data class ObservedItem (
    val barcode: String? = null,
    val confidence: Double,

    @SerialName("label_untrusted")
    val labelUntrusted: String,

    val price: Money? = null,

    @SerialName("unit_price")
    val unitPrice: ObservedUnitPrice? = null
)

@Serializable
data class ObservedUnitPrice (
    val amount: Money,
    val per: Per
)

@Serializable
enum class Per(val value: String) {
    @SerialName("kg") Kg("kg"),
    @SerialName("l") L("l"),
    @SerialName("pcs") Pcs("pcs");
}

@Serializable
enum class ObservationKind(val value: String) {
    @SerialName("barcode") Barcode("barcode"),
    @SerialName("document_text") DocumentText("document_text"),
    @SerialName("price_label") PriceLabel("price_label"),
    @SerialName("product") Product("product"),
    @SerialName("receipt") Receipt("receipt");
}

@Serializable
enum class ObservationSchema(val value: String) {
    @SerialName("platform.observation/v1") PlatformObservationV1("platform.observation/v1");
}

@Serializable
data class OutputConstraints (
    @SerialName("discreet_mode")
    val discreetMode: Boolean,

    val display: OutputDisplay,

    @SerialName("speech_max_words")
    val speechMaxWords: Long
)

@Serializable
enum class OutputDisplay(val value: String) {
    @SerialName("glasses") Glasses("glasses"),
    @SerialName("none") None("none"),
    @SerialName("phone") Phone("phone");
}

@Serializable
enum class DomainRequestSchema(val value: String) {
    @SerialName("platform.domain_request/v1") PlatformDomainRequestV1("platform.domain_request/v1");
}

/**
 * A capability's complete answer to one DomainRequest: one short spoken line, cards for the
 * phone, optional proposals, and a trace. The agent sends trace.verified=false; only the
 * adapter sets it to true after checking every number against the engine.
 */
@Serializable
data class DomainResponse (
    val cards: List<InsightCard>,
    val error: ErrorInfo? = null,

    /**
     * Suggested follow-up questions shown as chips.
     */
    val followups: List<Map<String, String>>? = null,

    val proposals: List<ActionProposal>,

    @SerialName("request_id")
    val requestID: String,

    val schema: DomainResponseSchema,
    val speech: SpokenLine,
    val status: DomainResponseStatus,
    val trace: ResponseTrace
)

@Serializable
enum class DomainResponseSchema(val value: String) {
    @SerialName("platform.domain_response/v1") PlatformDomainResponseV1("platform.domain_response/v1");
}

@Serializable
data class SpokenLine (
    val epistemic: Epistemic,
    val text: String
)

@Serializable
enum class DomainResponseStatus(val value: String) {
    @SerialName("answered") Answered("answered"),
    @SerialName("clarify") Clarify("clarify"),
    @SerialName("error") Error("error"),
    @SerialName("partial") Partial("partial"),
    @SerialName("unsupported") Unsupported("unsupported");
}

@Serializable
data class ResponseTrace (
    /**
     * Opaque backend id for telemetry only, e.g. 'remote_agent@0.4', 'fast_path@1'. The
     * platform never branches on it.
     */
    val backend: String,

    @SerialName("calc_ids")
    val calcIDS: List<String>,

    @SerialName("observation_ids")
    val observationIDS: List<String>? = null,

    val tools: List<ToolCallTrace>,
    val verification: VerificationReport? = null,
    val verified: Boolean
)

@Serializable
data class ToolCallTrace (
    val ms: Long,
    val name: String,
    val ok: Boolean
)

@Serializable
data class VerificationReport (
    @SerialName("checked_values")
    val checkedValues: Long,

    val unverified: List<String>
)

/**
 * One event in a streamed answer (SSE). Exactly one 'final' event ends the stream; cards
 * and proposals in earlier events are repeated in the final response so non-streaming
 * consumers lose nothing.
 */
@Serializable
data class DomainResponseEvent (
    @SerialName("speech_hint")
    val speechHint: Map<String, String>? = null,

    val stage: String? = null,
    val type: DomainResponseEventType,
    val card: InsightCard? = null,
    val proposal: ActionProposal? = null,
    val response: DomainResponse? = null
)

@Serializable
enum class DomainResponseEventType(val value: String) {
    @SerialName("card") Card("card"),
    @SerialName("final") Final("final"),
    @SerialName("progress") Progress("progress"),
    @SerialName("proposal") Proposal("proposal");
}

/**
 * Body of every non-2xx HTTP response on the platform's public APIs, and of SSE 'error'
 * events. user_message is safe to show or speak; diagnostics belong in logs keyed by
 * correlation_id, never in this object. Small in-body errors inside ToolResult and
 * DomainResponse keep using common ErrorInfo. See DEC-008.
 */
@Serializable
data class ErrorEnvelope (
    @SerialName("capability_id")
    val capabilityID: String? = null,

    /**
     * UPPER_SNAKE code. Open set: clients must treat unknown codes by their retryable and
     * effect_state flags. Registry: docs/contracts/README.md#error-codes.
     */
    val code: String,

    @SerialName("correlation_id")
    val correlationID: String,

    /**
     * Fallback the platform has already switched to, if any.
     */
    @SerialName("degraded_to")
    val degradedTo: DegradedTo? = null,

    /**
     * Whether the request had a persistent effect. unknown = it may have been applied (e.g. a
     * timeout while applying a confirmed proposal); clients must not replay it and must re-read
     * state first.
     */
    @SerialName("effect_state")
    val effectState: EffectState,

    @SerialName("occurred_at")
    val occurredAt: String,

    @SerialName("retry_after_ms")
    val retryAfterMS: Long? = null,

    /**
     * true = the same request may be sent again automatically (honour retry_after_ms).
     */
    val retryable: Boolean,

    val schema: ErrorEnvelopeSchema,

    /**
     * Short, non-technical, safe to speak aloud: no amounts, no account data, no stack traces.
     */
    @SerialName("user_message")
    val userMessage: Map<String, String>
)

/**
 * Fallback the platform has already switched to, if any.
 */
@Serializable
enum class DegradedTo(val value: String) {
    @SerialName("cached_cards") CachedCards("cached_cards"),
    @SerialName("fast_path") FastPath("fast_path"),
    @SerialName("none") None("none"),
    @SerialName("phone_only") PhoneOnly("phone_only");
}

/**
 * Whether the request had a persistent effect. unknown = it may have been applied (e.g. a
 * timeout while applying a confirmed proposal); clients must not replay it and must re-read
 * state first.
 */
@Serializable
enum class EffectState(val value: String) {
    @SerialName("applied") Applied("applied"),
    @SerialName("none") None("none"),
    @SerialName("unknown") Unknown("unknown");
}

@Serializable
enum class ErrorEnvelopeSchema(val value: String) {
    @SerialName("platform.error/v1") PlatformErrorV1("platform.error/v1");
}

@Serializable
enum class FinanceActionKind(val value: String) {
    @SerialName("finance.classification.update") FinanceClassificationUpdate("finance.classification.update"),
    @SerialName("finance.data.delete") FinanceDataDelete("finance.data.delete"),
    @SerialName("finance.goal.update") FinanceGoalUpdate("finance.goal.update"),
    @SerialName("finance.plan.add") FinancePlanAdd("finance.plan.add"),
    @SerialName("finance.receipt.link") FinanceReceiptLink("finance.receipt.link"),
    @SerialName("finance.settings.buffer.update") FinanceSettingsBufferUpdate("finance.settings.buffer.update");
}

@Serializable
enum class FinanceIntent(val value: String) {
    @SerialName("finance.basket.affordability") FinanceBasketAffordability("finance.basket.affordability"),
    @SerialName("finance.classification.correct") FinanceClassificationCorrect("finance.classification.correct"),
    @SerialName("finance.commitments.upcoming") FinanceCommitmentsUpcoming("finance.commitments.upcoming"),
    @SerialName("finance.education") FinanceEducation("finance.education"),
    @SerialName("finance.explain") FinanceExplain("finance.explain"),
    @SerialName("finance.goal.projection") FinanceGoalProjection("finance.goal.projection"),
    @SerialName("finance.receipt.scan") FinanceReceiptScan("finance.receipt.scan"),
    @SerialName("finance.safe_to_spend") FinanceSafeToSpend("finance.safe_to_spend"),
    @SerialName("finance.simulate_change") FinanceSimulateChange("finance.simulate_change"),
    @SerialName("finance.spend.query") FinanceSpendQuery("finance.spend.query"),
    @SerialName("finance.spender_profile") FinanceSpenderProfile("finance.spender_profile");
}

@Serializable
enum class FinanceToolName(val value: String) {
    @SerialName("finance.calculate_affordability") FinanceCalculateAffordability("finance.calculate_affordability"),
    @SerialName("finance.get_basket_breakdown") FinanceGetBasketBreakdown("finance.get_basket_breakdown"),
    @SerialName("finance.get_calculation") FinanceGetCalculation("finance.get_calculation"),
    @SerialName("finance.get_safe_to_spend") FinanceGetSafeToSpend("finance.get_safe_to_spend"),
    @SerialName("finance.get_savings_projection") FinanceGetSavingsProjection("finance.get_savings_projection"),
    @SerialName("finance.get_spending_summary") FinanceGetSpendingSummary("finance.get_spending_summary"),
    @SerialName("finance.get_transactions") FinanceGetTransactions("finance.get_transactions"),
    @SerialName("finance.get_upcoming_commitments") FinanceGetUpcomingCommitments("finance.get_upcoming_commitments"),
    @SerialName("finance.process_receipt") FinanceProcessReceipt("finance.process_receipt"),
    @SerialName("finance.propose_classification_change") FinanceProposeClassificationChange("finance.propose_classification_change"),
    @SerialName("finance.simulate_spending_change") FinanceSimulateSpendingChange("finance.simulate_spending_change");
}

/**
 * Normalised glasses input. The companion maps device-specific events (touchpad, capture
 * button, Neural Band) onto these.
 */
@Serializable
data class GlassesInput (
    @SerialName("device_event_id")
    val deviceEventID: String,

    val kind: GlassesInputKind
)

@Serializable
enum class GlassesInputKind(val value: String) {
    @SerialName("capture_button") CaptureButton("capture_button"),
    @SerialName("double_tap") DoubleTap("double_tap"),
    @SerialName("long_press") LongPress("long_press"),
    @SerialName("pinch") Pinch("pinch"),
    @SerialName("swipe_back") SwipeBack("swipe_back"),
    @SerialName("swipe_forward") SwipeForward("swipe_forward"),
    @SerialName("tap") Tap("tap");
}

/**
 * A test case a capability ships in its fixtures. The platform's fixture runner replays it
 * through the adapter (any backend) and the deterministic fast path; registration fails if
 * expected values differ or any spoken/card number is unverified.
 */
@Serializable
data class GoldenCase (
    @SerialName("capability_id")
    val capabilityID: String,

    @SerialName("case_id")
    val caseID: String,

    val description: String? = null,
    val expected: GoldenExpectation,
    val input: GoldenInput,
    val locale: String,

    /**
     * Path to a persona fixture, relative to the fixtures root.
     */
    val persona: String,

    val schema: GoldenCaseSchema,
    val tags: List<Tag>,
    val today: String
)

@Serializable
data class GoldenExpectation (
    @SerialName("data_mode")
    val dataMode: String? = null,

    val epistemic: Epistemic,
    val intent: String,

    @SerialName("proposal_kinds")
    val proposalKinds: List<String>? = null,

    @SerialName("speech_max_words")
    val speechMaxWords: Long? = null,

    /**
     * Concepts the spoken line must convey, as machine codes the evaluator maps to checks (e.g.
     * PRICE_IS_OBSERVED, ESTIMATE).
     */
    @SerialName("speech_must_mention")
    val speechMustMention: List<String>? = null,

    val status: DomainResponseStatus,
    val tools: List<String>,

    /**
     * Map of dotted path in the tool result (e.g. 'result.remaining_after.amount') to the exact
     * expected string.
     */
    val values: Map<String, String>
)

@Serializable
data class GoldenInput (
    @SerialName("capture_files")
    val captureFiles: List<String>? = null,

    val observations: List<Observation>? = null,
    val utterance: String? = null
)

@Serializable
enum class GoldenCaseSchema(val value: String) {
    @SerialName("platform.golden_case/v1") PlatformGoldenCaseV1("platform.golden_case/v1");
}

@Serializable
enum class Tag(val value: String) {
    @SerialName("capture") Capture("capture"),
    @SerialName("confirmation") Confirmation("confirmation"),
    @SerialName("degraded") Degraded("degraded"),
    @SerialName("golden") Golden("golden"),
    @SerialName("injection") Injection("injection"),
    @SerialName("locale") Locale("locale");
}

@Serializable
data class MissingData (
    val code: String,
    val detail: String? = null
)

@Serializable
enum class MissingDataCode(val value: String) {
    @SerialName("BALANCE_STALE") BalanceStale("BALANCE_STALE"),
    @SerialName("COMMITMENT_ESTIMATED") CommitmentEstimated("COMMITMENT_ESTIMATED"),
    @SerialName("HISTORY_LT_4_WEEKS") HistoryLt4_Weeks("HISTORY_LT_4_WEEKS"),
    @SerialName("INCOME_NOT_DETECTED") IncomeNotDetected("INCOME_NOT_DETECTED"),
    @SerialName("NO_BALANCE") NoBalance("NO_BALANCE"),
    @SerialName("PRICE_UNCERTAIN") PriceUncertain("PRICE_UNCERTAIN"),
    @SerialName("RECEIPT_UNMATCHED") ReceiptUnmatched("RECEIPT_UNMATCHED");
}

/**
 * Registry entry for a model the platform uses (ASR, TTS, router, OCR, embeddings, LLM),
 * wherever it runs. Swapping cloud for on-device means changing registry entries, not
 * contracts.
 */
@Serializable
data class ModelProvider (
    @SerialName("data_policy")
    val dataPolicy: DataPolicy,

    @SerialName("fallback_provider_id")
    val fallbackProviderID: String? = null,

    val kind: ModelProviderKind,
    val languages: List<String>,
    val location: Location,

    /**
     * Opaque to callers.
     */
    @SerialName("model_ref")
    val modelRef: String,

    @SerialName("provider_id")
    val providerID: String,

    val schema: ModelProviderSchema,
    val slo: ProviderSlo,
    val status: ModelProviderStatus,
    val version: String
)

@Serializable
data class DataPolicy (
    @SerialName("leaves_device")
    val leavesDevice: Boolean,

    val region: String? = null,
    val retention: String
)

@Serializable
enum class ModelProviderKind(val value: String) {
    @SerialName("asr") ASR("asr"),
    @SerialName("embedding") Embedding("embedding"),
    @SerialName("llm") Llm("llm"),
    @SerialName("router") Router("router"),
    @SerialName("tts") TTS("tts"),
    @SerialName("vision_ocr") VisionOcr("vision_ocr");
}

@Serializable
enum class Location(val value: String) {
    @SerialName("backend") Backend("backend"),
    @SerialName("cloud") Cloud("cloud"),
    @SerialName("device") Device("device");
}

@Serializable
enum class ModelProviderSchema(val value: String) {
    @SerialName("platform.model_provider/v1") PlatformModelProviderV1("platform.model_provider/v1");
}

@Serializable
data class ProviderSlo (
    @SerialName("p50_ms")
    val p50MS: Long,

    @SerialName("p95_ms")
    val p95MS: Long
)

@Serializable
enum class ModelProviderStatus(val value: String) {
    @SerialName("active") Active("active"),
    @SerialName("canary") Canary("canary"),
    @SerialName("disabled") Disabled("disabled"),
    @SerialName("shadow") Shadow("shadow");
}

@Serializable
data class SafeToSpendResult (
    @SerialName("days_left_in_week")
    val daysLeftInWeek: Long,

    @SerialName("days_to_income")
    val daysToIncome: Long,

    @SerialName("flexible_until_payday")
    val flexibleUntilPayday: Money,

    @SerialName("next_income_date")
    val nextIncomeDate: String? = null,

    @SerialName("safe_to_spend_week")
    val safeToSpendWeek: Money,

    val shortfall: Money? = null
)

/**
 * Envelope every deterministic tool returns. A successful non-educational result must carry
 * a resolvable calc_id so the adapter can verify every number shown or spoken.
 */
@Serializable
data class ToolResult (
    @SerialName("as_of")
    val asOf: String,

    val assumptions: List<String>,

    @SerialName("calc_id")
    val calcID: String? = null,

    val confidence: Risk? = null,

    @SerialName("data_mode")
    val dataMode: String? = null,

    val epistemic: Epistemic? = null,
    val error: ErrorInfo? = null,

    @SerialName("missing_data")
    val missingData: List<MissingData>,

    val ok: Boolean,

    /**
     * Tool-specific payload. Domains publish its schema in the tool descriptor (and may tighten
     * it in a domain overlay).
     */
    val result: JsonObject? = null,

    val schema: ResultEnvelope,
    val tool: String,

    @SerialName("tool_version")
    val toolVersion: String,

    val warnings: List<String>
)

/**
 * Created only by the companion from a real user input, then signed by the platform (L3).
 * Capabilities verify the signature and that payload_hash matches the payload they hold
 * before applying anything. Capabilities can never create one.
 */
@Serializable
data class UserConfirmation (
    val channel: ConfirmChannel,

    @SerialName("confirmation_id")
    val confirmationID: String,

    @SerialName("confirmed_at")
    val confirmedAt: String,

    val decision: Decision,
    val evidence: ConfirmationEvidence,

    @SerialName("payload_hash")
    val payloadHash: String,

    @SerialName("proposal_id")
    val proposalID: String,

    val schema: UserConfirmationSchema,

    @SerialName("session_id")
    val sessionID: String,

    /**
     * Compact JWS over the other fields, signed by the platform key.
     */
    val signature: String,

    @SerialName("user_ref")
    val userRef: String
)

@Serializable
enum class Decision(val value: String) {
    @SerialName("confirm") Confirm("confirm"),
    @SerialName("reject") Reject("reject");
}

@Serializable
data class ConfirmationEvidence (
    @SerialName("asr_confidence")
    val asrConfidence: Double? = null,

    val input: GlassesInput? = null,

    @SerialName("readback_played")
    val readbackPlayed: Boolean? = null,

    @SerialName("ui_event_id")
    val uiEventID: String? = null,

    val utterance: String? = null
)

@Serializable
enum class UserConfirmationSchema(val value: String) {
    @SerialName("platform.user_confirmation/v1") PlatformUserConfirmationV1("platform.user_confirmation/v1");
}

/**
 * One user turn from the companion: an utterance (transcribed on the phone) and/or a
 * glasses input. The platform only recognises platform intents (confirm, cancel, ...);
 * domain intent recognition belongs to the capability.
 */
@Serializable
data class VoiceIntent (
    @SerialName("attached_capture_ids")
    val attachedCaptureIDS: List<String>,

    @SerialName("capability_hint")
    val capabilityHint: String? = null,

    val context: TurnContext,

    @SerialName("device_capabilities")
    val deviceCapabilities: List<DeviceCapability>,

    val input: GlassesInput? = null,
    val invocation: Invocation,
    val output: OutputPreferences,

    @SerialName("platform_intent")
    val platformIntent: PlatformIntent? = null,

    val schema: VoiceIntentSchema,

    @SerialName("session_id")
    val sessionID: String,

    val transcript: Transcript? = null,

    @SerialName("turn_id")
    val turnID: String,

    @SerialName("user_ref")
    val userRef: String
)

@Serializable
data class TurnContext (
    @SerialName("active_capability")
    val activeCapability: String? = null,

    @SerialName("conversation_ref")
    val conversationRef: String,

    @SerialName("pending_proposal_id")
    val pendingProposalID: String? = null,

    @SerialName("recent_turns")
    val recentTurns: List<ConversationTurn>
)

@Serializable
enum class Invocation(val value: String) {
    @SerialName("glasses_input") GlassesInput("glasses_input"),
    @SerialName("hey_meta") HeyMeta("hey_meta"),
    @SerialName("phone_push_to_talk") PhonePushToTalk("phone_push_to_talk"),
    @SerialName("typed") Typed("typed");
}

@Serializable
data class OutputPreferences (
    /**
     * When true, spoken output must not contain amounts; details go to the phone.
     */
    @SerialName("discreet_mode")
    val discreetMode: Boolean,

    val display: OutputDisplay,
    val speech: Boolean
)

@Serializable
enum class PlatformIntent(val value: String) {
    @SerialName("cancel") Cancel("cancel"),
    @SerialName("confirm") Confirm("confirm"),
    @SerialName("next_card") NextCard("next_card"),
    @SerialName("reject") Reject("reject"),
    @SerialName("repeat") Repeat("repeat"),
    @SerialName("show_on_phone") ShowOnPhone("show_on_phone"),
    @SerialName("stop") Stop("stop");
}

@Serializable
enum class VoiceIntentSchema(val value: String) {
    @SerialName("platform.voice_intent/v1") PlatformVoiceIntentV1("platform.voice_intent/v1");
}

@Serializable
data class Transcript (
    @SerialName("asr_provider")
    val asrProvider: String? = null,

    val confidence: Double? = null,
    val lang: String,
    val text: String
)
