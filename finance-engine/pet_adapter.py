"""Boundary between the team's money engine and our contracts.

The engine (../finance-agent/personal-economic-trainer, src/engine.py) is the only source of
money figures (DEC-019). This module imports it unchanged and converts what it returns:

- floats rounded to cents become contract decimal strings ("90.16"), never floats;
- every result becomes a platform.tool_result/v1 with a calc_id, so the backend's verifier
  can resolve each number it is about to speak or show;
- the engine's commit and buffer configuration are recorded on every result.

Two figures are computed here because the engine has no function for them yet. Both are
labelled in `assumptions` and should move into the engine (see README):
- affordability: price against the money free until payday, with the reference thresholds;
- planned purchases the user confirmed, which reduce the money free until payday.
"""
from __future__ import annotations

import os
import subprocess
import sys
import threading
import uuid
from datetime import date
from decimal import ROUND_DOWN, ROUND_HALF_EVEN, Decimal
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
PET_ROOT = Path(os.environ.get("PET_ROOT", HERE.parent.parent / "finance-agent" / "personal-economic-trainer")).resolve()
os.environ.setdefault("PET_DATA", str(HERE / ".data" / "raw"))
os.environ.setdefault("PET_OUT", str(HERE / ".data" / "out"))
os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
sys.dont_write_bytecode = True  # never write __pycache__ into the engine's repo

CENT = Decimal("0.01")
TOOL_VERSION_PREFIX = "pet@"


def _engine_commit() -> str:
    try:
        sha = subprocess.run(["git", "-C", str(PET_ROOT), "rev-parse", "--short", "HEAD"],
                             capture_output=True, text=True, check=True).stdout.strip()
        dirty = subprocess.run(["git", "-C", str(PET_ROOT), "status", "--porcelain", "--", "src"],
                               capture_output=True, text=True, check=True).stdout.strip()
        return f"{sha}{'-dirty' if dirty else ''}"
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def money(x: float | int | Decimal) -> dict[str, str]:
    """Engine float (already rounded to cents) -> contract Money. Goes through repr, not binary."""
    d = x if isinstance(x, Decimal) else Decimal(repr(float(x)))
    d = d.quantize(CENT, rounding=ROUND_HALF_EVEN)
    if d == 0:
        d = Decimal("0.00")  # no "-0.00"
    return {"amount": f"{d:.2f}", "currency": "EUR"}


def dec(m: dict[str, str]) -> Decimal:
    return Decimal(m["amount"])


def per_day(total: Decimal, days: int) -> Decimal:
    """Money per day, rounded down to the cent so the figure is never more than is safe."""
    return (max(total, Decimal(0)) / max(days, 1)).quantize(CENT, rounding=ROUND_DOWN)


class Engine:
    """Loads the team's engine once; calls are serialised (it shares one DuckDB connection)."""

    def __init__(self) -> None:
        sys.path.insert(0, str(PET_ROOT / "src"))
        import engine as pet  # noqa: E402  (the team's module, unchanged)

        self.pet = pet
        self.commit = _engine_commit()
        self.version = f"{TOOL_VERSION_PREFIX}{self.commit}"[:32]
        self.buffer = pet.PARAMS.get("config", "unknown")
        self._lock = threading.Lock()

    def customer_exists(self, cid: str) -> bool:
        return cid in self.pet._cust.index

    def _call(self, fn: str, *args: Any) -> dict[str, Any]:
        with self._lock:
            return getattr(self.pet, fn)(*args)

    # ---- tools -------------------------------------------------------------------------

    def safe_to_spend(self, cid: str, as_of: date, planned_total: Decimal) -> dict[str, Any]:
        raw = self._call("safe_to_spend", cid, as_of.isoformat())
        days = int(raw["days_to_payday"])
        free = dec(money(raw["free_until_payday"]))
        free_after_plans = max(free - planned_total, Decimal(0))
        # With no plans, the daily figure is the engine's own; with plans it is recomputed here.
        today = dec(money(raw["safe_to_spend_today"])) if planned_total == 0 else per_day(free_after_plans, days)
        result = {
            "as_of_date": raw["as_of"],
            "balance": money(raw["balance"]),
            "next_payday": raw["next_payday"],
            "days_to_payday": days,
            "reserved": {k: money(v) for k, v in raw["reserved"].items()},
            "free_until_payday": money(free_after_plans),
            "safe_to_spend_today": money(today),
            "flexible_spent_this_cycle": money(raw["flexible_spent_this_cycle"]),
            "planned_total": money(planned_total),
            "status": "ok" if raw["status"] == "ok" else "at_risk",
        }
        assumptions = [
            "Bills still due, irregular reserve and savings are estimated from your previous pay cycles",
            f"Next payday estimated from your usual salary day ({raw['next_payday']})",
            f"Safety buffer: {self.buffer}",
        ]
        if planned_total > 0:
            assumptions.append(f"Includes {money(planned_total)['amount']} EUR of confirmed planned purchases "
                               "(subtracted outside the engine; interim)")
        warnings = [] if result["status"] == "ok" else ["Money reserved for bills exceeds the balance: pause flexible spending"]
        return self._envelope("sts", "finance.get_safe_to_spend_until_payday", result, assumptions, warnings, as_of)

    def affordability(self, cid: str, as_of: date, amount: Decimal, price_source: str,
                      observation_id: str | None, planned_total: Decimal) -> tuple[dict[str, Any], dict[str, Any]]:
        sts = self.safe_to_spend(cid, as_of, planned_total)
        r = sts["result"]
        free = dec(r["free_until_payday"])
        remaining = free - amount
        if remaining < 0:
            verdict = "EXCEEDS"
        elif remaining * 4 >= free:
            verdict = "FITS"   # at least 25 % of the money free until payday is left
        else:
            verdict = "TIGHT"
        result = {
            "amount_checked": money(amount),
            "price_source": price_source,
            **({"observation_id": observation_id} if observation_id else {}),
            "verdict": verdict,
            "safe_to_spend_week": None,  # this engine works until payday, not by week
            "remaining_after": money(remaining),
            "period": "until_payday",
            "free_until_payday": r["free_until_payday"],
            "days_to_payday": r["days_to_payday"],
            "next_payday": r["next_payday"],
            "safe_per_day_after": money(per_day(remaining, r["days_to_payday"])),
        }
        assumptions = list(sts["assumptions"])
        assumptions.insert(0, {"observation": "Price read from the shelf label",
                               "stated_amount": "Amount as stated by the user",
                               "basket": "Basket total"}[price_source])
        assumptions.append("Verdict computed outside the engine (interim): fits if at least 25 % of the money "
                           "free until payday is left, tight if less, exceeds if below zero")
        aff = self._envelope("aff", "finance.calculate_affordability", result, assumptions, list(sts["warnings"]), as_of)
        return aff, sts

    def baskets(self, cid: str, as_of: date) -> dict[str, Any]:
        raw = self._call("baskets", cid, as_of.isoformat())
        result = {
            "months": 12,
            "income_month": money(raw["income_eur_month"]),
            "savings_month": money(raw["savings_eur_month"]),
            "baskets": {
                b: {"label": raw["labels"][b], "total_month": money(raw[b]["total_eur_month"]),
                    "items": [{"category": k, "month": money(v)} for k, v in raw[b]["items"].items()]}
                for b in ("regular", "irregular", "flexible")
            },
        }
        return self._envelope("bsk", "finance.get_basket_breakdown", result,
                              ["Monthly averages over the last 12 months"], [], as_of)

    # ---- envelope ----------------------------------------------------------------------

    def _envelope(self, kind: str, tool: str, result: dict[str, Any], assumptions: list[str],
                  warnings: list[str], as_of: date) -> dict[str, Any]:
        return {
            "schema": "platform.tool_result/v1",
            "ok": True,
            "calc_id": f"calc_{kind}_{uuid.uuid4().hex[:10]}",
            "tool": tool,
            "tool_version": self.version,
            "epistemic": "estimate",
            "data_mode": "balance",
            # The dataset is synthetic history, so "today" is a fixed simulated date (hackathon mock).
            "as_of": f"{as_of.isoformat()}T08:00:00+03:00",
            "result": result,
            "assumptions": assumptions + [f"Simulated date {as_of.isoformat()} on S-Pankki's synthetic Junction 2026 dataset"],
            "missing_data": [],
            "warnings": warnings,
            "confidence": "medium",
            "x_engine": {"repo": "personal-economic-trainer", "commit": self.commit, "buffer": self.buffer},
        }
