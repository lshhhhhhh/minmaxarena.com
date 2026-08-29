#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { frozen, instances, isFrozen, verify } from "./index";

const [instanceId, file] = process.argv.slice(2);

if (!instanceId) {
  console.error("usage: minmax-verify <instanceId> <answer.json>   (- reads stdin)");
  console.error("       minmax-verify --list [--all]");
  process.exit(2);
}

if (instanceId === "--list") {
  const all = process.argv.includes("--all");
  for (const [id, { definition }] of instances({ includeFrozen: all })) {
    const note = isFrozen(definition.code) ? "  (frozen " + frozen[definition.code].since + ")" : "";
    console.log(id.padEnd(18), definition.code, definition.titleEn + note);
  }
  if (!all) {
    console.log("");
    console.log("--all also lists problems the catalogue no longer offers. Their records still stand and still verify.");
  }
  process.exit(0);
}

const raw = !file || file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
const result = verify(instanceId, JSON.parse(raw));
console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
