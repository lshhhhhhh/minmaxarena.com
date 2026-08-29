import { SCALE, ok, fail, refuse, asInt, asArray, parseFixed, printFixedBig } from "../problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, VerificationResult } from "../problem-kit";

// P57: circles in the unit square, maximizing the sum of the radii.
//
// The problem AlphaEvolve made famous (problem 6.36 of its discovery paper)
// and EinsteinArena's agents then ground to the float64 ceiling at n = 26.
// Unlike P01 the circles need not be equal, which changes the character
// completely: the optimum mixes a few large circles against walls with small
// ones packed into the gaps, and the trade between one big circle and several
// small ones is the whole game.
//
// Scoring is the plainest on the site: every radius is a nine-decimal integer,
// and the score is their exact integer sum.

const MIN_N = 1;
const MAX_N = 30;

// A deliberately weak seed: the k × k grid of equal circles at four fifths of
// the inscribed radius. Growing them back to full size already beats it, and
// mixing sizes beats that.
function shrunkGrid(n: number): { circles: [string, string, string][] } {
  const k = Math.ceil(Math.sqrt(n));
  const radius = Math.floor((SCALE / (2 * k)) * 4 / 5);
  const fine = (units: number) => (units / SCALE).toFixed(9).replace(/0+$/, "").replace(/\.$/, "") || "0";
  const circles: [string, string, string][] = [];
  for (let i = 0; i < k && circles.length < n; i += 1)
    for (let j = 0; j < k && circles.length < n; j += 1)
      circles.push([fine(Math.round(((2 * j + 1) * SCALE) / (2 * k))), fine(Math.round(((2 * i + 1) * SCALE) / (2 * k))), fine(radius)]);
  return { circles };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p57-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: shrunkGrid(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
  id: "p57", instanceId: "p57-n26-v1", code: "P57", slug: "sum-of-radii", category: "packing",
  title: "正方形内圆的半径之和",
  summary: "在单位正方形内放 n 个互不重叠的圆，大小随意，使所有半径之和尽可能大。",
  objective: "maximize", scoreLabel: "半径之和", instanceName: "n = 26", parameters: { n: 26 },
  baselineAnswer: shrunkGrid(26),
  answerHelp: "提交 circles：恰好 n 个三元组 [x, y, r]，每个数写成十进制字符串，例如 \"0.25\"。",
  titleEn: "Sum of radii in the unit square",
  summaryEn: "Place n non-overlapping circles of any sizes in the unit square, maximizing the sum of their radii.",
  scoreLabelEn: "sum of the radii", instanceNameEn: "n = 26",
  answerHelpEn: "Submit circles: exactly n triples [x, y, r], every number a decimal string such as \"0.25\".",
  extent: SCALE,
  frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。坐标与半径共用一套单位，直接写成小数，例如 \"0.25\"，最多九位小数。",
  frameEn: "The container is a square of side 1, with the origin (0, 0) at its lower-left corner and (1, 1) at its upper-right. Coordinates and radii share one unit and are written as plain decimals such as \"0.25\", to at most nine decimal places.",
  definition: "在单位正方形内放置 n 个互不重叠的圆，每个圆的半径各自随意，使所有半径之和尽可能大。",
  definitionEn: "Place n non-overlapping circles in the unit square, each with its own radius, making the sum of the radii as large as possible.",
  strict: [
    { label: "容器", labelEn: "Container", text: "边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "A square of side 1, origin (0, 0) at the lower-left corner, (1, 1) at the upper-right" },
    { label: "提交", labelEn: "Submission", text: "恰好 n 个圆，每个是一组 [x, y, r]：圆心加自己的半径", textEn: "Exactly n circles, each a triple [x, y, r]: a centre plus its own radius" },
    { label: "约束", labelEn: "Constraints", text: "每个圆完整落在正方形内；两两内部不重叠，相切允许；半径为正", textEn: "Every circle lies entirely inside the square; no two overlap in their interiors, tangency allowed; every radius is positive" },
    { label: "目标", labelEn: "Objective", text: "让所有半径之和尽可能大。半径都是九位小数，和是精确的整数和", textEn: "Make the sum of the radii as large as possible. Radii are nine-decimal numbers, and the sum is an exact integer sum" },
  ],
  intuition: [
    { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
      text: "等圆是最差的策略之一：几个大圆压住墙角，再用小圆钻进它们留下的缝隙，比任何均匀排布都强。一个大圆换几个小圆的取舍在每个角落重演，最优构形里大小能差出一个数量级。",
      textEn: "Equal circles are one of the worst strategies here: a few large circles pressed into the walls, with small ones tucked into the gaps they leave, beat any uniform arrangement. The trade of one big circle for several small ones replays in every corner, and the optimum spans an order of magnitude in size." },
    { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "这是 AlphaEvolve 大规模数学发现实验中的问题 6.36。n = 26 在 EinsteinArena 上被推到精确的 KKT 解（和的前 45 位已知），其余 n 几乎没有发表过的值，全部开放。",
      textEn: "This is problem 6.36 of AlphaEvolve's large-scale mathematical discovery runs. On EinsteinArena, n = 26 was pushed to the exact KKT optimum (the first 45 digits of the sum are known); almost no other n has a published value, and every one of them is open.",
      url: "https://einsteinarena.com/problems/circle-packing" },
  ],
  requirements: ["恰好 n 个圆，每个带自己的半径", "每个圆完整落在正方形内", "两两内部不重叠，相切允许"],
  requirementsEn: ["Exactly n circles, each with its own radius", "Every circle lies entirely inside the square", "No two overlap in their interiors, tangency allowed"],
  instances,
};

const big = BigInt;

function verifySumOfRadii(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < MIN_N || n > MAX_N) refuse("n 超出验证器支持的范围", "n is outside the range the verifier supports");
  const raw = asArray(answer.circles, "circles");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆`, `exactly ${n} circles are needed`);
  const circles: [number, number, number][] = [];
  for (let i = 0; i < n; i += 1) {
    const triple = raw[i];
    if (!Array.isArray(triple) || triple.length !== 3)
      return fail("BAD_CIRCLE", `circles[${i}] 必须是 [x, y, r] 三元组`, `circles[${i}] must be an [x, y, r] triple`);
    const x = parseFixed(triple[0], `circles[${i}][0]`);
    const y = parseFixed(triple[1], `circles[${i}][1]`);
    const r = parseFixed(triple[2], `circles[${i}][2]`);
    if (r <= 0) return fail("DEGENERATE", `circles[${i}] 的半径必须为正`, `circles[${i}] must have a positive radius`);
    if (x < r || y < r || x + r > SCALE || y + r > SCALE)
      return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 没有完整落在正方形内`, `circle ${i + 1} does not lie entirely inside the square`);
    circles.push([x, y, r]);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = big(circles[i][0] - circles[j][0]), dy = big(circles[i][1] - circles[j][1]);
    const reach = big(circles[i][2] + circles[j][2]);
    if (dx * dx + dy * dy < reach * reach)
      return fail("OVERLAP", `圆 ${i + 1} 与圆 ${j + 1} 相交`, `circles ${i + 1} and ${j + 1} intersect`);
  }
  let sum = 0n;
  for (const [, , r] of circles) sum += big(r);
  return ok(sum, printFixedBig(sum));
}

export const problem: ProblemModule = { definition, verify: verifySumOfRadii };
