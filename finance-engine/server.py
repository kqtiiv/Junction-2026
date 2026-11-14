"""HTTP service in front of the S-Bank Coach team's money engine (DEC-024).

    finance-engine/.venv/bin/uvicorn server:app --app-dir finance-engine --port 8790

Endpoints (all JSON; money as decimal strings; every result has a calc_id):
    GET  /health
    POST /v1/tools/safe_to_spend     {user_ref, planned_total?}
    POST /v1/tools/affordability     {user_ref, amount, price_source, observation_id?, planned_total?}
    POST /v1/tools/baskets           {user_ref}
    GET  /v1/calculations/{calc_id}?user_ref=...   (what the backend's verifier calls)

Configuration:
    PET_ROOT        the team's repo (default ../../finance-agent/personal-economic-trainer)
    PET_DATA/OUT    dataset and prepared files (default finance-engine/.data/raw, .data/out)
    FINANCE_AS_OF   simulated "today" inside the synthetic dataset (default 2026-09-05)
    FINANCE_USERS   platform user_ref -> dataset customer, "u_7f3a:CUST04069,..."
"""
from __future__ import annotations

import os
import re
from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from pet_adapter import Engine, PET_ROOT

AS_OF = date.fromisoformat(os.environ.get("FINANCE_AS_OF", "2026-09-05"))
USERS = dict(pair.split(":", 1) for pair in os.environ.get("FINANCE_USERS", "u_7f3a:CUST04069").split(",") if pair)
DECIMAL = r"^(0|[1-9][0-9]*)\.[0-9]{2}$"
REF = r"^[A-Za-z0-9][A-Za-z0-9_.:@-]*$"

engine = Engine()
for ref, cid in USERS.items():
    if not engine.customer_exists(cid):
        raise SystemExit(f"FINANCE_USERS maps {ref} to unknown customer {cid}")

# calc_id -> result, per user. In memory: the backend resolves within the same demo session.
LOG: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)

app = FastAPI(title="S-Bank Coach engine service", version="0.1.0")


def _error(status: int, code: str, message: str, retryable: bool = False) -> JSONResponse:
    return JSONResponse(status_code=status, content={"code": code, "message": message, "retryable": retryable})


def _customer(user_ref: str) -> str:
    cid = USERS.get(user_ref)
    if cid is None:
        raise HTTPException(status_code=404, detail="CUSTOMER_NOT_LINKED")
    return cid


def _log(user_ref: str, *results: dict[str, Any]) -> None:
    for r in results:
        LOG[user_ref][r["calc_id"]] = r


class StsIn(BaseModel):
    user_ref: str = Field(pattern=REF, max_length=128)
    planned_total: str = Field(default="0.00", pattern=DECIMAL)


class AffIn(StsIn):
    amount: str = Field(pattern=DECIMAL)
    price_source: Literal["basket", "stated_amount", "observation"]
    observation_id: str | None = Field(default=None, pattern=REF, max_length=128)


class UserIn(BaseModel):
    user_ref: str = Field(pattern=REF, max_length=128)


@app.exception_handler(HTTPException)
async def _http_error(_req, exc: HTTPException):
    return _error(exc.status_code, str(exc.detail), str(exc.detail))


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "engine": "personal-economic-trainer", "engine_commit": engine.commit,
            "engine_root": str(PET_ROOT), "buffer": engine.buffer, "as_of": AS_OF.isoformat(),
            "simulated_date": True, "users": len(USERS)}


@app.post("/v1/tools/safe_to_spend")
def safe_to_spend(body: StsIn) -> dict[str, Any]:
    r = engine.safe_to_spend(_customer(body.user_ref), AS_OF, Decimal(body.planned_total))
    _log(body.user_ref, r)
    return r


@app.post("/v1/tools/affordability")
def affordability(body: AffIn) -> dict[str, Any]:
    if body.price_source == "observation" and not body.observation_id:
        raise HTTPException(status_code=422, detail="OBSERVATION_ID_REQUIRED")
    aff, sts = engine.affordability(_customer(body.user_ref), AS_OF, Decimal(body.amount), body.price_source,
                                    body.observation_id, Decimal(body.planned_total))
    _log(body.user_ref, aff, sts)
    return {"result": aff, "sts": sts}


@app.post("/v1/tools/baskets")
def baskets(body: UserIn) -> dict[str, Any]:
    r = engine.baskets(_customer(body.user_ref), AS_OF)
    _log(body.user_ref, r)
    return r


@app.get("/v1/calculations/{calc_id}")
def calculation(calc_id: str, user_ref: str) -> dict[str, Any]:
    if not re.match(REF, calc_id):
        raise HTTPException(status_code=422, detail="VALIDATION_FAILED")
    r = LOG.get(user_ref, {}).get(calc_id)
    if r is None:  # unknown, or another user's calculation: same answer either way
        raise HTTPException(status_code=404, detail="CALCULATION_NOT_FOUND")
    return r
