import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, Point, VerificationResult } from "../problem-kit";

// Star discrepancy: how badly a finite set of points imitates an even spread.
//
// For every rectangle anchored at the origin, compare the fraction of the
// points it holds with the fraction of the square it covers. The worst
// disagreement over all such rectangles is the score, and it is minimised:
//
//   D*(P) = sup over 0 <= u,v <= 1 of | #(P ∩ [0,u)×[0,v)) / n  -  u·v |
//
// This is the quantity quasi-Monte Carlo integration is built on, and it is
// what renderers mean when they analyse a supersampling pattern: given a fixed
// budget of samples, is any rectangle of the frame being systematically
// oversampled or missed? The points a submitter arranges here are the sampling
// pattern itself, not an analogy for one.
//
// It scores exactly. The sup is attained on the grid of submitted coordinates,
// so the search is finite, and clearing denominators with u = X/S, v = Y/S
// leaves an integer:
//
//   max over the grid of max( A_closed·S² − n·X·Y , n·X·Y − A_open·S² )
//
// n and S are fixed within a sub-problem, so minimising that numerator is
// minimising D*.
const MIN_N = 22;
const MAX_N = 50;

// Both counting conventions are needed and taking one is the whole bug.
//
// The definition uses the half-open box [0,u)×[0,v). Push u and v just past a
// row of points and the box holds more of them than its area deserves; pull
// them just short and it holds fewer. Those are the two directions the
// supremum can come from, and on the grid they are the closed count and the
// open count at the same corner. Checking only the closed one silently forgives
// every arrangement that errs by being too sparse.
function worstDeviation(points: Point[]): { score: bigint; corner: Point; closed: boolean } {
  const n = BigInt(points.length);
  const square = BigInt(SCALE) * BigInt(SCALE);
  const xs = [...new Set([...points.map((point) => point[0]), SCALE])].sort((a, b) => a - b);
  const ys = [...new Set([...points.map((point) => point[1]), SCALE])].sort((a, b) => a - b);

  let score = -1n;
  let corner: Point = [SCALE, SCALE];
  let closed = true;
  for (const x of xs) for (const y of ys) {
    let inside = 0n;
    let strictly = 0n;
    for (const [px, py] of points) {
      if (px <= x && py <= y) inside += 1n;
      if (px < x && py < y) strictly += 1n;
    }
    const area = n * BigInt(x) * BigInt(y);
    const over = inside * square - area;
    const under = area - strictly * square;
    // A tie is settled towards the smaller corner, then towards the closed
    // reading, so the witness the page draws is the same one on every machine.
    if (over > score) { score = over; corner = [x, y]; closed = true; }
    if (under > score) { score = under; corner = [x, y]; closed = false; }
  }
  return { score, corner, closed };
}

// D* itself, for reading. The score is a count of 1/(n·10¹⁸), which is exact
// and unreadable; this is the same number written as a decimal, rounded UP so
// that a printed value never flatters an arrangement whose score is minimised.
const PLACES = 15n;
function readable(score: bigint, n: number): string {
  const denominator = BigInt(n) * BigInt(SCALE) * BigInt(SCALE);
  const scaled = 10n ** PLACES;
  const units = (score * scaled + denominator - 1n) / denominator;
  return `${units / scaled}.${(units % scaled).toString().padStart(Number(PLACES), "0")}`;
}

// A good arrangement, squashed.
//
// The Hammersley set — i/n against the van der Corput sequence — is a genuinely
// low-discrepancy construction, and this ships it scaled into the lower-left
// four fifths of the square. That is spoiled by construction rather than by
// judgement: the same set unsquashed is a legal answer, every rectangle beyond
// the squashed corner holds all n points against an area far short of one, and
// undoing the scaling is the first thing anyone will try. It is a floor, not a
// hint — the arrangement that undoes it is nowhere near optimal either.
const SQUASH = 0.8;
function squashedHammersley(n: number) {
  const vanDerCorput = (index: number) => {
    let digits = 0;
    let weight = 0.5;
    for (let rest = index; rest > 0; rest >>= 1) { digits += (rest & 1) * weight; weight /= 2; }
    return digits;
  };
  return {
    points: Array.from({ length: n }, (_, index) => [
      printFixed(Math.round(SQUASH * SCALE * ((index + 0.5) / n))),
      printFixed(Math.round(SQUASH * SCALE * (vanDerCorput(index) + 0.5 / n))),
    ]),
  };
}

const sizes = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => MIN_N + index);

const instances: ProblemInstanceDefinition[] = sizes.map((n) => ({
  instanceId: `p54-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: squashedHammersley(n),
  instanceNameEn: `n = ${n}`,
}));

const PRIMARY = 24;

export const definition: ProblemDefinition = {
  id: "p54", instanceId: `p54-n${PRIMARY}-v1`, code: "P54", slug: "star-discrepancy", category: "extremal",
  title: "单位正方形内的最低星偏差",
  summary: "你有 n 个采样点要铺满一块方形画面。从一角量起的任意一块矩形，占了多少面积，就该分到多少比例的采样点；偏得最厉害的那一块偏了多少，就是你的分数。",
  objective: "minimize", scoreLabel: "最大误差 D*",
  instanceName: `n = ${PRIMARY}`, parameters: { n: PRIMARY },
  baselineAnswer: squashedHammersley(PRIMARY),
  answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.25\"，最多九位小数。榜上的数字是 D*，也就是所有矩形里最大的那个误差；分数越小越好。",
  titleEn: "Minimum star discrepancy in the unit square",
  summaryEn: "You have n samples to spread over a square frame. Any rectangle measured from one corner should hold the same share of the samples as it holds of the area; the worst mismatch is your score.",
  scoreLabelEn: "the worst gap D*", instanceNameEn: `n = ${PRIMARY}`,
  answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.25\", to at most nine decimal places. The leaderboard number is D*, the largest gap over all rectangles; smaller is better.",
  extent: SCALE,
  frame: "容器是边长 1 的正方形：左下角是原点 (0, 0)，右上角是 (1, 1)。被比较的矩形永远从原点量起，右上角可以落在正方形里的任何位置，所以一共有无穷多块矩形要同时满足，而不是某几块。坐标写成小数，例如 \"0.25\"，最多九位小数。",
  frameEn: "The container is a square of side 1: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right. The rectangles being compared always start at the origin, and their upper-right corner may sit anywhere in the square — so there are infinitely many of them to satisfy at once, not a chosen few. Coordinates are plain decimals such as \"0.25\", to at most nine decimal places.",
  // The three registers, replacing the statement blob. The rendering-budget
  // framing moves to an intuition card; the frontier note — n ≤ 21 settled by
  // Clément, Doerr, Klamroth and Paquete, which is why this problem starts at
  // 22 — moves to the frontier card, citation kept, and a test holds it there.
  definition: "在单位正方形里放 n 个采样点。从原点量起、边平行于坐标轴的每一块矩形，占了多少面积，就该分到多少比例的点；你的分数，是所有这类矩形里最大的那个偏差。把它压到最低。",
  definitionEn: "Place n sample points in the unit square. Every axis-aligned rectangle anchored at the origin should hold the same share of the points as it holds of the area; your score is the largest mismatch over all such rectangles. Make it as small as you can.",
  strict: [
    { label: "容器", labelEn: "Container", text: "单位正方形，左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个点的坐标，十进制小数，最多九位；两点不得重合", textEn: "Exactly n points, each coordinate a decimal with at most nine places; no two points may coincide" },
    { label: "矩形", labelEn: "Rectangles", text: "被比较的矩形是半开的 [0, u) × [0, v)，右上角可落在正方形内任何位置；恰好压在上边或右边上的点算在外面", textEn: "The rectangles compared are half-open, [0, u) × [0, v), their upper-right corner anywhere in the square; a point exactly on the top or right edge counts as outside" },
    { label: "目标", labelEn: "Objective", text: "让所有矩形中最大的偏差 D* 尽可能小。上确界在提交坐标的网格上取得，以整数精确计分", textEn: "Make D*, the largest mismatch over all rectangles, as small as possible. The supremum is attained on the grid of submitted coordinates and scored exactly in integers" },
  ],
  intuition: [
    { title: "一个比喻：采样预算", titleEn: "An analogy: a sampling budget",
      text: "把正方形当成一帧要渲染的画面，这 n 个点就是你全部的采样预算。哪块矩形分到的点比面积应得的多，是预算浪费在同一处；少了，是那块的细节被漏掉。",
      textEn: "Read the square as a frame you are about to render and the n points as your entire sampling budget. A rectangle holding more than its share of the points is budget spent twice in one place; fewer, and that region's detail is lost." },
    { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
      text: "格点和随机撒点都会在某些矩形上系统性偏置；低偏差构造（Hammersley、van der Corput）压得低得多。但对每个具体的 n，没人知道还能压到哪里。",
      textEn: "Grids and random scatters are both systematically biased on some rectangle; low-discrepancy constructions (Hammersley, van der Corput) do far better — but for each particular n, nobody knows how low it goes." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "n ≤ 21 的最优解已由 Clément、Doerr、Klamroth 与 Paquete 在 2025 年证明（Proc. Amer. Math. Soc. Ser. B 12: 78–90），所以本站从 n = 22 起；再往上，每一个 n 都是开放的。",
      textEn: "Optima for n ≤ 21 were proven by Clément, Doerr, Klamroth and Paquete in 2025 (Proc. Amer. Math. Soc. Ser. B 12: 78–90), which is why this problem starts at n = 22; beyond that, every n is open." },
  ],
  requirements: [
    "恰好 n 个点，都落在正方形内，两点不能重合",
    "矩形是半开的 [0, u) × [0, v)：恰好压在它上边或右边上的点，算在外面",
    "分数是所有矩形里最大的那个偏差，越小越好",
  ],
  requirementsEn: [
    "Exactly n points, all inside the square, no two in the same place",
    "The rectangles are half-open, [0, u) × [0, v): a point sitting exactly on the top or right edge counts as outside",
    "The score is the largest gap over all rectangles, and smaller is better",
  ],
  instances,
};

function verifyStarDiscrepancy(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 120) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));

  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE)
      return fail("OUT_OF_BOUNDS", `点 ${i + 1} 落在单位正方形外`, `point ${i + 1} lies outside the unit square`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]) === 0n)
      return fail("COINCIDENT", `点 ${i + 1} 与 ${j + 1} 重合`, `points ${i + 1} and ${j + 1} are in the same place`);

  const { score } = worstDeviation(points);
  return ok(score, readable(score, n));
}

export const problem: ProblemModule = { definition, verify: verifyStarDiscrepancy };
