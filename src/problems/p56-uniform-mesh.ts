import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, sq } from "../problem-kit";
import { cellOf, squareBox, gcd } from "../exact-polygon";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, Point, VerificationResult } from "../problem-kit";

// The most uniform sampling mesh: n points, judged by the two failures a mesh
// can have at once. h is the radius of the largest uncovered hole — the
// farthest any location gets from its nearest point — and δ is the closest
// pair. The score is the classical mesh ratio, squared so it stays rational:
//
//   M(P)² = 4·h(P)² / δ(P)²        minimised, stored as ceil(M²·10¹⁵)
//
// This is not P52 again. P52 looks only at the submitted points and cannot see
// a region with no points in it at all; h is measured over every location in
// the square. Big holes hurt coverage, huddles waste samples, and M charges
// for both.
//
// It scores exactly. δ² is an integer. h² is attained at a vertex of some
// Voronoi cell clipped to the square — an interior Voronoi vertex, an edge's
// crossing with the boundary, or a corner of the square — and the exact kernel
// in lib/exact-polygon.ts enumerates exactly those as the corners of cellOf's
// output. The kernel is shared with P55; the SCORE implementation is not, and
// the tests are independent, so a defect in either scoring path cannot hide in
// both leaderboards at once (the roadmap's own requirement).
const MIN_N = 5;
const MAX_N = 40;

const PLACES = 15n;
const box = squareBox(BigInt(SCALE));

// max over cells over corners of |corner − site|², as an exact rational.
export function worstHoleSquared(points: readonly Point[]): { num: bigint; den: bigint } {
  const sites = points.map(([x, y]) => [BigInt(x), BigInt(y)] as const);
  let bestNum = 0n, bestDen = 1n;
  for (let i = 0; i < sites.length; i += 1) {
    const [x, y] = sites[i];
    for (const [nx, ny, d] of cellOf(sites, i, box)) {
      const dx = nx - x * d, dy = ny - y * d;
      const num = dx * dx + dy * dy, den = d * d;
      if (num * bestDen > bestNum * den) { bestNum = num; bestDen = den; }
    }
  }
  const common = gcd(bestNum, bestDen);
  return { num: bestNum / common, den: bestDen / common };
}

export function closestPairSquared(points: readonly Point[]): bigint {
  let best = -1n;
  for (let i = 0; i < points.length; i += 1)
    for (let j = i + 1; j < points.length; j += 1) {
      const d = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
      if (best < 0n || d < best) best = d;
    }
  return best;
}

const ceilDiv = (num: bigint, den: bigint) => (num + den - 1n) / den;

// ceil of the square root: the smallest integer whose square is not below.
function ceilSqrt(value: bigint): bigint {
  if (value < 2n) return value;
  let guess = value, next = (value >> 1n) + 1n;
  while (next < guess) { guess = next; next = (guess + value / guess) >> 1n; }
  return guess * guess < value ? guess + 1n : guess;
}

// M itself, for reading, derived from the STORED score so the printed number
// and the ranked one cannot drift: M·10¹² = ceil √(score·10⁹), rounded up
// because a minimised quantity printed low would flatter the arrangement.
function readable(score: bigint): string {
  const units = ceilSqrt(score * 10n ** 9n);
  const scale = 10n ** 12n;
  return `${units / scale}.${(units % scale).toString().padStart(12, "0")}`;
}

// A grid with one point dragged thirty percent of the way toward its
// neighbour. M is scale-invariant, so the squash that weakens the other
// baselines would weaken nothing here; the drag does, by shrinking δ while
// barely helping any hole. Undoing it is the first thing anyone will try, and
// the grid it restores is itself far from optimal.
function draggedGrid(n: number) {
  const columns = Math.ceil(Math.sqrt(n));
  const units: [number, number][] = [];
  for (let i = 0; units.length < n; i += 1)
    units.push([
      Math.round(SCALE * ((Math.floor(i / columns) + 0.5) / columns)),
      Math.round(SCALE * (((i % columns) + 0.5) / columns)),
    ]);
  units[0] = [
    Math.round(units[0][0] + 0.3 * (units[1][0] - units[0][0])),
    Math.round(units[0][1] + 0.3 * (units[1][1] - units[0][1])),
  ];
  return { points: units.map(([x, y]) => [printFixed(x), printFixed(y)]) };
}

const sizes = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => MIN_N + index);

// M ≥ 1, proven in three lines: the midpoint of the closest pair is at
// distance δ/2 from both its endpoints, and no third point can be nearer to
// it — a third point within δ/2 of the midpoint would be within δ of both
// endpoints, contradicting δ's minimality. So h ≥ δ/2, hence M = 2h/δ ≥ 1,
// for every arrangement of every n.
const FLOOR_SOURCE = "最近点对的中点到两端的距离都是 δ/2，而任何第三个点若离中点不足 δ/2，就会离两端都不足 δ，与 δ 的最小性矛盾。所以 h ≥ δ/2，M ≥ 1，对任何布局成立";
const FLOOR_SOURCE_EN = "The closest pair's midpoint is δ/2 from both endpoints, and a third point within δ/2 of it would be within δ of both, contradicting δ's minimality. So h ≥ δ/2 and M ≥ 1, for every arrangement";

const instances: ProblemInstanceDefinition[] = sizes.map((n) => ({
  instanceId: `p56-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: draggedGrid(n),
  instanceNameEn: `n = ${n}`,
  floor: { display: "1.000000000000000", exact: "1", source: FLOOR_SOURCE, sourceEn: FLOOR_SOURCE_EN },
}));

const PRIMARY = 12;

export const definition: ProblemDefinition = {
  id: "p56", instanceId: `p56-n${PRIMARY}-v1`, code: "P56", slug: "uniform-mesh", category: "extremal",
  title: "单位正方形内的最均匀采样网格",
  summary: "在单位正方形里放 n 个点，红圈是没被覆盖的最大空洞，蓝线是挨得最近的一对点；让空洞半径与点对间距的比值尽可能小。",
  objective: "minimize", scoreLabel: "均匀度 M",
  instanceName: `n = ${PRIMARY}`, parameters: { n: PRIMARY },
  baselineAnswer: draggedGrid(PRIMARY),
  answerHelp: "提交 points，每个坐标写成十进制字符串，例如 \"0.25\"，最多九位小数。分数是 M = 2h/δ，越小越好。",
  titleEn: "The most uniform sampling mesh in the unit square",
  summaryEn: "Place n points in the unit square; the red circle is the largest uncovered hole and the blue line the closest pair. Make the ratio of hole radius to pair spacing as small as you can.",
  scoreLabelEn: "the uniformity M", instanceNameEn: `n = ${PRIMARY}`,
  answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.25\", to at most nine decimal places. The score is M = 2h/δ; smaller is better.",
  extent: SCALE,
  frame: "容器是边长 1 的正方形：左下角是原点 (0, 0)，右上角是 (1, 1)。h 是正方形内任何位置到最近提交点距离的最大值，δ 是最近点对的距离。坐标写成小数，例如 \"0.25\"，最多九位小数。",
  frameEn: "The container is a square of side 1: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right. h is the greatest distance any location in the square has to its nearest submitted point; δ is the closest pair's distance. Coordinates are plain decimals such as \"0.25\", to at most nine decimal places.",
  definition: "在单位正方形里放 n 个点。h 是正方形内任何位置到最近点距离的最大值，δ 是最近的一对点之间的距离；分数是 M = 2h/δ。把它压到最低。",
  definitionEn: "Place n points in the unit square. h is the greatest distance any location has to its nearest point, δ the distance of the closest pair; the score is M = 2h/δ. Make it as small as you can.",
  strict: [
    { label: "容器", labelEn: "Container", text: "单位正方形，左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个点的坐标，十进制小数，最多九位；两点不得重合", textEn: "Exactly n points, each coordinate a decimal with at most nine places; no two points may coincide" },
    { label: "度量", labelEn: "Measures", text: "h 取正方形内所有位置到最近提交点距离的最大值；δ 取所有点对距离的最小值", textEn: "h is the maximum over all locations of the distance to the nearest submitted point; δ is the minimum over all pairs" },
    { label: "目标", labelEn: "Objective", text: "让 M = 2h/δ 尽可能小。内部以 M² = 4h²/δ² 精确计分，向上取整到 10⁻¹⁵", textEn: "Make M = 2h/δ as small as possible. Scored internally as M² = 4h²/δ², exact, rounded up at 10⁻¹⁵" },
  ],
  intuition: [
    { title: "一个比喻：基站选址", titleEn: "An analogy: siting base stations",
      text: "把 n 个点当成 n 座基站。h 是信号最差的位置离最近基站有多远，δ 是挨得最近的两座浪费了多少重叠覆盖。M 同时惩罚这两件事：既不许有大洞，也不许挤成一团。",
      textEn: "Read the n points as n base stations. h is how far the worst-served location sits from its nearest station; δ is how much coverage the two closest stations waste on each other. M charges for both: no big holes, no huddles." },
    { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
      text: "正方形网格的 M 是 √2 ≈ 1.414，六边形排布能压得更低，但边界会顶回来：角落要么留洞、要么挤点。最优构形是内部蜂窝与边界妥协的产物，每个 n 的妥协方式都不同。",
      textEn: "A square grid sits at M = √2 ≈ 1.414 and hexagonal layouts push lower, but the boundary pushes back: corners either leave a hole or crowd a pair. Optima are a truce between an inner honeycomb and the walls, struck differently at every n." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "均匀度（mesh ratio）是无网格方法评价采样质量的标准量，但「n 个点在正方形里能达到的最小 M」似乎没有逐 n 的文献；这里把每个 n 都当作开放问题。谁知道相关结果，欢迎来信。",
      textEn: "The mesh ratio is a standard uniformity measure in meshless methods, but a per-n table of the smallest M achievable in a square seems absent from the literature; every n here is treated as open. Pointers to sources are welcome." },
  ],
  requirements: [
    "恰好 n 个点，都落在正方形内，两点不能重合",
    "h 按整个正方形度量，不只在提交点上",
    "分数是 M = 2h/δ，越小越好",
  ],
  requirementsEn: [
    "Exactly n points, all inside the square, no two in the same place",
    "h is measured over the whole square, not only at the submitted points",
    "The score is M = 2h/δ, and smaller is better",
  ],
  instances,
};

function verifyUniformMesh(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 2 || n > 120) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));

  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE)
      return fail("OUT_OF_BOUNDS", `点 ${i + 1} 落在单位正方形外`, `point ${i + 1} lies outside the unit square`);
  }
  const delta = closestPairSquared(points);
  if (delta === 0n) return fail("COINCIDENT", "有两个点重合", "two points are in the same place");

  const hole = worstHoleSquared(points);
  // M² = 4h²/δ², stored as ceil(M²·10¹⁵). Up is the conservative direction
  // for a minimised quantity.
  const score = ceilDiv(4n * hole.num * 10n ** PLACES, hole.den * delta);
  return ok(score, readable(score));
}

export const problem: ProblemModule = { definition, verify: verifyUniformMesh };
