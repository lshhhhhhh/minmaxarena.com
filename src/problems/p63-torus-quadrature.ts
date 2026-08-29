import { SCALE, ok, fail, refuse, asInt, isObject, printFixed } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { big, S, ceilDiv, integerSqrtCeil, printScaled, readMatrix } from "./frontier-kit";

// P63: optimal equal-weight quadrature points on the torus, for a fixed
// periodic Sobolev kernel.
//
// The site fixes the kernel version once and for ever:
//
//   K(x, y) = Π_r (1 + 6·B₂({x_r − y_r})),   B₂(t) = t² − t + 1/6
//
// and scores the squared worst-case integration error of the equal-weight
// rule on the submitted points,
//
//   E(P) = (1/n²) Σ_{i,j} K(x_i, x_j) − 1,
//
// which is non-negative because B₂ integrates to zero. With λ = 6 the
// per-dimension factor is (2S² − 6tS + 6t²)/S² on the grid — positive, since
// its discriminant is negative — so the verifier sums exact bigint products
// and subtracts n²·S^{2d}. The λ = 6 kernel is this site's own fixed choice:
// the same family as the literature's periodic L2 discrepancy (λ = 3) and
// diaphony (λ = 2π²), deliberately its own parameter, and never to change.

const MAX_N = 64;
const MAX_D = 6;

// Fibonacci counts included on purpose: Fibonacci lattices are the strong
// classical constructions on the 2-torus, and trying them here is the
// natural first move.
const RANGES: Record<number, number[]> = {
  2: [8, 13, 16, 21, 27, 34],
  3: [8, 12, 16, 21, 27, 32],
};

// The baseline walks a single axis: x_i = (i/n, 0, …, 0). Legal and poor —
// every other dimension sees all n points at the same place, so each of
// those dimensions contributes its worst factor to every pair.
function axisBaseline(n: number, d: number): { points: string[][] } {
  return { points: Array.from({ length: n }, (_, i) => [
    printFixed(Math.floor((i * SCALE) / n)),
    ...Array.from({ length: d - 1 }, () => "0"),
  ]) };
}

// The exhibition answer: a Korobov-style rank-1 lattice with a fixed
// generator, x_i = ({i/n}, {i·a/n}, {i·a²/n}, …). Deterministic and far
// better than the axis walk, which is all the tests need it to be.
export function korobovExhibit(n: number, d: number): { points: string[][] } {
  const generator = Math.max(2, Math.round(n / 1.618) | 1);
  return { points: Array.from({ length: n }, (_, i) => Array.from({ length: d }, (_, r) => {
    const multiplier = generator ** r % n;
    return printFixed(Math.floor((((i * multiplier) % n) * SCALE) / n));
  })) };
}

const instances: ProblemInstanceDefinition[] = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p63-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: axisBaseline(n, Number(dims)),
})));

export const definition: ProblemDefinition = {
  id: "p63", instanceId: "p63-d2-n13-v1", code: "P63", slug: "torus-quadrature", category: "extremal",
  title: "环面上的最优积分点集",
  summary: "在 d 维环面上放 n 个等权采样点，让一类周期函数的最坏积分误差尽可能小。",
  objective: "minimize", scoreLabel: "最坏积分误差", scoreLabelEn: "the worst-case integration error",
  instanceName: "d = 2, n = 13", instanceNameEn: "d = 2, n = 13", parameters: { n: 13, d: 2 },
  baselineAnswer: axisBaseline(13, 2),
  answerHelp: "提交 points：恰好 n 行，每行 d 个 [0, 1) 内的十进制字符串坐标。坐标按模 1 理解，1 写成 0。",
  answerHelpEn: "Submit points: exactly n rows of d decimal-string coordinates in [0, 1). Coordinates are read modulo 1; write 1 as 0.",
  titleEn: "Optimal quadrature points on the torus",
  summaryEn: "Place n equal-weight sample points on the d-dimensional torus, minimizing the worst-case integration error over a class of periodic functions.",
  extent: SCALE,
  frame: "容器是 d 维环面：每个坐标在 [0, 1) 内且按模 1 理解，对边粘合。坐标写成十进制字符串，最多九位小数。",
  frameEn: "The container is the d-dimensional torus: every coordinate lives in [0, 1) modulo 1, opposite faces glued. Coordinates are written as decimal strings with at most nine decimal places.",
  definition: "在环面 T^d 上放置 n 个等权积分点。固定核 K(x,y) = Π (1 + 6·B₂({xᵣ − yᵣ}))，其中 B₂(t) = t² − t + 1/6；分数是等权求积规则的平方最坏误差 E = (1/n²)ΣᵢⱼK(xᵢ,xⱼ) − 1。让它尽可能小。",
  definitionEn: "Place n equal-weight quadrature points on the torus T^d. Fix the kernel K(x,y) = Π (1 + 6·B₂({x_r − y_r})) with B₂(t) = t² − t + 1/6; the score is the squared worst-case error of the equal-weight rule, E = (1/n²)Σ K(x_i,x_j) − 1. Make it as small as possible.",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维环面：坐标模 1，写在 [0, 1) 内", textEn: "The d-dimensional torus: coordinates modulo 1, written in [0, 1)" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个点，每个 d 个十进制坐标；允许重合", textEn: "Exactly n points, each d decimal coordinates; coincidences are allowed" },
    { label: "目标", labelEn: "Objective", text: "最小化等权求积规则的平方最坏误差 E = (1/n²)ΣᵢⱼK(xᵢ,xⱼ) − 1；核积分为 1，所以 E 非负", textEn: "Minimize the squared worst-case error of the equal-weight rule, E = (1/n²)Σ K(x_i,x_j) − 1; the kernel integrates to one, so E is non-negative" },
    { label: "核", labelEn: "Kernel", text: "K = Π(1 + 6·B₂({xᵣ−yᵣ}))，λ = 6 是本站固定的核版本，永不更改；它与文献的 periodic L2 discrepancy（λ = 3）和 diaphony（λ = 2π²）同族不同参", textEn: "K = Π(1 + 6·B₂({x_r−y_r})); λ = 6 is this site's fixed kernel version, never to change — same family as the literature's periodic L2 discrepancy (λ = 3) and diaphony (λ = 2π²), deliberately its own parameter" },
    { label: "计分", labelEn: "Scoring", text: "纪录是清分母后的精确整数 n²S^{2d}·E；页面显示误差 √E，向上取整到第 12 位小数", textEn: "The record is the exact integer n²S^{2d}·E with the denominator cleared; the page shows the error √E, rounded up at the twelfth decimal" },
  ],
  intuition: [
    { title: "它在优化什么", titleEn: "What it optimizes",
      text: "周期函数的数值积分里，点集的好坏由最难积的那个函数决定。张量积的 B₂ 核对每个坐标方向的空洞和规律性都敏感：某一维塌成一团，整个分数立刻变差。",
      textEn: "In numerical integration of periodic functions, a point set is only as good as the hardest function it faces. The tensor-product B₂ kernel is sensitive to holes and regularity in every coordinate direction: let one dimension clump, and the score decays at once." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "同族目标的全局最优至今只在极小的 n 上被证明：Fibonacci 格的最优性 2025 年才对少数 n 建立，环面张量积能量的极小构形仍是活跃研究。本站的 λ = 6 版本没有任何已发表的逐实例最优值，全部开放。",
      textEn: "Global optimality in this family has been proven only at tiny n: Fibonacci lattices were settled for a handful of n as recently as 2025, and minimizing tensor-product energies on the torus is active research. The site's λ = 6 version has no published per-instance optima at all; everything is open.",
      url: "https://arxiv.org/abs/2502.17082" },
  ],
  requirements: ["恰好 n 个点，每个 d 个坐标", "坐标在 [0, 1) 内，按模 1 理解", "分数是精确整数，越小越好"],
  requirementsEn: ["Exactly n points, each with d coordinates", "Coordinates lie in [0, 1), read modulo 1", "The score is an exact integer; smaller is better"],
  frontier: true,
  instances,
};

// Per-dimension kernel numerator over S²: 1 + 6B₂(t/S) = (2S² − 6tS + 6t²)/S².
// Positive for every t — the discriminant 36S² − 48S² is negative.
function factor(t: number): bigint {
  const value = big(t);
  return 2n * S * S - 6n * value * S + 6n * value * value;
}

export function torusEnergyNumerator(points: number[][], n: number, d: number): bigint {
  let sum = 0n;
  for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) {
    let product = 1n;
    for (let r = 0; r < d; r += 1) product *= factor(Math.abs(points[i][r] - points[j][r]));
    sum += product;
  }
  return sum - big(n) * big(n) * S ** big(2 * d);
}

function verifyTorusQuadrature(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 1 || n > MAX_N || d < 1 || d > MAX_D) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const points = readMatrix(answer.points, "points", n, d, 0, SCALE - 1);
  const score = torusEnergyNumerator(points, n, d);
  const display = printScaled(integerSqrtCeil(ceilDiv(score * 10n ** 24n, big(n) * big(n) * S ** big(2 * d))), 12);
  return ok(score, display);
}

export const problem: ProblemModule = { definition, verify: verifyTorusQuadrature };
