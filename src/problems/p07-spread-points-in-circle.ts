import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, printSquared, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// Points spread inside a disc rather than a square. The corner is what makes
// the square version what it is — the first few answers park points in corners
// and stop being interesting — and a disc has none, so every point has to earn
// its place against every other. Same exact arithmetic: containment is one
// squared comparison, and the score is the squared minimum distance because the
// distance itself needs a square root.
const MIN_N = 4;
const MAX_N = 20;
const RADIUS = SCALE;   // radius 1…
const CENTRE = SCALE;   // …centred at (1, 1), so coordinates run 0…2

// Deliberately poor: points on one circle of half the radius, evenly spaced.
// It leaves the whole outer ring and the centre unused, and every real answer
// uses both. Written with sin and cos here, at authoring time; the verifier
// that judges it never touches a float.
function ringBaseline(n: number) {
  const ring = Math.floor(RADIUS / 2);
  return {
    points: Array.from({ length: n }, (_, index) => {
      const angle = (2 * Math.PI * index) / n;
      return [
        printFixed(CENTRE + Math.round(ring * Math.cos(angle))),
        printFixed(CENTRE + Math.round(ring * Math.sin(angle))),
      ];
    }),
  };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p07-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: ringBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
  id: "p07", instanceId: "p07-n8-v2", code: "P07", slug: "spread-points-in-circle", category: "extremal",
  title: "圆内的散点分离",
  summary: "在半径 1 的圆内放置 n 个点，使任意两点之间的最小距离尽可能大。",
  objective: "maximize", scoreLabel: "最小两点距离的平方", goalLabel: "最小两点距离", scoreIs: "square", goalLabelEn: "the smallest distance between two points",
  instanceName: "n = 8", parameters: { n: 8 },
  baselineAnswer: ringBaseline(8),
  answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"1.5\"。",
  titleEn: "Spreading points in a circle",
  summaryEn: "Place n points inside a circle of radius 1 so that the smallest distance between any two is as large as possible.",
  scoreLabelEn: "squared minimum pairwise distance", instanceNameEn: "n = 8",
  answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"1.5\".",
  definition: "在半径 1 的圆内放置 n 个点，使两两之间的最小距离尽可能大。",
    definitionEn: "Place n points inside a circle of radius 1, maximizing the smallest distance between any two of them.",
    strict: [
      { label: "容器", labelEn: "Container", text: "半径 1 的圆，圆心在 (1, 1)，两个坐标都在 0 到 2 之间", textEn: "A circle of radius 1 centred at (1, 1), so both coordinates run from 0 to 2" },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个点 points，两两不重合", textEn: "Exactly n points, no two coinciding" },
      { label: "约束", labelEn: "Constraints", text: "每个点都在圆内或圆周上", textEn: "Every point lies inside the circle or on it" },
      { label: "目标", labelEn: "Objective", text: "让最小的两点距离尽可能大。内部以其平方精确比较", textEn: "Make the smallest pairwise distance as large as possible; compared internally by its square, exactly" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "散点分离就是装等圆：以每个点为圆心、最小距离一半为半径的圆必须互不重叠。最优构形因此也是卡死的接触结构，容器的形状决定一切。",
        textEn: "Spreading points IS packing equal circles: discs of half the minimum distance around each point must not overlap. Optima are jammed contact structures, and the container shape decides everything." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "圆内散点与等圆装圆互为对偶：最小间距 d 的点集就是半径 d/2 的装圆。cci 表的证明经换算适用，n = 4 在本站已证；其余按对偶随 cci 的进度开放。",
        textEn: "Spreading points in a disc is dual to packing equal circles in it: a point set with spacing d is a packing of radius d/2. Proofs in the cci table transfer; n = 4 is proven here, and the rest open or close as cci does." , url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/cci/cci.html" },
    ],
  extent: 2 * SCALE,
  frame: "容器是半径 1 的圆，圆心在 (1, 1)，所以坐标范围是 0 到 2。坐标直接写成小数，例如 \"1.5\"，最多九位小数。",
  frameEn: "The container is a circle of radius 1 centred at (1, 1), so coordinates run from 0 to 2. Coordinates are written as plain decimals such as \"1.5\", to at most nine decimal places.",
  requirements: ["恰好 n 个点，且两两不重合", "每个点都在圆内或圆周上", "分数是最小的那个两点距离"],
  requirementsEn: ["Exactly n points, no two coinciding", "Every point lies inside the circle or on it", "The score is the smallest distance between two points"],
  instances,
};

function verifySpreadPointsInCircle(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 2 || n > 120) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));

  const radiusSquared = BigInt(RADIUS) * BigInt(RADIUS);
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (sq(x - CENTRE) + sq(y - CENTRE) > radiusSquared) return fail("OUT_OF_BOUNDS", `点 ${i + 1} 落在圆外`, `point ${i + 1} lies outside the circle`);
  }

  let nearest: bigint | null = null;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (nearest === null || squared < nearest) nearest = squared;
  }
  if (nearest === null || nearest === 0n) return fail("COINCIDENT", "存在两个重合的点，最小距离为 0", "two of the points coincide, so the smallest distance is 0");
  return ok(nearest, printSquared(nearest));
}

export const problem: ProblemModule = { definition, verify: verifySpreadPointsInCircle };
