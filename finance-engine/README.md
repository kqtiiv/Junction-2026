# finance-engine: HTTP service in front of the S-Bank Coach team's money engine

The S-Bank Coach team's engine is `personal-economic-trainer` (a separate repo, cloned next to this one at `../finance-agent/personal-economic-trainer`). It is the only source of money figures (DEC-019). This folder imports it **unchanged** and puts it behind our contracts (DEC-024):

- **Decimal strings.** The engine returns floats rounded to cents. They become decimal strings here and never cross the boundary as floats.
- **Traceable figures.** Every result is a `platform.tool_result/v1` with a `calc_id`. The results are logged, and `GET /v1/calculations/{calc_id}` serves them back to the backend's verifier, scoped to the user.
- **Provenance.** Each result records the engine commit and the safety buffer it used.

Nothing here edits the team's repo, which the repo owner commits himself. Data and prepared files live in `finance-engine/.data/` (git-ignored).

## Setup (about 6 minutes, once)

```bash
cd finance-engine
python3 -m venv .venv
.venv/bin/pip install -r ../../finance-agent/personal-economic-trainer/requirements.txt -r requirements.txt

# Dataset (346 MB, official S-Pankki Junction 2026 data), checksum from the team's download script
mkdir -p .data/raw .data/out && cd .data/raw
curl -fLO https://raw.githubusercontent.com/hackjunction/Junction-2026-S-pankki/main/tx_customers_junction.csv
curl -fLO https://media.githubusercontent.com/media/hackjunction/Junction-2026-S-pankki/main/tx_junction_transactions.csv
echo "49b3265d8e44e751de305a074dcffcda732bb79aa1e07b46fcca774ce76f1e63  tx_junction_transactions.csv" | sha256sum -c
cd ../..

# The team's pipeline, writing into .data/out instead of their repo
export PET_DATA=$PWD/.data/raw PET_OUT=$PWD/.data/out PYTHONDONTWRITEBYTECODE=1
SRC=../../finance-agent/personal-economic-trainer/src
.venv/bin/python $SRC/prep.py && .venv/bin/python $SRC/backtest.py 50 defer && .venv/bin/python $SRC/plan.py 0.05
```

## Run and test

```bash
.venv/bin/pytest -q
.venv/bin/uvicorn server:app --port 8790
curl -s localhost:8790/v1/tools/safe_to_spend -H 'content-type: application/json' -d '{"user_ref":"u_7f3a"}'
```

| Env var | Default | Meaning |
|---|---|---|
| `PET_ROOT` | `../../finance-agent/personal-economic-trainer` | The team's repo |
| `PET_DATA`, `PET_OUT` | `.data/raw`, `.data/out` | Dataset and prepared files |
| `FINANCE_AS_OF` | `2026-09-05` | The simulated "today". The dataset is synthetic history (2024-10 to 2026-09), so the demo picks a date inside it. Every result says so. |
| `FINANCE_USERS` | `u_7f3a:CUST04069` | Platform `user_ref` → dataset customer. CUST04069 on 2026-09-05: €320.11 free until payday, €32.01 a day, payday in 10 days. CUST03420 is an "at risk" example (bills still due exceed the balance). |

## Endpoints

| Endpoint | Engine function | Result |
|---|---|---|
| `POST /v1/tools/safe_to_spend` `{user_ref, planned_total?}` | `safe_to_spend` | `finance.get_safe_to_spend_until_payday`: balance, the money reserved for bills, the money free until payday, safe to spend today, next payday |
| `POST /v1/tools/affordability` `{user_ref, amount, price_source, observation_id?, planned_total?}` | `safe_to_spend` + interim rule | `finance.calculate_affordability` with `period: "until_payday"`: verdict, the money left until payday, the safe amount per day after buying |
| `POST /v1/tools/baskets` `{user_ref}` | `baskets` | `finance.get_basket_breakdown`: the three baskets the challenge asks for |
| `GET /v1/calculations/{calc_id}?user_ref=` | — | The logged result, or 404 if it is unknown or belongs to another user |

## Computed here for now (should move into the engine)

The engine has no function for these yet. Each result labels them in `assumptions`.

1. **Affordability.** `remaining = free_until_payday − price`. The verdict is FITS if at least 25 % of the free money remains, TIGHT if less, and EXCEEDS below zero (the thresholds from `docs/finance/REFERENCE_DESIGN.md` §6.4, applied to the until-payday pot). The amount per day after buying is rounded **down** to the cent.
2. **Confirmed plans.** `planned_total` is subtracted from the money free until payday. With no plans, `safe_to_spend_today` is the engine's own figure, unchanged.

Suggested engine API for the team: `affordability(cid, amount, as_of, planned_total=0)`.
