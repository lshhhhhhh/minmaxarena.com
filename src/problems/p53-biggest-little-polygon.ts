import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, printSquared, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, Point, VerificationResult } from "../problem-kit";

// The one problem here with no container.
//
// Everything else on this site places things inside a shape somebody chose —
// a square, a disc, a plus sign — and the shape is half the question. Here the
// only rule is that no two of the n points are more than 1 apart, and the thing
// being maximised is the area they enclose. Nobody picked the boundary; the
// points are their own boundary, and finding it is the whole problem.
//
// Reinhardt settled the odd case in 1922: for odd n the regular n-gon wins, and
// once you know that there is nothing left to search for. The even case is not
// like that at all. The regular hexagon of diameter 1 is NOT the best hexagon —
// Graham's answer in 1975 beats it by about four per cent and looks nothing
// like it, and each even n after that has taken its own paper. So only even n
// is here. An odd sub-problem would be a rounding exercise with a known answer,
// which is exactly what section 1 of docs/NEW-PROBLEM.md rules out.
//
// It scores exactly, which is why it can be here at all. The diameter test is
// a squared integer against SCALE², and the area comes off the hull by the
// shoelace formula, which in these units is a sum of integer products — so the
// leaderboard number is twice the area, an exact integer, in the same idiom as
// the smallest-triangle problems.
const MIN_N = 6;
const MAX_N = 30;

// The coordinates are written in a 1.5 × 1.5 frame, and the size is chosen so
// that the frame is never the thing that refuses an answer.
//
// A set of diameter 1 fits inside a 1 × 1 box, so the unit square would be
// enough — but only for a set placed exactly right, and the good answers here
// are the ones that press against it. Their diameter graphs have several pairs
// at exactly 1, so a near-optimal polygon spans the full width in more than one
// direction, and rounding its coordinates to nine places is then enough to put
// one of them a nanometre outside. Refusing somebody's best arrangement over
// where they happened to centre it teaches nothing about the problem. A quarter
// unit of margin on every side costs nothing and removes the trap.
const FRAME = 1_500_000_000;

// Every point has to be a corner of the polygon, and that is a rule rather than
// a consequence. It is true at the optimum anyway — a point strictly inside
// contributes nothing, so an optimal arrangement never has one — but without
// saying it, "the biggest little 30-gon" would accept the biggest little
// hexagon with 24 spare points hidden in the middle, scoring the hexagon's
// number under the 30-gon's name. Refusing that keeps each n its own question.
//
// Strictly a corner: a point sitting on the edge between two others is not one.
// That is a cross product against zero, so it is exact like everything else.
function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  // Twice the signed area of oab. Coordinates run to 10⁹, so this runs to
  // 2 × 10¹⁸ and a Number would quietly stop being exact halfway there.
  const turn = (o: Point, a: Point, b: Point) =>
    BigInt(a[0] - o[0]) * BigInt(b[1] - o[1]) - BigInt(a[1] - o[1]) * BigInt(b[0] - o[0]);
  const chain = (sequence: Point[]) => {
    const out: Point[] = [];
    for (const point of sequence) {
      // `<= 0` rather than `< 0`: a zero turn is three points on a line, and the
      // middle one is dropped. That is what makes the count below a count of
      // corners rather than of points that happen to be on the boundary.
      while (out.length >= 2 && turn(out[out.length - 2], out[out.length - 1], point) <= 0n) out.pop();
      out.push(point);
    }
    return out;
  };
  const lower = chain(sorted);
  const upper = chain([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// A regular n-gon on a circle of radius 0.4, where 0.5 is what the diameter
// rule allows. Spoiled on purpose and by construction: the same ring at very
// nearly 0.5 is legal and its area is (0.5/0.4)² = 1.5625 times this one, so
// every sub-problem is beaten by a submitter who does nothing but inflate it.
// That is the floor, not the ceiling — for even n the ring is not the answer
// however far it is inflated, which is the point of the problem.
function ringBaseline(n: number) {
  const radius = Math.round(SCALE * 0.4);
  const centre = FRAME / 2;
  return {
    points: Array.from({ length: n }, (_, index) => {
      const angle = (2 * Math.PI * index) / n;
      return [
        printFixed(Math.round(centre + radius * Math.cos(angle))),
        printFixed(Math.round(centre + radius * Math.sin(angle))),
      ];
    }),
  };
}

const evenSizes = Array.from({ length: (MAX_N - MIN_N) / 2 + 1 }, (_, index) => MIN_N + 2 * index);

const instances: ProblemInstanceDefinition[] = evenSizes.map((n) => ({
  instanceId: `p53-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: ringBaseline(n),
  instanceNameEn: `n = ${n}`,
}));

const PRIMARY = 10;

export const definition: ProblemDefinition = {
  id: "p53", instanceId: `p53-n${PRIMARY}-v1`, code: "P53", slug: "biggest-little-polygon", category: "extremal",
  title: "最大的小多边形",
  summary: "取 n 个点，两两距离都不超过 1，使它们围成的凸多边形面积尽可能大。",
  objective: "maximize", scoreLabel: "面积的两倍", goalLabel: "面积", scoreIs: "double", goalLabelEn: "the area",
  instanceName: `n = ${PRIMARY}`, parameters: { n: PRIMARY },
  baselineAnswer: ringBaseline(PRIMARY),
  answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.25\"，最多九位小数。",
  titleEn: "The biggest little polygon",
  summaryEn: "Take n points with no two further than 1 apart, and make the convex polygon they enclose as large as possible.",
  scoreLabelEn: "twice the area", instanceNameEn: `n = ${PRIMARY}`,
  answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.25\", to at most nine decimal places.",
  definition: "取 n 个点，两两距离都不超过 1，使它们围成的凸多边形面积尽可能大；每个点都必须是凸包的顶点。",
    definitionEn: "Take n points, no two further apart than 1, and make the convex polygon they span as large as possible; every point must be a vertex of the hull.",
    strict: [
      { label: "容器", labelEn: "Container", text: "没有容器：唯一的全局约束是任意两点距离不超过 1；坐标写在 [0, 1.5] × [0, 1.5] 内", textEn: "No container: the one global constraint is that no two points are further than 1 apart; coordinates are written inside [0, 1.5] × [0, 1.5]" },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个点 points", textEn: "Exactly n points" },
      { label: "约束", labelEn: "Constraints", text: "两两距离 ≤ 1；每个点都是凸包的真顶点，落在别人连线上或内部都不算", textEn: "All pairwise distances at most 1; every point a genuine hull vertex — on another pair's segment or inside does not count" },
      { label: "目标", labelEn: "Objective", text: "让凸多边形面积尽可能大。内部以二倍面积精确比较", textEn: "Make the polygon area as large as possible; compared internally by twice the area, exactly" },
    ],
    intuition: [
      { title: "为什么偶数才难", titleEn: "Why the even cases are the hard ones",
        text: "奇数 n 的正多边形已被证明最优，没什么可争；偶数 n 时正多边形反而不是最优：Graham 的六边形比正六边形多出约 4% 的面积。所以本站只开偶数 n。",
        textEn: "For odd n the regular polygon is provably optimal — nothing to contest. For even n it is NOT: Graham hexagon beats the regular one by about 4% of area. That is why only even n are offered here." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "奇数 n 的正多边形由 Reinhardt (1922) 证明最优，所以只开偶数。偶数侧 n = 6, 8, 10, 12 已证明（Graham 1975 起，至 Audet 等），n ≥ 14 只有数值最好值，开放。",
        textEn: "Regular polygons are optimal for odd n (Reinhardt 1922), so only even n are offered. On the even side n = 6, 8, 10 and 12 are proven (from Graham 1975 to Audet et al.); n ≥ 14 has only numerical best values and is open." },
    ],
  extent: FRAME,
  frame: "这道题没有容器，唯一的约束是任意两点距离不超过 1。坐标写在 [0, 1.5] × [0, 1.5] 的框里，这只是一个坐标系而不是额外的限制：直径不超过 1 的点集总能装进 1×1 的方格，这里四边各多留了四分之一个单位，所以放在哪里都不会被框卡住。坐标是小数，例如 \"0.25\"，最多九位小数。",
  frameEn: "This problem has no container; the only constraint is that no two points are more than 1 apart. Coordinates are written inside a [0, 1.5] × [0, 1.5] frame, which is a coordinate system rather than an extra restriction: a set of diameter at most 1 always fits in a 1 × 1 box, and this leaves a further quarter unit on every side so that where you centre it can never matter. Coordinates are plain decimals such as \"0.25\", to at most nine decimal places.",
  requirements: [
    "恰好 n 个点，两两距离不超过 1",
    "每个点都要是凸包的顶点：落在另外两点连线上，或落在凸包内部，都不算",
    "分数是这个凸多边形的面积",
  ],
  requirementsEn: [
    "Exactly n points, with no two further apart than 1",
    "Every point is a corner of the hull: one lying on the segment between two others, or inside, does not count",
    "The score is the area of that convex polygon",
  ],
  instances,
};

function verifyBiggestLittlePolygon(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 3 || n > 120) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));

  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > FRAME || y > FRAME)
      return fail("OUT_OF_BOUNDS", `点 ${i + 1} 超出了坐标框 [0, 1.5] × [0, 1.5]`, `point ${i + 1} lies outside the coordinate frame [0, 1.5] × [0, 1.5]`);
  }

  // The whole of the problem's difficulty is in this one comparison. Squared,
  // so no root is ever taken and the boundary case — a pair exactly 1 apart,
  // which every good answer has several of — is decided on the digit.
  const limit = BigInt(SCALE) * BigInt(SCALE);
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const spread = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (spread > limit)
      return fail("DIAMETER", `点 ${i + 1} 与 ${j + 1} 的距离超过 1`, `points ${i + 1} and ${j + 1} are further apart than 1`);
  }

  const hull = convexHull(points);
  if (hull.length !== n)
    return fail("NOT_CONVEX", `只有 ${hull.length} 个点是凸包的顶点，需要全部 ${n} 个`, `only ${hull.length} of the points are corners of the hull, and all ${n} must be`);

  // Twice the area by the shoelace formula, walked in hull order. Exact in
  // these units: every term is a product of two integers.
  let doubled = 0n;
  for (let i = 0; i < hull.length; i += 1) {
    const [ax, ay] = hull[i];
    const [bx, by] = hull[(i + 1) % hull.length];
    doubled += BigInt(ax) * BigInt(by) - BigInt(bx) * BigInt(ay);
  }
  if (doubled < 0n) doubled = -doubled;
  return ok(doubled, printSquared(doubled));
}

export const problem: ProblemModule = { definition, verify: verifyBiggestLittlePolygon };
