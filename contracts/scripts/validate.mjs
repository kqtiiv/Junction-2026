// Validates every schema, every example in examples/v1/index.json, and a few
// cross-file policy rules JSON Schema cannot express. Exit code 1 on any failure.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_DIR = join(ROOT, "schemas", "v1");
const EXAMPLE_DIR = join(ROOT, "examples", "v1");
const BASE_ID = "https://contracts.example/v1/";

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") ? [p] : [];
  });

// Strict mode stays on (unknown keywords fail), except two lint rules that
// reject the type-less if/then sub-schemas used for policy rules.
const ajv = new Ajv({ allErrors: true, strict: true, strictTypes: false, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);

let failures = 0;
const fail = (msg) => { failures++; console.error(`  ✗ ${msg}`); };
const pass = (msg) => console.log(`  ✓ ${msg}`);

// 1. Load and compile every schema; check $id matches its path.
console.log("Schemas");
const schemaFiles = walk(SCHEMA_DIR);
for (const file of schemaFiles) {
  const schema = readJson(file);
  const rel = relative(SCHEMA_DIR, file).split("\\").join("/");
  if (schema.$id !== BASE_ID + rel) fail(`${rel}: $id should be ${BASE_ID + rel}`);
  ajv.addSchema(schema);
}
for (const file of schemaFiles) {
  const rel = relative(SCHEMA_DIR, file).split("\\").join("/");
  try { ajv.getSchema(BASE_ID + rel); pass(rel); } catch (e) { fail(`${rel}: ${e.message}`); }
}

// 2. Validate examples against their declared schema; invalid ones must fail.
console.log("\nExamples");
const { cases } = readJson(join(EXAMPLE_DIR, "index.json"));
const covered = new Set();
for (const c of cases) {
  let validate;
  try { validate = ajv.getSchema(BASE_ID + c.schema); } catch (e) { fail(`${c.file}: ${e.message}`); continue; }
  if (!validate) { fail(`${c.file}: unknown schema ${c.schema}`); continue; }
  const data = readJson(join(EXAMPLE_DIR, c.file));
  const ok = validate(data);
  if (c.valid) {
    covered.add(c.schema);
    if (!ok) fail(`${c.file} should be valid against ${c.schema}:\n${ajv.errorsText(validate.errors, { separator: "\n      " })}`);
    else {
      const schemaConst = readJson(join(SCHEMA_DIR, c.schema)).properties?.schema?.const;
      if (schemaConst && data.schema !== schemaConst) fail(`${c.file}: "schema" is ${data.schema}, expected ${schemaConst}`);
      else pass(`${c.file}`);
    }
  } else {
    if (ok) fail(`${c.file} should be REJECTED by ${c.schema} (${c.reason})`);
    else pass(`${c.file} rejected — ${c.reason}`);
  }
}

// Every top-level contract needs at least one valid example.
const libraries = new Set(["common.schema.json", "finance/finance.schema.json"]);
for (const file of schemaFiles) {
  const rel = relative(SCHEMA_DIR, file).split("\\").join("/");
  if (!libraries.has(rel) && !covered.has(rel)) fail(`${rel}: no valid example in examples/v1/index.json`);
}

// 3. Cross-file policy checks.
console.log("\nPolicy checks");
const manifest = readJson(join(EXAMPLE_DIR, "valid/finance/manifest.sbank_coach.json"));
const purposes = new Set(manifest.capture_purposes.map((p) => p.purpose));
for (const intent of manifest.intents) {
  for (const p of intent.accepts_capture) {
    if (!purposes.has(p)) fail(`manifest intent ${intent.id} accepts undeclared capture purpose '${p}'`);
  }
}
pass("manifest intents only accept declared capture purposes");

const declared = new Map(manifest.action_kinds.map((k) => [k.kind, k]));
const proposals = cases
  .filter((c) => c.valid)
  .flatMap((c) => {
    const d = readJson(join(EXAMPLE_DIR, c.file));
    if (d.schema === "platform.action_proposal/v1") return [[c.file, d]];
    if (d.type === "final") return d.response.proposals.map((p) => [c.file, p]);
    return [];
  });
for (const [file, p] of proposals) {
  const decl = declared.get(p.kind);
  if (!decl) { fail(`${file}: proposal kind ${p.kind} not declared in the manifest`); continue; }
  for (const ch of p.confirm_channels) {
    if (!decl.confirm_channels.includes(ch)) fail(`${file}: channel ${ch} not allowed for ${p.kind} by the manifest`);
  }
  if (p.risk !== decl.risk || p.reversible !== decl.reversible) fail(`${file}: risk/reversible differ from manifest for ${p.kind}`);
}
pass("proposals match the manifest's declared kinds, risk and channels");

for (const c of cases.filter((c) => c.valid)) {
  const d = readJson(join(EXAMPLE_DIR, c.file));
  if (d.type !== "final") continue;
  const traced = new Set(d.response.trace.calc_ids);
  for (const card of d.response.cards) {
    for (const id of card.basis.calc_ids) if (!traced.has(id)) fail(`${c.file}: card ${card.card_id} cites ${id}, missing from trace.calc_ids`);
  }
}
pass("cards in final responses only cite traced calc_ids");

console.log(failures ? `\n${failures} failure(s)` : "\nAll contracts valid.");
process.exit(failures ? 1 : 0);
