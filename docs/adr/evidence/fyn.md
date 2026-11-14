# Evidence: "FYN" and the consent/scope patterns that replace it

**Result:** no public product, repository, MCP server or API matching the brief's description of FYN could be found. That description was: narrow typed finance tools, read-only scopes, OAuth/consent, affordability, revocation. **No decision cites FYN as positive evidence.** Accessed 2026-11-14.

## Candidates examined (S17)
| Candidate | What it is | Licence | Match |
|---|---|---|---|
| Google Play `com.fyn` "FYN – AI Money Assistant" | Consumer app: Plaid-linked accounts, receipt OCR, chat. No public API, scopes or docs. | Proprietary | ~25 % (name only) |
| `dacobri/fynn-talk-to-your-finances` @ `907ebcca` | Hackathon dashboard plus an LLM agent; CSV upload | None (all rights reserved) | ~10 % |
| `Geovanni-AV/fyn-finance-os`, `Akshaikumar-N/Fyn.`, Fyn Bank (BR) | Unrelated apps | None / proprietary | < 5 % |
| npm `fyn`, PyPI `fyn`, `fynk-mcp-server` | Package manager, uv fork, contract-management MCP | — | 0 |

**Anti-pattern cited (DEC-019):** `fynn/backend/agent.py:53-82` exposes `run_sql(query)`.
- The LLM writes the SQL.
- "SELECT only" exists only in the docstring; the connection is a plain read-write `sqlite3.connect`.
- Amounts are `REAL` floats.
- Results are silently cut at 100 rows.

**Action:** whoever named FYN should supply a URL. Until then it stays unresolved in `SOURCES.md`.

## Primary sources used instead (DEC-014, proposed)
| Source | Finding |
|---|---|
| S13: MCP Authorization 2025-06-18 | Public clients MUST use authorization code + PKCE. SHOULD issue short-lived access tokens; MUST rotate refresh tokens for public clients. MUST validate token audience (RFC 8707 `resource`). MUST NOT pass a received token through upstream. 401 = invalid or expired token; 403 = insufficient scope. |
| S14: Delegated Reg. (EU) 2022/2360 | Account-information access requires SCA renewal at most every 180 days. Read via the official summary only. |
| S15: S-Pankki Open Banking | Third parties must use S-Bank's dedicated PSD2 interfaces (AIS, PIS, CBPII). Sandbox and docs are on Crosskey's Open Banking Market. FIN-FSA exempted S-Bank from the contingency interface (19.12.2019). |
| S16: Crosskey portal | Rendered with JavaScript and not readable. The API list and consent model are **unverified**. |

## Design consequences (proposed)
- **Read-only scope vocabulary** mapped per tool. No finance `:write` scope exists, which is consistent with the schema-level ban on money-moving kinds.
- **`ConsentGrant` lifecycle:** `active`, `revoked` or `expired`, with `last_reauth_at` and `expires_at` set at most 180 days later for any AIS-backed data.
- **Revocation purges derived data keyed by the grant:** cached calc results, cards, captures and embeddings. `get_calculation` returns `CONSENT_REVOKED`.
- **Partial consent:** lowers `data_mode` and `confidence` and appears in `missing_data`, never failing silently.
- **Consent check unavailable:** fail closed.
