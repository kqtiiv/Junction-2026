"""Tests for the engine service. Needs the prepared data (see README): .venv/bin/pytest -q"""
import json
import os
from decimal import Decimal
from pathlib import Path

os.environ.setdefault("FINANCE_USERS", "u_7f3a:CUST04069,u_risk:CUST03420")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from jsonschema import Draft7Validator  # noqa: E402
from referencing import Registry, Resource  # noqa: E402

import server  # noqa: E402

client = TestClient(server.app)
SCHEMAS = Path(__file__).resolve().parent.parent / "contracts" / "schemas" / "v1"
BASE = "https://contracts.example/v1/"


def _registry() -> Registry:
    reg = Registry()
    for p in SCHEMAS.rglob("*.schema.json"):
        doc = json.loads(p.read_text(encoding="utf-8"))
        reg = reg.with_resource(BASE + p.relative_to(SCHEMAS).as_posix(), Resource.from_contents(doc))
    return reg


TOOL_RESULT = Draft7Validator({"$ref": BASE + "tool_result.schema.json"}, registry=_registry())


def assert_contract_money(node, path="result"):
    """No floats anywhere; every Money is a 2-decimal string."""
    if isinstance(node, float):
        pytest.fail(f"float at {path}: {node}")
    if isinstance(node, dict):
        if set(node) == {"amount", "currency"}:
            assert node["currency"] == "EUR"
            Decimal(node["amount"])
            assert node["amount"].lstrip("-").count(".") == 1 and len(node["amount"].split(".")[1]) == 2, path
        for k, v in node.items():
            assert_contract_money(v, f"{path}.{k}")
    if isinstance(node, list):
        for i, v in enumerate(node):
            assert_contract_money(v, f"{path}[{i}]")


def assert_tool_result(r):
    errors = [e.message for e in TOOL_RESULT.iter_errors(r)]
    assert not errors, errors
    assert_contract_money(r["result"])


def sts(user="u_7f3a", planned="0.00"):
    res = client.post("/v1/tools/safe_to_spend", json={"user_ref": user, "planned_total": planned})
    assert res.status_code == 200, res.text
    return res.json()


def test_safe_to_spend_is_the_engines_figure_as_a_contract():
    r = sts()
    assert_tool_result(r)
    raw = server.engine.pet.safe_to_spend("CUST04069", server.AS_OF.isoformat())
    assert r["result"]["safe_to_spend_today"]["amount"] == f"{Decimal(repr(float(raw['safe_to_spend_today']))):.2f}"
    assert r["result"]["free_until_payday"]["amount"] == f"{Decimal(repr(float(raw['free_until_payday']))):.2f}"
    assert r["result"]["days_to_payday"] == raw["days_to_payday"]
    assert r["tool"] == "finance.get_safe_to_spend_until_payday"
    assert r["calc_id"].startswith("calc_sts_")


def test_planned_purchases_reduce_the_money_free_until_payday():
    base = sts()["result"]
    after = sts(planned="10.00")["result"]
    free = Decimal(base["free_until_payday"]["amount"])
    assert Decimal(after["free_until_payday"]["amount"]) == max(free - Decimal("10.00"), Decimal(0))
    assert Decimal(after["safe_to_spend_today"]["amount"]) <= Decimal(base["safe_to_spend_today"]["amount"])


@pytest.mark.parametrize("amount,expected", [("0.01", "FITS"), ("999999.00", "EXCEEDS")])
def test_affordability_verdicts_and_exact_remaining(amount, expected):
    res = client.post("/v1/tools/affordability", json={"user_ref": "u_7f3a", "amount": amount, "price_source": "stated_amount"})
    assert res.status_code == 200, res.text
    aff, s = res.json()["result"], res.json()["sts"]
    assert_tool_result(aff)
    assert_tool_result(s)
    r = aff["result"]
    free = Decimal(s["result"]["free_until_payday"]["amount"])
    assert Decimal(r["remaining_after"]["amount"]) == free - Decimal(amount)
    assert free > 0, "demo customer must have money free until payday"
    assert r["verdict"] == expected
    assert r["safe_to_spend_week"] is None and r["period"] == "until_payday"


def test_observation_needs_an_observation_id():
    res = client.post("/v1/tools/affordability", json={"user_ref": "u_7f3a", "amount": "79.90", "price_source": "observation"})
    assert res.status_code == 422


def test_calculations_resolve_only_for_their_owner():
    r = sts()
    own = client.get(f"/v1/calculations/{r['calc_id']}", params={"user_ref": "u_7f3a"})
    assert own.status_code == 200 and own.json() == r
    assert client.get(f"/v1/calculations/{r['calc_id']}", params={"user_ref": "u_risk"}).status_code == 404
    assert client.get("/v1/calculations/calc_sts_nope", params={"user_ref": "u_7f3a"}).status_code == 404


def test_unlinked_user_and_bad_amounts_are_refused():
    assert client.post("/v1/tools/safe_to_spend", json={"user_ref": "u_nobody"}).status_code == 404
    bad = client.post("/v1/tools/affordability", json={"user_ref": "u_7f3a", "amount": "79.9", "price_source": "stated_amount"})
    assert bad.status_code == 422


def test_baskets_are_money_strings():
    res = client.post("/v1/tools/baskets", json={"user_ref": "u_7f3a"})
    assert res.status_code == 200
    assert_tool_result(res.json())


def test_demo_purchase_fits_and_says_what_is_left_per_day():
    res = client.post("/v1/tools/affordability", json={"user_ref": "u_7f3a", "amount": "79.90", "price_source": "observation",
                                                        "observation_id": "obs_demo"})
    r = res.json()["result"]["result"]
    s = res.json()["sts"]["result"]
    assert r["verdict"] == "FITS"
    per_day = (Decimal(r["remaining_after"]["amount"]) / s["days_to_payday"]).quantize(Decimal("0.01"), rounding="ROUND_DOWN")
    assert Decimal(r["safe_per_day_after"]["amount"]) == per_day


def test_at_risk_customer_gets_zero_and_a_warning():
    r = sts("u_risk")
    assert r["result"]["status"] == "at_risk"
    assert r["result"]["safe_to_spend_today"]["amount"] == "0.00"
    assert r["warnings"]
    aff = client.post("/v1/tools/affordability", json={"user_ref": "u_risk", "amount": "5.00", "price_source": "stated_amount"}).json()
    assert aff["result"]["result"]["verdict"] == "EXCEEDS"
