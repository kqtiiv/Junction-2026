// Runtime access to the contracts package: generated types for shapes, JSON Schema
// (Ajv) for policy rules. Every message crossing a boundary is validated here.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv, type ValidateFunction } from "ajv";
import addFormatsModule from "ajv-formats";

export type * from "../../contracts/generated/ts/contracts.ts";

const addFormats = addFormatsModule as unknown as (ajv: Ajv) => Ajv;
const SCHEMA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "contracts", "schemas", "v1");
const BASE_ID = "https://contracts.example/v1/";

/** Schema file names (relative to schemas/v1) the backend validates against. */
export type SchemaName =
  | "action_proposal" | "action_result" | "capability_manifest" | "context_capture"
  | "device_session_state" | "domain_event" | "domain_request" | "domain_response"
  | "domain_response_event" | "error_envelope" | "insight_card" | "model_provider" | "observation"
  | "tool_result" | "user_confirmation" | "voice_intent"
  | "finance/finance_manifest" | "finance/finance_tool_result";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") ? [p] : [];
  });

// Same options as contracts/scripts/validate.mjs, so the backend and CI agree.
const ajv = new Ajv({ allErrors: true, strict: true, strictTypes: false, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);
for (const file of walk(SCHEMA_DIR)) ajv.addSchema(JSON.parse(readFileSync(file, "utf8")));

const cache = new Map<SchemaName, ValidateFunction>();
function validator(name: SchemaName): ValidateFunction {
  let v = cache.get(name);
  if (!v) {
    const found = ajv.getSchema(`${BASE_ID}${name}.schema.json`);
    if (!found) throw new Error(`Unknown schema ${name} (looked in ${relative(process.cwd(), SCHEMA_DIR)})`);
    v = found;
    cache.set(name, v);
  }
  return v;
}

export interface ValidationResult { ok: boolean; errors: string[] }

export function validate(name: SchemaName, data: unknown): ValidationResult {
  const v = validator(name);
  const ok = v(data) as boolean;
  const errors = ok
    ? []
    : (v.errors ?? [])
        .filter((e) => e.keyword !== "if")
        .map((e) => `${e.instancePath || "/"} ${e.message ?? "is invalid"}`);
  return { ok, errors: [...new Set(errors)] };
}

/** Throws if `data` does not satisfy the schema. Use on data the backend itself produces. */
export function assertValid(name: SchemaName, data: unknown): void {
  const r = validate(name, data);
  if (!r.ok) throw new Error(`Outgoing ${name} failed validation: ${r.errors.join("; ")}`);
}

/** Loads a JSON file from contracts/examples/v1 (fixtures double as mocks). */
export function loadExample<T>(relPath: string): T {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, "..", "..", "examples", "v1", relPath), "utf8")) as T;
}
