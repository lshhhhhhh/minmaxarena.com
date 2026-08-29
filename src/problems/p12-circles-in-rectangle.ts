import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// 容器是长宽比 2:1 的长方形，左下角在原点。所有判定都比较平方距离。
const RECTANGLE_WIDTH = 2 * SCALE;
const RECTANGLE_HEIGHT = SCALE;
const RECTANGLE_MAX_N = 200;

// 基线故意平庸：n 个圆沿水平中线排成一行，宽度是唯一被用满的方向，
// 上下两条长边之间的空间被整体浪费掉。
function rectangleBaseline(n: number) {
  const radius = Math.min(Math.floor(RECTANGLE_HEIGHT / 2), Math.floor(RECTANGLE_WIDTH / (2 * n)));
  const startX = Math.floor((RECTANGLE_WIDTH - 2 * radius * n) / 2) + radius;
  const y = Math.floor(RECTANGLE_HEIGHT / 2);
  return { radius: printFixed(radius), centers: Array.from({ length: n }, (_, index) => [printFixed(startX + 2 * radius * index), printFixed(y)]) };
}

// n = 2 时一行两个圆恰好就是最优解，基线不该占住最优值，所以子题从 n = 3 起。
const rectangleInstances: ProblemInstanceDefinition[] = Array.from({ length: 10 }, (_, index) => {
  const n = index + 3;
  return {
    instanceId: `p12-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rectangleBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
    id: "p12", instanceId: "p12-n6-v1", code: "P12", slug: "circles-in-rectangle", category: "packing",
    title: "2:1 长方形内的等圆装箱",
    summary: "在 2×1 的长方形内放置 n 个互不相交的等圆，使共同半径尽可能大。",
    objective: "maximize", scoreLabel: "共同半径",
    instanceName: "n = 6", parameters: { n: 6 },
    baselineAnswer: rectangleBaseline(6),
    answerHelp: "提交 radius 与 centers。每个数写成十进制字符串，例如 \"0.25\"。",
    titleEn: "Equal-circle packing in a 2:1 rectangle",
    summaryEn: "Place n non-overlapping equal circles in a 2×1 rectangle, maximizing their common radius.",
    scoreLabelEn: "common radius", instanceNameEn: "n = 6",
    answerHelpEn: "Submit radius and centers. Write every number as a decimal string, for example \"0.25\".",
    definition: "在 2×1 的长方形内放置 n 个互不重叠的等圆，使共同半径尽可能大。",
      definitionEn: "Place n non-overlapping equal circles inside a 2 × 1 rectangle, making the common radius as large as possible.",
      strict: [
        { label: "容器", labelEn: "Container", text: "宽 2、高 1 的长方形：左下角是原点 (0, 0)，右上角是 (2, 1)", textEn: "A rectangle 2 wide and 1 tall: the origin (0, 0) at its lower-left corner, (2, 1) at its upper right" },
        { label: "提交", labelEn: "Submission", text: "恰好 n 个圆：一个共同半径 radius 与 n 个圆心 centers", textEn: "Exactly n circles: one shared radius and n centres" },
        { label: "约束", labelEn: "Constraints", text: "每个圆完整落在容器内；两两内部不重叠，相切允许", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
        { label: "目标", labelEn: "Objective", text: "让共同半径尽可能大", textEn: "Make the common radius as large as possible" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "最优构形是「卡死」的接触结构：圆彼此顶住、顶住边界，常出现斜排、错位、以及不碰任何邻居的游离圆。规整的网格摆法几乎从不最优。",
          textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "n = 3..6 由之字形构造的初等论证证明（见各子题的已知最好栏）；2×1 长方形更大的 n 没有系统文献表，全部开放。",
          textEn: "n = 3..6 are proven by elementary zig-zag arguments (see each sub-problem's known-best row); larger n in the 2 × 1 rectangle have no systematic table and are all open." },
      ],
    extent: 2 * SCALE,
    frame: "容器是宽 2、高 1 的长方形，左下角是原点 (0, 0)，右上角是 (2, 1)。坐标和长度用同一个单位，直接写成小数，例如 \"0.25\"，最多九位小数。",
    frameEn: "The container is a rectangle 2 wide and 1 tall. Its lower-left corner is the origin (0, 0) and its upper-right corner is (2, 1). Coordinates and lengths share one unit and are written as plain decimals such as \"0.25\", to at most nine decimal places.",
    instances: rectangleInstances,
};

function verifyRectangleCircles(params: Obj, answer: Obj): VerificationResult {
  // The rectangle is the same for every instance, so it is stated in the frame
  // rather than repeated in each instance's parameters.
  const n = asInt(params.n, "n"), width = RECTANGLE_WIDTH, height = RECTANGLE_HEIGHT;
  if (n < 1 || n > RECTANGLE_MAX_N) return fail("COUNT", `n 必须在 1 与 ${RECTANGLE_MAX_N} 之间`, `n must be between 1 and ${RECTANGLE_MAX_N}`);
  if (width <= 0 || height <= 0) return fail("BAD_PARAMS", "长方形的边长必须为正数", "the rectangle's sides must be positive");
  const radius = parseFixed(answer.radius, "radius");
  const raw = asArray(answer.centers, "centers");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆心`, `exactly ${n} centres are needed`);
  if (radius <= 0 || radius > Math.floor(width / 2) || radius > Math.floor(height / 2)) return fail("RADIUS", "半径必须为正数且不超过长方形短边的一半", "the radius must be positive and at most half the rectangle's shorter side");
  const centers = raw.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i];
    if (x < radius || y < radius || x > width - radius || y > height - radius) return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 超出了长方形边界`, `circle ${i + 1} reaches outside the rectangle`);
  }
  const minDistance = 4n * sq(radius);
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    if (sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]) < minDistance) return fail("OVERLAP", `圆 ${i + 1} 与圆 ${j + 1} 相交`, `circles ${i + 1} and ${j + 1} intersect`);
  }
  return ok(BigInt(radius), printFixed(radius));
}

export const problem: ProblemModule = { definition, verify: verifyRectangleCircles };
