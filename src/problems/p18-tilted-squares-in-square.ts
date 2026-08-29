import { SCALE, ok, fail, isObject, asInt, asArray, parseFixed, printFixed, printSquared } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// 一个可倾斜的正方形写成「中心 c 加一条半边向量 u」，另一条半边向量取 v = (-u.y, u.x)。
// 整数向量转 90° 依然是整数向量，所以四个角 c ± u ± v 全是精确的定点整数，
// 边长的平方 4(u.x² + u.y²) 也是精确整数——边长本身无理，因此分数记边长平方。
const MIN_N = 3;
const MAX_N = 30;
const COORD_LIMIT = 4 * SCALE;

type Vec = readonly [bigint, bigint];
type Tile = { c: Vec; u: Vec; v: Vec };

const dot = (a: Vec, b: Vec): bigint => a[0] * b[0] + a[1] * b[1];
const absBig = (value: bigint): bigint => (value < 0n ? -value : value);

// 分离轴：两个凸多边形内部不相交，当且仅当存在一条与某条边垂直的分离轴。
// 正方形的边法向只有 u 与 v 两个方向，因此四条候选轴就穷尽了全部可能。
function separated(a: Tile, b: Tile): boolean {
  const d: Vec = [b.c[0] - a.c[0], b.c[1] - a.c[1]];
  for (const axis of [a.u, a.v, b.u, b.v]) {
    const reach = absBig(dot(axis, a.u)) + absBig(dot(axis, a.v)) + absBig(dot(axis, b.u)) + absBig(dot(axis, b.v));
    if (absBig(dot(axis, d)) >= reach) return true;
  }
  return false;
}

// 一字排开：n 个轴对齐的正方形贴着底边排成一行，边长 ⌊1/n⌋。
// 连最朴素的方阵都比它好，倾斜构造更是远胜于它。
function rowBaseline(n: number) {
  const half = Math.floor(SCALE / (2 * n));
  return { squares: Array.from({ length: n }, (_, index) => ({ cx: printFixed(half * (2 * index + 1)), cy: printFixed(half), ux: printFixed(half), uy: printFixed(0) })) };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p18-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
    id: "p18", instanceId: "p18-n5-v1", code: "P18", slug: "tilted-squares-in-square", category: "packing",
    title: "可倾斜等正方形装入单位正方形", summary: "在单位正方形内放 n 个小正方形，大小完全一样，每个都可以任意转角度；让这个共同的边长尽可能大。", objective: "maximize", scoreLabel: "最小边长的平方", goalLabel: "最小边长", scoreIs: "square", goalLabelEn: "the smallest side",
    instanceName: "n = 5", parameters: { n: 5 },
    baselineAnswer: rowBaseline(5),
    answerHelp: "每个正方形提交 {cx,cy,ux,uy}：中心加一条半边向量，另一条半边向量固定取 (-uy,ux)。每个数写成十进制字符串，例如 \"0.1\"；角度完全自由，计分取最小正方形的边长，所以把它们写得一样大最划算。边长本身几乎总是无理数，写不成有限小数，所以你写的是那条半边向量，边长由它精确定出。",
    titleEn: "Tilted equal squares in the unit square", summaryEn: "Place n equal squares inside the unit square, each free to tilt, and maximize their common side.", scoreLabelEn: "smallest side squared", instanceNameEn: "n = 5", answerHelpEn: "Submit {cx,cy,ux,uy} per square: a centre plus one half-edge vector, the other half-edge being (-uy,ux). Write every number as a decimal string such as \"0.1\", every angle is free, and the smallest square is the one scored, so writing them equal is the winning move. The side is almost always irrational, so what you write is the half-edge vector and the side follows from it exactly.",
    definition: "在单位正方形内放 n 个大小完全相同的小正方形，每个都可以任意转角度，互不重叠；让共同边长尽可能大。",
      definitionEn: "Place n equal squares in the unit square, each free to tilt, none overlapping, and make their common side as large as possible.",
      strict: [
        { label: "容器", labelEn: "Container", text: "单位正方形：左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
        { label: "提交", labelEn: "Submission", text: "每个正方形写 {cx, cy, ux, uy}：中心加一条半边向量，另一条固定取 (−uy, ux)", textEn: "Each square is {cx, cy, ux, uy}: a centre plus one half-edge vector, the other fixed as (−uy, ux)" },
        { label: "约束", labelEn: "Constraints", text: "每个正方形的角度完全自由；全部落在容器内；两两内部不重叠，贴边接触允许。计分只看最小的那个正方形，所以边长不一致占不到便宜", textEn: "Every square tilts freely; all lie inside the container; no two overlap in their interiors, touching allowed. Only the smallest square is scored, so unequal sides gain nothing" },
        { label: "目标", labelEn: "Objective", text: "让共同边长尽可能大。内部以其平方精确比较", textEn: "Make the common side as large as possible; compared internally by its square, exactly" },
      ],
      intuition: [
        { title: "为什么允许倾斜", titleEn: "Why tilting is the point",
          text: "正着摆是网格；斜着摆能在网格漏下的缝里再挤出空间。n = 5 的已知最好解就有一个 45° 的正方形卡在四个正放的中间。倾斜是这道题和普通装箱的全部区别。",
          textEn: "Straight is a grid; tilting squeezes space out of the seams a grid leaves — the best known n = 5 has one square at 45° wedged between four straight ones. Tilting is the entire difference between this and plain packing." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "s(n) 记号下的经典问题：n = 3, 4, 6..9, 14..16, 25 已证明（Göbel、Kearney–Shiu 等），其余开放；Friedman 的 squares 综述持续更新这一族。",
          textEn: "The classic s(n) problem: proven for n = 3, 4, 6..9, 14..16 and 25 (Göbel, Kearney–Shiu and others), the rest open; Friedman's squares survey keeps the running record." , url: "https://erich-friedman.github.io/papers/squares/squares.html" },
      ],
    extent: SCALE,
    frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。坐标和向量用同一个单位，直接写成小数，例如 \"0.1\"，最多九位小数。",
    frameEn: "The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and vectors share one unit and are written as plain decimals such as \"0.1\", to at most nine decimal places.",
    instances,
};

function verifyTiltedSquares(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  const size = SCALE;
  if (n < 1 || n > 64 || size <= 0) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const squares = asArray(answer.squares, "squares");
  if (squares.length !== n) return fail("COUNT", `需要恰好 ${n} 个正方形`, `exactly ${n} squares are needed`);

  const tiles: Tile[] = [];
  // The smallest square is the score. The verifier used to demand every
  // ux²+uy² be one exact integer, which on the grid quietly changed the
  // problem: two squares can differ in angle at an exactly shared norm only
  // when that integer has a second representation as a sum of two squares,
  // so free per-square rotation was priced out of the certificate format.
  // Scoring the minimum instead is the honest discretisation of Friedman's
  // problem -- making squares unequal never helps, since shrinking them all
  // to the smallest changes nothing the score can see, so the optimum is the
  // same and every mixture of angles becomes writable.
  let smallest: bigint | null = null;
  for (let i = 0; i < n; i += 1) {
    const raw = squares[i];
    if (!isObject(raw)) return fail("BAD_SQUARE", `squares[${i}] 必须是对象`, `squares[${i}] must be an object`);
    const cx = parseFixed(raw.cx, `squares[${i}].cx`);
    const cy = parseFixed(raw.cy, `squares[${i}].cy`);
    const ux = parseFixed(raw.ux, `squares[${i}].ux`);
    const uy = parseFixed(raw.uy, `squares[${i}].uy`);
    for (const value of [cx, cy, ux, uy]) if (value < -COORD_LIMIT || value > COORD_LIMIT) return fail("OUT_OF_BOUNDS", `squares[${i}] 的坐标超出了允许范围`, `the coordinates of squares[${i}] are outside the permitted range`);

    const u: Vec = [BigInt(ux), BigInt(uy)];
    const v: Vec = [-u[1], u[0]];
    const quarter = u[0] * u[0] + u[1] * u[1];
    if (quarter <= 0n) return fail("DEGENERATE", `squares[${i}] 的边长为零`, `squares[${i}] has a side of zero`);
    if (smallest === null || quarter < smallest) smallest = quarter;

    // 四个角 c ± u ± v 都必须落在容器内，端点贴边是允许的。
    const c: Vec = [BigInt(cx), BigInt(cy)];
    const limit = BigInt(size);
    for (const su of [1n, -1n]) for (const sv of [1n, -1n]) {
      const x = c[0] + su * u[0] + sv * v[0];
      const y = c[1] + su * u[1] + sv * v[1];
      if (x < 0n || y < 0n || x > limit || y > limit) return fail("OUT_OF_BOUNDS", `squares[${i}] 有角点落在单位正方形之外`, `squares[${i}] has a corner outside the unit square`);
    }
    tiles.push({ c, u, v });
  }
  if (smallest === null) return fail("COUNT", "答案里没有任何正方形", "the answer contains no squares at all");

  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (!separated(tiles[i], tiles[j])) return fail("OVERLAP", `正方形 ${i + 1} 与 ${j + 1} 的内部重叠`, `the interiors of squares ${i + 1} and ${j + 1} overlap`);

  const sideSquared = 4n * smallest;
  return ok(sideSquared, printSquared(sideSquared));
}

export const problem: ProblemModule = { definition, verify: verifyTiltedSquares };
