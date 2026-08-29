import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed, sq } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// The first container here that is not convex: a 2 × 2 square with its
// top-right quarter removed. That one missing corner changes the problem more
// than another shape of outline would. In a convex container the circles push
// outward against the wall; here they also have to get past a corner that
// points inward, and the best arrangements stop being anything you would guess
// from the convex case.
//
// It stays exact. A disc lies inside the L when it lies inside the bounding
// square and misses the removed quarter, and the distance from a point to an
// axis-aligned box is one clamp per axis — so both tests are a comparison of
// squared integers, with no square root and no polygon walk.
const SPAN = 2 * SCALE;     // the bounding square runs 0…2
const NOTCH = SCALE;        // the quarter (1,2] × (1,2] is missing
const MIN_N = 4;
const MAX_N = 18;

// Deliberately poor: one row along the bottom arm, which uses two thirds of the
// container and ignores the arm going up. Every sub-problem is beaten by
// splitting the circles between the two arms, which is the first thing anyone
// tries and still nowhere near the best.
function rowBaseline(n: number) {
  const radius = Math.floor(Math.min(SCALE / 2, SCALE / n));
  return {
    radius: printFixed(radius),
    centers: Array.from({ length: n }, (_, index) => [printFixed(radius * (2 * index + 1)), printFixed(radius)]),
  };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p08-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
  id: "p08", instanceId: "p08-n7-v2", code: "P08", slug: "circles-in-an-l", category: "packing",
  title: "等圆装入 L 形",
  summary: "在一个 L 形区域内放 n 个等圆，使共同半径尽可能大。",
  objective: "maximize", scoreLabel: "共同半径",
  instanceName: "n = 7", parameters: { n: 7 },
  baselineAnswer: rowBaseline(7),
  answerHelp: "提交 radius 与 centers。每个数写成十进制字符串，例如 \"0.25\"。所有圆共用同一个半径。",
  titleEn: "Equal circles in an L",
  summaryEn: "Place n equal circles inside an L-shaped region, making their common radius as large as possible.",
  scoreLabelEn: "common radius", instanceNameEn: "n = 7",
  answerHelpEn: "Submit radius and centers. Write every number as a decimal string such as \"0.25\". Every circle shares one radius.",
  definition: "在 L 形区域内放置 n 个半径相同、互不重叠的圆，使共同半径尽可能大。",
    definitionEn: "Place n non-overlapping circles of one common radius inside the L-shaped region, making that radius as large as possible.",
    strict: [
      { label: "容器", labelEn: "Container", text: "边长 2 的正方形挖去右上角的 1×1：左下角是原点 (0, 0)，x 与 y 同时超过 1 的区域是缺口", textEn: "A 2 × 2 square with its top-right 1 × 1 removed: the origin (0, 0) at the lower-left; the notch is where x and y both exceed 1" },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个圆：一个共同半径 radius 与 n 个圆心 centers", textEn: "Exactly n circles: one shared radius and n centres" },
      { label: "约束", labelEn: "Constraints", text: "每个圆完整落在 L 形内，不能压到缺口；两两内部不重叠，相切允许", textEn: "Every circle lies wholly inside the L and clear of the notch; no two overlap in their interiors, tangency allowed" },
      { label: "目标", labelEn: "Objective", text: "让共同半径尽可能大", textEn: "Make the common radius as large as possible" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "最优构形是「卡死」的接触结构：圆彼此顶住、顶住边界，常出现斜排、错位、以及不碰任何邻居的游离圆。规整的网格摆法几乎从不最优。",
        textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "本站变体：把装等圆放进 L 形是本站出的题，文献里查不到。每一个 n 都无人研究过，当前纪录就是人类已知的全部。",
        textEn: "Our own variant: equal-circle packing in an L was posed here, and there is no literature for it. Every n is unstudied; the standing record is all anybody knows." },
    ],
  extent: SPAN,
  frame: "容器是边长 2 的正方形挖掉右上角那块 1×1：左下角是原点 (0, 0)，缺口是 x 与 y 同时大于 1 的那一块。坐标和半径用同一个单位，直接写成小数，例如 \"0.25\"，最多九位小数。",
  frameEn: "The container is a square of side 2 with its top-right 1 × 1 quarter removed: the origin (0, 0) is its lower-left corner, and the missing piece is where x and y are both greater than 1. Coordinates and radii share one unit and are written as plain decimals such as \"0.25\", to at most nine decimal places.",
  requirements: ["恰好 n 个圆，半径完全相同", "每个圆整体落在 L 形内，不能压到缺口", "两两不重叠，相切是允许的"],
  requirementsEn: ["Exactly n circles, all the same radius", "Every circle lies wholly inside the L and clear of the notch", "No two overlap, though tangency is allowed"],
  instances,
};

function verifyCirclesInL(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 120) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const radius = parseFixed(answer.radius, "radius");
  if (radius <= 0) return fail("RADIUS", "半径必须为正数", "the radius must be a positive number");
  const raw = asArray(answer.centers, "centers");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆心`, `exactly ${n} centres are needed`);
  const centers = raw.map((point, index) => parseFixedPoint(point, `centers[${index}]`));

  const r = BigInt(radius);
  const rSquared = r * r;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i];
    if (x < radius || y < radius || x > SPAN - radius || y > SPAN - radius)
      return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 超出了外接正方形`, `circle ${i + 1} reaches outside the bounding square`);
    // Distance from the centre to the removed quarter, which is the box
    // [1, 2] × [1, 2]. Clamped per axis: a centre already past the notch on an
    // axis contributes nothing on that axis, and a centre past it on both is
    // inside the missing piece, where the distance is zero and nothing fits.
    const dx = x < NOTCH ? BigInt(NOTCH - x) : 0n;
    const dy = y < NOTCH ? BigInt(NOTCH - y) : 0n;
    if (dx * dx + dy * dy < rSquared) return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 压到了缺口`, `circle ${i + 1} crosses into the notch`);
  }

  const gap = 4n * rSquared;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]);
    if (squared < gap) return fail("OVERLAP", `圆 ${i + 1} 与 ${j + 1} 重叠`, `circles ${i + 1} and ${j + 1} overlap`);
  }
  return ok(r, printFixed(radius));
}

export const problem: ProblemModule = { definition, verify: verifyCirclesInL };
