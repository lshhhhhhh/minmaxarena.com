import { SCALE, ok, fail, isObject, asInt, asArray, parseFixed, printFixed, printSquared } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// The same square as P18 — a centre plus one half-edge vector, the other being
// that vector turned a quarter turn — but the container is round. Turning an
// integer vector by 90° keeps it integral, so the four corners c ± u ± v are
// exact, and a corner is inside the disc exactly when its squared distance to
// the centre is at most the squared radius. Nothing here needs a square root.
//
// The side itself is irrational for every arrangement worth submitting, so the
// score is its square — the same convention P18 uses, and the reason neither
// can ever be finished: no certificate ever sits exactly on the ceiling.
const MIN_N = 3;
const MAX_N = 14;
const COORD_LIMIT = 4 * SCALE;
const RADIUS = SCALE;              // the container has radius 1…
const CENTRE = SCALE;              // …centred at (1, 1), so coordinates run 0…2

type Vec = readonly [bigint, bigint];
type Tile = { c: Vec; u: Vec; v: Vec };

const dot = (a: Vec, b: Vec): bigint => a[0] * b[0] + a[1] * b[1];
const absBig = (value: bigint): bigint => (value < 0n ? -value : value);

// Two convex polygons miss each other exactly when some edge normal separates
// them. A square offers only two distinct normals, so four axes are the whole
// test.
function separated(a: Tile, b: Tile): boolean {
  const d: Vec = [b.c[0] - a.c[0], b.c[1] - a.c[1]];
  for (const axis of [a.u, a.v, b.u, b.v]) {
    const reach = absBig(dot(axis, a.u)) + absBig(dot(axis, a.v)) + absBig(dot(axis, b.u)) + absBig(dot(axis, b.v));
    if (absBig(dot(axis, d)) >= reach) return true;
  }
  return false;
}

// Deliberately poor: one row of axis-aligned squares across the horizontal
// diameter. A row wastes the whole width of the disc above and below it, and
// any arrangement that uses two rows — or tilts anything — does better.
function rowBaseline(n: number) {
  // A row of n squares of side s spans n·s across and s tall, so its corners
  // sit at (n·s/2)² + (s/2)² from the centre, which must be within the radius.
  const side = Math.floor((2 * RADIUS) / Math.sqrt(n * n + 1)) - 4;
  const half = Math.floor(side / 2);
  const left = CENTRE - half * n;
  return {
    squares: Array.from({ length: n }, (_, index) => ({
      cx: printFixed(left + half * (2 * index + 1)),
      cy: printFixed(CENTRE),
      ux: printFixed(half),
      uy: printFixed(0),
    })),
  };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p05-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
  id: "p05", instanceId: "p05-n6-v2", code: "P05", slug: "tilted-squares-in-circle", category: "packing",
  title: "可倾斜等正方形装入圆",
  summary: "在半径 1 的圆内放 n 个正方形，大小完全一样，每个都可以任意转角度；让这个共同的边长尽可能大。",
  objective: "maximize", scoreLabel: "最小边长的平方", goalLabel: "最小边长", scoreIs: "square", goalLabelEn: "the smallest side",
  instanceName: "n = 6", parameters: { n: 6 },
  baselineAnswer: rowBaseline(6),
  answerHelp: "每个正方形提交 {cx,cy,ux,uy}：中心加一条半边向量，另一条半边向量固定取 (-uy,ux)。每个数写成十进制字符串，例如 \"0.4\"；角度完全自由，计分取最小正方形的边长，所以把它们写得一样大最划算。边长本身几乎总是无理数，写不成有限小数，所以你写的是那条半边向量，边长由它精确定出。",
  titleEn: "Tilted equal squares in a circle",
  summaryEn: "Place n equal squares inside a circle of radius 1, each free to tilt, and maximize their common side.",
  scoreLabelEn: "smallest side squared", instanceNameEn: "n = 6",
  answerHelpEn: "Submit {cx,cy,ux,uy} per square: a centre plus one half-edge vector, the other half-edge being (-uy,ux). Write every number as a decimal string such as \"0.4\", every angle is free, and the smallest square is the one scored, so writing them equal is the winning move. The side is almost always irrational, so what you write is the half-edge vector and the side follows from it exactly.",
  definition: "在半径 1 的圆内放 n 个可任意旋转的正方形，边长完全相同、互不重叠，使共同边长尽可能大。",
    definitionEn: "Place n freely rotatable squares of one common side inside a circle of radius 1, none overlapping, making that side as large as possible.",
    strict: [
      { label: "容器", labelEn: "Container", text: "半径 1 的圆，圆心在 (1, 1)，两个坐标都在 0 到 2 之间", textEn: "A circle of radius 1 centred at (1, 1), so both coordinates run from 0 to 2" },
      { label: "提交", labelEn: "Submission", text: "每个正方形写 {cx, cy, ux, uy}：中心加一条半边向量，另一条固定取 (−uy, ux)", textEn: "Each square is {cx, cy, ux, uy}: a centre plus one half-edge vector, the other fixed as (−uy, ux)" },
      { label: "约束", labelEn: "Constraints", text: "每个正方形的角度完全自由；全部落在容器内；两两内部不重叠，贴边接触允许。计分只看最小的那个正方形，所以边长不一致占不到便宜", textEn: "Every square tilts freely; all lie inside the container; no two overlap in their interiors, touching allowed. Only the smallest square is scored, so unequal sides gain nothing" },
      { label: "目标", labelEn: "Objective", text: "让共同边长尽可能大。内部以其平方精确比较", textEn: "Make the common side as large as possible; compared internally by its square, exactly" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "圆形容器没有角：正方形的直边贴不住弧形边界，最优解几乎总是倾斜的，正方形彼此以角相抵。",
        textEn: "A circular container has no corners: straight sides cannot hug the arc, so optima are almost always tilted, squares bracing corner against corner." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "n = 4 已证明；其余已知最好值取自 Friedman 的 squares-in-circles 汇总（1997 年起多人贡献），全部未证明。",
        textEn: "n = 4 is proven; the other best known values come from Friedman's squares-in-circles survey (many contributors since 1997), none of them proven." , url: "https://erich-friedman.github.io/packing/squincir/" },
    ],
  extent: 2 * SCALE,
  frame: "容器是半径 1 的圆，圆心在 (1, 1)，所以坐标范围是 0 到 2。坐标和向量用同一个单位，直接写成小数，例如 \"0.4\"，最多九位小数。",
  frameEn: "The container is a circle of radius 1 centred at (1, 1), so coordinates run from 0 to 2. Coordinates and vectors share one unit and are written as plain decimals such as \"0.4\", to at most nine decimal places.",
  requirements: ["恰好 n 个正方形，角度自由，计分取最小的边长", "每个正方形整体落在圆内", "两两内部不重叠，贴边接触是允许的"],
  requirementsEn: ["Exactly n squares, any angles; the smallest side is the score", "Every square lies entirely inside the circle", "No two overlap, though touching is allowed"],
  instances,
};

function verifyTiltedSquaresInCircle(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 64) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
  const squares = asArray(answer.squares, "squares");
  if (squares.length !== n) return fail("COUNT", `需要恰好 ${n} 个正方形`, `exactly ${n} squares are needed`);

  const centre: Vec = [BigInt(CENTRE), BigInt(CENTRE)];
  const radiusSquared = BigInt(RADIUS) * BigInt(RADIUS);
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
    for (const value of [cx, cy, ux, uy])
      if (value < -COORD_LIMIT || value > COORD_LIMIT) return fail("OUT_OF_BOUNDS", `squares[${i}] 的坐标超出了允许范围`, `the coordinates of squares[${i}] are outside the permitted range`);

    const u: Vec = [BigInt(ux), BigInt(uy)];
    const v: Vec = [-u[1], u[0]];
    const quarter = u[0] * u[0] + u[1] * u[1];
    if (quarter <= 0n) return fail("DEGENERATE", `squares[${i}] 的边长为零`, `squares[${i}] has a side of zero`);
    if (smallest === null || quarter < smallest) smallest = quarter;

    const c: Vec = [BigInt(cx), BigInt(cy)];
    for (const su of [1n, -1n]) for (const sv of [1n, -1n]) {
      const x = c[0] + su * u[0] + sv * v[0] - centre[0];
      const y = c[1] + su * u[1] + sv * v[1] - centre[1];
      if (x * x + y * y > radiusSquared) return fail("OUT_OF_BOUNDS", `squares[${i}] 有角点落在圆外`, `squares[${i}] has a corner outside the circle`);
    }
    tiles.push({ c, u, v });
  }
  if (smallest === null) return fail("COUNT", "答案里没有任何正方形", "the answer contains no squares at all");

  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (!separated(tiles[i], tiles[j])) return fail("OVERLAP", `正方形 ${i + 1} 与 ${j + 1} 的内部重叠`, `the interiors of squares ${i + 1} and ${j + 1} overlap`);

  const sideSquared = 4n * smallest;
  return ok(sideSquared, printSquared(sideSquared));
}

export const problem: ProblemModule = { definition, verify: verifyTiltedSquaresInCircle };
