import { SCALE, ok, fail, refuse, asInt, isObject, asArray, parseFixed } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { big, floorDiv, printScaled, ratioLess, lcg, signedUnit, type Ratio } from "./frontier-kit";

// P64: packing 2-dimensional subspaces of R^d — Grassmannian packing under
// the chordal distance, the workhorse of fusion frames.
//
// A submission gives each subspace as two basis vectors. The verifier forms
// the exact orthogonal projector P = A(AᵀA)⁻¹Aᵀ through the 2×2 adjugate —
// so any basis of the same plane scores identically — and maximizes the
// smallest squared chordal distance
//
//   d²(i, j) = k − tr(P_i P_j),   k = 2,
//
// which is the sum of the squared sines of the principal angles: exactly the
// D column of Sloane's Grassmannian packing tables, so the known-best rows
// cite his numbers with no unit conversion at all. The stored score is
// floor(min·10¹⁸), rounded against the submitter.

const K = 2;
const MAX_N = 24;
const MAX_D = 8;

// Ranges skip the plateaus of Sloane's table (long runs of exactly-rational
// D where the packings are rigid families with published constructions) and
// keep the rows where the best known value is a genuine search result.
const RANGES: Record<number, number[]> = {
  4: [9, 19, 20],
  5: [12, 13, 14, 15, 18, 19, 20],
  6: [15, 16, 17, 18, 19, 20],
};

// The baseline pins every plane to a common line: subspace i is spanned by
// e₁ and a second vector that walks a coarse arc. Every pair shares e₁, so
// one principal angle is zero and d² ≤ 1 with the minimum far below the
// spread constructions the tests exhibit.
function pinnedBaseline(n: number, d: number): { subspaces: string[][][] } {
  const fine = (value: number) => (Math.round(value * SCALE) / SCALE).toFixed(9);
  return { subspaces: Array.from({ length: n }, (_, i) => {
    const first = Array.from({ length: d }, (_, r) => (r === 0 ? "1" : "0"));
    const angle = (i + 1) / (n + 1);
    const second = Array.from({ length: d }, (_, r) => r === 1 ? fine(1 - angle) : r === 2 ? fine(angle) : "0");
    return [first, second];
  }) };
}

export function scatteredSubspaces(n: number, d: number, seed: number): { subspaces: string[][][] } {
  const next = lcg(seed);
  return { subspaces: Array.from({ length: n }, () => [
    Array.from({ length: d }, () => signedUnit(next)),
    Array.from({ length: d }, () => signedUnit(next)),
  ]) };
}

const instances: ProblemInstanceDefinition[] = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p64-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims), k: K },
  baselineAnswer: pinnedBaseline(n, Number(dims)),
})));

export const definition: ProblemDefinition = {
  id: "p64", instanceId: "p64-d5-n12-v1", code: "P64", slug: "subspace-packing", category: "extremal",
  title: "最分离的子空间族",
  summary: "在 d 维空间里选 n 个二维子空间（平面），让最接近的一对尽可能远。",
  objective: "maximize", scoreLabel: "最小弦距平方", scoreLabelEn: "the smallest squared chordal distance",
  instanceName: "d = 5, n = 12", instanceNameEn: "d = 5, n = 12", parameters: { n: 12, d: 5, k: K },
  baselineAnswer: pinnedBaseline(12, 5),
  answerHelp: "提交 subspaces：恰好 n 个子空间，每个是 2 个长度为 d 的基向量（十进制字符串，[-1, 1]）。基的选择不影响分数：同一个平面的任何基得同一个分。",
  answerHelpEn: "Submit subspaces: exactly n subspaces, each 2 basis vectors of length d (decimal strings in [-1, 1]). The basis does not matter: any basis of the same plane scores the same.",
  titleEn: "The most separated family of subspaces",
  summaryEn: "Choose n two-dimensional subspaces (planes) of R^d so that the closest pair is as far apart as possible.",
  extent: SCALE,
  frame: "每个子空间由 2 个线性无关的基向量给出，坐标写成 [-1, 1] 内的十进制字符串，最多九位小数。张成同一平面的任何基代表同一个答案。",
  frameEn: "Each subspace is given by 2 linearly independent basis vectors, coordinates written as decimal strings in [-1, 1] with at most nine decimal places. Any basis spanning the same plane represents the same answer.",
  definition: "在 R^d 中选择 n 个二维子空间。两个平面的弦距平方是它们主角正弦的平方和，等价地 2 − tr(PᵢPⱼ)，其中 P 是正交投影矩阵。最大化所有平面对中最小的弦距平方。",
  definitionEn: "Choose n two-dimensional subspaces of R^d. The squared chordal distance of two planes is the sum of the squared sines of their principal angles — equivalently 2 − tr(P_iP_j) with P the orthogonal projectors. Maximize the smallest squared chordal distance over all pairs.",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维实空间 R^d；答案是 Grassmann 流形 G(d, 2) 中的 n 个点，即 n 个过原点的平面", textEn: "Real d-space R^d; an answer is n points of the Grassmannian G(d, 2) — n planes through the origin" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个子空间，每个 2 个基向量；基向量必须线性无关", textEn: "Exactly n subspaces, each 2 basis vectors; the basis vectors must be linearly independent" },
    { label: "目标", labelEn: "Objective", text: "最大化 min 2 − tr(PᵢPⱼ)；投影矩阵经 2×2 伴随矩阵精确构造，全程有理数", textEn: "Maximize min 2 − tr(P_iP_j); projectors are built exactly through the 2×2 adjugate, rational throughout" },
    { label: "计分", labelEn: "Scoring", text: "纪录是 floor(最小弦距平方 · 10¹⁸)，向不利于提交者的方向取整；页面显示弦距平方，向下取整到第 9 位小数", textEn: "The record is floor(min squared chordal distance · 10¹⁸), rounded against the submitter; the page shows the squared distance, rounded down at the ninth decimal" },
  ],
  intuition: [
    { title: "它用在哪里", titleEn: "Where it is used",
      text: "Fusion frame 把信号投影到多个低维子空间。平面彼此分得越开，对噪声和其中一个测量的丢失越鲁棒，用于分布式传感、并行处理与 MIMO 通信。",
      textEn: "A fusion frame projects a signal onto several low-dimensional subspaces. The further apart the planes, the more robust the system is to noise and to losing one of the measurements — distributed sensing, parallel processing, MIMO communication." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "Sloane 的 Grassmannian 打包表按弦距维护这些参数的最好已知值，多数只是大规模搜索的产物；本站的子题特意避开了表中恰为有理数的刚性平台段，选在真正的搜索前沿上。",
      textEn: "Sloane's Grassmannian packing tables maintain the best known chordal values for these parameters, most of them products of large searches; the sub-problems here deliberately skip the table's exactly-rational rigid plateaus and sit on the genuine search frontier.",
      url: "http://neilsloane.com/grass/" },
  ],
  requirements: ["恰好 n 个子空间，每个 2 个长度 d 的基向量", "坐标在 [-1, 1] 内；两个基向量线性无关", "分数是 floor(最小弦距平方 · 10¹⁸)，越大越好"],
  requirementsEn: ["Exactly n subspaces, each 2 basis vectors of length d", "Coordinates in [-1, 1]; the two basis vectors linearly independent", "The score is floor(min squared chordal distance · 10¹⁸); larger is better"],
  frontier: true,
  instances,
};

type Plane = { basis: bigint[][]; gram: [bigint, bigint, bigint]; det: bigint };

function readPlanes(value: unknown, n: number, d: number): Plane[] | VerificationResult {
  const raw = asArray(value, "subspaces");
  if (raw.length !== n) refuse(`subspaces 需要恰好 ${n} 个子空间`, `subspaces needs exactly ${n} subspaces`);
  const planes: Plane[] = [];
  for (let i = 0; i < n; i += 1) {
    const pair = asArray(raw[i], `subspaces[${i}]`);
    if (pair.length !== K) refuse(`subspaces[${i}] 需要恰好 ${K} 个基向量`, `subspaces[${i}] needs exactly ${K} basis vectors`);
    const basis = pair.map((entry, v) => {
      const row = asArray(entry, `subspaces[${i}][${v}]`);
      if (row.length !== d) refuse(`subspaces[${i}][${v}] 需要 ${d} 个坐标`, `subspaces[${i}][${v}] needs ${d} coordinates`);
      return row.map((cell, j) => {
        const units = parseFixed(cell, `subspaces[${i}][${v}][${j}]`);
        if (Math.abs(units) > SCALE) refuse(`subspaces[${i}][${v}][${j}] 超出 [-1, 1]`, `subspaces[${i}][${v}][${j}] is outside [-1, 1]`);
        return big(units);
      });
    });
    let g11 = 0n, g12 = 0n, g22 = 0n;
    for (let r = 0; r < d; r += 1) {
      g11 += basis[0][r] * basis[0][r];
      g12 += basis[0][r] * basis[1][r];
      g22 += basis[1][r] * basis[1][r];
    }
    const det = g11 * g22 - g12 * g12;
    if (det === 0n)
      return fail("DEGENERATE", `子空间 ${i + 1} 的基向量线性相关，张不成平面`, `subspace ${i + 1}'s basis vectors are linearly dependent and span no plane`);
    planes.push({ basis, gram: [g11, g12, g22], det });
  }
  return planes;
}

// tr(P_i P_j) computed through the adjugate: with M = A_iᵀA_j (2×2),
// tr(P_iP_j) = tr(adj(G_i)·M·adj(G_j)·Mᵀ) / (det G_i · det G_j). The
// chordal distance squared is then (2·det_i·det_j − numerator)/(det_i·det_j).
export function smallestChordal(planes: Plane[]): { ratio: Ratio; pair: [number, number] } {
  let best: Ratio | null = null;
  let pair: [number, number] = [0, 1];
  for (let i = 0; i < planes.length; i += 1) for (let j = i + 1; j < planes.length; j += 1) {
    const a = planes[i], b = planes[j];
    const d = a.basis[0].length;
    // M = A_iᵀ A_j, 2×2.
    let m11 = 0n, m12 = 0n, m21 = 0n, m22 = 0n;
    for (let r = 0; r < d; r += 1) {
      m11 += a.basis[0][r] * b.basis[0][r];
      m12 += a.basis[0][r] * b.basis[1][r];
      m21 += a.basis[1][r] * b.basis[0][r];
      m22 += a.basis[1][r] * b.basis[1][r];
    }
    // adj(G) for G = [[g11, g12], [g12, g22]] is [[g22, -g12], [-g12, g11]].
    const [ag11, ag12, ag22] = a.gram, [bg11, bg12, bg22] = b.gram;
    // T = adj(G_i) · M          (2×2)
    const t11 = ag22 * m11 - ag12 * m21, t12 = ag22 * m12 - ag12 * m22;
    const t21 = -ag12 * m11 + ag11 * m21, t22 = -ag12 * m12 + ag11 * m22;
    // U = T · adj(G_j)          (2×2)
    const u11 = t11 * bg22 - t12 * bg12, u12 = -t11 * bg12 + t12 * bg11;
    const u21 = t21 * bg22 - t22 * bg12, u22 = -t21 * bg12 + t22 * bg11;
    // tr(U · Mᵀ) = u11·m11 + u12·m12 + u21·m21 + u22·m22.
    const traceNumerator = u11 * m11 + u12 * m12 + u21 * m21 + u22 * m22;
    const denominator = a.det * b.det;
    const candidate: Ratio = { p: 2n * denominator - traceNumerator, q: denominator };
    if (best === null || ratioLess(candidate, best)) { best = candidate; pair = [i, j]; }
  }
  return { ratio: best ?? { p: 2n, q: 1n }, pair };
}

function verifySubspacePacking(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (asInt(params.k ?? K, "k") !== K) refuse("本验证器只支持 k = 2", "this verifier supports only k = 2");
  if (n < 2 || n > MAX_N || d < 3 || d > MAX_D) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const planes = readPlanes(answer.subspaces, n, d);
  if (!Array.isArray(planes)) return planes;
  const { ratio, pair } = smallestChordal(planes);
  const score = floorDiv(ratio.p * 10n ** 18n, ratio.q);
  const display = printScaled(floorDiv(ratio.p * 10n ** 9n, ratio.q), 9);
  const result = ok(score, display);
  return { ...result,
    message: `${result.message} 最接近的一对平面是 ${pair[0] + 1} 与 ${pair[1] + 1}。`,
    messageEn: `${result.messageEn} The closest pair of planes is ${pair[0] + 1} and ${pair[1] + 1}.` };
}

export const problem: ProblemModule = { definition, verify: verifySubspacePacking };
