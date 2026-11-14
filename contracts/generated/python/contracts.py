from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional, Any, List, Union, TypeVar, Callable, Type, cast
from datetime import datetime
import dateutil.parser


T = TypeVar("T")
EnumT = TypeVar("EnumT", bound=Enum)


def from_str(x: Any) -> str:
    assert isinstance(x, str)
    return x


def from_dict(f: Callable[[Any], T], x: Any) -> Dict[str, T]:
    assert isinstance(x, dict)
    return { k: f(v) for (k, v) in x.items() }


def from_none(x: Any) -> Any:
    assert x is None
    return x


def from_union(fs, x):
    for f in fs:
        try:
            return f(x)
        except:
            pass
    assert False


def from_list(f: Callable[[Any], T], x: Any) -> List[T]:
    assert isinstance(x, list)
    return [f(y) for y in x]


def from_datetime(x: Any) -> datetime:
    return dateutil.parser.parse(x)


def from_bool(x: Any) -> bool:
    assert isinstance(x, bool)
    return x


def from_int(x: Any) -> int:
    assert isinstance(x, int) and not isinstance(x, bool)
    return x


def to_enum(c: Type[EnumT], x: Any) -> EnumT:
    assert isinstance(x, c)
    return x.value


def to_class(c: Type[T], x: Any) -> dict:
    assert isinstance(x, c)
    return cast(Any, x).to_dict()


def from_float(x: Any) -> float:
    assert isinstance(x, (float, int)) and not isinstance(x, bool)
    return float(x)


def to_float(x: Any) -> float:
    assert isinstance(x, (int, float))
    return x


class ConfirmChannel(Enum):
    """How a user may confirm a proposal. voice_readback and glasses_gesture are allowed only
    for low-risk, reversible actions after the summary has been read back.
    """
    GLASSES_GESTURE = "glasses_gesture"
    PHONE_BIOMETRIC = "phone_biometric"
    PHONE_TAP = "phone_tap"
    VOICE_READBACK = "voice_readback"


@dataclass
class ProposalDetail:
    after: str
    label: Dict[str, str]
    before: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ProposalDetail':
        assert isinstance(obj, dict)
        after = from_str(obj.get("after"))
        label = from_dict(from_str, obj.get("label"))
        before = from_union([from_str, from_none], obj.get("before"))
        return ProposalDetail(after, label, before)

    def to_dict(self) -> dict:
        result: dict = {}
        result["after"] = from_str(self.after)
        result["label"] = from_dict(from_str, self.label)
        if self.before is not None:
            result["before"] = from_union([from_str, from_none], self.before)
        return result


class Risk(Enum):
    """Deterministic data-coverage confidence, not a model self-report."""

    HIGH = "high"
    LOW = "low"
    MEDIUM = "medium"


class ActionProposalSchema(Enum):
    PLATFORM_ACTION_PROPOSAL_V1 = "platform.action_proposal/v1"


@dataclass
class ProposalSummary:
    spoken: Dict[str, str]
    text: Dict[str, str]

    @staticmethod
    def from_dict(obj: Any) -> 'ProposalSummary':
        assert isinstance(obj, dict)
        spoken = from_dict(from_str, obj.get("spoken"))
        text = from_dict(from_str, obj.get("text"))
        return ProposalSummary(spoken, text)

    def to_dict(self) -> dict:
        result: dict = {}
        result["spoken"] = from_dict(from_str, self.spoken)
        result["text"] = from_dict(from_str, self.text)
        return result


@dataclass
class ActionProposal:
    """A persistent change a capability proposes. The capability keeps the payload; the platform
    keeps only its hash and owns the confirmation. Nothing is applied without a signed
    UserConfirmation.
    """
    capability_id: str
    confirm_channels: List[ConfirmChannel]
    details: List[ProposalDetail]
    expires_at: datetime
    kind: str
    payload_hash: str
    proposal_id: str
    reversible: bool
    risk: Risk
    schema: ActionProposalSchema
    summary: ProposalSummary
    undo_window_s: Optional[int] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ActionProposal':
        assert isinstance(obj, dict)
        capability_id = from_str(obj.get("capability_id"))
        confirm_channels = from_list(ConfirmChannel, obj.get("confirm_channels"))
        details = from_list(ProposalDetail.from_dict, obj.get("details"))
        expires_at = from_datetime(obj.get("expires_at"))
        kind = from_str(obj.get("kind"))
        payload_hash = from_str(obj.get("payload_hash"))
        proposal_id = from_str(obj.get("proposal_id"))
        reversible = from_bool(obj.get("reversible"))
        risk = Risk(obj.get("risk"))
        schema = ActionProposalSchema(obj.get("schema"))
        summary = ProposalSummary.from_dict(obj.get("summary"))
        undo_window_s = from_union([from_int, from_none], obj.get("undo_window_s"))
        return ActionProposal(capability_id, confirm_channels, details, expires_at, kind, payload_hash, proposal_id, reversible, risk, schema, summary, undo_window_s)

    def to_dict(self) -> dict:
        result: dict = {}
        result["capability_id"] = from_str(self.capability_id)
        result["confirm_channels"] = from_list(lambda x: to_enum(ConfirmChannel, x), self.confirm_channels)
        result["details"] = from_list(lambda x: to_class(ProposalDetail, x), self.details)
        result["expires_at"] = self.expires_at.isoformat()
        result["kind"] = from_str(self.kind)
        result["payload_hash"] = from_str(self.payload_hash)
        result["proposal_id"] = from_str(self.proposal_id)
        result["reversible"] = from_bool(self.reversible)
        result["risk"] = to_enum(Risk, self.risk)
        result["schema"] = to_enum(ActionProposalSchema, self.schema)
        result["summary"] = to_class(ProposalSummary, self.summary)
        if self.undo_window_s is not None:
            result["undo_window_s"] = from_union([from_int, from_none], self.undo_window_s)
        return result


class SourceKind(Enum):
    CALCULATION = "calculation"
    DOCUMENT = "document"
    OBSERVATION = "observation"


@dataclass
class CardSource:
    kind: SourceKind
    ref: str
    title: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'CardSource':
        assert isinstance(obj, dict)
        kind = SourceKind(obj.get("kind"))
        ref = from_str(obj.get("ref"))
        title = from_union([from_str, from_none], obj.get("title"))
        return CardSource(kind, ref, title)

    def to_dict(self) -> dict:
        result: dict = {}
        result["kind"] = to_enum(SourceKind, self.kind)
        result["ref"] = from_str(self.ref)
        if self.title is not None:
            result["title"] = from_union([from_str, from_none], self.title)
        return result


@dataclass
class CardBasis:
    as_of: datetime
    calc_ids: List[str]
    observation_ids: Optional[List[str]] = None
    sources: Optional[List[CardSource]] = None

    @staticmethod
    def from_dict(obj: Any) -> 'CardBasis':
        assert isinstance(obj, dict)
        as_of = from_datetime(obj.get("as_of"))
        calc_ids = from_list(from_str, obj.get("calc_ids"))
        observation_ids = from_union([lambda x: from_list(from_str, x), from_none], obj.get("observation_ids"))
        sources = from_union([lambda x: from_list(CardSource.from_dict, x), from_none], obj.get("sources"))
        return CardBasis(as_of, calc_ids, observation_ids, sources)

    def to_dict(self) -> dict:
        result: dict = {}
        result["as_of"] = self.as_of.isoformat()
        result["calc_ids"] = from_list(from_str, self.calc_ids)
        if self.observation_ids is not None:
            result["observation_ids"] = from_union([lambda x: from_list(from_str, x), from_none], self.observation_ids)
        if self.sources is not None:
            result["sources"] = from_union([lambda x: from_list(lambda x: to_class(CardSource, x), x), from_none], self.sources)
        return result


class Epistemic(Enum):
    """What kind of claim this is. fact = read from a record; calculated = deterministic from
    facts; estimate = deterministic but depends on assumptions or forecasts; educational =
    general content, not about the user's data; observed = perceived from a camera capture
    and may be misread.
    """
    CALCULATED = "calculated"
    EDUCATIONAL = "educational"
    ESTIMATE = "estimate"
    FACT = "fact"
    OBSERVED = "observed"


class Currency(Enum):
    EUR = "EUR"


@dataclass
class Money:
    amount: str
    currency: Currency

    @staticmethod
    def from_dict(obj: Any) -> 'Money':
        assert isinstance(obj, dict)
        amount = from_str(obj.get("amount"))
        currency = Currency(obj.get("currency"))
        return Money(amount, currency)

    def to_dict(self) -> dict:
        result: dict = {}
        result["amount"] = from_str(self.amount)
        result["currency"] = to_enum(Currency, self.currency)
        return result


@dataclass
class CardValue:
    epistemic: Epistemic
    label: Dict[str, str]
    value: Union[Money, str]

    @staticmethod
    def from_dict(obj: Any) -> 'CardValue':
        assert isinstance(obj, dict)
        epistemic = Epistemic(obj.get("epistemic"))
        label = from_dict(from_str, obj.get("label"))
        value = from_union([Money.from_dict, from_str], obj.get("value"))
        return CardValue(epistemic, label, value)

    def to_dict(self) -> dict:
        result: dict = {}
        result["epistemic"] = to_enum(Epistemic, self.epistemic)
        result["label"] = from_dict(from_str, self.label)
        result["value"] = from_union([lambda x: to_class(Money, x), from_str], self.value)
        return result


@dataclass
class RenderHints:
    glasses_display_lines: Optional[List[str]] = None
    sensitive: Optional[bool] = None
    voice_summary: Optional[Dict[str, str]] = None

    @staticmethod
    def from_dict(obj: Any) -> 'RenderHints':
        assert isinstance(obj, dict)
        glasses_display_lines = from_union([lambda x: from_list(from_str, x), from_none], obj.get("glasses_display_lines"))
        sensitive = from_union([from_bool, from_none], obj.get("sensitive"))
        voice_summary = from_union([lambda x: from_dict(from_str, x), from_none], obj.get("voice_summary"))
        return RenderHints(glasses_display_lines, sensitive, voice_summary)

    def to_dict(self) -> dict:
        result: dict = {}
        if self.glasses_display_lines is not None:
            result["glasses_display_lines"] = from_union([lambda x: from_list(from_str, x), from_none], self.glasses_display_lines)
        if self.sensitive is not None:
            result["sensitive"] = from_union([from_bool, from_none], self.sensitive)
        if self.voice_summary is not None:
            result["voice_summary"] = from_union([lambda x: from_dict(from_str, x), from_none], self.voice_summary)
        return result


@dataclass
class CardRow:
    epistemic: Epistemic
    label: Dict[str, str]
    value: Union[Money, str]
    note: Optional[Dict[str, str]] = None

    @staticmethod
    def from_dict(obj: Any) -> 'CardRow':
        assert isinstance(obj, dict)
        epistemic = Epistemic(obj.get("epistemic"))
        label = from_dict(from_str, obj.get("label"))
        value = from_union([Money.from_dict, from_str], obj.get("value"))
        note = from_union([lambda x: from_dict(from_str, x), from_none], obj.get("note"))
        return CardRow(epistemic, label, value, note)

    def to_dict(self) -> dict:
        result: dict = {}
        result["epistemic"] = to_enum(Epistemic, self.epistemic)
        result["label"] = from_dict(from_str, self.label)
        result["value"] = from_union([lambda x: to_class(Money, x), from_str], self.value)
        if self.note is not None:
            result["note"] = from_union([lambda x: from_dict(from_str, x), from_none], self.note)
        return result


class InsightCardSchema(Enum):
    PLATFORM_INSIGHT_CARD_V1 = "platform.insight_card/v1"


class InsightCardType(Enum):
    BREAKDOWN = "breakdown"
    COMPARISON = "comparison"
    CONSENT = "consent"
    EXPLANATION = "explanation"
    LIST = "list"
    METRIC = "metric"


@dataclass
class InsightCard:
    """Schema-driven card rendered generically by the phone (and optionally the glasses
    display). Every value carries an epistemic label; calculated and estimated cards must
    cite calc_ids, observed cards must cite observations, educational cards must cite sources.
    """
    assumptions: List[Dict[str, str]]
    basis: CardBasis
    capability_id: str
    card_id: str
    epistemic: Epistemic
    missing_data: List[Dict[str, str]]
    schema: InsightCardSchema
    title: Dict[str, str]
    type: InsightCardType
    body: Optional[Dict[str, str]] = None
    data_mode: Optional[str] = None
    primary: Optional[CardValue] = None
    proposal_ids: Optional[List[str]] = None
    render_hints: Optional[RenderHints] = None
    rows: Optional[List[CardRow]] = None

    @staticmethod
    def from_dict(obj: Any) -> 'InsightCard':
        assert isinstance(obj, dict)
        assumptions = from_list(lambda x: from_dict(from_str, x), obj.get("assumptions"))
        basis = CardBasis.from_dict(obj.get("basis"))
        capability_id = from_str(obj.get("capability_id"))
        card_id = from_str(obj.get("card_id"))
        epistemic = Epistemic(obj.get("epistemic"))
        missing_data = from_list(lambda x: from_dict(from_str, x), obj.get("missing_data"))
        schema = InsightCardSchema(obj.get("schema"))
        title = from_dict(from_str, obj.get("title"))
        type = InsightCardType(obj.get("type"))
        body = from_union([lambda x: from_dict(from_str, x), from_none], obj.get("body"))
        data_mode = from_union([from_str, from_none], obj.get("data_mode"))
        primary = from_union([CardValue.from_dict, from_none], obj.get("primary"))
        proposal_ids = from_union([lambda x: from_list(from_str, x), from_none], obj.get("proposal_ids"))
        render_hints = from_union([RenderHints.from_dict, from_none], obj.get("render_hints"))
        rows = from_union([lambda x: from_list(CardRow.from_dict, x), from_none], obj.get("rows"))
        return InsightCard(assumptions, basis, capability_id, card_id, epistemic, missing_data, schema, title, type, body, data_mode, primary, proposal_ids, render_hints, rows)

    def to_dict(self) -> dict:
        result: dict = {}
        result["assumptions"] = from_list(lambda x: from_dict(from_str, x), self.assumptions)
        result["basis"] = to_class(CardBasis, self.basis)
        result["capability_id"] = from_str(self.capability_id)
        result["card_id"] = from_str(self.card_id)
        result["epistemic"] = to_enum(Epistemic, self.epistemic)
        result["missing_data"] = from_list(lambda x: from_dict(from_str, x), self.missing_data)
        result["schema"] = to_enum(InsightCardSchema, self.schema)
        result["title"] = from_dict(from_str, self.title)
        result["type"] = to_enum(InsightCardType, self.type)
        if self.body is not None:
            result["body"] = from_union([lambda x: from_dict(from_str, x), from_none], self.body)
        if self.data_mode is not None:
            result["data_mode"] = from_union([from_str, from_none], self.data_mode)
        if self.primary is not None:
            result["primary"] = from_union([lambda x: to_class(CardValue, x), from_none], self.primary)
        if self.proposal_ids is not None:
            result["proposal_ids"] = from_union([lambda x: from_list(from_str, x), from_none], self.proposal_ids)
        if self.render_hints is not None:
            result["render_hints"] = from_union([lambda x: to_class(RenderHints, x), from_none], self.render_hints)
        if self.rows is not None:
            result["rows"] = from_union([lambda x: from_list(lambda x: to_class(CardRow, x), x), from_none], self.rows)
        return result


@dataclass
class ErrorInfo:
    code: str
    message: str
    retryable: bool

    @staticmethod
    def from_dict(obj: Any) -> 'ErrorInfo':
        assert isinstance(obj, dict)
        code = from_str(obj.get("code"))
        message = from_str(obj.get("message"))
        retryable = from_bool(obj.get("retryable"))
        return ErrorInfo(code, message, retryable)

    def to_dict(self) -> dict:
        result: dict = {}
        result["code"] = from_str(self.code)
        result["message"] = from_str(self.message)
        result["retryable"] = from_bool(self.retryable)
        return result


class ActionResultSchema(Enum):
    PLATFORM_ACTION_RESULT_V1 = "platform.action_result/v1"


class ActionResultStatus(Enum):
    APPLIED = "applied"
    EXPIRED = "expired"
    FAILED = "failed"
    HASH_MISMATCH = "hash_mismatch"
    REJECTED_BY_USER = "rejected_by_user"
    SIGNATURE_INVALID = "signature_invalid"


@dataclass
class ActionResult:
    """What a capability returns after receiving a UserConfirmation."""

    confirmation_id: str
    proposal_id: str
    schema: ActionResultSchema
    status: ActionResultStatus
    applied_at: Optional[datetime] = None
    card: Optional[InsightCard] = None
    error: Optional[ErrorInfo] = None
    undo_expires_at: Optional[datetime] = None
    undo_token: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ActionResult':
        assert isinstance(obj, dict)
        confirmation_id = from_str(obj.get("confirmation_id"))
        proposal_id = from_str(obj.get("proposal_id"))
        schema = ActionResultSchema(obj.get("schema"))
        status = ActionResultStatus(obj.get("status"))
        applied_at = from_union([from_datetime, from_none], obj.get("applied_at"))
        card = from_union([InsightCard.from_dict, from_none], obj.get("card"))
        error = from_union([ErrorInfo.from_dict, from_none], obj.get("error"))
        undo_expires_at = from_union([from_datetime, from_none], obj.get("undo_expires_at"))
        undo_token = from_union([from_str, from_none], obj.get("undo_token"))
        return ActionResult(confirmation_id, proposal_id, schema, status, applied_at, card, error, undo_expires_at, undo_token)

    def to_dict(self) -> dict:
        result: dict = {}
        result["confirmation_id"] = from_str(self.confirmation_id)
        result["proposal_id"] = from_str(self.proposal_id)
        result["schema"] = to_enum(ActionResultSchema, self.schema)
        result["status"] = to_enum(ActionResultStatus, self.status)
        if self.applied_at is not None:
            result["applied_at"] = from_union([lambda x: x.isoformat(), from_none], self.applied_at)
        if self.card is not None:
            result["card"] = from_union([lambda x: to_class(InsightCard, x), from_none], self.card)
        if self.error is not None:
            result["error"] = from_union([lambda x: to_class(ErrorInfo, x), from_none], self.error)
        if self.undo_expires_at is not None:
            result["undo_expires_at"] = from_union([lambda x: x.isoformat(), from_none], self.undo_expires_at)
        if self.undo_token is not None:
            result["undo_token"] = from_union([from_str, from_none], self.undo_token)
        return result


class PriceSource(Enum):
    """Where the amount came from. 'observation' = read from a capture; the answer must say the
    price was read, not known.
    """
    BASKET = "basket"
    OBSERVATION = "observation"
    STATED_AMOUNT = "stated_amount"


class Verdict(Enum):
    EXCEEDS = "EXCEEDS"
    FITS = "FITS"
    TIGHT = "TIGHT"
    UNKNOWN = "UNKNOWN"


@dataclass
class AffordabilityResult:
    amount_checked: Money
    price_source: PriceSource
    """Where the amount came from. 'observation' = read from a capture; the answer must say the
    price was read, not known.
    """
    verdict: Verdict
    category: Optional[str] = None
    difference_vs_usual: Optional[Money] = None
    observation_id: Optional[str] = None
    remaining_after: Optional[Money] = None
    safe_to_spend_week: Optional[Money] = None
    usual_week_median: Optional[Money] = None

    @staticmethod
    def from_dict(obj: Any) -> 'AffordabilityResult':
        assert isinstance(obj, dict)
        amount_checked = Money.from_dict(obj.get("amount_checked"))
        price_source = PriceSource(obj.get("price_source"))
        verdict = Verdict(obj.get("verdict"))
        category = from_union([from_str, from_none], obj.get("category"))
        difference_vs_usual = from_union([Money.from_dict, from_none], obj.get("difference_vs_usual"))
        observation_id = from_union([from_str, from_none], obj.get("observation_id"))
        remaining_after = from_union([Money.from_dict, from_none], obj.get("remaining_after"))
        safe_to_spend_week = from_union([Money.from_dict, from_none], obj.get("safe_to_spend_week"))
        usual_week_median = from_union([Money.from_dict, from_none], obj.get("usual_week_median"))
        return AffordabilityResult(amount_checked, price_source, verdict, category, difference_vs_usual, observation_id, remaining_after, safe_to_spend_week, usual_week_median)

    def to_dict(self) -> dict:
        result: dict = {}
        result["amount_checked"] = to_class(Money, self.amount_checked)
        result["price_source"] = to_enum(PriceSource, self.price_source)
        result["verdict"] = to_enum(Verdict, self.verdict)
        if self.category is not None:
            result["category"] = from_union([from_str, from_none], self.category)
        if self.difference_vs_usual is not None:
            result["difference_vs_usual"] = from_union([lambda x: to_class(Money, x), from_none], self.difference_vs_usual)
        if self.observation_id is not None:
            result["observation_id"] = from_union([from_str, from_none], self.observation_id)
        result["remaining_after"] = from_union([lambda x: to_class(Money, x), from_none], self.remaining_after)
        result["safe_to_spend_week"] = from_union([lambda x: to_class(Money, x), from_none], self.safe_to_spend_week)
        if self.usual_week_median is not None:
            result["usual_week_median"] = from_union([lambda x: to_class(Money, x), from_none], self.usual_week_median)
        return result


class MediaKind(Enum):
    IMAGE = "image"


class MIME(Enum):
    IMAGE_JPEG = "image/jpeg"
    IMAGE_PNG = "image/png"


@dataclass
class CaptureMedia:
    expires_at: datetime
    height: int
    kind: MediaKind
    mime: MIME
    sha256: str
    uri: str
    width: int

    @staticmethod
    def from_dict(obj: Any) -> 'CaptureMedia':
        assert isinstance(obj, dict)
        expires_at = from_datetime(obj.get("expires_at"))
        height = from_int(obj.get("height"))
        kind = MediaKind(obj.get("kind"))
        mime = MIME(obj.get("mime"))
        sha256 = from_str(obj.get("sha256"))
        uri = from_str(obj.get("uri"))
        width = from_int(obj.get("width"))
        return CaptureMedia(expires_at, height, kind, mime, sha256, uri, width)

    def to_dict(self) -> dict:
        result: dict = {}
        result["expires_at"] = self.expires_at.isoformat()
        result["height"] = from_int(self.height)
        result["kind"] = to_enum(MediaKind, self.kind)
        result["mime"] = to_enum(MIME, self.mime)
        result["sha256"] = from_str(self.sha256)
        result["uri"] = from_str(self.uri)
        result["width"] = from_int(self.width)
        return result


class Minimisation(Enum):
    CROPPED = "cropped"
    DOWNSCALED = "downscaled"
    EXIF_STRIPPED = "exif_stripped"
    FACES_BLURRED = "faces_blurred"
    GPS_REMOVED = "gps_removed"
    ORIENTATION_APPLIED = "orientation_applied"


class ContextCaptureSchema(Enum):
    PLATFORM_CONTEXT_CAPTURE_V1 = "platform.context_capture/v1"


class Source(Enum):
    GLASSES_PHOTO = "glasses_photo"
    GLASSES_STREAM_FRAME = "glasses_stream_frame"
    PHONE_CAMERA = "phone_camera"
    PHONE_UPLOAD = "phone_upload"


class Trigger(Enum):
    GLASSES_INPUT = "glasses_input"
    PHONE_TAP = "phone_tap"
    VOICE_COMMAND = "voice_command"


@dataclass
class ContextCapture:
    """A user-initiated photo from the glasses or phone, minimised on the phone before upload.
    Capabilities receive raw media only if their manifest declares delivery 'media' for this
    purpose; otherwise they receive Observations.
    """
    capture_id: str
    captured_at: datetime
    consent_grant_id: str
    locale: str
    media: CaptureMedia
    minimisation: List[Minimisation]
    """What the phone did before upload. EXIF stripping is mandatory. orientation_applied = the
    image was rotated upright from its EXIF orientation before EXIF was stripped (DEC-006).
    """
    purpose: str
    """A purpose declared in some capability manifest's capture_purposes, e.g. 'price_label',
    'receipt'.
    """
    schema: ContextCaptureSchema
    session_id: str
    source: Source
    trigger: Trigger
    user_ref: str

    @staticmethod
    def from_dict(obj: Any) -> 'ContextCapture':
        assert isinstance(obj, dict)
        capture_id = from_str(obj.get("capture_id"))
        captured_at = from_datetime(obj.get("captured_at"))
        consent_grant_id = from_str(obj.get("consent_grant_id"))
        locale = from_str(obj.get("locale"))
        media = CaptureMedia.from_dict(obj.get("media"))
        minimisation = from_list(Minimisation, obj.get("minimisation"))
        purpose = from_str(obj.get("purpose"))
        schema = ContextCaptureSchema(obj.get("schema"))
        session_id = from_str(obj.get("session_id"))
        source = Source(obj.get("source"))
        trigger = Trigger(obj.get("trigger"))
        user_ref = from_str(obj.get("user_ref"))
        return ContextCapture(capture_id, captured_at, consent_grant_id, locale, media, minimisation, purpose, schema, session_id, source, trigger, user_ref)

    def to_dict(self) -> dict:
        result: dict = {}
        result["capture_id"] = from_str(self.capture_id)
        result["captured_at"] = self.captured_at.isoformat()
        result["consent_grant_id"] = from_str(self.consent_grant_id)
        result["locale"] = from_str(self.locale)
        result["media"] = to_class(CaptureMedia, self.media)
        result["minimisation"] = from_list(lambda x: to_enum(Minimisation, x), self.minimisation)
        result["purpose"] = from_str(self.purpose)
        result["schema"] = to_enum(ContextCaptureSchema, self.schema)
        result["session_id"] = from_str(self.session_id)
        result["source"] = to_enum(Source, self.source)
        result["trigger"] = to_enum(Trigger, self.trigger)
        result["user_ref"] = from_str(self.user_ref)
        return result


class Role(Enum):
    ASSISTANT = "assistant"
    USER = "user"


@dataclass
class ConversationTurn:
    role: Role
    text: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConversationTurn':
        assert isinstance(obj, dict)
        role = Role(obj.get("role"))
        text = from_str(obj.get("text"))
        return ConversationTurn(role, text)

    def to_dict(self) -> dict:
        result: dict = {}
        result["role"] = to_enum(Role, self.role)
        result["text"] = from_str(self.text)
        return result


class DataMode(Enum):
    """balance = actual balance + income date; budget = detected income and bills, no balance;
    pace = spending history only (no affordability yes/no allowed).
    """
    BALANCE = "balance"
    BUDGET = "budget"
    PACE = "pace"


class ResultEnvelope(Enum):
    PLATFORM_TOOL_RESULT_V1 = "platform.tool_result/v1"


class DeterministicToolSchema(Enum):
    PLATFORM_TOOL_DESCRIPTOR_V1 = "platform.tool_descriptor/v1"


class SideEffects(Enum):
    """Tools never write persistent state directly. 'proposal_only' tools may create an
    ActionProposal.
    """
    NONE = "none"
    PROPOSAL_ONLY = "proposal_only"


@dataclass
class DeterministicTool:
    """Descriptor every domain publishes for its deterministic functions. The agent, the
    deterministic fast path and the verifier all use the same tools, so each tool can be
    tested without any model.
    """
    description: str
    deterministic: bool
    golden_fixtures: str
    input_schema: Dict[str, Any]
    """JSON Schema for the tool input."""

    name: str
    output_schema: Dict[str, Any]
    """JSON Schema for ToolResult.result."""

    owner: str
    result_envelope: ResultEnvelope
    schema: DeterministicToolSchema
    side_effects: SideEffects
    """Tools never write persistent state directly. 'proposal_only' tools may create an
    ActionProposal.
    """
    version: str

    @staticmethod
    def from_dict(obj: Any) -> 'DeterministicTool':
        assert isinstance(obj, dict)
        description = from_str(obj.get("description"))
        deterministic = from_bool(obj.get("deterministic"))
        golden_fixtures = from_str(obj.get("golden_fixtures"))
        input_schema = from_dict(lambda x: x, obj.get("input_schema"))
        name = from_str(obj.get("name"))
        output_schema = from_dict(lambda x: x, obj.get("output_schema"))
        owner = from_str(obj.get("owner"))
        result_envelope = ResultEnvelope(obj.get("result_envelope"))
        schema = DeterministicToolSchema(obj.get("schema"))
        side_effects = SideEffects(obj.get("side_effects"))
        version = from_str(obj.get("version"))
        return DeterministicTool(description, deterministic, golden_fixtures, input_schema, name, output_schema, owner, result_envelope, schema, side_effects, version)

    def to_dict(self) -> dict:
        result: dict = {}
        result["description"] = from_str(self.description)
        result["deterministic"] = from_bool(self.deterministic)
        result["golden_fixtures"] = from_str(self.golden_fixtures)
        result["input_schema"] = from_dict(lambda x: x, self.input_schema)
        result["name"] = from_str(self.name)
        result["output_schema"] = from_dict(lambda x: x, self.output_schema)
        result["owner"] = from_str(self.owner)
        result["result_envelope"] = to_enum(ResultEnvelope, self.result_envelope)
        result["schema"] = to_enum(DeterministicToolSchema, self.schema)
        result["side_effects"] = to_enum(SideEffects, self.side_effects)
        result["version"] = from_str(self.version)
        return result


class DeviceCapability(Enum):
    """Capabilities negotiated with the connected glasses at session start. Availability varies
    by device and SDK version.
    """
    AUDIO_STREAM = "audio_stream"
    CAMERA_STREAM = "camera_stream"
    DISPLAY = "display"
    IMU = "imu"
    INPUTS = "inputs"
    ON_DEVICE_SPEECH = "on_device_speech"
    PHOTO_CAPTURE = "photo_capture"
    VOICE_INVOCATION = "voice_invocation"


class AudioRoute(Enum):
    """glasses_hfp = two-way narrow-band mono (mic + speech out); glasses_a2dp = output only;
    phone = phone mic/speaker; none = no usable audio.
    """
    GLASSES_A2_DP = "glasses_a2dp"
    GLASSES_HFP = "glasses_hfp"
    NONE = "none"
    PHONE = "phone"


class Permission(Enum):
    """Camera permission is granted in the Meta AI app, not through an OS dialog."""

    DENIED = "denied"
    GRANTED_ALWAYS = "granted_always"
    GRANTED_ONCE = "granted_once"
    UNKNOWN = "unknown"


class Stream(Enum):
    PAUSED = "paused"
    STARTING = "starting"
    STOPPED = "stopped"
    STOPPING = "stopping"
    STREAMING = "streaming"


@dataclass
class CameraState:
    permission: Permission
    """Camera permission is granted in the Meta AI app, not through an OS dialog."""

    stream: Stream

    @staticmethod
    def from_dict(obj: Any) -> 'CameraState':
        assert isinstance(obj, dict)
        permission = Permission(obj.get("permission"))
        stream = Stream(obj.get("stream"))
        return CameraState(permission, stream)

    def to_dict(self) -> dict:
        result: dict = {}
        result["permission"] = to_enum(Permission, self.permission)
        result["stream"] = to_enum(Stream, self.stream)
        return result


class DegradedReason(Enum):
    APP_BACKGROUNDED = "APP_BACKGROUNDED"
    BATTERY_LOW = "BATTERY_LOW"
    BLUETOOTH_ROUTE_UNAVAILABLE = "BLUETOOTH_ROUTE_UNAVAILABLE"
    CAMERA_PERMISSION_DENIED = "CAMERA_PERMISSION_DENIED"
    DEVICE_UPDATE_REQUIRED = "DEVICE_UPDATE_REQUIRED"
    DOFFED = "DOFFED"
    HINGES_CLOSED = "HINGES_CLOSED"
    META_AI_APP_MISSING = "META_AI_APP_MISSING"
    MIC_PERMISSION_DENIED = "MIC_PERMISSION_DENIED"
    NOT_REGISTERED = "NOT_REGISTERED"
    NO_DEVICE = "NO_DEVICE"
    SDK_UPDATE_REQUIRED = "SDK_UPDATE_REQUIRED"
    SESSION_STOPPED = "SESSION_STOPPED"
    THERMAL = "THERMAL"
    USER_CHOSE_PHONE = "USER_CHOSE_PHONE"


class DeviceAvailability(Enum):
    """Whether an eligible device is selected. update_required = the glasses need a firmware or
    on-glasses app update.
    """
    AVAILABLE = "available"
    NONE = "none"
    UPDATE_REQUIRED = "update_required"


class DeviceSession(Enum):
    """Device session state. paused is device-driven and carries no reason; stopped is terminal
    and a new session must be created.
    """
    IDLE = "idle"
    PAUSED = "paused"
    STARTED = "started"
    STARTING = "starting"
    STOPPED = "stopped"
    STOPPING = "stopping"


class ExperimentalFeature(Enum):
    DISPLAY = "display"
    INPUTS = "inputs"
    MOTION = "motion"
    SPEECH = "speech"
    STANDALONE_PHOTO = "standalone_photo"
    STREAM_AUDIO = "stream_audio"
    VOICE_INVOCATION = "voice_invocation"


class GlassesBackend(Enum):
    """Which implementation GlassesBridge is running. Always explicit: a mock must never stand
    in silently for real hardware.
    """
    DAT = "dat"
    MOCK = "mock"
    NONE = "none"


class Interaction(Enum):
    """The platform's conversation state, independent of the device lifecycles above."""

    AWAITING_CONFIRMATION = "awaiting_confirmation"
    CAPTURE_PENDING = "capture_pending"
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"


class Mode(Enum):
    """glasses = the glasses are usable for this turn; phone_only = every interaction continues
    on the phone.
    """
    GLASSES = "glasses"
    PHONE_ONLY = "phone_only"


class Registration(Enum):
    """Registration of this app with the Meta AI app."""

    NOT_REGISTERED = "not_registered"
    REGISTERED = "registered"
    REGISTERING = "registering"
    UNAVAILABLE = "unavailable"


class DeviceSessionStateSchema(Enum):
    PLATFORM_DEVICE_SESSION_STATE_V1 = "platform.device_session_state/v1"


@dataclass
class DeviceSessionState:
    """Snapshot of the glasses link as the companion sees it, published on every change (seq
    increases monotonically). Four independent lifecycles are reported separately rather than
    as one state chain, because the Meta Wearables Device Access Toolkit changes them
    independently: registration with the Meta AI app, the device session, the camera stream,
    and the platform's own conversation state. Values are platform names; GlassesBridge maps
    SDK enums onto them, so SDK changes never reach this contract. See
    docs/ARCHITECTURE_DECISION_LOG.md DEC-005.
    """
    audio_route: AudioRoute
    """glasses_hfp = two-way narrow-band mono (mic + speech out); glasses_a2dp = output only;
    phone = phone mic/speaker; none = no usable audio.
    """
    camera: CameraState
    degraded_reasons: List[DegradedReason]
    """Why the experience is reduced. Empty when everything requested is available."""

    device_availability: DeviceAvailability
    """Whether an eligible device is selected. update_required = the glasses need a firmware or
    on-glasses app update.
    """
    device_capabilities: List[DeviceCapability]
    device_session: DeviceSession
    """Device session state. paused is device-driven and carries no reason; stopped is terminal
    and a new session must be created.
    """
    experimental_features: List[ExperimentalFeature]
    """SDK features in use that the vendor marks experimental or preview. A non-empty list means
    this build cannot be published; each feature has a non-experimental fallback (DEC-004).
    """
    glasses_backend: GlassesBackend
    """Which implementation GlassesBridge is running. Always explicit: a mock must never stand
    in silently for real hardware.
    """
    interaction: Interaction
    """The platform's conversation state, independent of the device lifecycles above."""

    mode: Mode
    """glasses = the glasses are usable for this turn; phone_only = every interaction continues
    on the phone.
    """
    observed_at: datetime
    registration: Registration
    """Registration of this app with the Meta AI app."""

    schema: DeviceSessionStateSchema
    seq: int
    """Monotonic per session. Consumers drop snapshots with a lower seq than the last one seen."""

    session_id: str

    @staticmethod
    def from_dict(obj: Any) -> 'DeviceSessionState':
        assert isinstance(obj, dict)
        audio_route = AudioRoute(obj.get("audio_route"))
        camera = CameraState.from_dict(obj.get("camera"))
        degraded_reasons = from_list(DegradedReason, obj.get("degraded_reasons"))
        device_availability = DeviceAvailability(obj.get("device_availability"))
        device_capabilities = from_list(DeviceCapability, obj.get("device_capabilities"))
        device_session = DeviceSession(obj.get("device_session"))
        experimental_features = from_list(ExperimentalFeature, obj.get("experimental_features"))
        glasses_backend = GlassesBackend(obj.get("glasses_backend"))
        interaction = Interaction(obj.get("interaction"))
        mode = Mode(obj.get("mode"))
        observed_at = from_datetime(obj.get("observed_at"))
        registration = Registration(obj.get("registration"))
        schema = DeviceSessionStateSchema(obj.get("schema"))
        seq = from_int(obj.get("seq"))
        session_id = from_str(obj.get("session_id"))
        return DeviceSessionState(audio_route, camera, degraded_reasons, device_availability, device_capabilities, device_session, experimental_features, glasses_backend, interaction, mode, observed_at, registration, schema, seq, session_id)

    def to_dict(self) -> dict:
        result: dict = {}
        result["audio_route"] = to_enum(AudioRoute, self.audio_route)
        result["camera"] = to_class(CameraState, self.camera)
        result["degraded_reasons"] = from_list(lambda x: to_enum(DegradedReason, x), self.degraded_reasons)
        result["device_availability"] = to_enum(DeviceAvailability, self.device_availability)
        result["device_capabilities"] = from_list(lambda x: to_enum(DeviceCapability, x), self.device_capabilities)
        result["device_session"] = to_enum(DeviceSession, self.device_session)
        result["experimental_features"] = from_list(lambda x: to_enum(ExperimentalFeature, x), self.experimental_features)
        result["glasses_backend"] = to_enum(GlassesBackend, self.glasses_backend)
        result["interaction"] = to_enum(Interaction, self.interaction)
        result["mode"] = to_enum(Mode, self.mode)
        result["observed_at"] = self.observed_at.isoformat()
        result["registration"] = to_enum(Registration, self.registration)
        result["schema"] = to_enum(DeviceSessionStateSchema, self.schema)
        result["seq"] = from_int(self.seq)
        result["session_id"] = from_str(self.session_id)
        return result


@dataclass
class ActionKindDeclaration:
    confirm_channels: List[ConfirmChannel]
    kind: str
    reversible: bool
    risk: Risk

    @staticmethod
    def from_dict(obj: Any) -> 'ActionKindDeclaration':
        assert isinstance(obj, dict)
        confirm_channels = from_list(ConfirmChannel, obj.get("confirm_channels"))
        kind = from_str(obj.get("kind"))
        reversible = from_bool(obj.get("reversible"))
        risk = Risk(obj.get("risk"))
        return ActionKindDeclaration(confirm_channels, kind, reversible, risk)

    def to_dict(self) -> dict:
        result: dict = {}
        result["confirm_channels"] = from_list(lambda x: to_enum(ConfirmChannel, x), self.confirm_channels)
        result["kind"] = from_str(self.kind)
        result["reversible"] = from_bool(self.reversible)
        result["risk"] = to_enum(Risk, self.risk)
        return result


class Delivery(Enum):
    """'observation' (default, preferred): the capability receives only what the platform read.
    'media': it receives the minimised image via a short-lived reference.
    """
    MEDIA = "media"
    OBSERVATION = "observation"


@dataclass
class CapturePurpose:
    delivery: Delivery
    """'observation' (default, preferred): the capability receives only what the platform read.
    'media': it receives the minimised image via a short-lived reference.
    """
    purpose: str
    retention_max_s: int
    """Maximum time the capability may keep the image. Capped at 30 days."""

    @staticmethod
    def from_dict(obj: Any) -> 'CapturePurpose':
        assert isinstance(obj, dict)
        delivery = Delivery(obj.get("delivery"))
        purpose = from_str(obj.get("purpose"))
        retention_max_s = from_int(obj.get("retention_max_s"))
        return CapturePurpose(delivery, purpose, retention_max_s)

    def to_dict(self) -> dict:
        result: dict = {}
        result["delivery"] = to_enum(Delivery, self.delivery)
        result["purpose"] = from_str(self.purpose)
        result["retention_max_s"] = from_int(self.retention_max_s)
        return result


class ContractVersion(Enum):
    THE_1 = "1"


@dataclass
class IntentDeclaration:
    accepts_capture: List[str]
    """Capture purposes this intent can use; each must appear in capture_purposes."""

    examples: List[Dict[str, str]]
    id: str
    voice_ok: bool

    @staticmethod
    def from_dict(obj: Any) -> 'IntentDeclaration':
        assert isinstance(obj, dict)
        accepts_capture = from_list(from_str, obj.get("accepts_capture"))
        examples = from_list(lambda x: from_dict(from_str, x), obj.get("examples"))
        id = from_str(obj.get("id"))
        voice_ok = from_bool(obj.get("voice_ok"))
        return IntentDeclaration(accepts_capture, examples, id, voice_ok)

    def to_dict(self) -> dict:
        result: dict = {}
        result["accepts_capture"] = from_list(from_str, self.accepts_capture)
        result["examples"] = from_list(lambda x: from_dict(from_str, x), self.examples)
        result["id"] = from_str(self.id)
        result["voice_ok"] = from_bool(self.voice_ok)
        return result


class DomainCapabilitySchema(Enum):
    PLATFORM_CAPABILITY_MANIFEST_V1 = "platform.capability_manifest/v1"


@dataclass
class LatencySlo:
    p50_ms: int
    p95_ms: int

    @staticmethod
    def from_dict(obj: Any) -> 'LatencySlo':
        assert isinstance(obj, dict)
        p50_ms = from_int(obj.get("p50_ms"))
        p95_ms = from_int(obj.get("p95_ms"))
        return LatencySlo(p50_ms, p95_ms)

    def to_dict(self) -> dict:
        result: dict = {}
        result["p50_ms"] = from_int(self.p50_ms)
        result["p95_ms"] = from_int(self.p95_ms)
        return result


class TransportKind(Enum):
    HTTPS_JSON = "https_json"
    HTTPS_SSE = "https_sse"
    IN_PROCESS = "in_process"


@dataclass
class CapabilityTransport:
    kind: TransportKind
    endpoint: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'CapabilityTransport':
        assert isinstance(obj, dict)
        kind = TransportKind(obj.get("kind"))
        endpoint = from_union([from_str, from_none], obj.get("endpoint"))
        return CapabilityTransport(kind, endpoint)

    def to_dict(self) -> dict:
        result: dict = {}
        result["kind"] = to_enum(TransportKind, self.kind)
        if self.endpoint is not None:
            result["endpoint"] = from_union([from_str, from_none], self.endpoint)
        return result


@dataclass
class DomainCapability:
    """What a capability declares to the platform. The platform loads nothing it cannot
    validate: intents, capture purposes, data classes (for consent), action kinds (for
    confirmation policy), events, transport and SLOs.
    """
    action_kinds: List[ActionKindDeclaration]
    capability_id: str
    capture_purposes: List[CapturePurpose]
    contract_version: ContractVersion
    data_classes: List[str]
    """Data classes this capability touches; the consent registry asks for each."""

    display_name: Dict[str, str]
    events_emitted: List[str]
    fixtures_uri: str
    intents: List[IntentDeclaration]
    schema: DomainCapabilitySchema
    slo: LatencySlo
    transport: CapabilityTransport
    version: str
    health_uri: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'DomainCapability':
        assert isinstance(obj, dict)
        action_kinds = from_list(ActionKindDeclaration.from_dict, obj.get("action_kinds"))
        capability_id = from_str(obj.get("capability_id"))
        capture_purposes = from_list(CapturePurpose.from_dict, obj.get("capture_purposes"))
        contract_version = ContractVersion(obj.get("contract_version"))
        data_classes = from_list(from_str, obj.get("data_classes"))
        display_name = from_dict(from_str, obj.get("display_name"))
        events_emitted = from_list(from_str, obj.get("events_emitted"))
        fixtures_uri = from_str(obj.get("fixtures_uri"))
        intents = from_list(IntentDeclaration.from_dict, obj.get("intents"))
        schema = DomainCapabilitySchema(obj.get("schema"))
        slo = LatencySlo.from_dict(obj.get("slo"))
        transport = CapabilityTransport.from_dict(obj.get("transport"))
        version = from_str(obj.get("version"))
        health_uri = from_union([from_str, from_none], obj.get("health_uri"))
        return DomainCapability(action_kinds, capability_id, capture_purposes, contract_version, data_classes, display_name, events_emitted, fixtures_uri, intents, schema, slo, transport, version, health_uri)

    def to_dict(self) -> dict:
        result: dict = {}
        result["action_kinds"] = from_list(lambda x: to_class(ActionKindDeclaration, x), self.action_kinds)
        result["capability_id"] = from_str(self.capability_id)
        result["capture_purposes"] = from_list(lambda x: to_class(CapturePurpose, x), self.capture_purposes)
        result["contract_version"] = to_enum(ContractVersion, self.contract_version)
        result["data_classes"] = from_list(from_str, self.data_classes)
        result["display_name"] = from_dict(from_str, self.display_name)
        result["events_emitted"] = from_list(from_str, self.events_emitted)
        result["fixtures_uri"] = from_str(self.fixtures_uri)
        result["intents"] = from_list(lambda x: to_class(IntentDeclaration, x), self.intents)
        result["schema"] = to_enum(DomainCapabilitySchema, self.schema)
        result["slo"] = to_class(LatencySlo, self.slo)
        result["transport"] = to_class(CapabilityTransport, self.transport)
        result["version"] = from_str(self.version)
        if self.health_uri is not None:
            result["health_uri"] = from_union([from_str, from_none], self.health_uri)
        return result


class GlassesAudio(Enum):
    IN_SESSION_ONLY = "in_session_only"
    NEVER = "never"


@dataclass
class DeliveryPrefs:
    glasses_audio: GlassesAudio
    phone_notification: bool
    spoken_amounts: bool
    """Reserved. Always false in v1."""

    @staticmethod
    def from_dict(obj: Any) -> 'DeliveryPrefs':
        assert isinstance(obj, dict)
        glasses_audio = GlassesAudio(obj.get("glasses_audio"))
        phone_notification = from_bool(obj.get("phone_notification"))
        spoken_amounts = from_bool(obj.get("spoken_amounts"))
        return DeliveryPrefs(glasses_audio, phone_notification, spoken_amounts)

    def to_dict(self) -> dict:
        result: dict = {}
        result["glasses_audio"] = to_enum(GlassesAudio, self.glasses_audio)
        result["phone_notification"] = from_bool(self.phone_notification)
        result["spoken_amounts"] = from_bool(self.spoken_amounts)
        return result


class DomainEventSchema(Enum):
    PLATFORM_DOMAIN_EVENT_V1 = "platform.domain_event/v1"


class Severity(Enum):
    IMPORTANT = "important"
    INFO = "info"
    NUDGE = "nudge"


@dataclass
class DomainEvent:
    """Emitted by a capability for possible proactive delivery. The platform's notification
    policy decides whether, when and where to deliver it (rate limits, quiet hours, active
    session). Amounts are never spoken proactively: open-ear speakers can be overheard. The
    summary must be safe to show on a lock screen: no amounts, merchants or item names.
    """
    capability_id: str
    dedupe_key: str
    delivery_prefs: DeliveryPrefs
    event_id: str
    expires_at: datetime
    occurred_at: datetime
    schema: DomainEventSchema
    severity: Severity
    summary: Dict[str, str]
    type: str
    user_ref: str
    card_ref: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'DomainEvent':
        assert isinstance(obj, dict)
        capability_id = from_str(obj.get("capability_id"))
        dedupe_key = from_str(obj.get("dedupe_key"))
        delivery_prefs = DeliveryPrefs.from_dict(obj.get("delivery_prefs"))
        event_id = from_str(obj.get("event_id"))
        expires_at = from_datetime(obj.get("expires_at"))
        occurred_at = from_datetime(obj.get("occurred_at"))
        schema = DomainEventSchema(obj.get("schema"))
        severity = Severity(obj.get("severity"))
        summary = from_dict(from_str, obj.get("summary"))
        type = from_str(obj.get("type"))
        user_ref = from_str(obj.get("user_ref"))
        card_ref = from_union([from_str, from_none], obj.get("card_ref"))
        return DomainEvent(capability_id, dedupe_key, delivery_prefs, event_id, expires_at, occurred_at, schema, severity, summary, type, user_ref, card_ref)

    def to_dict(self) -> dict:
        result: dict = {}
        result["capability_id"] = from_str(self.capability_id)
        result["dedupe_key"] = from_str(self.dedupe_key)
        result["delivery_prefs"] = to_class(DeliveryPrefs, self.delivery_prefs)
        result["event_id"] = from_str(self.event_id)
        result["expires_at"] = self.expires_at.isoformat()
        result["occurred_at"] = self.occurred_at.isoformat()
        result["schema"] = to_enum(DomainEventSchema, self.schema)
        result["severity"] = to_enum(Severity, self.severity)
        result["summary"] = from_dict(from_str, self.summary)
        result["type"] = from_str(self.type)
        result["user_ref"] = from_str(self.user_ref)
        if self.card_ref is not None:
            result["card_ref"] = from_union([from_str, from_none], self.card_ref)
        return result


@dataclass
class ConversationContext:
    recent_turns: List[ConversationTurn]
    ref: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConversationContext':
        assert isinstance(obj, dict)
        recent_turns = from_list(ConversationTurn.from_dict, obj.get("recent_turns"))
        ref = from_str(obj.get("ref"))
        return ConversationContext(recent_turns, ref)

    def to_dict(self) -> dict:
        result: dict = {}
        result["recent_turns"] = from_list(lambda x: to_class(ConversationTurn, x), self.recent_turns)
        result["ref"] = from_str(self.ref)
        return result


@dataclass
class IntentHint:
    """Optional pre-classification (e.g. from an on-device router). Capabilities may ignore it."""

    confidence: float
    intent: str
    source: str
    slots: Optional[Dict[str, Any]] = None

    @staticmethod
    def from_dict(obj: Any) -> 'IntentHint':
        assert isinstance(obj, dict)
        confidence = from_float(obj.get("confidence"))
        intent = from_str(obj.get("intent"))
        source = from_str(obj.get("source"))
        slots = from_union([lambda x: from_dict(lambda x: x, x), from_none], obj.get("slots"))
        return IntentHint(confidence, intent, source, slots)

    def to_dict(self) -> dict:
        result: dict = {}
        result["confidence"] = to_float(self.confidence)
        result["intent"] = from_str(self.intent)
        result["source"] = from_str(self.source)
        if self.slots is not None:
            result["slots"] = from_union([lambda x: from_dict(lambda x: x, x), from_none], self.slots)
        return result


class ObservationEpistemic(Enum):
    OBSERVED = "observed"


@dataclass
class ObservationExtractor:
    provider_id: str
    version: str

    @staticmethod
    def from_dict(obj: Any) -> 'ObservationExtractor':
        assert isinstance(obj, dict)
        provider_id = from_str(obj.get("provider_id"))
        version = from_str(obj.get("version"))
        return ObservationExtractor(provider_id, version)

    def to_dict(self) -> dict:
        result: dict = {}
        result["provider_id"] = from_str(self.provider_id)
        result["version"] = from_str(self.version)
        return result


class Per(Enum):
    KG = "kg"
    L = "l"
    PCS = "pcs"


@dataclass
class ObservedUnitPrice:
    amount: Money
    per: Per

    @staticmethod
    def from_dict(obj: Any) -> 'ObservedUnitPrice':
        assert isinstance(obj, dict)
        amount = Money.from_dict(obj.get("amount"))
        per = Per(obj.get("per"))
        return ObservedUnitPrice(amount, per)

    def to_dict(self) -> dict:
        result: dict = {}
        result["amount"] = to_class(Money, self.amount)
        result["per"] = to_enum(Per, self.per)
        return result


@dataclass
class ObservedItem:
    confidence: float
    label_untrusted: str
    barcode: Optional[str] = None
    price: Optional[Money] = None
    unit_price: Optional[ObservedUnitPrice] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ObservedItem':
        assert isinstance(obj, dict)
        confidence = from_float(obj.get("confidence"))
        label_untrusted = from_str(obj.get("label_untrusted"))
        barcode = from_union([from_str, from_none], obj.get("barcode"))
        price = from_union([Money.from_dict, from_none], obj.get("price"))
        unit_price = from_union([ObservedUnitPrice.from_dict, from_none], obj.get("unit_price"))
        return ObservedItem(confidence, label_untrusted, barcode, price, unit_price)

    def to_dict(self) -> dict:
        result: dict = {}
        result["confidence"] = to_float(self.confidence)
        result["label_untrusted"] = from_str(self.label_untrusted)
        if self.barcode is not None:
            result["barcode"] = from_union([from_str, from_none], self.barcode)
        if self.price is not None:
            result["price"] = from_union([lambda x: to_class(Money, x), from_none], self.price)
        if self.unit_price is not None:
            result["unit_price"] = from_union([lambda x: to_class(ObservedUnitPrice, x), from_none], self.unit_price)
        return result


class ObservationKind(Enum):
    BARCODE = "barcode"
    DOCUMENT_TEXT = "document_text"
    PRICE_LABEL = "price_label"
    PRODUCT = "product"
    RECEIPT = "receipt"


class ObservationSchema(Enum):
    PLATFORM_OBSERVATION_V1 = "platform.observation/v1"


@dataclass
class Observation:
    """What the platform read from a capture (price label, product, barcode, document text).
    Lets a capability reason about what the user is looking at without receiving the photo.
    All text is untrusted: it is data, never instructions.
    """
    capture_id: str
    created_at: datetime
    epistemic: ObservationEpistemic
    extractor: ObservationExtractor
    issues: List[str]
    items: List[ObservedItem]
    kind: ObservationKind
    needs_user_check: bool
    """True when the capability must ask the user to confirm what was read before relying on it."""

    observation_id: str
    schema: ObservationSchema
    raw_text_untrusted: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'Observation':
        assert isinstance(obj, dict)
        capture_id = from_str(obj.get("capture_id"))
        created_at = from_datetime(obj.get("created_at"))
        epistemic = ObservationEpistemic(obj.get("epistemic"))
        extractor = ObservationExtractor.from_dict(obj.get("extractor"))
        issues = from_list(from_str, obj.get("issues"))
        items = from_list(ObservedItem.from_dict, obj.get("items"))
        kind = ObservationKind(obj.get("kind"))
        needs_user_check = from_bool(obj.get("needs_user_check"))
        observation_id = from_str(obj.get("observation_id"))
        schema = ObservationSchema(obj.get("schema"))
        raw_text_untrusted = from_union([from_str, from_none], obj.get("raw_text_untrusted"))
        return Observation(capture_id, created_at, epistemic, extractor, issues, items, kind, needs_user_check, observation_id, schema, raw_text_untrusted)

    def to_dict(self) -> dict:
        result: dict = {}
        result["capture_id"] = from_str(self.capture_id)
        result["created_at"] = self.created_at.isoformat()
        result["epistemic"] = to_enum(ObservationEpistemic, self.epistemic)
        result["extractor"] = to_class(ObservationExtractor, self.extractor)
        result["issues"] = from_list(from_str, self.issues)
        result["items"] = from_list(lambda x: to_class(ObservedItem, x), self.items)
        result["kind"] = to_enum(ObservationKind, self.kind)
        result["needs_user_check"] = from_bool(self.needs_user_check)
        result["observation_id"] = from_str(self.observation_id)
        result["schema"] = to_enum(ObservationSchema, self.schema)
        if self.raw_text_untrusted is not None:
            result["raw_text_untrusted"] = from_union([from_str, from_none], self.raw_text_untrusted)
        return result


class OutputDisplay(Enum):
    GLASSES = "glasses"
    NONE = "none"
    PHONE = "phone"


@dataclass
class OutputConstraints:
    discreet_mode: bool
    display: OutputDisplay
    speech_max_words: int

    @staticmethod
    def from_dict(obj: Any) -> 'OutputConstraints':
        assert isinstance(obj, dict)
        discreet_mode = from_bool(obj.get("discreet_mode"))
        display = OutputDisplay(obj.get("display"))
        speech_max_words = from_int(obj.get("speech_max_words"))
        return OutputConstraints(discreet_mode, display, speech_max_words)

    def to_dict(self) -> dict:
        result: dict = {}
        result["discreet_mode"] = from_bool(self.discreet_mode)
        result["display"] = to_enum(OutputDisplay, self.display)
        result["speech_max_words"] = from_int(self.speech_max_words)
        return result


class DomainRequestSchema(Enum):
    PLATFORM_DOMAIN_REQUEST_V1 = "platform.domain_request/v1"


@dataclass
class DomainRequest:
    """What the orchestrator sends to a capability (and what the S-Bank Coach agent receives on
    POST /v1/turn). Self-contained: the capability may be stateless.
    """
    capability_id: str
    captures: List[ContextCapture]
    """Raw minimised captures, only for purposes with delivery 'media'."""

    conversation: ConversationContext
    deadline_ms: int
    """The capability must answer (or the adapter falls back) within this time."""

    locale: str
    observations: List[Observation]
    """What the platform read from captures (for purposes with delivery 'observation')."""

    output_constraints: OutputConstraints
    request_id: str
    schema: DomainRequestSchema
    session_id: str
    turn_id: str
    user_ref: str
    device_capabilities: Optional[List[DeviceCapability]] = None
    intent_hint: Optional[IntentHint] = None
    """Optional pre-classification (e.g. from an on-device router). Capabilities may ignore it."""

    utterance: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'DomainRequest':
        assert isinstance(obj, dict)
        capability_id = from_str(obj.get("capability_id"))
        captures = from_list(ContextCapture.from_dict, obj.get("captures"))
        conversation = ConversationContext.from_dict(obj.get("conversation"))
        deadline_ms = from_int(obj.get("deadline_ms"))
        locale = from_str(obj.get("locale"))
        observations = from_list(Observation.from_dict, obj.get("observations"))
        output_constraints = OutputConstraints.from_dict(obj.get("output_constraints"))
        request_id = from_str(obj.get("request_id"))
        schema = DomainRequestSchema(obj.get("schema"))
        session_id = from_str(obj.get("session_id"))
        turn_id = from_str(obj.get("turn_id"))
        user_ref = from_str(obj.get("user_ref"))
        device_capabilities = from_union([lambda x: from_list(DeviceCapability, x), from_none], obj.get("device_capabilities"))
        intent_hint = from_union([IntentHint.from_dict, from_none], obj.get("intent_hint"))
        utterance = from_union([from_none, from_str], obj.get("utterance"))
        return DomainRequest(capability_id, captures, conversation, deadline_ms, locale, observations, output_constraints, request_id, schema, session_id, turn_id, user_ref, device_capabilities, intent_hint, utterance)

    def to_dict(self) -> dict:
        result: dict = {}
        result["capability_id"] = from_str(self.capability_id)
        result["captures"] = from_list(lambda x: to_class(ContextCapture, x), self.captures)
        result["conversation"] = to_class(ConversationContext, self.conversation)
        result["deadline_ms"] = from_int(self.deadline_ms)
        result["locale"] = from_str(self.locale)
        result["observations"] = from_list(lambda x: to_class(Observation, x), self.observations)
        result["output_constraints"] = to_class(OutputConstraints, self.output_constraints)
        result["request_id"] = from_str(self.request_id)
        result["schema"] = to_enum(DomainRequestSchema, self.schema)
        result["session_id"] = from_str(self.session_id)
        result["turn_id"] = from_str(self.turn_id)
        result["user_ref"] = from_str(self.user_ref)
        if self.device_capabilities is not None:
            result["device_capabilities"] = from_union([lambda x: from_list(lambda x: to_enum(DeviceCapability, x), x), from_none], self.device_capabilities)
        if self.intent_hint is not None:
            result["intent_hint"] = from_union([lambda x: to_class(IntentHint, x), from_none], self.intent_hint)
        result["utterance"] = from_union([from_none, from_str], self.utterance)
        return result


class DomainResponseSchema(Enum):
    PLATFORM_DOMAIN_RESPONSE_V1 = "platform.domain_response/v1"


@dataclass
class SpokenLine:
    epistemic: Epistemic
    text: str

    @staticmethod
    def from_dict(obj: Any) -> 'SpokenLine':
        assert isinstance(obj, dict)
        epistemic = Epistemic(obj.get("epistemic"))
        text = from_str(obj.get("text"))
        return SpokenLine(epistemic, text)

    def to_dict(self) -> dict:
        result: dict = {}
        result["epistemic"] = to_enum(Epistemic, self.epistemic)
        result["text"] = from_str(self.text)
        return result


class DomainResponseStatus(Enum):
    ANSWERED = "answered"
    CLARIFY = "clarify"
    ERROR = "error"
    PARTIAL = "partial"
    UNSUPPORTED = "unsupported"


@dataclass
class ToolCallTrace:
    ms: int
    name: str
    ok: bool

    @staticmethod
    def from_dict(obj: Any) -> 'ToolCallTrace':
        assert isinstance(obj, dict)
        ms = from_int(obj.get("ms"))
        name = from_str(obj.get("name"))
        ok = from_bool(obj.get("ok"))
        return ToolCallTrace(ms, name, ok)

    def to_dict(self) -> dict:
        result: dict = {}
        result["ms"] = from_int(self.ms)
        result["name"] = from_str(self.name)
        result["ok"] = from_bool(self.ok)
        return result


@dataclass
class VerificationReport:
    checked_values: int
    unverified: List[str]

    @staticmethod
    def from_dict(obj: Any) -> 'VerificationReport':
        assert isinstance(obj, dict)
        checked_values = from_int(obj.get("checked_values"))
        unverified = from_list(from_str, obj.get("unverified"))
        return VerificationReport(checked_values, unverified)

    def to_dict(self) -> dict:
        result: dict = {}
        result["checked_values"] = from_int(self.checked_values)
        result["unverified"] = from_list(from_str, self.unverified)
        return result


@dataclass
class ResponseTrace:
    backend: str
    """Opaque backend id for telemetry only, e.g. 'remote_agent@0.4', 'fast_path@1'. The
    platform never branches on it.
    """
    calc_ids: List[str]
    tools: List[ToolCallTrace]
    verified: bool
    observation_ids: Optional[List[str]] = None
    verification: Optional[VerificationReport] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ResponseTrace':
        assert isinstance(obj, dict)
        backend = from_str(obj.get("backend"))
        calc_ids = from_list(from_str, obj.get("calc_ids"))
        tools = from_list(ToolCallTrace.from_dict, obj.get("tools"))
        verified = from_bool(obj.get("verified"))
        observation_ids = from_union([lambda x: from_list(from_str, x), from_none], obj.get("observation_ids"))
        verification = from_union([VerificationReport.from_dict, from_none], obj.get("verification"))
        return ResponseTrace(backend, calc_ids, tools, verified, observation_ids, verification)

    def to_dict(self) -> dict:
        result: dict = {}
        result["backend"] = from_str(self.backend)
        result["calc_ids"] = from_list(from_str, self.calc_ids)
        result["tools"] = from_list(lambda x: to_class(ToolCallTrace, x), self.tools)
        result["verified"] = from_bool(self.verified)
        if self.observation_ids is not None:
            result["observation_ids"] = from_union([lambda x: from_list(from_str, x), from_none], self.observation_ids)
        if self.verification is not None:
            result["verification"] = from_union([lambda x: to_class(VerificationReport, x), from_none], self.verification)
        return result


@dataclass
class DomainResponse:
    """A capability's complete answer to one DomainRequest: one short spoken line, cards for the
    phone, optional proposals, and a trace. The agent sends trace.verified=false; only the
    adapter sets it to true after checking every number against the engine.
    """
    cards: List[InsightCard]
    proposals: List[ActionProposal]
    request_id: str
    schema: DomainResponseSchema
    speech: SpokenLine
    status: DomainResponseStatus
    trace: ResponseTrace
    error: Optional[ErrorInfo] = None
    followups: Optional[List[Dict[str, str]]] = None
    """Suggested follow-up questions shown as chips."""

    @staticmethod
    def from_dict(obj: Any) -> 'DomainResponse':
        assert isinstance(obj, dict)
        cards = from_list(InsightCard.from_dict, obj.get("cards"))
        proposals = from_list(ActionProposal.from_dict, obj.get("proposals"))
        request_id = from_str(obj.get("request_id"))
        schema = DomainResponseSchema(obj.get("schema"))
        speech = SpokenLine.from_dict(obj.get("speech"))
        status = DomainResponseStatus(obj.get("status"))
        trace = ResponseTrace.from_dict(obj.get("trace"))
        error = from_union([ErrorInfo.from_dict, from_none], obj.get("error"))
        followups = from_union([lambda x: from_list(lambda x: from_dict(from_str, x), x), from_none], obj.get("followups"))
        return DomainResponse(cards, proposals, request_id, schema, speech, status, trace, error, followups)

    def to_dict(self) -> dict:
        result: dict = {}
        result["cards"] = from_list(lambda x: to_class(InsightCard, x), self.cards)
        result["proposals"] = from_list(lambda x: to_class(ActionProposal, x), self.proposals)
        result["request_id"] = from_str(self.request_id)
        result["schema"] = to_enum(DomainResponseSchema, self.schema)
        result["speech"] = to_class(SpokenLine, self.speech)
        result["status"] = to_enum(DomainResponseStatus, self.status)
        result["trace"] = to_class(ResponseTrace, self.trace)
        if self.error is not None:
            result["error"] = from_union([lambda x: to_class(ErrorInfo, x), from_none], self.error)
        if self.followups is not None:
            result["followups"] = from_union([lambda x: from_list(lambda x: from_dict(from_str, x), x), from_none], self.followups)
        return result


class DomainResponseEventType(Enum):
    CARD = "card"
    FINAL = "final"
    PROGRESS = "progress"
    PROPOSAL = "proposal"


@dataclass
class DomainResponseEvent:
    """One event in a streamed answer (SSE). Exactly one 'final' event ends the stream; cards
    and proposals in earlier events are repeated in the final response so non-streaming
    consumers lose nothing.
    """
    type: DomainResponseEventType
    speech_hint: Optional[Dict[str, str]] = None
    stage: Optional[str] = None
    card: Optional[InsightCard] = None
    proposal: Optional[ActionProposal] = None
    response: Optional[DomainResponse] = None

    @staticmethod
    def from_dict(obj: Any) -> 'DomainResponseEvent':
        assert isinstance(obj, dict)
        type = DomainResponseEventType(obj.get("type"))
        speech_hint = from_union([lambda x: from_dict(from_str, x), from_none], obj.get("speech_hint"))
        stage = from_union([from_str, from_none], obj.get("stage"))
        card = from_union([InsightCard.from_dict, from_none], obj.get("card"))
        proposal = from_union([ActionProposal.from_dict, from_none], obj.get("proposal"))
        response = from_union([DomainResponse.from_dict, from_none], obj.get("response"))
        return DomainResponseEvent(type, speech_hint, stage, card, proposal, response)

    def to_dict(self) -> dict:
        result: dict = {}
        result["type"] = to_enum(DomainResponseEventType, self.type)
        if self.speech_hint is not None:
            result["speech_hint"] = from_union([lambda x: from_dict(from_str, x), from_none], self.speech_hint)
        if self.stage is not None:
            result["stage"] = from_union([from_str, from_none], self.stage)
        if self.card is not None:
            result["card"] = from_union([lambda x: to_class(InsightCard, x), from_none], self.card)
        if self.proposal is not None:
            result["proposal"] = from_union([lambda x: to_class(ActionProposal, x), from_none], self.proposal)
        if self.response is not None:
            result["response"] = from_union([lambda x: to_class(DomainResponse, x), from_none], self.response)
        return result


class DegradedTo(Enum):
    """Fallback the platform has already switched to, if any."""

    CACHED_CARDS = "cached_cards"
    FAST_PATH = "fast_path"
    NONE = "none"
    PHONE_ONLY = "phone_only"


class EffectState(Enum):
    """Whether the request had a persistent effect. unknown = it may have been applied (e.g. a
    timeout while applying a confirmed proposal); clients must not replay it and must re-read
    state first.
    """
    APPLIED = "applied"
    NONE = "none"
    UNKNOWN = "unknown"


class ErrorEnvelopeSchema(Enum):
    PLATFORM_ERROR_V1 = "platform.error/v1"


@dataclass
class ErrorEnvelope:
    """Body of every non-2xx HTTP response on the platform's public APIs, and of SSE 'error'
    events. user_message is safe to show or speak; diagnostics belong in logs keyed by
    correlation_id, never in this object. Small in-body errors inside ToolResult and
    DomainResponse keep using common ErrorInfo. See DEC-008.
    """
    code: str
    """UPPER_SNAKE code. Open set: clients must treat unknown codes by their retryable and
    effect_state flags. Registry: docs/contracts/README.md#error-codes.
    """
    correlation_id: str
    effect_state: EffectState
    """Whether the request had a persistent effect. unknown = it may have been applied (e.g. a
    timeout while applying a confirmed proposal); clients must not replay it and must re-read
    state first.
    """
    occurred_at: datetime
    retryable: bool
    """true = the same request may be sent again automatically (honour retry_after_ms)."""

    schema: ErrorEnvelopeSchema
    user_message: Dict[str, str]
    """Short, non-technical, safe to speak aloud: no amounts, no account data, no stack traces."""

    capability_id: Optional[str] = None
    degraded_to: Optional[DegradedTo] = None
    """Fallback the platform has already switched to, if any."""

    retry_after_ms: Optional[int] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ErrorEnvelope':
        assert isinstance(obj, dict)
        code = from_str(obj.get("code"))
        correlation_id = from_str(obj.get("correlation_id"))
        effect_state = EffectState(obj.get("effect_state"))
        occurred_at = from_datetime(obj.get("occurred_at"))
        retryable = from_bool(obj.get("retryable"))
        schema = ErrorEnvelopeSchema(obj.get("schema"))
        user_message = from_dict(from_str, obj.get("user_message"))
        capability_id = from_union([from_str, from_none], obj.get("capability_id"))
        degraded_to = from_union([DegradedTo, from_none], obj.get("degraded_to"))
        retry_after_ms = from_union([from_int, from_none], obj.get("retry_after_ms"))
        return ErrorEnvelope(code, correlation_id, effect_state, occurred_at, retryable, schema, user_message, capability_id, degraded_to, retry_after_ms)

    def to_dict(self) -> dict:
        result: dict = {}
        result["code"] = from_str(self.code)
        result["correlation_id"] = from_str(self.correlation_id)
        result["effect_state"] = to_enum(EffectState, self.effect_state)
        result["occurred_at"] = self.occurred_at.isoformat()
        result["retryable"] = from_bool(self.retryable)
        result["schema"] = to_enum(ErrorEnvelopeSchema, self.schema)
        result["user_message"] = from_dict(from_str, self.user_message)
        if self.capability_id is not None:
            result["capability_id"] = from_union([from_str, from_none], self.capability_id)
        if self.degraded_to is not None:
            result["degraded_to"] = from_union([lambda x: to_enum(DegradedTo, x), from_none], self.degraded_to)
        if self.retry_after_ms is not None:
            result["retry_after_ms"] = from_union([from_int, from_none], self.retry_after_ms)
        return result


class FinanceActionKind(Enum):
    FINANCE_CLASSIFICATION_UPDATE = "finance.classification.update"
    FINANCE_DATA_DELETE = "finance.data.delete"
    FINANCE_GOAL_UPDATE = "finance.goal.update"
    FINANCE_PLAN_ADD = "finance.plan.add"
    FINANCE_RECEIPT_LINK = "finance.receipt.link"
    FINANCE_SETTINGS_BUFFER_UPDATE = "finance.settings.buffer.update"


class FinanceIntent(Enum):
    FINANCE_BASKET_AFFORDABILITY = "finance.basket.affordability"
    FINANCE_CLASSIFICATION_CORRECT = "finance.classification.correct"
    FINANCE_COMMITMENTS_UPCOMING = "finance.commitments.upcoming"
    FINANCE_EDUCATION = "finance.education"
    FINANCE_EXPLAIN = "finance.explain"
    FINANCE_GOAL_PROJECTION = "finance.goal.projection"
    FINANCE_RECEIPT_SCAN = "finance.receipt.scan"
    FINANCE_SAFE_TO_SPEND = "finance.safe_to_spend"
    FINANCE_SIMULATE_CHANGE = "finance.simulate_change"
    FINANCE_SPENDER_PROFILE = "finance.spender_profile"
    FINANCE_SPEND_QUERY = "finance.spend.query"


class FinanceToolName(Enum):
    FINANCE_CALCULATE_AFFORDABILITY = "finance.calculate_affordability"
    FINANCE_GET_BASKET_BREAKDOWN = "finance.get_basket_breakdown"
    FINANCE_GET_CALCULATION = "finance.get_calculation"
    FINANCE_GET_SAFE_TO_SPEND = "finance.get_safe_to_spend"
    FINANCE_GET_SAVINGS_PROJECTION = "finance.get_savings_projection"
    FINANCE_GET_SPENDING_SUMMARY = "finance.get_spending_summary"
    FINANCE_GET_TRANSACTIONS = "finance.get_transactions"
    FINANCE_GET_UPCOMING_COMMITMENTS = "finance.get_upcoming_commitments"
    FINANCE_PROCESS_RECEIPT = "finance.process_receipt"
    FINANCE_PROPOSE_CLASSIFICATION_CHANGE = "finance.propose_classification_change"
    FINANCE_SIMULATE_SPENDING_CHANGE = "finance.simulate_spending_change"


class GlassesInputKind(Enum):
    CAPTURE_BUTTON = "capture_button"
    DOUBLE_TAP = "double_tap"
    LONG_PRESS = "long_press"
    PINCH = "pinch"
    SWIPE_BACK = "swipe_back"
    SWIPE_FORWARD = "swipe_forward"
    TAP = "tap"


@dataclass
class GlassesInput:
    """Normalised glasses input. The companion maps device-specific events (touchpad, capture
    button, Neural Band) onto these.
    """
    device_event_id: str
    kind: GlassesInputKind

    @staticmethod
    def from_dict(obj: Any) -> 'GlassesInput':
        assert isinstance(obj, dict)
        device_event_id = from_str(obj.get("device_event_id"))
        kind = GlassesInputKind(obj.get("kind"))
        return GlassesInput(device_event_id, kind)

    def to_dict(self) -> dict:
        result: dict = {}
        result["device_event_id"] = from_str(self.device_event_id)
        result["kind"] = to_enum(GlassesInputKind, self.kind)
        return result


@dataclass
class GoldenExpectation:
    epistemic: Epistemic
    intent: str
    status: DomainResponseStatus
    tools: List[str]
    values: Dict[str, str]
    """Map of dotted path in the tool result (e.g. 'result.remaining_after.amount') to the exact
    expected string.
    """
    data_mode: Optional[str] = None
    proposal_kinds: Optional[List[str]] = None
    speech_max_words: Optional[int] = None
    speech_must_mention: Optional[List[str]] = None
    """Concepts the spoken line must convey, as machine codes the evaluator maps to checks (e.g.
    PRICE_IS_OBSERVED, ESTIMATE).
    """

    @staticmethod
    def from_dict(obj: Any) -> 'GoldenExpectation':
        assert isinstance(obj, dict)
        epistemic = Epistemic(obj.get("epistemic"))
        intent = from_str(obj.get("intent"))
        status = DomainResponseStatus(obj.get("status"))
        tools = from_list(from_str, obj.get("tools"))
        values = from_dict(from_str, obj.get("values"))
        data_mode = from_union([from_str, from_none], obj.get("data_mode"))
        proposal_kinds = from_union([lambda x: from_list(from_str, x), from_none], obj.get("proposal_kinds"))
        speech_max_words = from_union([from_int, from_none], obj.get("speech_max_words"))
        speech_must_mention = from_union([lambda x: from_list(from_str, x), from_none], obj.get("speech_must_mention"))
        return GoldenExpectation(epistemic, intent, status, tools, values, data_mode, proposal_kinds, speech_max_words, speech_must_mention)

    def to_dict(self) -> dict:
        result: dict = {}
        result["epistemic"] = to_enum(Epistemic, self.epistemic)
        result["intent"] = from_str(self.intent)
        result["status"] = to_enum(DomainResponseStatus, self.status)
        result["tools"] = from_list(from_str, self.tools)
        result["values"] = from_dict(from_str, self.values)
        if self.data_mode is not None:
            result["data_mode"] = from_union([from_str, from_none], self.data_mode)
        if self.proposal_kinds is not None:
            result["proposal_kinds"] = from_union([lambda x: from_list(from_str, x), from_none], self.proposal_kinds)
        if self.speech_max_words is not None:
            result["speech_max_words"] = from_union([from_int, from_none], self.speech_max_words)
        if self.speech_must_mention is not None:
            result["speech_must_mention"] = from_union([lambda x: from_list(from_str, x), from_none], self.speech_must_mention)
        return result


@dataclass
class GoldenInput:
    capture_files: Optional[List[str]] = None
    observations: Optional[List[Observation]] = None
    utterance: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'GoldenInput':
        assert isinstance(obj, dict)
        capture_files = from_union([lambda x: from_list(from_str, x), from_none], obj.get("capture_files"))
        observations = from_union([lambda x: from_list(Observation.from_dict, x), from_none], obj.get("observations"))
        utterance = from_union([from_none, from_str], obj.get("utterance"))
        return GoldenInput(capture_files, observations, utterance)

    def to_dict(self) -> dict:
        result: dict = {}
        if self.capture_files is not None:
            result["capture_files"] = from_union([lambda x: from_list(from_str, x), from_none], self.capture_files)
        if self.observations is not None:
            result["observations"] = from_union([lambda x: from_list(lambda x: to_class(Observation, x), x), from_none], self.observations)
        result["utterance"] = from_union([from_none, from_str], self.utterance)
        return result


class GoldenCaseSchema(Enum):
    PLATFORM_GOLDEN_CASE_V1 = "platform.golden_case/v1"


class Tag(Enum):
    CAPTURE = "capture"
    CONFIRMATION = "confirmation"
    DEGRADED = "degraded"
    GOLDEN = "golden"
    INJECTION = "injection"
    LOCALE = "locale"


@dataclass
class GoldenCase:
    """A test case a capability ships in its fixtures. The platform's fixture runner replays it
    through the adapter (any backend) and the deterministic fast path; registration fails if
    expected values differ or any spoken/card number is unverified.
    """
    capability_id: str
    case_id: str
    expected: GoldenExpectation
    input: GoldenInput
    locale: str
    persona: str
    """Path to a persona fixture, relative to the fixtures root."""

    schema: GoldenCaseSchema
    tags: List[Tag]
    today: datetime
    description: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'GoldenCase':
        assert isinstance(obj, dict)
        capability_id = from_str(obj.get("capability_id"))
        case_id = from_str(obj.get("case_id"))
        expected = GoldenExpectation.from_dict(obj.get("expected"))
        input = GoldenInput.from_dict(obj.get("input"))
        locale = from_str(obj.get("locale"))
        persona = from_str(obj.get("persona"))
        schema = GoldenCaseSchema(obj.get("schema"))
        tags = from_list(Tag, obj.get("tags"))
        today = from_datetime(obj.get("today"))
        description = from_union([from_str, from_none], obj.get("description"))
        return GoldenCase(capability_id, case_id, expected, input, locale, persona, schema, tags, today, description)

    def to_dict(self) -> dict:
        result: dict = {}
        result["capability_id"] = from_str(self.capability_id)
        result["case_id"] = from_str(self.case_id)
        result["expected"] = to_class(GoldenExpectation, self.expected)
        result["input"] = to_class(GoldenInput, self.input)
        result["locale"] = from_str(self.locale)
        result["persona"] = from_str(self.persona)
        result["schema"] = to_enum(GoldenCaseSchema, self.schema)
        result["tags"] = from_list(lambda x: to_enum(Tag, x), self.tags)
        result["today"] = self.today.isoformat()
        if self.description is not None:
            result["description"] = from_union([from_str, from_none], self.description)
        return result


@dataclass
class MissingData:
    code: str
    detail: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'MissingData':
        assert isinstance(obj, dict)
        code = from_str(obj.get("code"))
        detail = from_union([from_str, from_none], obj.get("detail"))
        return MissingData(code, detail)

    def to_dict(self) -> dict:
        result: dict = {}
        result["code"] = from_str(self.code)
        if self.detail is not None:
            result["detail"] = from_union([from_str, from_none], self.detail)
        return result


class MissingDataCode(Enum):
    BALANCE_STALE = "BALANCE_STALE"
    COMMITMENT_ESTIMATED = "COMMITMENT_ESTIMATED"
    HISTORY_LT_4__WEEKS = "HISTORY_LT_4_WEEKS"
    INCOME_NOT_DETECTED = "INCOME_NOT_DETECTED"
    NO_BALANCE = "NO_BALANCE"
    PRICE_UNCERTAIN = "PRICE_UNCERTAIN"
    RECEIPT_UNMATCHED = "RECEIPT_UNMATCHED"


@dataclass
class DataPolicy:
    leaves_device: bool
    retention: str
    region: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'DataPolicy':
        assert isinstance(obj, dict)
        leaves_device = from_bool(obj.get("leaves_device"))
        retention = from_str(obj.get("retention"))
        region = from_union([from_str, from_none], obj.get("region"))
        return DataPolicy(leaves_device, retention, region)

    def to_dict(self) -> dict:
        result: dict = {}
        result["leaves_device"] = from_bool(self.leaves_device)
        result["retention"] = from_str(self.retention)
        if self.region is not None:
            result["region"] = from_union([from_str, from_none], self.region)
        return result


class ModelProviderKind(Enum):
    ASR = "asr"
    EMBEDDING = "embedding"
    LLM = "llm"
    ROUTER = "router"
    TTS = "tts"
    VISION_OCR = "vision_ocr"


class Location(Enum):
    BACKEND = "backend"
    CLOUD = "cloud"
    DEVICE = "device"


class ModelProviderSchema(Enum):
    PLATFORM_MODEL_PROVIDER_V1 = "platform.model_provider/v1"


@dataclass
class ProviderSlo:
    p50_ms: int
    p95_ms: int

    @staticmethod
    def from_dict(obj: Any) -> 'ProviderSlo':
        assert isinstance(obj, dict)
        p50_ms = from_int(obj.get("p50_ms"))
        p95_ms = from_int(obj.get("p95_ms"))
        return ProviderSlo(p50_ms, p95_ms)

    def to_dict(self) -> dict:
        result: dict = {}
        result["p50_ms"] = from_int(self.p50_ms)
        result["p95_ms"] = from_int(self.p95_ms)
        return result


class ModelProviderStatus(Enum):
    ACTIVE = "active"
    CANARY = "canary"
    DISABLED = "disabled"
    SHADOW = "shadow"


@dataclass
class ModelProvider:
    """Registry entry for a model the platform uses (ASR, TTS, router, OCR, embeddings, LLM),
    wherever it runs. Swapping cloud for on-device means changing registry entries, not
    contracts.
    """
    data_policy: DataPolicy
    kind: ModelProviderKind
    languages: List[str]
    location: Location
    model_ref: str
    """Opaque to callers."""

    provider_id: str
    schema: ModelProviderSchema
    slo: ProviderSlo
    status: ModelProviderStatus
    version: str
    fallback_provider_id: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ModelProvider':
        assert isinstance(obj, dict)
        data_policy = DataPolicy.from_dict(obj.get("data_policy"))
        kind = ModelProviderKind(obj.get("kind"))
        languages = from_list(from_str, obj.get("languages"))
        location = Location(obj.get("location"))
        model_ref = from_str(obj.get("model_ref"))
        provider_id = from_str(obj.get("provider_id"))
        schema = ModelProviderSchema(obj.get("schema"))
        slo = ProviderSlo.from_dict(obj.get("slo"))
        status = ModelProviderStatus(obj.get("status"))
        version = from_str(obj.get("version"))
        fallback_provider_id = from_union([from_str, from_none], obj.get("fallback_provider_id"))
        return ModelProvider(data_policy, kind, languages, location, model_ref, provider_id, schema, slo, status, version, fallback_provider_id)

    def to_dict(self) -> dict:
        result: dict = {}
        result["data_policy"] = to_class(DataPolicy, self.data_policy)
        result["kind"] = to_enum(ModelProviderKind, self.kind)
        result["languages"] = from_list(from_str, self.languages)
        result["location"] = to_enum(Location, self.location)
        result["model_ref"] = from_str(self.model_ref)
        result["provider_id"] = from_str(self.provider_id)
        result["schema"] = to_enum(ModelProviderSchema, self.schema)
        result["slo"] = to_class(ProviderSlo, self.slo)
        result["status"] = to_enum(ModelProviderStatus, self.status)
        result["version"] = from_str(self.version)
        if self.fallback_provider_id is not None:
            result["fallback_provider_id"] = from_union([from_str, from_none], self.fallback_provider_id)
        return result


@dataclass
class SafeToSpendResult:
    days_left_in_week: int
    days_to_income: int
    flexible_until_payday: Money
    safe_to_spend_week: Money
    next_income_date: Optional[datetime] = None
    shortfall: Optional[Money] = None

    @staticmethod
    def from_dict(obj: Any) -> 'SafeToSpendResult':
        assert isinstance(obj, dict)
        days_left_in_week = from_int(obj.get("days_left_in_week"))
        days_to_income = from_int(obj.get("days_to_income"))
        flexible_until_payday = Money.from_dict(obj.get("flexible_until_payday"))
        safe_to_spend_week = Money.from_dict(obj.get("safe_to_spend_week"))
        next_income_date = from_union([from_datetime, from_none], obj.get("next_income_date"))
        shortfall = from_union([Money.from_dict, from_none], obj.get("shortfall"))
        return SafeToSpendResult(days_left_in_week, days_to_income, flexible_until_payday, safe_to_spend_week, next_income_date, shortfall)

    def to_dict(self) -> dict:
        result: dict = {}
        result["days_left_in_week"] = from_int(self.days_left_in_week)
        result["days_to_income"] = from_int(self.days_to_income)
        result["flexible_until_payday"] = to_class(Money, self.flexible_until_payday)
        result["safe_to_spend_week"] = to_class(Money, self.safe_to_spend_week)
        result["next_income_date"] = from_union([lambda x: x.isoformat(), from_none], self.next_income_date)
        if self.shortfall is not None:
            result["shortfall"] = from_union([lambda x: to_class(Money, x), from_none], self.shortfall)
        return result


@dataclass
class ToolResult:
    """Envelope every deterministic tool returns. A successful non-educational result must carry
    a resolvable calc_id so the adapter can verify every number shown or spoken.
    """
    as_of: datetime
    assumptions: List[str]
    missing_data: List[MissingData]
    ok: bool
    schema: ResultEnvelope
    tool: str
    tool_version: str
    warnings: List[str]
    calc_id: Optional[str] = None
    confidence: Optional[Risk] = None
    data_mode: Optional[str] = None
    epistemic: Optional[Epistemic] = None
    error: Optional[ErrorInfo] = None
    result: Optional[Dict[str, Any]] = None
    """Tool-specific payload. Domains publish its schema in the tool descriptor (and may tighten
    it in a domain overlay).
    """

    @staticmethod
    def from_dict(obj: Any) -> 'ToolResult':
        assert isinstance(obj, dict)
        as_of = from_datetime(obj.get("as_of"))
        assumptions = from_list(from_str, obj.get("assumptions"))
        missing_data = from_list(MissingData.from_dict, obj.get("missing_data"))
        ok = from_bool(obj.get("ok"))
        schema = ResultEnvelope(obj.get("schema"))
        tool = from_str(obj.get("tool"))
        tool_version = from_str(obj.get("tool_version"))
        warnings = from_list(from_str, obj.get("warnings"))
        calc_id = from_union([from_none, from_str], obj.get("calc_id"))
        confidence = from_union([Risk, from_none], obj.get("confidence"))
        data_mode = from_union([from_str, from_none], obj.get("data_mode"))
        epistemic = from_union([Epistemic, from_none], obj.get("epistemic"))
        error = from_union([ErrorInfo.from_dict, from_none], obj.get("error"))
        result = from_union([lambda x: from_dict(lambda x: x, x), from_none], obj.get("result"))
        return ToolResult(as_of, assumptions, missing_data, ok, schema, tool, tool_version, warnings, calc_id, confidence, data_mode, epistemic, error, result)

    def to_dict(self) -> dict:
        result: dict = {}
        result["as_of"] = self.as_of.isoformat()
        result["assumptions"] = from_list(from_str, self.assumptions)
        result["missing_data"] = from_list(lambda x: to_class(MissingData, x), self.missing_data)
        result["ok"] = from_bool(self.ok)
        result["schema"] = to_enum(ResultEnvelope, self.schema)
        result["tool"] = from_str(self.tool)
        result["tool_version"] = from_str(self.tool_version)
        result["warnings"] = from_list(from_str, self.warnings)
        if self.calc_id is not None:
            result["calc_id"] = from_union([from_none, from_str], self.calc_id)
        if self.confidence is not None:
            result["confidence"] = from_union([lambda x: to_enum(Risk, x), from_none], self.confidence)
        if self.data_mode is not None:
            result["data_mode"] = from_union([from_str, from_none], self.data_mode)
        if self.epistemic is not None:
            result["epistemic"] = from_union([lambda x: to_enum(Epistemic, x), from_none], self.epistemic)
        if self.error is not None:
            result["error"] = from_union([lambda x: to_class(ErrorInfo, x), from_none], self.error)
        if self.result is not None:
            result["result"] = from_union([lambda x: from_dict(lambda x: x, x), from_none], self.result)
        return result


class Decision(Enum):
    CONFIRM = "confirm"
    REJECT = "reject"


@dataclass
class ConfirmationEvidence:
    asr_confidence: Optional[float] = None
    input: Optional[GlassesInput] = None
    readback_played: Optional[bool] = None
    ui_event_id: Optional[str] = None
    utterance: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ConfirmationEvidence':
        assert isinstance(obj, dict)
        asr_confidence = from_union([from_float, from_none], obj.get("asr_confidence"))
        input = from_union([GlassesInput.from_dict, from_none], obj.get("input"))
        readback_played = from_union([from_bool, from_none], obj.get("readback_played"))
        ui_event_id = from_union([from_str, from_none], obj.get("ui_event_id"))
        utterance = from_union([from_str, from_none], obj.get("utterance"))
        return ConfirmationEvidence(asr_confidence, input, readback_played, ui_event_id, utterance)

    def to_dict(self) -> dict:
        result: dict = {}
        if self.asr_confidence is not None:
            result["asr_confidence"] = from_union([to_float, from_none], self.asr_confidence)
        if self.input is not None:
            result["input"] = from_union([lambda x: to_class(GlassesInput, x), from_none], self.input)
        if self.readback_played is not None:
            result["readback_played"] = from_union([from_bool, from_none], self.readback_played)
        if self.ui_event_id is not None:
            result["ui_event_id"] = from_union([from_str, from_none], self.ui_event_id)
        if self.utterance is not None:
            result["utterance"] = from_union([from_str, from_none], self.utterance)
        return result


class UserConfirmationSchema(Enum):
    PLATFORM_USER_CONFIRMATION_V1 = "platform.user_confirmation/v1"


@dataclass
class UserConfirmation:
    """Created only by the companion from a real user input, then signed by the platform (L3).
    Capabilities verify the signature and that payload_hash matches the payload they hold
    before applying anything. Capabilities can never create one.
    """
    channel: ConfirmChannel
    confirmation_id: str
    confirmed_at: datetime
    decision: Decision
    evidence: ConfirmationEvidence
    payload_hash: str
    proposal_id: str
    schema: UserConfirmationSchema
    session_id: str
    signature: str
    """Compact JWS over the other fields, signed by the platform key."""

    user_ref: str

    @staticmethod
    def from_dict(obj: Any) -> 'UserConfirmation':
        assert isinstance(obj, dict)
        channel = ConfirmChannel(obj.get("channel"))
        confirmation_id = from_str(obj.get("confirmation_id"))
        confirmed_at = from_datetime(obj.get("confirmed_at"))
        decision = Decision(obj.get("decision"))
        evidence = ConfirmationEvidence.from_dict(obj.get("evidence"))
        payload_hash = from_str(obj.get("payload_hash"))
        proposal_id = from_str(obj.get("proposal_id"))
        schema = UserConfirmationSchema(obj.get("schema"))
        session_id = from_str(obj.get("session_id"))
        signature = from_str(obj.get("signature"))
        user_ref = from_str(obj.get("user_ref"))
        return UserConfirmation(channel, confirmation_id, confirmed_at, decision, evidence, payload_hash, proposal_id, schema, session_id, signature, user_ref)

    def to_dict(self) -> dict:
        result: dict = {}
        result["channel"] = to_enum(ConfirmChannel, self.channel)
        result["confirmation_id"] = from_str(self.confirmation_id)
        result["confirmed_at"] = self.confirmed_at.isoformat()
        result["decision"] = to_enum(Decision, self.decision)
        result["evidence"] = to_class(ConfirmationEvidence, self.evidence)
        result["payload_hash"] = from_str(self.payload_hash)
        result["proposal_id"] = from_str(self.proposal_id)
        result["schema"] = to_enum(UserConfirmationSchema, self.schema)
        result["session_id"] = from_str(self.session_id)
        result["signature"] = from_str(self.signature)
        result["user_ref"] = from_str(self.user_ref)
        return result


@dataclass
class TurnContext:
    conversation_ref: str
    recent_turns: List[ConversationTurn]
    active_capability: Optional[str] = None
    pending_proposal_id: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'TurnContext':
        assert isinstance(obj, dict)
        conversation_ref = from_str(obj.get("conversation_ref"))
        recent_turns = from_list(ConversationTurn.from_dict, obj.get("recent_turns"))
        active_capability = from_union([from_none, from_str], obj.get("active_capability"))
        pending_proposal_id = from_union([from_none, from_str], obj.get("pending_proposal_id"))
        return TurnContext(conversation_ref, recent_turns, active_capability, pending_proposal_id)

    def to_dict(self) -> dict:
        result: dict = {}
        result["conversation_ref"] = from_str(self.conversation_ref)
        result["recent_turns"] = from_list(lambda x: to_class(ConversationTurn, x), self.recent_turns)
        result["active_capability"] = from_union([from_none, from_str], self.active_capability)
        result["pending_proposal_id"] = from_union([from_none, from_str], self.pending_proposal_id)
        return result


class Invocation(Enum):
    GLASSES_INPUT = "glasses_input"
    HEY_META = "hey_meta"
    PHONE_PUSH_TO_TALK = "phone_push_to_talk"
    TYPED = "typed"


@dataclass
class OutputPreferences:
    discreet_mode: bool
    """When true, spoken output must not contain amounts; details go to the phone."""

    display: OutputDisplay
    speech: bool

    @staticmethod
    def from_dict(obj: Any) -> 'OutputPreferences':
        assert isinstance(obj, dict)
        discreet_mode = from_bool(obj.get("discreet_mode"))
        display = OutputDisplay(obj.get("display"))
        speech = from_bool(obj.get("speech"))
        return OutputPreferences(discreet_mode, display, speech)

    def to_dict(self) -> dict:
        result: dict = {}
        result["discreet_mode"] = from_bool(self.discreet_mode)
        result["display"] = to_enum(OutputDisplay, self.display)
        result["speech"] = from_bool(self.speech)
        return result


class PlatformIntent(Enum):
    CANCEL = "cancel"
    CONFIRM = "confirm"
    NEXT_CARD = "next_card"
    REJECT = "reject"
    REPEAT = "repeat"
    SHOW_ON_PHONE = "show_on_phone"
    STOP = "stop"


class VoiceIntentSchema(Enum):
    PLATFORM_VOICE_INTENT_V1 = "platform.voice_intent/v1"


@dataclass
class Transcript:
    lang: str
    text: str
    asr_provider: Optional[str] = None
    confidence: Optional[float] = None

    @staticmethod
    def from_dict(obj: Any) -> 'Transcript':
        assert isinstance(obj, dict)
        lang = from_str(obj.get("lang"))
        text = from_str(obj.get("text"))
        asr_provider = from_union([from_str, from_none], obj.get("asr_provider"))
        confidence = from_union([from_float, from_none], obj.get("confidence"))
        return Transcript(lang, text, asr_provider, confidence)

    def to_dict(self) -> dict:
        result: dict = {}
        result["lang"] = from_str(self.lang)
        result["text"] = from_str(self.text)
        if self.asr_provider is not None:
            result["asr_provider"] = from_union([from_str, from_none], self.asr_provider)
        if self.confidence is not None:
            result["confidence"] = from_union([to_float, from_none], self.confidence)
        return result


@dataclass
class VoiceIntent:
    """One user turn from the companion: an utterance (transcribed on the phone) and/or a
    glasses input. The platform only recognises platform intents (confirm, cancel, ...);
    domain intent recognition belongs to the capability.
    """
    attached_capture_ids: List[str]
    context: TurnContext
    device_capabilities: List[DeviceCapability]
    invocation: Invocation
    output: OutputPreferences
    schema: VoiceIntentSchema
    session_id: str
    turn_id: str
    user_ref: str
    capability_hint: Optional[str] = None
    input: Optional[GlassesInput] = None
    platform_intent: Optional[PlatformIntent] = None
    transcript: Optional[Transcript] = None

    @staticmethod
    def from_dict(obj: Any) -> 'VoiceIntent':
        assert isinstance(obj, dict)
        attached_capture_ids = from_list(from_str, obj.get("attached_capture_ids"))
        context = TurnContext.from_dict(obj.get("context"))
        device_capabilities = from_list(DeviceCapability, obj.get("device_capabilities"))
        invocation = Invocation(obj.get("invocation"))
        output = OutputPreferences.from_dict(obj.get("output"))
        schema = VoiceIntentSchema(obj.get("schema"))
        session_id = from_str(obj.get("session_id"))
        turn_id = from_str(obj.get("turn_id"))
        user_ref = from_str(obj.get("user_ref"))
        capability_hint = from_union([from_none, from_str], obj.get("capability_hint"))
        input = from_union([GlassesInput.from_dict, from_none], obj.get("input"))
        platform_intent = from_union([from_none, PlatformIntent], obj.get("platform_intent"))
        transcript = from_union([Transcript.from_dict, from_none], obj.get("transcript"))
        return VoiceIntent(attached_capture_ids, context, device_capabilities, invocation, output, schema, session_id, turn_id, user_ref, capability_hint, input, platform_intent, transcript)

    def to_dict(self) -> dict:
        result: dict = {}
        result["attached_capture_ids"] = from_list(from_str, self.attached_capture_ids)
        result["context"] = to_class(TurnContext, self.context)
        result["device_capabilities"] = from_list(lambda x: to_enum(DeviceCapability, x), self.device_capabilities)
        result["invocation"] = to_enum(Invocation, self.invocation)
        result["output"] = to_class(OutputPreferences, self.output)
        result["schema"] = to_enum(VoiceIntentSchema, self.schema)
        result["session_id"] = from_str(self.session_id)
        result["turn_id"] = from_str(self.turn_id)
        result["user_ref"] = from_str(self.user_ref)
        result["capability_hint"] = from_union([from_none, from_str], self.capability_hint)
        if self.input is not None:
            result["input"] = from_union([lambda x: to_class(GlassesInput, x), from_none], self.input)
        result["platform_intent"] = from_union([from_none, lambda x: to_enum(PlatformIntent, x)], self.platform_intent)
        if self.transcript is not None:
            result["transcript"] = from_union([lambda x: to_class(Transcript, x), from_none], self.transcript)
        return result


@dataclass
class ContractsIndex:
    action_kind: Optional[str] = None
    action_proposal: Optional[ActionProposal] = None
    action_result: Optional[ActionResult] = None
    affordability_result: Optional[AffordabilityResult] = None
    capability_id: Optional[str] = None
    confidence: Optional[Risk] = None
    confirm_channel: Optional[ConfirmChannel] = None
    context_capture: Optional[ContextCapture] = None
    conversation_turn: Optional[ConversationTurn] = None
    data_mode: Optional[DataMode] = None
    date: Optional[datetime] = None
    decimal_string: Optional[str] = None
    deterministic_tool: Optional[DeterministicTool] = None
    device_capability: Optional[DeviceCapability] = None
    device_session_state: Optional[DeviceSessionState] = None
    domain_capability: Optional[DomainCapability] = None
    domain_event: Optional[DomainEvent] = None
    domain_request: Optional[DomainRequest] = None
    domain_response: Optional[DomainResponse] = None
    domain_response_event: Optional[DomainResponseEvent] = None
    epistemic: Optional[Epistemic] = None
    error_envelope: Optional[ErrorEnvelope] = None
    error_info: Optional[ErrorInfo] = None
    finance_action_kind: Optional[FinanceActionKind] = None
    finance_intent: Optional[FinanceIntent] = None
    finance_tool_name: Optional[FinanceToolName] = None
    glasses_input: Optional[GlassesInput] = None
    golden_case: Optional[GoldenCase] = None
    insight_card: Optional[InsightCard] = None
    intent_id: Optional[str] = None
    locale: Optional[str] = None
    l_text: Optional[Dict[str, str]] = None
    media_uri: Optional[str] = None
    missing_data: Optional[MissingData] = None
    missing_data_code: Optional[MissingDataCode] = None
    model_provider: Optional[ModelProvider] = None
    money: Optional[Money] = None
    observation: Optional[Observation] = None
    output_display: Optional[OutputDisplay] = None
    probability: Optional[float] = None
    ref: Optional[str] = None
    risk: Optional[Risk] = None
    safe_to_spend_result: Optional[SafeToSpendResult] = None
    sha256: Optional[str] = None
    timestamp: Optional[datetime] = None
    tool_result: Optional[ToolResult] = None
    user_confirmation: Optional[UserConfirmation] = None
    voice_intent: Optional[VoiceIntent] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ContractsIndex':
        assert isinstance(obj, dict)
        action_kind = from_union([from_str, from_none], obj.get("ActionKind"))
        action_proposal = from_union([ActionProposal.from_dict, from_none], obj.get("ActionProposal"))
        action_result = from_union([ActionResult.from_dict, from_none], obj.get("ActionResult"))
        affordability_result = from_union([AffordabilityResult.from_dict, from_none], obj.get("AffordabilityResult"))
        capability_id = from_union([from_str, from_none], obj.get("CapabilityId"))
        confidence = from_union([Risk, from_none], obj.get("Confidence"))
        confirm_channel = from_union([ConfirmChannel, from_none], obj.get("ConfirmChannel"))
        context_capture = from_union([ContextCapture.from_dict, from_none], obj.get("ContextCapture"))
        conversation_turn = from_union([ConversationTurn.from_dict, from_none], obj.get("ConversationTurn"))
        data_mode = from_union([DataMode, from_none], obj.get("DataMode"))
        date = from_union([from_datetime, from_none], obj.get("Date"))
        decimal_string = from_union([from_str, from_none], obj.get("DecimalString"))
        deterministic_tool = from_union([DeterministicTool.from_dict, from_none], obj.get("DeterministicTool"))
        device_capability = from_union([DeviceCapability, from_none], obj.get("DeviceCapability"))
        device_session_state = from_union([DeviceSessionState.from_dict, from_none], obj.get("DeviceSessionState"))
        domain_capability = from_union([DomainCapability.from_dict, from_none], obj.get("DomainCapability"))
        domain_event = from_union([DomainEvent.from_dict, from_none], obj.get("DomainEvent"))
        domain_request = from_union([DomainRequest.from_dict, from_none], obj.get("DomainRequest"))
        domain_response = from_union([DomainResponse.from_dict, from_none], obj.get("DomainResponse"))
        domain_response_event = from_union([DomainResponseEvent.from_dict, from_none], obj.get("DomainResponseEvent"))
        epistemic = from_union([Epistemic, from_none], obj.get("Epistemic"))
        error_envelope = from_union([ErrorEnvelope.from_dict, from_none], obj.get("ErrorEnvelope"))
        error_info = from_union([ErrorInfo.from_dict, from_none], obj.get("ErrorInfo"))
        finance_action_kind = from_union([FinanceActionKind, from_none], obj.get("FinanceActionKind"))
        finance_intent = from_union([FinanceIntent, from_none], obj.get("FinanceIntent"))
        finance_tool_name = from_union([FinanceToolName, from_none], obj.get("FinanceToolName"))
        glasses_input = from_union([GlassesInput.from_dict, from_none], obj.get("GlassesInput"))
        golden_case = from_union([GoldenCase.from_dict, from_none], obj.get("GoldenCase"))
        insight_card = from_union([InsightCard.from_dict, from_none], obj.get("InsightCard"))
        intent_id = from_union([from_str, from_none], obj.get("IntentId"))
        locale = from_union([from_str, from_none], obj.get("Locale"))
        l_text = from_union([lambda x: from_dict(from_str, x), from_none], obj.get("LText"))
        media_uri = from_union([from_str, from_none], obj.get("MediaUri"))
        missing_data = from_union([MissingData.from_dict, from_none], obj.get("MissingData"))
        missing_data_code = from_union([MissingDataCode, from_none], obj.get("MissingDataCode"))
        model_provider = from_union([ModelProvider.from_dict, from_none], obj.get("ModelProvider"))
        money = from_union([Money.from_dict, from_none], obj.get("Money"))
        observation = from_union([Observation.from_dict, from_none], obj.get("Observation"))
        output_display = from_union([OutputDisplay, from_none], obj.get("OutputDisplay"))
        probability = from_union([from_float, from_none], obj.get("Probability"))
        ref = from_union([from_str, from_none], obj.get("Ref"))
        risk = from_union([Risk, from_none], obj.get("Risk"))
        safe_to_spend_result = from_union([SafeToSpendResult.from_dict, from_none], obj.get("SafeToSpendResult"))
        sha256 = from_union([from_str, from_none], obj.get("Sha256"))
        timestamp = from_union([from_datetime, from_none], obj.get("Timestamp"))
        tool_result = from_union([ToolResult.from_dict, from_none], obj.get("ToolResult"))
        user_confirmation = from_union([UserConfirmation.from_dict, from_none], obj.get("UserConfirmation"))
        voice_intent = from_union([VoiceIntent.from_dict, from_none], obj.get("VoiceIntent"))
        return ContractsIndex(action_kind, action_proposal, action_result, affordability_result, capability_id, confidence, confirm_channel, context_capture, conversation_turn, data_mode, date, decimal_string, deterministic_tool, device_capability, device_session_state, domain_capability, domain_event, domain_request, domain_response, domain_response_event, epistemic, error_envelope, error_info, finance_action_kind, finance_intent, finance_tool_name, glasses_input, golden_case, insight_card, intent_id, locale, l_text, media_uri, missing_data, missing_data_code, model_provider, money, observation, output_display, probability, ref, risk, safe_to_spend_result, sha256, timestamp, tool_result, user_confirmation, voice_intent)

    def to_dict(self) -> dict:
        result: dict = {}
        if self.action_kind is not None:
            result["ActionKind"] = from_union([from_str, from_none], self.action_kind)
        if self.action_proposal is not None:
            result["ActionProposal"] = from_union([lambda x: to_class(ActionProposal, x), from_none], self.action_proposal)
        if self.action_result is not None:
            result["ActionResult"] = from_union([lambda x: to_class(ActionResult, x), from_none], self.action_result)
        if self.affordability_result is not None:
            result["AffordabilityResult"] = from_union([lambda x: to_class(AffordabilityResult, x), from_none], self.affordability_result)
        if self.capability_id is not None:
            result["CapabilityId"] = from_union([from_str, from_none], self.capability_id)
        if self.confidence is not None:
            result["Confidence"] = from_union([lambda x: to_enum(Risk, x), from_none], self.confidence)
        if self.confirm_channel is not None:
            result["ConfirmChannel"] = from_union([lambda x: to_enum(ConfirmChannel, x), from_none], self.confirm_channel)
        if self.context_capture is not None:
            result["ContextCapture"] = from_union([lambda x: to_class(ContextCapture, x), from_none], self.context_capture)
        if self.conversation_turn is not None:
            result["ConversationTurn"] = from_union([lambda x: to_class(ConversationTurn, x), from_none], self.conversation_turn)
        if self.data_mode is not None:
            result["DataMode"] = from_union([lambda x: to_enum(DataMode, x), from_none], self.data_mode)
        if self.date is not None:
            result["Date"] = from_union([lambda x: x.isoformat(), from_none], self.date)
        if self.decimal_string is not None:
            result["DecimalString"] = from_union([from_str, from_none], self.decimal_string)
        if self.deterministic_tool is not None:
            result["DeterministicTool"] = from_union([lambda x: to_class(DeterministicTool, x), from_none], self.deterministic_tool)
        if self.device_capability is not None:
            result["DeviceCapability"] = from_union([lambda x: to_enum(DeviceCapability, x), from_none], self.device_capability)
        if self.device_session_state is not None:
            result["DeviceSessionState"] = from_union([lambda x: to_class(DeviceSessionState, x), from_none], self.device_session_state)
        if self.domain_capability is not None:
            result["DomainCapability"] = from_union([lambda x: to_class(DomainCapability, x), from_none], self.domain_capability)
        if self.domain_event is not None:
            result["DomainEvent"] = from_union([lambda x: to_class(DomainEvent, x), from_none], self.domain_event)
        if self.domain_request is not None:
            result["DomainRequest"] = from_union([lambda x: to_class(DomainRequest, x), from_none], self.domain_request)
        if self.domain_response is not None:
            result["DomainResponse"] = from_union([lambda x: to_class(DomainResponse, x), from_none], self.domain_response)
        if self.domain_response_event is not None:
            result["DomainResponseEvent"] = from_union([lambda x: to_class(DomainResponseEvent, x), from_none], self.domain_response_event)
        if self.epistemic is not None:
            result["Epistemic"] = from_union([lambda x: to_enum(Epistemic, x), from_none], self.epistemic)
        if self.error_envelope is not None:
            result["ErrorEnvelope"] = from_union([lambda x: to_class(ErrorEnvelope, x), from_none], self.error_envelope)
        if self.error_info is not None:
            result["ErrorInfo"] = from_union([lambda x: to_class(ErrorInfo, x), from_none], self.error_info)
        if self.finance_action_kind is not None:
            result["FinanceActionKind"] = from_union([lambda x: to_enum(FinanceActionKind, x), from_none], self.finance_action_kind)
        if self.finance_intent is not None:
            result["FinanceIntent"] = from_union([lambda x: to_enum(FinanceIntent, x), from_none], self.finance_intent)
        if self.finance_tool_name is not None:
            result["FinanceToolName"] = from_union([lambda x: to_enum(FinanceToolName, x), from_none], self.finance_tool_name)
        if self.glasses_input is not None:
            result["GlassesInput"] = from_union([lambda x: to_class(GlassesInput, x), from_none], self.glasses_input)
        if self.golden_case is not None:
            result["GoldenCase"] = from_union([lambda x: to_class(GoldenCase, x), from_none], self.golden_case)
        if self.insight_card is not None:
            result["InsightCard"] = from_union([lambda x: to_class(InsightCard, x), from_none], self.insight_card)
        if self.intent_id is not None:
            result["IntentId"] = from_union([from_str, from_none], self.intent_id)
        if self.locale is not None:
            result["Locale"] = from_union([from_str, from_none], self.locale)
        if self.l_text is not None:
            result["LText"] = from_union([lambda x: from_dict(from_str, x), from_none], self.l_text)
        if self.media_uri is not None:
            result["MediaUri"] = from_union([from_str, from_none], self.media_uri)
        if self.missing_data is not None:
            result["MissingData"] = from_union([lambda x: to_class(MissingData, x), from_none], self.missing_data)
        if self.missing_data_code is not None:
            result["MissingDataCode"] = from_union([lambda x: to_enum(MissingDataCode, x), from_none], self.missing_data_code)
        if self.model_provider is not None:
            result["ModelProvider"] = from_union([lambda x: to_class(ModelProvider, x), from_none], self.model_provider)
        if self.money is not None:
            result["Money"] = from_union([lambda x: to_class(Money, x), from_none], self.money)
        if self.observation is not None:
            result["Observation"] = from_union([lambda x: to_class(Observation, x), from_none], self.observation)
        if self.output_display is not None:
            result["OutputDisplay"] = from_union([lambda x: to_enum(OutputDisplay, x), from_none], self.output_display)
        if self.probability is not None:
            result["Probability"] = from_union([to_float, from_none], self.probability)
        if self.ref is not None:
            result["Ref"] = from_union([from_str, from_none], self.ref)
        if self.risk is not None:
            result["Risk"] = from_union([lambda x: to_enum(Risk, x), from_none], self.risk)
        if self.safe_to_spend_result is not None:
            result["SafeToSpendResult"] = from_union([lambda x: to_class(SafeToSpendResult, x), from_none], self.safe_to_spend_result)
        if self.sha256 is not None:
            result["Sha256"] = from_union([from_str, from_none], self.sha256)
        if self.timestamp is not None:
            result["Timestamp"] = from_union([lambda x: x.isoformat(), from_none], self.timestamp)
        if self.tool_result is not None:
            result["ToolResult"] = from_union([lambda x: to_class(ToolResult, x), from_none], self.tool_result)
        if self.user_confirmation is not None:
            result["UserConfirmation"] = from_union([lambda x: to_class(UserConfirmation, x), from_none], self.user_confirmation)
        if self.voice_intent is not None:
            result["VoiceIntent"] = from_union([lambda x: to_class(VoiceIntent, x), from_none], self.voice_intent)
        return result


def contracts_index_from_dict(s: Any) -> ContractsIndex:
    return ContractsIndex.from_dict(s)


def contracts_index_to_dict(x: ContractsIndex) -> Any:
    return to_class(ContractsIndex, x)
