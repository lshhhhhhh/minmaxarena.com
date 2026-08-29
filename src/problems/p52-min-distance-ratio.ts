import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, printFixedBig, integerSqrt, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// Place n points so that the furthest pair is as close as possible to the
// nearest pair. The quantity is a ratio, so it does not care about scale,
// position or reflection — which is why the unit square costs nothing here.
// Any configuration has width and height at most its own diameter, so scaling
// the diameter to 1 always fits inside a 1 × 1 box. The square is a place to
// write the answer down, not a constraint on it.
//
// Nothing about this one is settled past a handful of points, and the reason is
// worth stating: the ratio is minimised by clusters that look like pieces of a
// triangular lattice, but the best piece is not the obvious piece, and even the
// obvious pieces cannot be written down exactly — a triangular lattice needs
// √3, which no decimal certificate holds. So there is always another digit to
// win, on top of the arrangement still being unknown.
const MIN_N = 9;
const MAX_N = 28;

// Deliberately mediocre: the first n cells of a square lattice, packed into a
// block as square as the count allows. A square lattice is the wrong lattice —
// its diagonal neighbours sit √2 apart where a triangular lattice would put
// them at 1 — so every one of these has room above it, and it has the virtue of
// being exact on the grid rather than an approximation of something irrational.
function latticeBaseline(n: number) {
  let columns = 1;
  while (columns * columns < n) columns += 1;
  const rows = Math.ceil(n / columns);
  // Spread the block across the square so the answer uses the whole box.
  const stepX = Math.floor(SCALE / Math.max(1, columns - 1));
  const stepY = Math.floor(SCALE / Math.max(1, rows - 1));
  const step = Math.min(stepX, stepY);
  return {
    points: Array.from({ length: n }, (_, index) => [
      printFixed((index % columns) * step),
      printFixed(Math.floor(index / columns) * step),
    ]),
  };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p52-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: latticeBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
  id: "p52", instanceId: "p52-n12-v1", code: "P52", slug: "min-distance-ratio", category: "extremal",
  title: "最远与最近距离之比",
  summary: "放置 n 个点，使最远两点的距离除以最近两点的距离尽可能小。",
  objective: "minimize", scoreLabel: "最远与最近距离之比",
  instanceName: "n = 12", parameters: { n: 12 },
  baselineAnswer: latticeBaseline(12),
  answerHelp: "提交 points，每个坐标写成十进制字符串，例如 \"0.5\"。比值与整体的缩放和平移无关，正方形只是写下答案的地方。",
  titleEn: "Smallest ratio of largest to smallest distance",
  summaryEn: "Place n points so the distance between the furthest pair, divided by the distance between the closest pair, is as small as possible.",
  scoreLabelEn: "max-to-min distance ratio", instanceNameEn: "n = 12",
  answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\". The ratio ignores scale and position, so the square is only where you write the answer down.",
  definition: "在平面上放置 n 个点，记最远两点距离为 D、最近两点距离为 d，使比值 D/d 尽可能小。",
    definitionEn: "Place n points in the plane; with D the largest and d the smallest pairwise distance, make the ratio D/d as small as possible.",
    strict: [
      { label: "容器", labelEn: "Container", text: "没有真正的容器：比值不随缩放平移改变，答案缩放到单位正方形内写下即可", textEn: "No real container: the ratio is invariant under scaling and translation, so the answer is written scaled into the unit square" },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个点 points，两两不重合", textEn: "Exactly n points, no two coinciding" },
      { label: "目标", labelEn: "Objective", text: "让 D/d 尽可能小。内部以平方比精确比较", textEn: "Make D/d as small as possible; compared internally by the squared ratio, exactly" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "既要最近的不太近、又要最远的不太远，点集被迫又圆又匀：内部像六边形蜂窝，输赢却决定在边界的取舍。",
        textEn: "The nearest pair must not be near and the farthest must not be far, so the set is forced round and even: hexagonal inside, but won or lost at the boundary." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "这一族收录在 Friedman 的 maxmin 页（Rechenberg、Cantrell、Audet 等人的构造），全部未证明；本站已录三个值，其余 n 未录，开放。",
        textEn: "The family is collected on Friedman's maxmin page (constructions by Rechenberg, Cantrell, Audet and others), none proven; three values are recorded here, the rest are open." , url: "https://erich-friedman.github.io/packing/maxmin/" },
    ],
  extent: SCALE,
  frame: "把答案缩放平移到边长 1 的正方形内写下即可：比值不随缩放改变，而任何点集的宽和高都不超过它自己的直径，所以总放得下。左下角是原点 (0, 0)，右上角是 (1, 1)，坐标最多九位小数。",
  frameEn: "Scale and shift your configuration into the unit square to write it down: the ratio does not change under scaling, and any point set is no wider than its own diameter, so it always fits. The lower-left corner is (0, 0) and the upper-right is (1, 1); coordinates take at most nine decimal places.",
  requirements: ["恰好 n 个点，且两两不重合", "坐标写在单位正方形内", "分数是 D / d，越小越好"],
  requirementsEn: ["Exactly n points, no two coinciding", "Coordinates are written inside the unit square", "The score is D / d, and smaller is better"],
  instances,
};

function verifyDistanceRatio(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < MIN_N || n > MAX_N) return fail("BAD_PARAMS", `n 必须在 ${MIN_N} 与 ${MAX_N} 之间`, `n must be between ${MIN_N} and ${MAX_N}`);
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE) return fail("OUT_OF_BOUNDS", `点 ${i + 1} 不在正方形内`, `point ${i + 1} is outside the square`);
  }

  let nearest: bigint | null = null, furthest = 0n;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (nearest === null || squared < nearest) nearest = squared;
    if (squared > furthest) furthest = squared;
  }
  if (nearest === null) return fail("COUNT", "至少需要两个点才能谈距离", "at least two points are needed before there is a distance to speak of");
  if (nearest === 0n) return fail("COINCIDENT", "存在两个重合的点，最近距离为 0", "two of the points coincide, so the closest distance is 0");

  // The ratio is a square root of a rational, so it is irrational almost
  // always and cannot be stored exactly. Round it UP: the objective is to make
  // it small, and a score rounded down would credit a submission with a ratio
  // it did not actually achieve. Smallest k with k² · nearest ≥ furthest · SCALE².
  const target = furthest * BigInt(SCALE) * BigInt(SCALE);
  let units = integerSqrt(target / nearest);
  while (units * units * nearest < target) units += 1n;
  return ok(units, printFixedBig(units));
}

export const problem: ProblemModule = { definition, verify: verifyDistanceRatio };
