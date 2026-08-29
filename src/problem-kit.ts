// Everything a single problem needs, and nothing that needs a single problem.
// The catalogue and the verifier both import this; problem modules import only
// this, which is what keeps the registry free of cycles.

export const SCALE = 1_000_000_000;

export type Objective = "maximize" | "minimize";

// Designs, sequences, graphs and puzzles are gone along with the problems that
// filled them. Every one of those scored on an integer a search can write down,
// which ends a sub-problem the moment anyone writes it; what is left scores on
// a scale where the ceiling is an arrangement nobody knows yet.
export const problemCategories = [
  { id: "packing", name: "装箱与覆盖", nameEn: "Packing and covering" },
  { id: "extremal", name: "极值构型", nameEn: "Extremal configurations" },
] as const;
export type ProblemCategory = (typeof problemCategories)[number]["id"];
// What a problem is, rather than how it is going. A problem may carry
// several: the table is lib/problem-tags.ts.
// "solved" is DERIVED (problemSolved in catalog.ts), never declared by hand
// in problem-tags -- a test keeps it that way.
export type ProblemTag = "classic" | "original" | "applied" | "solved" | "easyBaseline";

// What is known to be achievable on this sub-problem, and who says so. A site
// whose every row reads "founding benchmark" looks like nobody has ever been
// here; naming the target turns a blank column into a mountain with a height.
//
// "proven" and "record" are different claims and are shown differently: a proven
// optimum is a ceiling, and reaching it finishes the sub-problem, while a record
// is the best anyone has published and beating it is a real result.
export type KnownBest = {
  display: string;
  // The one thing a reader needs to know about a value: has anybody shown that
  // nothing beats it?
  //
  //   proven — settled. Reaching it finishes the sub-problem, and the page
  //            says so. Only for something established here, by exhaustive
  //            search or by an argument short enough to sit in `source`.
  //   best   — the best value anybody knows, exactly stated, optimality open.
  //            Reaching it draws level; beating it is a result.
  //
  // Where it came from is a separate question, and `source` already answers it:
  // a construction worked out here names the construction, a value read
  // somewhere names the work and carries its `url`. That was briefly a third
  // kind, which said the same thing twice — a published record and a
  // construction of ours are both "best known, not proven", and only their
  // provenance differs.
  kind: "proven" | "best";
  // Where the value comes from — for something settled here, the argument that
  // settles it. Both languages, because this is shown to the reader and a
  // Chinese reason on an English page is a bug, not a detail.
  source: string;
  sourceEn: string;
  url?: string;
  // The optimum as mathematics, where it has a closed form: "(2 − √2)/2".
  //
  // `display` is what a certificate can hold, and for most of these problems
  // that is not the optimum -- it is the optimum cut to nine decimal places,
  // because the optimum is an algebraic irrational and the format is decimal.
  // Printing "proven optimum" over the cut number states, as fact, something
  // that is not the fact. This field carries the real one, and the page shows
  // both with the difference between them said out loud.
  //
  // Language-neutral: it is notation, not prose, so there is one of it.
  // Absent where there is no closed form -- P53's hexagon is the root of an
  // irreducible degree-10 polynomial, and several values are known only as
  // decimals from a numerical search. Absent is honest; invented is not.
  exact?: string;
};

export type Floor = {
  // The bound as a decimal, rounded TOWARD the safe side: for a lower bound,
  // down -- the page may claim "nothing goes below this" only if the printed
  // number is at or below the proven one.
  display: string;
  // The bound as mathematics.
  exact: string;
  source: string;
  sourceEn: string;
  url?: string;
};

// One clause of a problem's formal definition: a bold label (容器/提交/目标…)
// over one precise sentence. Together the clauses are the whole contract —
// the standard is that a reader could re-implement the verifier from them.
export type StrictTerm = { label: string; labelEn: string; text: string; textEn: string };

// One card in the "帮助理解" band: an analogy, why the problem is hard, where
// the frontier is. Explicitly NOT part of the definition, and supplied per
// problem — a problem with no honest analogy carries fewer cards, or none,
// rather than a forced one.
export type IntuitionCard = { title: string; titleEn: string; text: string; textEn: string; tone?: "frontier"; url?: string };

export type ProblemInstanceDefinition = {
  instanceId: string;
  instanceName: string;
  parameters: Record<string, unknown>;
  baselineAnswer: unknown;
  instanceNameEn: string;
  knownBest?: KnownBest;
  // Set by catalog.ts when the answer shipped for this row is an exhibited
  // construction rather than the deliberately weak seed declared by the
  // problem. Both are persisted by the system account, but only the latter is
  // honestly a "founding benchmark" on the public site.
  referenceAnswer?: boolean;
  // A proven bound no arrangement can cross, for problems where the literature
  // has a theorem rather than a value. The dual of knownBest: knownBest says
  // "nothing beats this known answer", a floor says "nothing beats this line,
  // whoever tries". It is display only -- a floor is typically unattainable
  // (P55's hexagon bound cannot be reached because hexagons do not tile a
  // square), so it must never feed knownBestStatus or close a sub-problem.
  floor?: Floor;
  // A warm-up: the answer follows from one line of reasoning. Marked so nobody
  // spends an evening on it thinking it is open. It is a claim about the
  // sub-problem's difficulty, which is a different thing from whether its record
  // has been maxed out — a hard sub-problem can also be finished.
  trivial?: boolean;
};

// Every problem uses one coordinate model: non-negative integers, origin at the
// lower-left of the container bounding box, running 0 … extent. A continuous
// packing sets extent to SCALE, so one unit is 10^-9 of the container; a grid
// problem sets it to the board size. That is the whole difference between
// 500000000 and 3 — the container, not the rules.
export type ProblemDefinition = {
  id: string;
  instanceId: string;
  code: string;
  slug: string;
  category: ProblemCategory;
  title: string;
  summary: string;
  objective: Objective;
  scoreLabel: string;
  // What the reader is being asked to make large or small, when that is not the
  // same phrase as the number on the leaderboard.
  //
  // For most problems it is: a radius is maximised and a radius is recorded.
  // But a side length, a distance and a triangle's area are all irrational at
  // almost every arrangement, so what gets recorded is the square, or twice the
  // area -- an exact integer that orders the same way. Printing "maximise the
  // common side SQUARED" as the goal states a technicality of the format as
  // though it were the question, and invites the obvious retort that squaring
  // changes nothing. The goal says the side; the score says the square; the
  // answer help says why they differ.
  goalLabel?: string;
  goalLabelEn?: string;
  // How the recorded number relates to that goal, so a page can show the goal's
  // own value beside it. Nobody has an intuition for a squared side: 0.02775556
  // is a 6 x 6 grid and does not look like one until it is written as 1/6.
  // The square stays the record -- it is what is exact -- and the plain
  // quantity is shown as the approximation it necessarily is.
  scoreIs?: "square" | "double";
  instanceName: string;
  parameters: Record<string, unknown>;
  baselineAnswer: unknown;
  answerHelp: string;
  titleEn: string;
  summaryEn: string;
  scoreLabelEn: string;
  instanceNameEn: string;
  answerHelpEn: string;
  // The coordinate upper bound. Present on every problem whose certificate
  // carries positions; absent where a certificate is a sequence or a labelling.
  extent?: number;
  // One sentence naming the container and where the origin sits.
  frame?: string;
  frameEn?: string;
  // The full statement and the requirement list shown on the problem page. Kept
  // with the problem rather than in the interface copy file, because they say
  // what this problem is, not how the site talks.
  // The three-register model, piloted on P55. `definition` is the natural-
  // language definition alone — no analogy, no history; `strict` is the
  // formal contract; `intuition` is everything that helps but does not define.
  // Problems without these fall back to `statement`, the old single blob.
  definition?: string;
  definitionEn?: string;
  strict?: StrictTerm[];
  intuition?: IntuitionCard[];
  statement?: string;
  statementEn?: string;
  requirements?: string[];
  requirementsEn?: string[];
  // A research-frontier problem: solving approaches open mathematics, and a
  // sub-problem with no published value is hard territory, not free territory.
  // The difficulty badge reads this instead of inferring "easy" from a bare
  // baseline — on these problems a bare baseline means nobody on Earth has
  // published a value, which is the opposite of easy.
  frontier?: boolean;
  instances?: ProblemInstanceDefinition[];
};

export type VerificationResult = {
  valid: boolean;
  score?: string;
  displayScore?: string;
  errorCode?: string;
  message: string;
  // The same sentence in English. A refusal is the whole explanation of what
  // went wrong, and for a long time it came back in Chinese whatever language
  // the reader had chosen — so an English visitor who dragged two circles
  // together was told "圆 2 与 3 重叠" and had to guess. Optional, because a
  // handful of these are faults rather than refusals and never reach anyone.
  messageEn?: string;
};

export type Obj = Record<string, unknown>;
export type Point = [number, number];

// A problem is its definition plus the one function that decides whether a
// certificate is worth a record. Keeping them in one file means a new problem is
// a new file rather than an edit spread across the catalogue and the verifier.
export type ProblemModule = {
  definition: ProblemDefinition;
  verify: (params: Obj, answer: Obj) => VerificationResult;
};

export const ok = (score: bigint, displayScore = score.toString()): VerificationResult => ({ valid: true, score: score.toString(), displayScore, message: "答案有效，验证器已接受这份答案。", messageEn: "The answer is valid; the verifier accepted it." });
export const fail = (errorCode: string, message: string, messageEn?: string): VerificationResult => ({ valid: false, errorCode, message, messageEn });

// A refusal thrown rather than returned, from the helpers that read a field
// before the verifier has a result to hand back. It carries both languages the
// way `fail` does, and `verifySubmission` turns it into one.
export class Refusal extends Error {
  readonly messageEn: string;
  constructor(message: string, messageEn: string) { super(message); this.name = "Refusal"; this.messageEn = messageEn; }
}
// A function declaration and not an arrow, because TypeScript only narrows
// control flow past a never-returning call when the callee is declared this
// way — and every use of this stands where a `throw` used to.
export function refuse(message: string, messageEn: string): never { throw new Refusal(message, messageEn); }
export const isObject = (value: unknown): value is Obj => Boolean(value) && typeof value === "object" && !Array.isArray(value);
export const isInt = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
export const asInt = (value: unknown, name: string): number => { if (!isInt(value)) refuse(`${name} 必须是安全整数`, `${name} must be a safe integer`); return value; };
export const asArray = (value: unknown, name: string): unknown[] => { if (!Array.isArray(value)) refuse(`${name} 必须是数组`, `${name} must be an array`); return value; };
export const sq = (value: number) => BigInt(value) * BigInt(value);

// 500000000 reads as 0.5. Rendering both forms side by side is the shortest path
// from "why is this number so big" to being able to write one.
export function formatFixedPoint(value: number): string {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const whole = Math.floor(magnitude / SCALE);
  const fraction = String(magnitude % SCALE).padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

// Certificates for continuous problems are written the way the container is
// described: a unit square is 1 across and a point in the middle of it is "0.5".
// The string is turned into an exact grid integer by digit surgery — never by
// parseFloat — so nothing a submitter writes is ever routed through a float on
// this side. That is why the precision on their machine cannot change the
// verdict on ours: we only ever see the digits they wrote.
export const FIXED_DECIMALS = 9;

export function parseFixed(value: unknown, name: string): number {
  // Strings only, including for whole numbers. A bare JSON number has already
  // been through a float, and — worse — a certificate written against the old
  // grid would be silently reread as that many whole units instead of failing.
  // A loud refusal is the only safe way to tell those apart.
  if (typeof value !== "string") refuse(`${name} 必须写成字符串，例如 "0.5" 或 "1"`, `${name} must be written as a string, for example "0.5" or "1"`);
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) refuse(`${name} 必须是十进制数字，不支持指数写法`, `${name} must be a decimal number; exponent notation is not supported`);
  const negative = trimmed.startsWith("-");
  const [whole, fraction = ""] = (negative ? trimmed.slice(1) : trimmed).split(".");
  // Refuse rather than round: silently dropping digits is how a certificate
  // passes on one machine and fails on another.
  if (fraction.length > FIXED_DECIMALS) refuse(`${name} 最多 ${FIXED_DECIMALS} 位小数`, `${name} may have at most ${FIXED_DECIMALS} decimal places`);
  if (whole.length > 12) refuse(`${name} 数值过大`, `${name} is too large`);
  const units = Number(whole) * SCALE + Number(fraction.padEnd(FIXED_DECIMALS, "0"));
  if (!Number.isSafeInteger(units)) refuse(`${name} 数值过大`, `${name} is too large`);
  return negative ? -units : units;
}

// The inverse, for printing a stored certificate back in the form it was written.
export function printFixed(units: number): string {
  return formatFixedPoint(units);
}

export function parseFixedPoint(value: unknown, name: string): [number, number] {
  const pair = asArray(value, name);
  if (pair.length !== 2) refuse(`${name} 必须包含两个坐标`, `${name} must contain exactly two coordinates`);
  return [parseFixed(pair[0], `${name}.x`), parseFixed(pair[1], `${name}.y`)];
}

// A squared length or a doubled area is exact as an integer count of 10⁻¹⁸,
// because the coordinates it came from are exact counts of 10⁻⁹. Printing it
// back as a decimal keeps the leaderboard in the same unit as the answer
// instead of showing a nineteen-digit integer.
const SQUARE_SCALE = BigInt(SCALE) * BigInt(SCALE);
export function printSquared(units: bigint): string {
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  const whole = magnitude / SQUARE_SCALE;
  const fraction = (magnitude % SQUARE_SCALE).toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

// The same printer for a value already counted in 10⁻⁹, where the count is too
// large for a number. A ratio of two distances can run to eighteen digits once
// somebody submits two points a nanometre apart, and Number stops being exact
// nine digits before that.
const FIXED_SCALE = BigInt(SCALE);
export function printFixedBig(units: bigint): string {
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  const whole = magnitude / FIXED_SCALE;
  const fraction = (magnitude % FIXED_SCALE).toString().padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

// Exact integer square root, for scores that are a length rather than a length
// squared. Newton's method on bigints: no Math.sqrt, so the answer is the same
// on every machine and is never off by a last-digit rounding.
export function integerSqrt(value: bigint): bigint {
  if (value < 0n) throw new Error("integerSqrt does not take a negative");
  if (value < 2n) return value;
  let guess = value;
  let next = (value >> 1n) + 1n;
  while (next < guess) {
    guess = next;
    next = (guess + value / guess) >> 1n;
  }
  return guess;
}

