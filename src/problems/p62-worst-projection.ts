import { SCALE, ok, fail, refuse, asInt, isObject } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { readMatrix, lcg, unitCoordinate } from "./frontier-kit";
import { l2StarNumerator, l2StarDenominator, l2StarDisplay } from "./p59-l2-star-discrepancy";

// P62: the worst two-column projection of a high-dimensional point set.
//
// A full-dimensional uniformity number can be excellent while two particular
// coordinates, seen alone, stripe or cluster — and low-order interactions are
// exactly what dominates computer experiments and rendering. So this problem
// scores the projection a designer would be least happy to see: every pair of
// coordinates is dropped to the plane and scored with P59's exact
// two-dimensional L2-star formula, and the score is the worst pair's.
//
// All C(d,2) projections share one denominator (same n, same d = 2), so the
// exact maximum of the numerators is the exact maximum of the discrepancies:
// one bigint, no rounding anywhere before display.

const MAX_N = 64;
const MAX_D = 12;

const RANGES: Record<number, number[]> = {
  4: [16, 24, 32],
  6: [16, 24, 32],
  8: [16, 24, 32],
};

// The baseline piles every point onto the centre. Deliberately as poor as a
// legal answer gets — every projection shows one clump, D ≈ 0.28 — and any
// arrangement that spreads at all beats it. (The first draft used the
// diagonal, which turned out to be a genuinely decent L2-star answer:
// min(u,v) tracks uv closely enough that the diagonal beat random points'
// worst projection. The test suite caught the baseline being too good,
// which is a new way for a baseline to fail.)
function centreBaseline(n: number, d: number): { points: string[][] } {
  return { points: Array.from({ length: n }, () => Array.from({ length: d }, () => "0.5")) };
}

// Deterministic pseudo-random points. Not Halton: high-base Halton pairs are
// notoriously correlated at small n, and on this problem — which scores the
// WORST projection — that correlation actually loses to the diagonal
// baseline, which the test suite discovered the hard way. Uniform random
// points have unremarkable projections in every pair, which here is a virtue.
export function scatteredExhibit62(n: number, d: number, seed: number): { points: string[][] } {
  const next = lcg(seed);
  return { points: Array.from({ length: n }, () => Array.from({ length: d }, () => unitCoordinate(next))) };
}

const instances: ProblemInstanceDefinition[] = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p62-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: centreBaseline(n, Number(dims)),
})));

export const definition: ProblemDefinition = {
  id: "p62", instanceId: "p62-d4-n16-v1", code: "P62", slug: "worst-projection", category: "extremal",
  title: "最坏二维投影下的均匀采样",
  summary: "在 d 维超立方体里放 n 个点，让所有二维坐标投影里最不均匀的那个尽可能均匀。",
  objective: "minimize", scoreLabel: "最坏投影的 L2 星偏差", scoreLabelEn: "the worst projection's L2-star discrepancy",
  instanceName: "d = 4, n = 16", instanceNameEn: "d = 4, n = 16", parameters: { n: 16, d: 4 },
  baselineAnswer: centreBaseline(16, 4),
  answerHelp: "提交 points：恰好 n 行，每行 d 个 [0, 1] 内的十进制字符串坐标。",
  answerHelpEn: "Submit points: exactly n rows of d decimal-string coordinates in [0, 1].",
  titleEn: "Uniformity under the worst 2D projection",
  summaryEn: "Place n points in the d-dimensional hypercube so that the least uniform of all two-coordinate projections is as uniform as possible.",
  extent: SCALE,
  frame: "容器是 d 维单位超立方体 [0,1]^d。每个点是 d 个坐标，写成十进制字符串，最多九位小数。",
  frameEn: "The container is the d-dimensional unit hypercube [0,1]^d. Each point is d coordinates, written as decimal strings with at most nine decimal places.",
  definition: "在 [0,1]^d 中放置 n 个点。对每一对坐标 (r, s)，保留这两个坐标得到平面上的投影点集，用 P59 的精确公式算它的 L2 星偏差；全部 C(d,2) 个投影里最大的那个就是分数。让它尽可能小。",
  definitionEn: "Place n points in [0,1]^d. For every pair of coordinates (r, s), keep just those two coordinates to get a planar projection and score it with P59's exact L2-star formula; the score is the largest over all C(d,2) projections. Make it as small as possible.",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维单位超立方体 [0,1]^d", textEn: "The d-dimensional unit hypercube [0,1]^d" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个点，每个 d 个十进制坐标；允许重合", textEn: "Exactly n points, each d decimal coordinates; coincidences are allowed" },
    { label: "目标", labelEn: "Objective", text: "最小化所有二维坐标投影的 L2 星偏差的最大值；C(d,2) 个投影共用同一个分母，最大值在整数分子上精确取得", textEn: "Minimize the maximum L2-star discrepancy over all two-coordinate projections; the C(d,2) projections share one denominator, so the maximum is taken exactly on integer numerators" },
    { label: "计分", labelEn: "Scoring", text: "纪录是最坏投影清分母后的精确整数；页面显示该投影的偏差，向上取整到第 12 位小数", textEn: "The record is the worst projection's exact integer with the denominator cleared; the page shows that projection's discrepancy, rounded up at the twelfth decimal" },
  ],
  intuition: [
    { title: "为什么盯着投影", titleEn: "Why stare at projections",
      text: "高维的整体指标再好，也挡不住某两列合起来看条纹密布。计算机实验、渲染和 QMC 常由低阶交互主导，最坏的二维投影就是设计里最先坏掉的那面镜子。",
      textEn: "A fine full-dimensional score cannot stop two particular columns from striping when seen together. Computer experiments, rendering and QMC are dominated by low-order interactions, and the worst 2D projection is the first mirror to crack." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "投影均匀性是实验设计的活跃方向，但对固定 (n, d) 的连续最坏投影目标没有已发表的最优表。每个子题都开放。",
      textEn: "Projection uniformity is an active direction in experimental design, but the continuous worst-projection objective has no published table of optima for fixed (n, d). Every sub-problem is open.",
      url: "https://arxiv.org/abs/2605.19900" },
  ],
  requirements: ["恰好 n 个点，每个 d 个坐标", "坐标在 [0, 1] 内", "分数是最坏投影的精确整数，越小越好"],
  requirementsEn: ["Exactly n points, each with d coordinates", "Coordinates lie in [0, 1]", "The score is the worst projection's exact integer; smaller is better"],
  frontier: true,
  instances,
};

function verifyWorstProjection(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 1 || n > MAX_N || d < 3 || d > MAX_D) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const points = readMatrix(answer.points, "points", n, d, 0, SCALE);
  let worst = -1n;
  let pair: [number, number] = [0, 1];
  for (let r = 0; r < d; r += 1) for (let s = r + 1; s < d; s += 1) {
    const projected = points.map((point) => [point[r], point[s]]);
    const numerator = l2StarNumerator(projected, n, 2);
    if (numerator > worst) { worst = numerator; pair = [r, s]; }
  }
  const result = ok(worst, l2StarDisplay(worst, l2StarDenominator(n, 2)));
  return { ...result,
    message: `${result.message} 最坏的投影是坐标 ${pair[0] + 1} 与 ${pair[1] + 1}。`,
    messageEn: `${result.messageEn} The worst projection is onto coordinates ${pair[0] + 1} and ${pair[1] + 1}.` };
}

export const problem: ProblemModule = { definition, verify: verifyWorstProjection };
