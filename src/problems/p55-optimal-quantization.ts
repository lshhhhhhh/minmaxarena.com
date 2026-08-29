import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, sq } from "../problem-kit";
import { cellOf, squareBox, secondMomentAbout, addRational, rational } from "../exact-polygon";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, Point, VerificationResult } from "../problem-kit";

// Optimal quantization: n points, and every place in the square is served by
// whichever is nearest. The score is the average squared distance from a place
// to the point serving it, over the whole square, and it is minimised:
//
//   E(P) = ∫∫ over [0,1]²  min over i of |x − p_i|²  dx
//
// This is the quadratic quantization energy — the thing k-means is trying to
// minimise, and the thing a centroidal Voronoi tessellation is stationary for.
// It is also, without any translation, where to put n respawn points on a map
// so that a player dropped anywhere is close to one.
//
// It scores exactly, which is the only reason it can live here. The region a
// point serves is cut out by |x − p|² ≤ |x − q|², and that is linear in x:
//
//   2(q − p)·x ≤ |q|² − |p|²
//
// so every cell is the square clipped by one half-plane per rival — a convex
// polygon with rational corners — and integrating a quadratic over it is a
// closed form in those corners. The whole integral is one exact rational, and
// no step of it touches a float. lib/exact-polygon.ts does the geometry.
//
// Lloyd's algorithm walks each point to the centroid of what it serves and
// stops. That is a stationary point, not a minimum: this energy has many local
// ones, and which you land in depends entirely on where you started. That gap
// is what there is to win here.
//
// n starts at 6, and the reason is less tidy than it first looked.
//
// Roychowdhury (arXiv:1608.03815, Real Analysis Exchange 43(1) 2018) gives all
// of n = 1..5 for this exact square: 1/6, 5/48, 0.0661797, 1/24, 0.0352697.
// But only the first two are theorems. Section 3 states Conjecture 3.5 -- an
// unproven claim about where optimal points sit relative to the square's lines
// of symmetry -- and then says "Under the above conjecture, in the following
// subsections, we determine the optimal sets of n-means for n = 3, 4, and 5."
// So even 1/24, the 2 x 2 grid, is not a proven optimum. It was first written
// here as though all five were proven, which was wrong.
//
// They are still not shipped, for a reason that survives the correction: the
// optimal points are irrational, so no certificate can hold them, and the only
// route past those three values is to refute a published conjecture. That is a
// research programme, not a record to take. The statement says so.
//
// What IS unconditional, for every n, is a floor. Fejes Toth's moment theorem
// says n points in a convex polygon of at most six sides cannot beat n copies
// of the regular hexagon of the same average area, and the second moment of a
// unit-area regular hexagon is 5/(18*sqrt 3). So
//
//   E(P) >= 5 / (18*sqrt(3)*n) = 0.1603750747748961 / n
//
// for every arrangement of every n, proven. Nothing this verifier returns may
// fall below it, which makes it a property test rather than only a fact.
//
// The verifier reproduces all five of Roychowdhury's values to every digit he
// prints -- an outside check worth having whatever their status -- and the
// tests keep that.
const MIN_N = 6;
const MAX_N = 30;

// The score is an integer count of 10⁻¹⁸ of the energy, rounded UP. Up is the
// conservative direction for a quantity being minimised: rounding down would
// hand a submitter a shade of improvement the arrangement did not earn.
const PLACES = 18n;
const READABLE_PLACES = 15n;

const box = squareBox(BigInt(SCALE));

export function quantizationEnergy(points: readonly Point[]) {
  const sites = points.map(([x, y]) => [BigInt(x), BigInt(y)] as const);
  let total = { num: 0n, den: 1n };
  for (let i = 0; i < sites.length; i += 1)
    total = addRational(total, secondMomentAbout(cellOf(sites, i, box), sites[i]));
  // The integral above is in units where the square is SCALE across: a squared
  // distance carries SCALE², an area carries SCALE², so the whole carries
  // SCALE⁴.
  return rational(total.num, total.den * BigInt(SCALE) ** 4n);
}

const ceilDiv = (num: bigint, den: bigint) => (num + den - 1n) / den;

// The energy as a decimal, taken from the stored score rather than recomputed,
// so what is printed and what is ranked cannot drift apart.
function readable(score: bigint): string {
  const units = ceilDiv(score, 10n ** (PLACES - READABLE_PLACES));
  const scale = 10n ** READABLE_PLACES;
  return `${units / scale}.${(units % scale).toString().padStart(Number(READABLE_PLACES), "0")}`;
}

// A grid, squashed into four fifths of the square.
//
// Weakened on purpose and openly: the same grid unsquashed is a legal answer
// and is strictly better, so the first thing anyone tries beats this. It is a
// floor, not a hint — the grid itself is nowhere near optimal either. A plain
// grid was tried as the baseline first and rejected: at n = 9 it is a local
// minimum that four hundred rounds of Lloyd from two dozen starts never
// improved on, so it would have shut that sub-problem before it opened.
const SQUASH = 0.8;
function squashedGrid(n: number) {
  const columns = Math.ceil(Math.sqrt(n));
  const points: [string, string][] = [];
  for (let i = 0; points.length < n; i += 1)
    points.push([
      printFixed(Math.round(SQUASH * SCALE * ((Math.floor(i / columns) + 0.5) / columns))),
      printFixed(Math.round(SQUASH * SCALE * (((i % columns) + 0.5) / columns))),
    ]);
  return { points };
}

const sizes = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => MIN_N + index);

// The Fejes Toth floor, 5/(18 sqrt(3) n), as a fifteen-place decimal.
//
// Computed in integers and rounded DOWN twice -- once inside the square root,
// once in the division -- because the page says "no arrangement can go below
// this", and that sentence is only true while the printed number sits at or
// under the proven bound. Scores are strictly above the true bound (hexagons
// do not tile a square), the true bound is at or above this, so the claim
// holds with room to spare.
function fejesTothFloor(n: number): string {
  // floor(sqrt(3) * 10^15): Newton on 3 * 10^30.
  let guess = 3n * 10n ** 30n, next = (guess >> 1n) + 1n;
  while (next < guess) { guess = next; next = (guess + (3n * 10n ** 30n) / guess) >> 1n; }
  const units = (5n * guess) / (54n * BigInt(n));
  const scale = 10n ** 15n;
  return `${units / scale}.${(units % scale).toString().padStart(15, "0")}`;
}

const FLOOR_SOURCE = "Fejes Tóth 矩定理：平均平方距离不可能低于把地图剖成 n 个等面积正六边形的水平；正方形铺不出正六边形，这条线永远取不到，只能逼近";
const FLOOR_SOURCE_EN = "Fejes Tóth's moment theorem: the mean squared distance cannot go below what n equal-area regular hexagons would achieve — and hexagons do not tile a square, so the line can be approached but never reached";
const FLOOR_URL = "https://link.springer.com/article/10.1007/s000100050116";

const instances: ProblemInstanceDefinition[] = sizes.map((n) => ({
  instanceId: `p55-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: squashedGrid(n),
  instanceNameEn: `n = ${n}`,
  floor: { display: fejesTothFloor(n), exact: `5/(18√3·${n})`, source: FLOOR_SOURCE, sourceEn: FLOOR_SOURCE_EN, url: FLOOR_URL },
}));

const PRIMARY = 12;

export const definition: ProblemDefinition = {
  id: "p55", instanceId: `p55-n${PRIMARY}-v1`, code: "P55", slug: "optimal-quantization", category: "extremal",
  title: "单位正方形内的最优量化",
  summary: "在一张方形地图上放 n 个复活点。玩家均匀地随机出现在任何位置，然后被送到离他最近的那个复活点；让这段路的平均平方距离尽可能小。",
  objective: "minimize", scoreLabel: "平均平方距离",
  instanceName: `n = ${PRIMARY}`, parameters: { n: PRIMARY },
  baselineAnswer: squashedGrid(PRIMARY),
  answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.25\"，最多九位小数。分数是整块地图上的平均平方距离，越小越好。",
  titleEn: "Optimal quantization in the unit square",
  summaryEn: "Place n respawn points on a square map. A player appears uniformly at random and is sent to the nearest one; make the average squared trip as short as you can.",
  scoreLabelEn: "the average squared distance", instanceNameEn: `n = ${PRIMARY}`,
  answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.25\", to at most nine decimal places. The score is the average squared distance over the whole map, and smaller is better.",
  extent: SCALE,
  frame: "容器是边长 1 的正方形：左下角是原点 (0, 0)，右上角是 (1, 1)。每一个位置都归离它最近的那个点管，所以整块正方形被划成 n 块，谁也不重叠、谁也不漏下。坐标写成小数，例如 \"0.25\"，最多九位小数。",
  frameEn: "The container is a square of side 1: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right. Every place belongs to whichever point is nearest, so the square is divided into n regions that neither overlap nor leave a gap. Coordinates are plain decimals such as \"0.25\", to at most nine decimal places.",
  // The three registers, piloted here. `definition` states the problem and
  // nothing else; `strict` is the contract a verifier could be rebuilt from;
  // `intuition` is everything that helps without defining — the analogy, why
  // there is anything to win, and where the frontier is, citation included.
  // The old `statement` blob carried all four at once and is retired for this
  // problem; the family page's frame/requirements duplication dies with it.
  definition: "在边长为 1 的正方形里放 n 个点。正方形内的每一个位置，都由离它最近的那个点负责；你的分数，是「位置到负责它的点的距离的平方」在整个正方形上的平均值。把这个平均值压到最低。",
  definitionEn: "Place n points in the square of side 1. Every location in the square is served by whichever point is nearest; your score is the average, over the whole square, of the squared distance from a location to the point serving it. Make that average as small as you can.",
  strict: [
    { label: "容器", labelEn: "Container", text: "单位正方形，左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个点的坐标，十进制小数，最多九位；两点不得重合", textEn: "Exactly n points, each coordinate a decimal with at most nine places; no two points may coincide" },
    { label: "归属", labelEn: "Assignment", text: "每个位置归离它最近的那个点；恰好等距的位置构成零面积集合，归给谁不影响分数", textEn: "Every location belongs to the nearest point; the exactly-equidistant locations form a set of zero area, so their assignment cannot change the score" },
    { label: "目标", labelEn: "Objective", text: "让 E(P) = ∫∫ min‖x − pᵢ‖² dx 尽可能小。精确有理数计分，向上取整到 10⁻¹⁸", textEn: "Make E(P) = ∫∫ min‖x − pᵢ‖² dx as small as possible. Scored in exact rationals, rounded up at 10⁻¹⁸" },
  ],
  intuition: [
    { title: "一个比喻：复活点", titleEn: "An analogy: respawn points",
      text: "把正方形当成一张地图，这 n 个点就是你放的复活点。玩家均匀地随机出现在地图上任何位置，然后被送到离他最近的复活点。你的分数，就是这段路程平方的平均值。",
      textEn: "Read the square as a map and the n points as respawn points. A player appears uniformly at random anywhere on it and is sent to the nearest one — your score is the average squared length of that trip." },
    { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
      text: "把每个点挪到它辖区的重心、反复迭代，就是 Lloyd 算法：它一定会停，但停在驻点，不是最优解。这个能量有很多局部极小，落进哪一个，完全取决于起点。能优化的就是这一段。",
      textEn: "Moving every point to the centre of mass of its region, over and over, is Lloyd's algorithm: it always stops, but where it stops is a stationary point, not the best one. This energy has many local minima, and which one you fall into depends entirely on where you started — that gap is the contest." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "n ≤ 2 已证明；n = 3、4、5 依赖一个未证明的对称性猜想（Roychowdhury, arXiv:1608.03815）；n ≥ 6 文献原话是「极其困难，至今不知道答案」。另有一条对每个 n 都成立的下界 5/(18√3·n)：那是正六边形的水平，正方形永远铺不出。",
      textEn: "n ≤ 2 is proven; n = 3, 4 and 5 rest on an unproven symmetry conjecture (Roychowdhury, arXiv:1608.03815); of anything larger the literature says it \"is extremely difficult and the answer is not known yet\". One floor holds for every n: 5/(18√3·n), the level of regular hexagons — which never tile a square." },
  ],
  requirements: [
    "恰好 n 个点，都落在正方形内，两点不能重合",
    "每一个位置都归离它最近的那个点管；正好等距的位置连成一条线，面积为零，算给谁都不影响分数",
    "分数是整块正方形上平均的平方距离，越小越好",
  ],
  requirementsEn: [
    "Exactly n points, all inside the square, no two in the same place",
    "Every place belongs to whichever point is nearest; the places exactly equidistant form a line of zero area, so which side they fall on cannot change the score",
    "The score is the average squared distance over the whole square, and smaller is better",
  ],
  instances,
};

function verifyQuantization(params: Obj, answer: Obj): VerificationResult {
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
  // Two points in one place would share one region between them, and the
  // tie-break deciding which of them gets it is an implementation detail
  // nobody should be able to score against.
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]) === 0n)
      return fail("COINCIDENT", `点 ${i + 1} 与 ${j + 1} 重合`, `points ${i + 1} and ${j + 1} are in the same place`);

  const energy = quantizationEnergy(points);
  const score = ceilDiv(energy.num * 10n ** PLACES, energy.den);
  return ok(score, readable(score));
}

export const problem: ProblemModule = { definition, verify: verifyQuantization };
