#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { instances, verify } from "./index";

const [instanceId, file] = process.argv.slice(2);
if (!instanceId) {
  console.error("usage: minmax-verify <instanceId> <answer.json>   (- reads stdin)");
  console.error("       minmax-verify --list");
  process.exit(2);
}
if (instanceId === "--list") {
  for (const [id, { definition }] of instances()) console.log(id.padEnd(18), definition.code, definition.titleEn);
  process.exit(0);
}
const raw = !file || file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
const result = verify(instanceId, JSON.parse(raw));
console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
