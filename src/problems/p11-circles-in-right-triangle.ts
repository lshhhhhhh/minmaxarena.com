import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// 容器是钉在坐标轴上的直角三角形：直角顶点在原点，两条直角边分别沿 x 轴与 y 轴。
// 斜边所在直线是 legY·x + legX·y = legY·legX，内部满足 legY·x + legX·y ≤ legY·legX。
// 点到斜边的距离乘以 √(legY²+legX²) 就是上式左右之差，于是「距离 ≥ r」可以整体平方，
// 全程只用 bigint 比较，不需要开方。
const RIGHT_TRIANGLE_LEG_X = SCALE;                 // 4 × 2.5·10⁻¹
const RIGHT_TRIANGLE_LEG_Y = 750_000_000;           // 3 × 2.5·10⁻¹
const RIGHT_TRIANGLE_HYPOTENUSE = 1_250_000_000;    // 5 × 2.5·10⁻¹，整数斜边只在构造基线时用到
const RIGHT_TRIANGLE_MAX_N = 200;

// 基线故意平庸：所有圆挤在底边上排成一行，只有最右端的圆碰到斜边。
// r 取满足该行放得下的最大整数，用 bigint 精确求出，不含任何浮点运算。
function rightTriangleBaseline(n: number) {
  const a = BigInt(RIGHT_TRIANGLE_LEG_Y), b = BigInt(RIGHT_TRIANGLE_LEG_X), c = BigInt(RIGHT_TRIANGLE_HYPOTENUSE);
  const radius = Number((a * b) / (a * BigInt(2 * n - 1) + b + c));
  return { radius: printFixed(radius), centers: Array.from({ length: n }, (_, index) => [printFixed(radius * (2 * index + 1)), printFixed(radius)]) };
}

const rightTriangleInstances: ProblemInstanceDefinition[] = Array.from({ length: 11 }, (_, index) => {
  const n = index + 2;
  return {
    instanceId: `p11-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rightTriangleBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
    id: "p11", instanceId: "p11-n5-v1", code: "P11", slug: "circles-in-right-triangle", category: "packing",
    title: "直角三角形内的等圆装箱",
    summary: "在直角边为 1 与 0.75 的固定直角三角形内放置 n 个互不相交的等圆，使共同半径尽可能大。",
    objective: "maximize", scoreLabel: "共同半径",
    instanceName: "n = 5", parameters: { n: 5 },
    baselineAnswer: rightTriangleBaseline(5),
    answerHelp: "提交 radius 与 centers。每个数写成十进制字符串，例如 \"0.15\"。",
    titleEn: "Equal-circle packing in a right triangle",
    summaryEn: "Place n non-overlapping equal circles inside a fixed right triangle with legs 1 and 0.75, maximizing their common radius.",
    scoreLabelEn: "common radius", instanceNameEn: "n = 5",
    answerHelpEn: "Submit radius and centers. Write every number as a decimal string, for example \"0.15\".",
    definition: "在直角边为 1 与 0.75 的直角三角形内放置 n 个互不重叠的等圆，使共同半径尽可能大。",
      definitionEn: "Place n non-overlapping equal circles inside the right triangle with legs 1 and 0.75, making the common radius as large as possible.",
      strict: [
        { label: "容器", labelEn: "Container", text: "直角三角形：直角顶点在原点 (0, 0)，一条直角边沿 x 轴到 (1, 0)，另一条沿 y 轴到 (0, 0.75)", textEn: "A right triangle: the right angle at the origin (0, 0), one leg along the x-axis to (1, 0), the other along the y-axis to (0, 0.75)" },
        { label: "提交", labelEn: "Submission", text: "恰好 n 个圆：一个共同半径 radius 与 n 个圆心 centers", textEn: "Exactly n circles: one shared radius and n centres" },
        { label: "约束", labelEn: "Constraints", text: "每个圆完整落在容器内；两两内部不重叠，相切允许", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
        { label: "目标", labelEn: "Objective", text: "让共同半径尽可能大", textEn: "Make the common radius as large as possible" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "最优构形是「卡死」的接触结构：圆彼此顶住、顶住边界，常出现斜排、错位、以及不碰任何邻居的游离圆。规整的网格摆法几乎从不最优。",
          textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "直角边 1 与 0.75 这个具体三角形没有文献表；等腰直角三角形等近亲收录在 Friedman 的 Packing Center。本站未录值，每个 n 都开放。",
          textEn: "This particular triangle, legs 1 and 0.75, has no literature table; close relatives such as the isosceles right triangle are collected on Friedman's Packing Center. No values are recorded here, and every n is open." , url: "https://erich-friedman.github.io/packing/" },
      ],
    extent: SCALE,
    frame: "容器是直角三角形：直角顶点就是原点 (0, 0)，一条直角边沿 x 轴到 (1, 0)，另一条沿 y 轴到 (0, 0.75)，斜边连接这两点。坐标和长度用同一个单位，直接写成小数，例如 \"0.15\"，最多九位小数。",
    frameEn: "The container is a right triangle: the right angle is the origin (0, 0), one leg runs along the x axis to (1, 0), the other along the y axis to (0, 0.75), and the hypotenuse joins those two points. Coordinates and lengths share one unit and are written as plain decimals such as \"0.15\", to at most nine decimal places.",
    instances: rightTriangleInstances,
};

function verifyRightTriangleCircles(params: Obj, answer: Obj): VerificationResult {
  // The triangle is the same for every instance, so it is stated in the frame
  // rather than repeated in each instance's parameters.
  const n = asInt(params.n, "n"), legX = RIGHT_TRIANGLE_LEG_X, legY = RIGHT_TRIANGLE_LEG_Y;
  if (n < 1 || n > RIGHT_TRIANGLE_MAX_N) return fail("COUNT", `n 必须在 1 与 ${RIGHT_TRIANGLE_MAX_N} 之间`, `n must be between 1 and ${RIGHT_TRIANGLE_MAX_N}`);
  if (legX <= 0 || legY <= 0) return fail("BAD_PARAMS", "三角形的直角边必须为正数", "the triangle's legs must be positive");
  const radius = parseFixed(answer.radius, "radius");
  const raw = asArray(answer.centers, "centers");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆心`, `exactly ${n} centres are needed`);
  if (radius <= 0) return fail("RADIUS", "半径必须为正数", "the radius must be a positive number");
  const centers = raw.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const a = BigInt(legY), b = BigInt(legX), r = BigInt(radius);
  const doubledArea = a * b, normSquared = a * a + b * b, reach = r * r * normSquared;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i];
    if (x < radius || y < radius) return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 越过了一条直角边`, `circle ${i + 1} crosses one of the legs`);
    const slack = doubledArea - a * BigInt(x) - b * BigInt(y);
    if (slack < 0n || slack * slack < reach) return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 越过了斜边`, `circle ${i + 1} crosses the hypotenuse`);
  }
  const minDistance = 4n * r * r;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = BigInt(centers[i][0] - centers[j][0]), dy = BigInt(centers[i][1] - centers[j][1]);
    if (dx * dx + dy * dy < minDistance) return fail("OVERLAP", `圆 ${i + 1} 与圆 ${j + 1} 相交`, `circles ${i + 1} and ${j + 1} intersect`);
  }
  return ok(r, printFixed(radius));
}

export const problem: ProblemModule = { definition, verify: verifyRightTriangleCircles };
