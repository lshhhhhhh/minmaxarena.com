import { SCALE, ok, fail, refuse, asInt, isObject } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { big, floorDiv, printScaled, ratioLess, readMatrix, lcg, signedUnit, type Ratio } from "./frontier-kit";

// P65: measurement directions that survive losses — maximin-volume frames.
//
// Choose n nonzero vectors in R^d. If only some d of the n measurements
// survive, the space is recoverable exactly when those d vectors are
// linearly independent, and the further their normalized volume is from
// zero, the further the worst survivors are from useless. The score is
//
//   R(V) = min over d-subsets S of det(V_S)² / Π_{i∈S} |v_i|²
//
// maximized. Zero means some d survivors cannot recover the space at all; a
// full-spark frame is exactly one with R > 0, and this problem asks for the
// most robust one. The wording is deliberate: the normalized squared volume
// is a stability proxy aligned with, but not identical to, worst-case
// condition numbers — the page claims maximin volume and nothing more.
//
// Every determinant is an integer of scaled coordinates and every norm a
// sum of squares, so the minimum is exact by cross-multiplication; the
// stored score is floor(R·10¹⁸), rounded against the submitter. The subset
// count C(n,d) is capped by the instance table, far under the public
// interface budget.

const MAX_N = 20;
const MAX_D = 6;

const RANGES: Record<number, number[]> = {
  3: [6, 8, 10, 12],
  4: [8, 10, 12, 14],
  5: [10, 12, 14],
};

// The baseline clusters two vectors nearly together: v₂ is v₁ nudged by one
// part in a thousand, so any surviving subset containing both is nearly
// dependent and the minimum volume is tiny. Everything spread beats it.
function clusteredBaseline(n: number, d: number): { vectors: string[][] } {
  const next = lcg(65_001);
  const rows = Array.from({ length: n }, () => Array.from({ length: d }, () => signedUnit(next)));
  rows[1] = rows[0].map((value, index) => {
    const nudged = Math.round(Number(value) * SCALE) + (index === 0 ? 1_000_000 : 0);
    return (Math.max(-SCALE, Math.min(SCALE, nudged)) / SCALE).toFixed(9);
  });
  return { vectors: rows };
}

export function scatteredFrame(n: number, d: number, seed: number): { vectors: string[][] } {
  const next = lcg(seed);
  return { vectors: Array.from({ length: n }, () => Array.from({ length: d }, () => signedUnit(next))) };
}

const instances: ProblemInstanceDefinition[] = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p65-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: clusteredBaseline(n, Number(dims)),
})));

export const definition: ProblemDefinition = {
  id: "p65", instanceId: "p65-d4-n10-v1", code: "P65", slug: "erasure-frames", category: "extremal",
  title: "最鲁棒的冗余测量方向",
  summary: "选 n 个测量方向，使任意 d 个幸存方向张成的最小归一化体积尽可能大。",
  objective: "maximize", scoreLabel: "最坏子集的归一化体积", scoreLabelEn: "the worst subset's normalized volume",
  instanceName: "d = 4, n = 10", instanceNameEn: "d = 4, n = 10", parameters: { n: 10, d: 4 },
  baselineAnswer: clusteredBaseline(10, 4),
  answerHelp: "提交 vectors：恰好 n 行，每行 d 个 [-1, 1] 内的十进制字符串坐标，每行是一个非零向量。",
  answerHelpEn: "Submit vectors: exactly n rows of d decimal-string coordinates in [-1, 1], each row a nonzero vector.",
  titleEn: "The most erasure-robust measurement directions",
  summaryEn: "Choose n measurement directions so that the smallest normalized volume spanned by any d survivors is as large as possible.",
  extent: SCALE,
  frame: "每个测量方向是一个非零向量：d 个坐标写成 [-1, 1] 内的十进制字符串，最多九位小数。",
  frameEn: "Each measurement direction is a nonzero vector: d coordinates written as decimal strings in [-1, 1], at most nine decimal places.",
  definition: "在 R^d 中选择 n 个非零向量。对每个大小为 d 的子集，取以这些向量为列的矩阵的行列式平方除以各向量范数平方之积；最大化所有子集中这个归一化体积的最小值。为零意味着某 d 个幸存测量无法恢复整个空间。",
  definitionEn: "Choose n nonzero vectors in R^d. For every subset of size d, take the squared determinant of the matrix with those vectors as columns, divided by the product of their squared norms; maximize the minimum of this normalized volume over all subsets. Zero means some d surviving measurements cannot recover the space at all.",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维实空间 R^d；答案是 n 个测量方向", textEn: "Real d-space R^d; an answer is n measurement directions" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个非零向量，每个 d 个坐标", textEn: "Exactly n nonzero vectors with d coordinates each" },
    { label: "目标", labelEn: "Objective", text: "最大化 min det(V_S)²/Π|vᵢ|²，对全部 C(n,d) 个子集取最小；行列式与范数全是有理数，比较交叉相乘", textEn: "Maximize min det(V_S)²/Π|v_i|² over all C(n,d) subsets; determinants and norms are rational, compared by cross-multiplication" },
    { label: "措辞", labelEn: "Wording", text: "归一化体积是与数值稳定性一致的鲁棒性代理，不等同于所有噪声模型下的最优重建误差；本题只声称 maximin volume", textEn: "The normalized volume is a robustness proxy aligned with numerical stability, not the optimal reconstruction error under every noise model; this problem claims maximin volume and nothing more" },
    { label: "计分", labelEn: "Scoring", text: "纪录是 floor(最小归一化体积 · 10¹⁸)，向不利于提交者的方向取整；页面显示该体积，向下取整到第 12 位小数", textEn: "The record is floor(min normalized volume · 10¹⁸), rounded against the submitter; the page shows that volume, rounded down at the twelfth decimal" },
  ],
  intuition: [
    { title: "它防的是什么", titleEn: "What it defends against",
      text: "冗余测量的意义是坏掉几个也能恢复信号。full-spark frame 要求任何 d 个幸存向量都张成全空间；这里更进一步，问最坏的那组幸存者离退化有多远，这出现在稀疏信号处理、抗擦除传输与相位恢复里。",
      textEn: "Redundant measurements exist so the signal survives losing a few. A full-spark frame demands that any d survivors span the space; this problem goes further and asks how far the worst set of survivors is from degenerate — the concern of sparse signal processing, erasure-robust transmission and phase retrieval." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "full-spark frame 的存在性与构造有成熟文献，但固定 (n, d) 下最大化最坏子集体积没有已发表的最优表。每个子题都开放。",
      textEn: "Existence and constructions of full-spark frames are well studied, but maximizing the worst subset volume at fixed (n, d) has no published table of optima. Every sub-problem is open.",
      url: "https://arxiv.org/abs/1110.3548" },
  ],
  requirements: ["恰好 n 个非零向量，每个 d 个坐标", "坐标在 [-1, 1] 内", "分数是 floor(最小归一化体积 · 10¹⁸)，越大越好"],
  requirementsEn: ["Exactly n nonzero vectors with d coordinates each", "Coordinates lie in [-1, 1]", "The score is floor(min normalized volume · 10¹⁸); larger is better"],
  frontier: true,
  instances,
};

// Exact integer determinant by fraction-free Gaussian elimination (Bareiss),
// on a d×d matrix of scaled coordinates.
export function integerDeterminant(matrix: bigint[][]): bigint {
  const size = matrix.length;
  const work = matrix.map((row) => row.slice());
  let sign = 1n, previous = 1n;
  for (let column = 0; column < size - 1; column += 1) {
    if (work[column][column] === 0n) {
      const swap = work.findIndex((row, index) => index > column && row[column] !== 0n);
      if (swap === -1) return 0n;
      [work[column], work[swap]] = [work[swap], work[column]];
      sign = -sign;
    }
    for (let row = column + 1; row < size; row += 1) {
      for (let entry = column + 1; entry < size; entry += 1)
        work[row][entry] = (work[row][entry] * work[column][column] - work[row][column] * work[column][entry]) / previous;
      work[row][column] = 0n;
    }
    previous = work[column][column];
  }
  return sign * work[size - 1][size - 1];
}

export function worstSubsetVolume(vectors: number[][], d: number): { ratio: Ratio; subset: number[] } {
  const n = vectors.length;
  const lifted = vectors.map((vector) => vector.map(big));
  const norms = lifted.map((vector) => vector.reduce((sum, value) => sum + value * value, 0n));
  let best: Ratio | null = null;
  let witness: number[] = [];
  const chosen: number[] = [];
  const walk = (start: number) => {
    if (chosen.length === d) {
      const det = integerDeterminant(chosen.map((index) => lifted[index]));
      const candidate: Ratio = { p: det * det, q: chosen.reduce((product, index) => product * norms[index], 1n) };
      if (best === null || ratioLess(candidate, best)) { best = candidate; witness = chosen.slice(); }
      return;
    }
    for (let index = start; index <= n - (d - chosen.length); index += 1) {
      chosen.push(index);
      walk(index + 1);
      chosen.pop();
      // The minimum cannot go below zero, and zero cannot be improved on.
      if (best && (best as Ratio).p === 0n) return;
    }
  };
  walk(0);
  return { ratio: best ?? { p: 0n, q: 1n }, subset: witness };
}

function verifyErasureFrame(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 2 || n > MAX_N || d < 2 || d > MAX_D || n < d) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const vectors = readMatrix(answer.vectors, "vectors", n, d, -SCALE, SCALE);
  for (let i = 0; i < n; i += 1)
    if (vectors[i].every((value) => value === 0))
      return fail("DEGENERATE", `向量 ${i + 1} 是零向量`, `vector ${i + 1} is zero`);
  const { ratio, subset } = worstSubsetVolume(vectors, d);
  const score = floorDiv(ratio.p * 10n ** 18n, ratio.q);
  const display = printScaled(floorDiv(ratio.p * 10n ** 12n, ratio.q), 12);
  const result = ok(score, display);
  const listed = subset.map((index) => index + 1).join(", ");
  return { ...result,
    message: `${result.message} 最脆弱的幸存组合是向量 ${listed}。`,
    messageEn: `${result.messageEn} The most fragile surviving subset is vectors ${listed}.` };
}

export const problem: ProblemModule = { definition, verify: verifyErasureFrame };
