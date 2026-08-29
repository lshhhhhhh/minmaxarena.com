import { SCALE, ok, fail, refuse, asInt, isObject, printFixed } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { big, S, ceilDiv, integerSqrtCeil, printScaled, readMatrix, halton } from "./frontier-kit";

// P59: minimum L2-star discrepancy in the unit hypercube.
//
// The mean-squared cousin of P54. Where P54 hunts the single worst
// origin-anchored box in the plane, this integrates the squared error over
// every box — which is what gives it Warnock's closed formula and lets the
// same objective climb into dimensions 3, 4, 6 and 8, where the L-infinity
// version has no affordable exact verifier.
//
//   D²(P) = 3^{-d} − (2^{1−d}/n) Σ_i Π_r (1 − x_{ir}²)
//                  + (1/n²) Σ_{i,j} Π_r (1 − max(x_{ir}, x_{jr}))
//
// Every term is rational on the nine-decimal grid. The verifier clears the
// common denominator M = 2^{d−1}·3^d·n²·S^{2d} and scores the exact bigint
// M·D², to be minimized. The displayed value is D itself, rounded UP at the
// twelfth decimal — the direction that cannot flatter the submitter.

const MAX_N = 64;
const MAX_D = 12;

const DIMS = [2, 3, 4, 6, 8];
const COUNTS = [8, 12, 16, 24, 32];

// The baseline is the main diagonal: x_i = ((2i+1)/2n, …, (2i+1)/2n). It is a
// legal answer and a terrible one — the whole mass sits on a measure-zero
// line, so boxes below the diagonal are systematically starved — and any
// classical low-discrepancy construction beats it, which the tests assert
// through the real verifier for every instance.
function diagonalBaseline(n: number, d: number): { points: string[][] } {
  return { points: Array.from({ length: n }, (_, i) => {
    const coordinate = printFixed(Math.round(((2 * i + 1) * SCALE) / (2 * n)));
    return Array.from({ length: d }, () => coordinate);
  }) };
}

// The exhibition answer the tests hold against the baseline: the Halton
// sequence in the first d prime bases, rounded to the grid. Not close to
// optimal — which is the point of shipping the weak baseline as the seed and
// leaving this construction to be rediscovered or beaten.
export function haltonExhibit(n: number, d: number): { points: string[][] } {
  const bases = [2, 3, 5, 7, 11, 13, 17, 19].slice(0, d);
  return { points: Array.from({ length: n }, (_, i) => bases.map((base) => halton(i + 1, base))) };
}

const instances: ProblemInstanceDefinition[] = DIMS.flatMap((d) => COUNTS.map((n) => ({
  instanceId: `p59-d${d}-n${n}-v1`,
  instanceName: `d = ${d}, n = ${n}`,
  instanceNameEn: `d = ${d}, n = ${n}`,
  parameters: { n, d },
  baselineAnswer: diagonalBaseline(n, d),
})));

export const definition: ProblemDefinition = {
  id: "p59", instanceId: "p59-d3-n16-v1", code: "P59", slug: "l2-star-discrepancy", category: "extremal",
  title: "超立方体内的最低 L2 星偏差",
  summary: "在 d 维单位超立方体里放 n 个采样点，让所有原点角矩形上的均方分布误差尽可能小。",
  objective: "minimize", scoreLabel: "L2 星偏差", scoreLabelEn: "L2-star discrepancy",
  instanceName: "d = 3, n = 16", instanceNameEn: "d = 3, n = 16", parameters: { n: 16, d: 3 },
  baselineAnswer: diagonalBaseline(16, 3),
  answerHelp: "提交 points：恰好 n 行，每行 d 个 [0, 1] 内的十进制字符串坐标，例如 \"0.25\"。",
  answerHelpEn: "Submit points: exactly n rows of d decimal-string coordinates in [0, 1], such as \"0.25\".",
  titleEn: "Minimum L2-star discrepancy in the unit hypercube",
  summaryEn: "Place n sample points in the d-dimensional unit hypercube, making the mean-squared distribution error over all origin-anchored boxes as small as possible.",
  extent: SCALE,
  frame: "容器是 d 维单位超立方体 [0,1]^d。每个点是 d 个坐标，写成十进制字符串，最多九位小数。",
  frameEn: "The container is the d-dimensional unit hypercube [0,1]^d. Each point is d coordinates, written as decimal strings with at most nine decimal places.",
  definition: "在 [0,1]^d 中放置 n 个点。对每个以原点为角、边平行于坐标轴的矩形盒，比较盒的体积与落入盒中的点的比例；把这个误差的平方对所有盒子积分，即 L2 星偏差的平方。让它尽可能小。",
  definitionEn: "Place n points in [0,1]^d. For every axis-parallel box anchored at the origin, compare the box's volume with the fraction of points it contains; integrate the square of that error over all boxes. That integral is the squared L2-star discrepancy. Make it as small as possible.",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维单位超立方体 [0,1]^d，坐标闭区间", textEn: "The d-dimensional unit hypercube [0,1]^d, coordinates in the closed interval" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个点，每个是 d 个十进制坐标；允许重合", textEn: "Exactly n points, each d decimal coordinates; coincidences are allowed" },
    { label: "目标", labelEn: "Objective", text: "最小化 Warnock 闭式公式给出的 L2 星偏差；验证器在九位网格上精确计算它的平方", textEn: "Minimize the L2-star discrepancy given by Warnock's closed formula; the verifier computes its square exactly on the nine-decimal grid" },
    { label: "计分", labelEn: "Scoring", text: "纪录是清分母后的精确整数 M·D²；页面显示 D，向上取整到第 12 位小数", textEn: "The record is the exact integer M·D² with the common denominator cleared; the page shows D, rounded up at the twelfth decimal" },
  ],
  intuition: [
    { title: "它衡量什么", titleEn: "What it measures",
      text: "渲染和数值积分的预算有限时，采样点要模仿均匀分布。星偏差问的是：哪个角落矩形被系统性地过采样或忽略了？L∞ 版（P54）罚最坏的一个盒子，这里罚所有盒子的均方误差，所以它可以进入高维，而验证器反而更简单。",
      textEn: "With a finite budget for rendering or numerical integration, sample points have to imitate the uniform distribution. Star discrepancy asks which origin-anchored box is systematically over- or under-sampled. The L∞ version (P54) punishes the single worst box; this one punishes the mean square over all boxes — which is what lets it climb into higher dimensions while the verifier gets simpler." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "固定 (n, d) 的最优 L2 星偏差点集几乎没有已证明的结果：文献只对 n = 1、2 给出精确最优。这里的每个子题都开放。",
      textEn: "Provably optimal L2-star point sets for fixed (n, d) barely exist: the literature settles only n = 1 and 2 exactly. Every sub-problem here is open.",
      url: "https://doi.org/10.1090/bproc/254" },
  ],
  requirements: ["恰好 n 个点，每个 d 个坐标", "坐标在 [0, 1] 内", "分数是精确整数，越小越好"],
  requirementsEn: ["Exactly n points, each with d coordinates", "Coordinates lie in [0, 1]", "The score is an exact integer; smaller is better"],
  frontier: true,
  instances,
};

// The exact score of a point set, all bigint. Exported for the worst-
// projection problem (P62), which runs this same computation on every
// two-column projection of its higher-dimensional set.
export function l2StarNumerator(points: number[][], n: number, d: number): bigint {
  const power2 = 1n << big(d - 1);
  const power3 = 3n ** big(d);
  const gridPower = S ** big(2 * d);
  let single = 0n;
  for (let i = 0; i < n; i += 1) {
    let product = 1n;
    for (let r = 0; r < d; r += 1) { const a = big(points[i][r]); product *= S * S - a * a; }
    single += product;
  }
  let pairs = 0n;
  for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) {
    let product = 1n;
    for (let r = 0; r < d; r += 1) product *= S - big(Math.max(points[i][r], points[j][r]));
    pairs += product;
  }
  return power2 * big(n) * big(n) * gridPower - power3 * big(n) * single + power2 * power3 * (S ** big(d)) * pairs;
}

export function l2StarDenominator(n: number, d: number): bigint {
  return (1n << big(d - 1)) * 3n ** big(d) * big(n) * big(n) * S ** big(2 * d);
}

// D rounded up at the twelfth decimal: sqrt(score/M) with both the division
// and the root taken toward the ceiling.
export function l2StarDisplay(score: bigint, denominator: bigint): string {
  return printScaled(integerSqrtCeil(ceilDiv(score * 10n ** 24n, denominator)), 12);
}

function verifyL2Star(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 1 || n > MAX_N || d < 1 || d > MAX_D) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const points = readMatrix(answer.points, "points", n, d, 0, SCALE);
  const score = l2StarNumerator(points, n, d);
  return ok(score, l2StarDisplay(score, l2StarDenominator(n, d)));
}

export const problem: ProblemModule = { definition, verify: verifyL2Star };
