import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

const SQUARE_CIRCLE_MAX_N = 30;

function squareCircleBaseline(n: number) {
  const write = (units: number) => printFixed(units);
  if (n === 1) return { radius: write(500000000), centers: [[write(500000000), write(500000000)]] };
  if (n === 5) return {
    radius: write(100000000),
    centers: ([[100000000,100000000],[900000000,100000000],[100000000,900000000],[900000000,900000000],[500000000,500000000]] as [number,number][]).map(([x,y])=>[write(x),write(y)]),
  };

  const columns = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / columns);
  const radius = Math.floor(SCALE / (2 * Math.max(columns, rows)));
  const width = columns * radius * 2;
  const height = rows * radius * 2;
  const startX = Math.floor((SCALE - width) / 2) + radius;
  const startY = Math.floor((SCALE - height) / 2) + radius;
  const centers: number[][] = [];
  for (let row = 0; row < rows && centers.length < n; row += 1) {
    for (let column = 0; column < columns && centers.length < n; column += 1) {
      centers.push([startX + column * radius * 2, startY + row * radius * 2]);
    }
  }
  return { radius: write(radius), centers: centers.map(([x,y])=>[write(x),write(y)]) };
}

const squareCircleInstances: ProblemInstanceDefinition[] = Array.from({ length: SQUARE_CIRCLE_MAX_N }, (_, index) => {
  const n = index + 1;
  return {
    instanceId: `p01-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: squareCircleBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
    id: "p01", instanceId: "p01-n5-v1", code: "P01", slug: "square-circle-packing", category: "packing",
    title: "单位正方形内的等圆装箱", summary: "放置 n 个等圆，使共同半径尽可能大。", objective: "maximize", scoreLabel: "共同半径",
    instanceName: "n = 5", parameters: { n: 5 },
    baselineAnswer: squareCircleBaseline(5),
    answerHelp: "提交 radius 与 centers。每个数写成十进制字符串，例如 \"0.25\"。",
    extent: SCALE,
    frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。坐标和长度用同一个单位，直接写成小数，例如 \"0.5\"，最多九位小数。",
    frameEn: "The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and lengths share one unit and are written as plain decimals such as \"0.5\", to at most nine decimal places.",
    titleEn: "Equal-circle packing in a unit square", summaryEn: "Place n equal circles and maximize their common radius.", scoreLabelEn: "common radius", instanceNameEn: "n = 5", answerHelpEn: "Submit radius and centers. Write every number as a decimal string, for example \"0.25\".",
    definition: "在边长 1 的正方形内放置 n 个半径相同、互不重叠的圆，使共同半径尽可能大。",
      definitionEn: "Place n non-overlapping circles of one common radius inside the unit square, making that radius as large as possible.",
      strict: [
        { label: "容器", labelEn: "Container", text: "单位正方形：左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
        { label: "提交", labelEn: "Submission", text: "恰好 n 个圆：一个共同半径 radius 与 n 个圆心 centers", textEn: "Exactly n circles: one shared radius and n centres" },
        { label: "约束", labelEn: "Constraints", text: "每个圆完整落在容器内；两两内部不重叠，相切允许", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
        { label: "目标", labelEn: "Objective", text: "让共同半径尽可能大", textEn: "Make the common radius as large as possible" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "最优构形是「卡死」的接触结构：圆彼此顶住、顶住边界，常出现斜排、错位、以及不碰任何邻居的游离圆。规整的网格摆法几乎从不最优。",
          textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "这三十个 n 全部已证明，最优构形也已直接展示，整题作为已完成陈列，不再接受破纪录；csq 表往上收录到几百个 n，真正的前沿在那里。",
          textEn: "All thirty n are proven and their optimal configurations are shown outright; the whole problem is exhibited as finished and takes no records. Specht's csq table runs to hundreds of n, and the real frontier lives there." , url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/csq/csq.html" },
      ],
    requirements: ["所有圆必须完全位于正方形内","任意两个圆的内部不能重叠","所有圆使用同一个半径"],
    requirementsEn: ["Every circle stays inside the square","No two circle interiors overlap","Every circle has the same radius"],
    instances: squareCircleInstances,
};

function verifySquareCircles(params: Obj, answer: Obj): VerificationResult {
  // The container is the unit square for every instance, so it is stated in the
  // frame rather than repeated in each instance's parameters.
  const n = asInt(params.n, "n"), size = SCALE;
  const radius = parseFixed(answer.radius, "radius");
  const centers = asArray(answer.centers, "centers").map((point, i) => parseFixedPoint(point, `centers[${i}]`));
  if (radius <= 0 || centers.length !== n) return fail("COUNT_OR_RADIUS", `需要恰好 ${n} 个圆，且半径为正数`, `exactly ${n} circles are needed, with a positive radius`);
  for (const [x, y] of centers) if (x < radius || y < radius || x > size - radius || y > size - radius) return fail("OUT_OF_BOUNDS", "至少一个圆超出了正方形边界", "at least one circle reaches outside the square");
  const minDistance = 4n * sq(radius);
  for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) if (sq(centers[i][0]-centers[j][0]) + sq(centers[i][1]-centers[j][1]) < minDistance) return fail("OVERLAP", `圆 ${i+1} 与圆 ${j+1} 相交`, `circles ${i+1} and ${j+1} intersect`);
  return ok(BigInt(radius), printFixed(radius));
}

export const problem: ProblemModule = { definition, verify: verifySquareCircles };
