import { SCALE, ok, fail, refuse, asInt, asArray, parseFixedPoint, printFixed, printSquared } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// 容器换成直角三角形 (0,0)、(size,0)、(0,size)：三条边都能用整数不等式表达，
// x ≥ 0、y ≥ 0、x + y ≤ size，不需要任何浮点数或三角函数。
const MAX_N = 40;

// 基线把点摆在一张很粗的三角格点网上（分母 denominator，坐标是格点乘以
// ⌊size / denominator⌋）。这样的格点构型合法但明显粗糙：最小三角形面积
// 只有容器面积的百分之几，而连续位置能做得好得多。
const latticeBaselines: Record<number, { denominator: number; cells: number[][] }> = {
  5: { denominator: 6, cells: [[0,1],[3,0],[3,3],[4,1],[6,0]] },
  6: { denominator: 6, cells: [[0,2],[0,5],[1,0],[2,4],[3,1],[5,1]] },
  7: { denominator: 6, cells: [[0,1],[0,5],[1,0],[2,2],[2,4],[4,0],[5,1]] },
  8: { denominator: 6, cells: [[0,0],[0,1],[1,4],[1,5],[2,2],[2,4],[3,1],[5,0]] },
  9: { denominator: 6, cells: [[0,2],[0,5],[1,1],[1,3],[2,2],[2,3],[3,0],[5,1],[6,0]] },
  10: { denominator: 7, cells: [[0,2],[0,5],[1,3],[1,5],[2,0],[3,0],[3,1],[4,3],[5,1],[5,2]] },
};

const pointCounts = [5, 6, 7, 8, 9, 10];

function latticeBaseline(n: number) {
  const { denominator, cells } = latticeBaselines[n];
  const step = Math.floor(SCALE / denominator);
  return { points: cells.map(([a, b]) => [printFixed(a * step), printFixed(b * step)]) };
}

const instances: ProblemInstanceDefinition[] = pointCounts.map((n) => ({
  instanceId: `p29-n${n}-v1`,
  instanceName: `n = ${n}`,
  instanceNameEn: `n = ${n}`,
  parameters: { n },
  baselineAnswer: latticeBaseline(n),
}));

export const definition: ProblemDefinition = {
    id: "p29", instanceId: "p29-n6-v1", code: "P29", slug: "heilbronn-in-triangle", category: "extremal",
    title: "三角形容器内的 Heilbronn 问题", summary: "在直角三角形 (0,0)、(size,0)、(0,size) 内放置 n 个点，最大化任意三点构成的最小三角形面积。", objective: "maximize", scoreLabel: "最小三角形的二倍面积", goalLabel: "最小三角形的面积", scoreIs: "double", goalLabelEn: "the smallest triangle's area",
    instanceName: "n = 6", parameters: { n: 6 },
    baselineAnswer: latticeBaseline(6),
    answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.5\"。",
    titleEn: "Heilbronn's problem in a triangle", summaryEn: "Place n points inside the right triangle (0,0), (size,0), (0,size) and maximize the smallest triangle area among all triples.", scoreLabelEn: "minimum triangle area, doubled", instanceNameEn: "n = 6", answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\".",
    definition: "在顶点为 (0, 0)、(1, 0)、(0, 1) 的直角三角形内放置 n 个点，使任意三点构成的最小三角形面积尽可能大。",
      definitionEn: "Place n points inside the right triangle with vertices (0, 0), (1, 0) and (0, 1), maximizing the smallest triangle formed by any three of them.",
      strict: [
        { label: "容器", labelEn: "Container", text: "直角三角形，顶点 (0, 0)、(1, 0)、(0, 1)：内部就是 x ≥ 0、y ≥ 0、x + y ≤ 1", textEn: "A right triangle with vertices (0, 0), (1, 0) and (0, 1): the region x ≥ 0, y ≥ 0, x + y ≤ 1" },
        { label: "提交", labelEn: "Submission", text: "恰好 n 个点 points，任意三点不共线", textEn: "Exactly n points, no three collinear" },
        { label: "约束", labelEn: "Constraints", text: "每个点都在三角形内或边界上", textEn: "Every point lies inside the triangle or on its boundary" },
        { label: "目标", labelEn: "Objective", text: "让任意三点构成的三角形中最小的面积尽可能大。内部以二倍面积精确比较", textEn: "Make the smallest triangle over all triples as large as possible; compared internally by twice the area, exactly" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "把点撒得均匀并不够：任何三点都不能接近共线，而近共线恰恰是看起来整齐的排布最容易犯的错。最优构形往往不对称，连形状都难猜。",
          textEn: "Even spreading is not enough: no three points may come close to collinear, and near-collinearity is exactly what tidy arrangements love to do. Optima are often asymmetric and hard even to guess." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "n = 5, 6 由 Yang、Zhang 与 Zeng 证明，n = 7 由 Sudermann-Merx 证明，见 arXiv:2607.15021；n ≥ 8 全部开放。",
          textEn: "n = 5 and 6 were proven by Yang, Zhang and Zeng, n = 7 by Sudermann-Merx — see arXiv:2607.15021; everything from n = 8 up is open." , url: "https://arxiv.org/abs/2607.15021" },
      ],
    extent: SCALE,
    frame: "容器是直角三角形，三个顶点是 (0, 0)、(1, 0) 与 (0, 1)：内部就是 x ≥ 0、y ≥ 0、x + y ≤ 1。坐标直接写成小数，例如 \"0.5\"，最多九位小数。",
    frameEn: "The container is the right triangle with vertices (0, 0), (1, 0) and (0, 1): its interior is exactly x ≥ 0, y ≥ 0, x + y ≤ 1. Coordinates are written as plain decimals such as \"0.5\", to at most nine decimal places.",
    instances,
};

const absBig = (value: bigint) => (value < 0n ? -value : value);

function verifyHeilbronnInTriangle(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), size = SCALE;
  if (n < 3 || n > MAX_N) refuse("n 超出验证器支持的范围", "n is outside the range the verifier supports");
  if (size < 2 || size > SCALE) refuse("size 超出验证器支持的范围", "size is outside the range the verifier supports");
  const raw = asArray(answer.points, "points");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (const [x, y] of points) if (x < 0 || y < 0 || x + y > size) return fail("OUT_OF_BOUNDS", "至少一个点落在三角形之外", "at least one point lies outside the triangle");
  const seen = new Set<string>();
  for (const [x, y] of points) { const key = `${x},${y}`; if (seen.has(key)) return fail("DUPLICATE", `点 (${x}, ${y}) 出现了两次`, `the point (${x}, ${y}) appears twice`); seen.add(key); }
  let minimum: bigint | null = null;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    const [ax, ay] = points[i], [bx, by] = points[j], [cx, cy] = points[k];
    const doubledArea = absBig((BigInt(bx) - BigInt(ax)) * (BigInt(cy) - BigInt(ay)) - (BigInt(by) - BigInt(ay)) * (BigInt(cx) - BigInt(ax)));
    if (minimum === null || doubledArea < minimum) minimum = doubledArea;
  }
  if (minimum === null || minimum === 0n) return fail("COLLINEAR", "存在三点共线，最小面积为 0", "three of the points are collinear, so the smallest area is 0");
  return ok(minimum, printSquared(minimum));
}

export const problem: ProblemModule = { definition, verify: verifyHeilbronnInTriangle };
