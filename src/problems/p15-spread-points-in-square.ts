import { SCALE, ok, fail, asInt, asArray, parseFixedPoint, printFixed, printSquared, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// 分数是「最小两点距离的平方」，不是距离本身：距离要开方，而开方在整数下无法精确表示。
// 坐标是 10⁻⁹ 精度的整数，所以平方距离的单位是 10⁻¹⁸。
const SPREAD_MAX_N = 120;

// 基线故意平庸：把 k×k 的方格取前 n 个格心，k = ⌈√n⌉。
// 最小距离就是格距 ⌊1/k⌋，正方形靠边的一整圈空间完全没有用上。
function spreadBaseline(n: number) {
  let columns = 1;
  while (columns * columns < n) columns += 1;   // ⌈√n⌉ without touching a float
  const step = Math.floor(SCALE / columns), offset = Math.floor(step / 2);
  return {
    points: Array.from({ length: n }, (_, index) => [
      printFixed(offset + (index % columns) * step),
      printFixed(offset + Math.floor(index / columns) * step),
    ]),
  };
}

const spreadInstances: ProblemInstanceDefinition[] = Array.from({ length: 11 }, (_, index) => {
  const n = index + 2;
  return {
    instanceId: `p15-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: spreadBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
    id: "p15", instanceId: "p15-n6-v1", code: "P15", slug: "spread-points-in-square", category: "packing",
    title: "单位正方形内的散点分离",
    summary: "在单位正方形内放置 n 个点，使任意两点之间的最小距离尽可能大。",
    objective: "maximize", scoreLabel: "最小两点距离的平方", goalLabel: "最小两点距离", scoreIs: "square", goalLabelEn: "the smallest distance between two points",
    instanceName: "n = 6", parameters: { n: 6 },
    baselineAnswer: spreadBaseline(6),
    answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.5\"。",
    titleEn: "Spreading points in the unit square",
    summaryEn: "Place n points in the unit square so that the smallest distance between any two of them is as large as possible.",
    scoreLabelEn: "squared minimum pairwise distance", instanceNameEn: "n = 6",
    answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\".",
    definition: "在单位正方形内放置 n 个点，使两两之间的最小距离尽可能大。",
      definitionEn: "Place n points in the unit square, maximizing the smallest distance between any two of them.",
      strict: [
        { label: "容器", labelEn: "Container", text: "单位正方形：左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
        { label: "提交", labelEn: "Submission", text: "恰好 n 个点 points，两两不重合", textEn: "Exactly n points, no two coinciding" },
        { label: "约束", labelEn: "Constraints", text: "每个点都在正方形内或边界上", textEn: "Every point lies inside the square or on its boundary" },
        { label: "目标", labelEn: "Objective", text: "让最小的两点距离尽可能大。内部以其平方精确比较", textEn: "Make the smallest pairwise distance as large as possible; compared internally by its square, exactly" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "散点分离就是装等圆：以每个点为圆心、最小距离一半为半径的圆必须互不重叠。最优构形因此也是卡死的接触结构，容器的形状决定一切。",
          textEn: "Spreading points IS packing equal circles: discs of half the minimum distance around each point must not overlap. Optima are jammed contact structures, and the container shape decides everything." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "正方形散点与等圆装方互为对偶，csq 表的证明经换算适用；本站已证 n = 2, 4, 5, 9（初等论证，见各子题），其余按对偶随 csq 的进度。",
          textEn: "Spreading points in a square is dual to packing equal circles in one; proofs in the csq table transfer. n = 2, 4, 5 and 9 are proven here by elementary arguments, and the rest follow csq's progress." , url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/csq/csq.html" },
      ],
    extent: SCALE,
    frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。坐标和长度用同一个单位，直接写成小数，例如 \"0.5\"，最多九位小数。",
    frameEn: "The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and lengths share one unit and are written as plain decimals such as \"0.5\", to at most nine decimal places.",
    instances: spreadInstances,
};

function verifySpreadPoints(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), size = SCALE;
  if (n < 2 || n > SPREAD_MAX_N) return fail("COUNT", `n 必须在 2 与 ${SPREAD_MAX_N} 之间`, `n must be between 2 and ${SPREAD_MAX_N}`);
  if (size <= 0) return fail("BAD_PARAMS", "正方形边长必须为正数", "the square's side must be a positive number");
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > size || y > size) return fail("OUT_OF_BOUNDS", `点 ${i + 1} 不在正方形内`, `point ${i + 1} is outside the square`);
  }
  let minimum: bigint | null = null;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (minimum === null || squared < minimum) minimum = squared;
  }
  if (minimum === null || minimum === 0n) return fail("COINCIDENT", "存在两个重合的点，最小距离为 0", "two of the points coincide, so the smallest distance is 0");
  return ok(minimum, printSquared(minimum));
}

export const problem: ProblemModule = { definition, verify: verifySpreadPoints };
