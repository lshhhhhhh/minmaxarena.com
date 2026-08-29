import { SCALE, ok, fail, refuse, asInt, isObject, asArray, parseFixed } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";
import { big, ratioLess, lcg, signedUnit, type Ratio } from "./frontier-kit";
import { coherenceScore, coherenceDisplay } from "./p60-line-packing";

// P61: packing points in complex projective space — the complex sibling of
// P60, and the table it plays against is the Game of Sloanes (Jasper, King,
// Mixon), a public leader board of putatively optimal packings that exists
// precisely to be beaten.
//
// A submission is n nonzero vectors in C^d, each entry a [re, im] pair of
// decimal strings. Global phase and nonzero complex scaling do not change the
// projective point, so no normalization is asked for or done. The score is
//
//   μ²(Z) = max_{i<j} |⟨z_i, z_j⟩|² / (|z_i|²|z_j|²)
//
// minimized, with |⟨z,w⟩|² = (Σ aᵣcᵣ + bᵣdᵣ)² + (Σ aᵣdᵣ − bᵣcᵣ)² for
// z = a + bi, w = c + di — integers throughout, compared by cross
// multiplication, stored as ceil(μ²·10¹⁸) exactly like P60.

const MAX_N = 48;
const MAX_D = 8;

// The ranges dodge every row of the Game of Sloanes leader board where the
// best known coherence MEETS its lower bound — those packings are provably
// optimal (mostly equiangular tight frames) and playing them would be
// spending evenings on finished mathematics. What remains is the open rows.
const RANGES: Record<number, number[]> = {
  3: [5, 8, 13, 14, 15, 16],
  4: [6, 9, 10, 11, 12, 14, 15],
  5: [7, 8, 9, 12, 13, 14, 15, 16],
  6: [10, 13, 14, 15],
};

// The moment-curve baseline again, real parts only: legal, deterministic,
// poor. Anything spread beats it.
function momentBaseline(n: number, d: number): { vectors: string[][][] } {
  const fine = (value: number) => (Math.round(value * SCALE) / SCALE).toFixed(9);
  return { vectors: Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return Array.from({ length: d }, (_, r) => [fine(t ** r), "0"]);
  }) };
}

export function scatteredComplex(n: number, d: number, seed: number): { vectors: string[][][] } {
  const next = lcg(seed);
  return { vectors: Array.from({ length: n }, () => Array.from({ length: d }, () => [signedUnit(next), signedUnit(next)])) };
}

const instances: ProblemInstanceDefinition[] = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p61-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: momentBaseline(n, Number(dims)),
})));

export const definition: ProblemDefinition = {
  id: "p61", instanceId: "p61-d4-n9-v1", code: "P61", slug: "complex-projective-packing", category: "extremal",
  title: "复射影空间中的码本打包",
  summary: "在 d 维复空间里选 n 个方向，让任意两个的重合度尽可能小。",
  objective: "minimize", scoreLabel: "最大重合度 μ", scoreLabelEn: "the largest coherence μ",
  instanceName: "d = 4, n = 9", instanceNameEn: "d = 4, n = 9", parameters: { n: 9, d: 4 },
  baselineAnswer: momentBaseline(9, 4),
  answerHelp: "提交 vectors：恰好 n 行，每行 d 个 [re, im] 对，实部虚部都是 [-1, 1] 内的十进制字符串。每行是一个非零复向量；整体相位和非零复缩放不改变答案。",
  answerHelpEn: "Submit vectors: exactly n rows of d pairs [re, im], both decimal strings in [-1, 1]. Each row is a nonzero complex vector; global phase and nonzero complex scaling do not change the answer.",
  titleEn: "Codebook packing in complex projective space",
  summaryEn: "Choose n directions in complex d-space so that the largest pairwise coherence is as small as possible.",
  extent: SCALE,
  frame: "每个复向量是 d 个 [re, im] 对，分量写成 [-1, 1] 内的十进制字符串，最多九位小数。整体相位与非零复缩放代表同一个射影点。",
  frameEn: "Each complex vector is d pairs [re, im], components written as decimal strings in [-1, 1] with at most nine decimal places. Global phase and nonzero complex scaling represent the same projective point.",
  definition: "在 C^d 中选择 n 个非零向量（即复射影空间中的 n 个点），最小化最大归一化 Hermitian 重合度 μ = max |⟨zᵢ, zⱼ⟩| / (|zᵢ||zⱼ|)。",
  definitionEn: "Choose n nonzero vectors in C^d — n points of complex projective space — minimizing the largest normalized Hermitian overlap μ = max |⟨z_i, z_j⟩| / (|z_i||z_j|).",
  strict: [
    { label: "容器", labelEn: "Container", text: "d 维复空间 C^d；答案是复射影空间 CP^{d-1} 中的 n 个点", textEn: "Complex d-space C^d; an answer is n points of complex projective space CP^{d-1}" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个非零复向量，每个 d 个 [re, im] 对", textEn: "Exactly n nonzero complex vectors, each d pairs [re, im]" },
    { label: "目标", labelEn: "Objective", text: "最小化 μ² = max |⟨zᵢ,zⱼ⟩|²/(|zᵢ|²|zⱼ|²)；模平方与范数平方全是有理数，交叉相乘精确比较", textEn: "Minimize μ² = max |⟨z_i,z_j⟩|²/(|z_i|²|z_j|²); moduli and norms squared are rational, compared exactly by cross-multiplication" },
    { label: "计分", labelEn: "Scoring", text: "纪录是 ceil(μ²·10¹⁸)；页面显示 μ，向上取整到第 9 位小数", textEn: "The record is ceil(μ²·10¹⁸); the page shows μ, rounded up at the ninth decimal" },
  ],
  intuition: [
    { title: "它用在哪里", titleEn: "Where it is used",
      text: "复射影码本直接对应量子测量（SIC-POVM 一族）、通信码本与抗噪数据表示。分得越开的码字，越能在噪声和丢失下区分。",
      textEn: "Complex projective codebooks are quantum measurements (the SIC-POVM family), communication codebooks, and noise-robust data representations. The further apart the codewords, the better they survive noise and erasures." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "Game of Sloanes 是一张公开的「推测最优」排行榜，明确邀请任何人改进表中的打包。这里的每个子题都选自它仍然开放的行：最好已知值与下界之间有真实的缝隙。",
      textEn: "The Game of Sloanes is a public leader board of putatively optimal packings that explicitly invites improvement. Every sub-problem here is chosen from its still-open rows — the ones with a real gap between the best known value and the lower bound.",
      url: "https://github.com/gnikylime/GameofSloanes" },
  ],
  requirements: ["恰好 n 个非零复向量，每个 d 个 [re, im] 对", "所有分量在 [-1, 1] 内", "分数是 ceil(μ²·10¹⁸)，越小越好"],
  requirementsEn: ["Exactly n nonzero complex vectors with d pairs [re, im] each", "All components lie in [-1, 1]", "The score is ceil(μ²·10¹⁸); smaller is better"],
  frontier: true,
  instances,
};

type ComplexVector = { re: number[]; im: number[] };

function readComplexVectors(value: unknown, n: number, d: number): ComplexVector[] {
  const raw = asArray(value, "vectors");
  if (raw.length !== n) refuse(`vectors 需要恰好 ${n} 行`, `vectors needs exactly ${n} rows`);
  return raw.map((entry, i) => {
    const row = asArray(entry, `vectors[${i}]`);
    if (row.length !== d) refuse(`vectors[${i}] 需要恰好 ${d} 个分量`, `vectors[${i}] needs exactly ${d} components`);
    const re: number[] = [], im: number[] = [];
    row.forEach((cell, j) => {
      const pair = asArray(cell, `vectors[${i}][${j}]`);
      if (pair.length !== 2) refuse(`vectors[${i}][${j}] 必须是 [re, im] 对`, `vectors[${i}][${j}] must be a pair [re, im]`);
      const a = parseFixed(pair[0], `vectors[${i}][${j}][0]`), b = parseFixed(pair[1], `vectors[${i}][${j}][1]`);
      if (Math.abs(a) > SCALE || Math.abs(b) > SCALE)
        refuse(`vectors[${i}][${j}] 超出 [-1, 1]`, `vectors[${i}][${j}] is outside [-1, 1]`);
      re.push(a); im.push(b);
    });
    return { re, im };
  });
}

export function worstHermitianAlignment(vectors: ComplexVector[]): { ratio: Ratio; pair: [number, number] } {
  const norms = vectors.map((vector) => {
    let norm = 0n;
    for (let r = 0; r < vector.re.length; r += 1) norm += big(vector.re[r]) * big(vector.re[r]) + big(vector.im[r]) * big(vector.im[r]);
    return norm;
  });
  let worst: Ratio = { p: 0n, q: 1n };
  let pair: [number, number] = [0, 1];
  for (let i = 0; i < vectors.length; i += 1) for (let j = i + 1; j < vectors.length; j += 1) {
    let realPart = 0n, imagPart = 0n;
    for (let r = 0; r < vectors[i].re.length; r += 1) {
      const a = big(vectors[i].re[r]), b = big(vectors[i].im[r]);
      const c = big(vectors[j].re[r]), e = big(vectors[j].im[r]);
      realPart += a * c + b * e;
      imagPart += a * e - b * c;
    }
    const candidate: Ratio = { p: realPart * realPart + imagPart * imagPart, q: norms[i] * norms[j] };
    if (ratioLess(worst, candidate)) { worst = candidate; pair = [i, j]; }
  }
  return { ratio: worst, pair };
}

function verifyComplexPacking(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 2 || n > MAX_N || d < 2 || d > MAX_D) refuse("参数超出验证器支持的范围", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "答案必须是对象", "the answer must be an object");
  const vectors = readComplexVectors(answer.vectors, n, d);
  for (let i = 0; i < n; i += 1)
    if (vectors[i].re.every((value) => value === 0) && vectors[i].im.every((value) => value === 0))
      return fail("DEGENERATE", `向量 ${i + 1} 是零向量`, `vector ${i + 1} is zero`);
  const { ratio, pair } = worstHermitianAlignment(vectors);
  const score = coherenceScore(ratio);
  const result = ok(score, coherenceDisplay(score));
  return { ...result,
    message: `${result.message} 最接近的一对是 ${pair[0] + 1} 与 ${pair[1] + 1}。`,
    messageEn: `${result.messageEn} The closest pair is ${pair[0] + 1} and ${pair[1] + 1}.` };
}

export const problem: ProblemModule = { definition, verify: verifyComplexPacking };
