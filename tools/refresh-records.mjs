#!/usr/bin/env node
// Refreshes records/ and the README table in the public repository from
// minmaxarena.com's own public data. Run by .github/workflows/refresh-records.yml
// once a day, and by hand with:
//
//   node tools/refresh-records.mjs
//
// It reaches only for URLs anybody can fetch, so it needs no token and no
// access to the site's private repository. src/ — the verifiers — changes only
// when a problem is added, which is a deliberate act over there; the records
// change whenever somebody breaks one, which is most days.
//
// This file is copied verbatim into the public repository by
// tools/export-public-repo.ts. It is a real file rather than a string inside
// that script because escapes do not survive being written through a template
// literal: one lost backslash produced a syntax error, and a subtler one would
// have produced a pattern that matches nothing and a README that silently
// stops updating.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://minmaxarena.com";
const START = "<!-- records:start -->";
const END = "<!-- records:end -->";

function sameExceptTimestamp(path, next) {
  try {
    const before = JSON.parse(readFileSync(path, "utf8"));
    const after = JSON.parse(next);
    delete before.generatedAt;
    delete after.generatedAt;
    return JSON.stringify(before) === JSON.stringify(after);
  } catch {
    return false;
  }
}

const catalogue = await fetch(`${SITE}/api/problems`).then((response) => response.json());
const problems = catalogue.problems ?? catalogue;
mkdirSync(join(root, "records"), { recursive: true });

const rows = [];
for (const problem of problems) {
  const response = await fetch(`${SITE}/data/${problem.slug}.json`);
  if (!response.ok) {
    console.error(`skipped ${problem.slug}: ${response.status}`);
    continue;
  }
  const payload = await response.json();
  // The live file stamps the moment it was generated, so writing every time
  // rewrites all forty-three files daily and commits a timestamp as though it
  // were news. Only what the records actually say counts as a change; on a
  // quiet day the old file keeps its own honest generatedAt.
  const target = join(root, "records", `${problem.slug}.json`);
  const next = `${JSON.stringify(payload, null, 2)}\n`;
  if (!sameExceptTimestamp(target, next)) writeFileSync(target, next);
  rows.push({
    code: problem.code,
    slug: problem.slug,
    title: problem.titleEn,
    instances: payload.instances.length,
    open: payload.instances.filter((row) => row.status !== "proven" && row.status !== "optimal").length,
  });
}

rows.sort((left, right) => left.code.localeCompare(right.code));
const table = [
  "| Code | Family | Sub-problems | Open | Data |",
  "| --- | --- | ---: | ---: | --- |",
  ...rows.map((row) => `| [${row.code}](${SITE}/en/problems/${row.slug}) | ${row.title} | ${row.instances} | ${row.open} | [json](records/${row.slug}.json) |`),
].join("\n");

// Markers rather than a regular expression, for the same reason this file is
// not a string: a pattern that stops matching fails silently, and a README
// frozen while its data moves is exactly the stale snapshot this job exists
// to prevent.
const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const opens = readme.indexOf(START);
const closes = readme.indexOf(END);
if (opens < 0 || closes < 0) throw new Error("README.md has lost its records markers");

const totals = `${rows.length} problem families, ${rows.reduce((sum, row) => sum + row.instances, 0)} sub-problems, ${rows.reduce((sum, row) => sum + row.open, 0)} still open.`;
const rebuilt = `${readme.slice(0, opens)}${START}\n${table}\n${readme.slice(closes)}`;
writeFileSync(readmePath, rebuilt
  .split("\n")
  .map((line) => (line.includes(" problem families, ") && line.endsWith("still open.") ? totals : line))
  .join("\n"), "utf8");

console.log(`${rows.length} families refreshed`);
