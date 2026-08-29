import { SCALE, ok, fail, refuse, asInt, isObject } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { big, ceilDiv, integerSqrtCeil, printScaled, readMatrix, ratioLess, lcg, signedUnit, type Ratio } from "./frontier-kit";

// P60: packing lines in real projective space — for a reader, the most
// spread-out set of directions.
//
// A submission is n nonzero rational vectors in R^d; each stands for the line
// through the origin it spans, so sign and scale are free. The score is the
// squared coherence
//
//   μ²(V) = max_{i<j} (v_i·v_j)² / (|v_i|²|v_j|²)
//
// minimized: the largest pairwise alignment, and the frontier is Sloane's
// Grassmannian packing table, which the known-best column cites. Every
// candidate value is a ratio of two bigints compared by cross-multiplication;
// no normalization, no square root, no trigonometry anywhere on the scoring
// path. The stored score is ceil(μ²·10¹⁸) — rounded against the submitter —
// and the display is μ itself, rounded up at the ninth decimal.

const MAX_N = 48;
const MAX_D = 8;

// Sub-problem ranges skirt everything the literature has settled: for d = 3,
// optimality is proven through n = 8 (n ≤ 7 classically; n = 8 by Mixon and
// Parshall, arXiv:1902.10177), so play starts at 9. For d = 4 and 5 the small
// counts sit in simplex/orthoplex territory with published proofs, so play
// starts past them.
const RANGES: Record<number, number[]> = {
  3: [9, 10, 11, 12, 13, 14, 15, 16],
  4: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  5: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
};

// The baseline rides the moment curve: v_i = (1, t_i, t_i², …) with t_i
// spread over (0, 1]. Legal, deterministic, and poor — neighbouring
// parameters give nearly parallel lines — so a spread construction beats it,
// which the tests assert through the real verifier for every sub-problem.
function momentBaseline(n: number, d: number): { vectors: string[][] } {
  const fine = (value: number) => (Math.round(value * SCALE) / SCALE).toFixed(9);
  return { vectors: Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return Array.from({ length: d }, (_, r) => fine(t ** r));
  }) };
}

// The exhibition answer the tests hold against the baseline: deterministic
// pseudo-random directions. Far from optimal, which is deliberate.
export function scatteredLines(n: number, d: number, seed: number): { vectors: string[][] } {
  const next = lcg(seed);
  return { vectors: Array.from({ length: n }, () => Array.from({ length: d }, () => signedUnit(next))) };
}

const instances: ProblemInstanceDefinition[] = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p60-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: momentBaseline(n, Number(dims)),
})));

export const definition: ProblemDefinition = {
  id: "p60", instanceId: "p60-d3-n9-v1", code: "P60", slug: "line-packing", category: "extremal",
  title: "实射影空间中的直线打包",
  summary: "在 d 维空间里选 n 条过原点的直线，让任意两条的夹角尽可能大。",
  objective: "minimize", scoreLabel: "最大重合度 μ", scoreLabelEn: "the largest coherence μ",
  instanceName: "d = 3, n = 9", instanceNameEn: "d = 3, n = 9", parameters: { n: 9, d: 3 },
  baselineAnswer: momentBaseline(9, 3),
  answerHelp: "提交 vectors：恰好 n 行，每行 d 个 [-1, 1] 内的十进制字符串坐标。每行是一个非零向量，代表它张成的直线；正负与缩放不改变答案。",
  answerHelpEn: "Submit vectors: exactly n rows of d decimal-string coordinates in [-1, 1]. Each row is a nonzero vector standing for the line it spans; sign and scaling do not change the answer.",
  titleEn: "Line packing in real projective space",
  summaryEn: "Choose n lines through the origin of R^d so that the smallest angle between any two is as large as possible.",
  extent: SCALE,
  frame: "每条直线由一个非零向量表示，d 个坐标写成 [-1, 1] 内的十进制字符串，最多九位小数。向量的正负和非零缩放代表同一条直线。",
  frameEn: "Each line is given by a nonzero vector: d coordinates written as decimal strings in [-1, 1], at most nine decimal places. Sign and nonzero scaling represent the same line.",
  definition: "在 R^d 中选择 n 条过原点的直线，使任意两条之间的夹角的最小值尽可能大。等价地：最小化最大重合度 μ = max |cos∠(vᵢ, vⱼ)|。",
  definitionEn: "Choose n lines through the origin of R^d so that the minimum angle between any two is as large as possible — equivalently, minimize the largest coherence μ = max |cos ∠(v_i, v_j)|.",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维实空间 R^d，所有直线都过原点；答案是实射影空间 RP^{d-1} 中的 n 个点", textEn: "Real d-space R^d, every line through the origin; an answer is n points of real projective space RP^{d-1}" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个非零向量，每个 d 个坐标；向量代表它张成的直线", textEn: "Exactly n nonzero vectors, d coordinates each; a vector stands for the line it spans" },
    { label: "目标", labelEn: "Objective", text: "最小化 μ² = max (vᵢ·vⱼ)²/(|vᵢ|²|vⱼ|²)，全程有理数交叉相乘比较，无归一化无开方", textEn: "Minimize μ² = max (v_i·v_j)²/(|v_i|²|v_j|²), compared exactly by cross-multiplication — no normalization, no square roots" },
    { label: "计分", labelEn: "Scoring", text: "纪录是 ceil(μ²·10¹⁸)，向不利于提交者的方向取整；页面显示 μ，向上取整到第 9 位小数", textEn: "The record is ceil(μ²·10¹⁸), rounded against the submitter; the page shows μ, rounded up at the ninth decimal" },
  ],
  intuition: [
    { title: "换一种说法", titleEn: "Another way to say it",
      text: "d = 4 时，一个非零向量归一化后是单位四元数，q 与 −q 是同一个三维旋转，所以 d = 4 的子题就是「选 n 个彼此最分散的三维姿态」，机器人和渲染里真实使用的问题。",
      textEn: "At d = 4 a normalized nonzero vector is a unit quaternion, and q and −q are the same 3D rotation — so the d = 4 sub-problems ask for n maximally separated 3D orientations, a problem robotics and rendering actually use." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "Grassmannian frame 用于抗噪声与抗擦除的数据表示、无线通信与压缩感知。Sloane 的打包表维护着这些参数的最好已知值并公开邀请改进；d = 3 的最优性证明只到 n = 8。",
      textEn: "Grassmannian frames drive noise- and erasure-robust data representations, wireless communication and compressed sensing. Sloane's packing table maintains the best known values for these parameters and openly invites improvement; optimality proofs in d = 3 stop at n = 8.",
      url: "http://neilsloane.com/grass/" },
  ],
  requirements: ["恰好 n 个非零向量，每个 d 个坐标", "坐标在 [-1, 1] 内", "分数是 ceil(μ²·10¹⁸)，越小越好"],
  requirementsEn: ["Exactly n nonzero vectors with d coordinates each", "Coordinates lie in [-1, 1]", "The score is ceil(μ²·10¹⁸); smaller is better"],
  frontier: true,
  instances,
};

// The exact worst pair of a set of integer vectors: max (v·w)²/(|v|²|w|²) as
// a ratio, plus which pair achieves it. Exported for the tests.
export function worstAlignment(vectors: number[][]): { ratio: Ratio; pair: [number, number] } {
  let worst: Ratio = { p: 0n, q: 1n };
  let pair: [number, number] = [0, 1];
  for (let i = 0; i < vectors.length; i += 1) for (let j = i + 1; j < vectors.length; j += 1) {
    let dot = 0n, normI = 0n, normJ = 0n;
    for (let r = 0; r < vectors[i].length; r += 1) {
      const a = big(vectors[i][r]), b = big(vectors[j][r]);
      dot += a * b; normI += a * a; normJ += b * b;
    }
    const candidate: Ratio = { p: dot * dot, q: normI * normJ };
    if (ratioLess(worst, candidate)) { worst = candidate; pair = [i, j]; }
  }
  return { ratio: worst, pair };
}

export function coherenceScore(ratio: Ratio): bigint {
  return ceilDiv(ratio.p * 10n ** 18n, ratio.q);
}

export function coherenceDisplay(score: bigint): string {
  return printScaled(integerSqrtCeil(score), 9);
}

function verifyLinePacking(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 2 || n > MAX_N || d < 2 || d > MAX_D) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const vectors = readMatrix(answer.vectors, "vectors", n, d, -SCALE, SCALE);
  for (let i = 0; i < n; i += 1)
    if (vectors[i].every((value) => value === 0))
      return fail("DEGENERATE", `向量 ${i + 1} 是零向量，代表不了直线`, `vector ${i + 1} is zero and spans no line`);
  const { ratio, pair } = worstAlignment(vectors);
  const score = coherenceScore(ratio);
  const result = ok(score, coherenceDisplay(score));
  return { ...result,
    message: `${result.message} 最接近的一对直线是 ${pair[0] + 1} 与 ${pair[1] + 1}。`,
    messageEn: `${result.messageEn} The closest pair of lines is ${pair[0] + 1} and ${pair[1] + 1}.` };
}

export const problem: ProblemModule = { definition, verify: verifyLinePacking };
