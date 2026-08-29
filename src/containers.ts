import { SCALE } from "./problem-kit";

// The containers every geometric problem packs into, each with the two exact
// tests a packing needs: whether a point is inside, and whether a disc of a
// given radius is. Both answer in integers — squared comparisons, clamped
// distances to axis-aligned boxes, and one halved square root written as
// (a)² >= 2r² rather than a/√2 >= r — so no problem built on these ever routes
// a decision through a float.
//
// Writing them once is the point. Thirteen problems share these; a mistake in
// one container is a mistake found by any of their tests, rather than thirteen
// chances to get the same geometry subtly different.

export type Container = {
  id: string;
  /** Bounding box, in the same 10⁻⁹ units as every coordinate. */
  width: number;
  height: number;
  /** The board class the drawing uses. */
  board: string;
  /** Chinese and English names, for the problem statements built from these. */
  name: string;
  nameEn: string;
  /** One sentence saying where the origin is and how far the coordinates run. */
  frame: string;
  frameEn: string;
  /** Does a disc of this radius, centred here, lie entirely inside? */
  fitsDisc(x: number, y: number, radius: number): boolean;
  /** Is this point inside, boundary included? */
  holds(x: number, y: number): boolean;
  /** A disc that certainly fits. Baselines are built from it, and points spread
   *  around a circle are never three-collinear -- which is what the
   *  smallest-triangle problems need of a starting answer. */
  inscribed: { x: number; y: number; r: number };
};

const big = BigInt;

// Distance from a point to an axis-aligned box, squared, clamped per axis. A
// point inside the box gives zero, which is what a removed region needs: no
// disc centred in the hole can avoid it.
function boxDistanceSquared(x: number, y: number, left: number, bottom: number, right: number, top: number): bigint {
  const dx = x < left ? big(left - x) : x > right ? big(x - right) : 0n;
  const dy = y < bottom ? big(bottom - y) : y > top ? big(y - top) : 0n;
  return dx * dx + dy * dy;
}

const inBox = (x: number, y: number, width: number, height: number, margin: number) =>
  x >= margin && y >= margin && x <= width - margin && y <= height - margin;

// --- the containers ---------------------------------------------------------

export const square: Container = {
  id: "square", width: SCALE, height: SCALE, board: "square-board",
  name: "单位正方形", nameEn: "the unit square",
  frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。",
  frameEn: "The container is a square of side 1, with the origin (0, 0) at its lower-left corner and (1, 1) at its upper-right.",
  fitsDisc: (x, y, r) => inBox(x, y, SCALE, SCALE, r),
  holds: (x, y) => inBox(x, y, SCALE, SCALE, 0),
  inscribed: { x: SCALE / 2, y: SCALE / 2, r: SCALE / 2 },
};

export const rectangle: Container = {
  id: "rectangle", width: 2 * SCALE, height: SCALE, board: "square-board",
  name: "2 × 1 的长方形", nameEn: "a 2 × 1 rectangle",
  frame: "容器是 2 × 1 的长方形，左下角是原点 (0, 0)，右上角是 (2, 1)。",
  frameEn: "The container is a 2 × 1 rectangle, with the origin (0, 0) at its lower-left corner and (2, 1) at its upper-right.",
  fitsDisc: (x, y, r) => inBox(x, y, 2 * SCALE, SCALE, r),
  holds: (x, y) => inBox(x, y, 2 * SCALE, SCALE, 0),
  inscribed: { x: SCALE, y: SCALE / 2, r: SCALE / 2 },
};

export const disc: Container = {
  id: "disc", width: 2 * SCALE, height: 2 * SCALE, board: "circle-board",
  name: "半径 1 的圆", nameEn: "a circle of radius 1",
  frame: "容器是半径 1 的圆，圆心在 (1, 1)，所以坐标范围是 0 到 2。",
  frameEn: "The container is a circle of radius 1 centred at (1, 1), so coordinates run from 0 to 2.",
  fitsDisc: (x, y, r) => {
    if (r > SCALE) return false;
    const room = big(SCALE - r);
    const dx = big(x - SCALE), dy = big(y - SCALE);
    return dx * dx + dy * dy <= room * room;
  },
  holds: (x, y) => {
    const dx = big(x - SCALE), dy = big(y - SCALE);
    return dx * dx + dy * dy <= big(SCALE) * big(SCALE);
  },
  inscribed: { x: SCALE, y: SCALE, r: SCALE },
};

// The equilateral triangle of side 1: base from (0,0) to (1,0), apex at
// (1/2, √3/2). The apex height is irrational, so the bounding box tops out at
// its ceiling and the slanted edges are decided in integers: below the left
// edge, y ≤ √3·x, is y² ≤ 3x² for non-negative sides, and the right edge
// mirrors it. Clearance from a disc to those edges squares the same way:
// √3·x − y ≥ 2r becomes 3x² ≥ (y + 2r)², with the sign checked first.
export const equilateral: Container = {
  id: "equilateral", width: SCALE, height: 866_025_404, board: "equilateral-board",
  name: "边长 1 的等边三角形", nameEn: "an equilateral triangle of side 1",
  frame: "容器是边长 1 的等边三角形：底边从 (0, 0) 到 (1, 0)，顶点在 (1/2, √3/2)。",
  frameEn: "The container is an equilateral triangle of side 1: its base runs from (0, 0) to (1, 0) and its apex is at (1/2, √3/2).",
  fitsDisc: (x, y, r) => {
    if (r < 0 || y < r || x < 0 || x > SCALE) return false;
    const lift = big(y + 2 * r);
    if (3n * big(x) * big(x) < lift * lift) return false;
    const mirror = big(SCALE - x);
    return 3n * mirror * mirror >= lift * lift;
  },
  holds: (x, y) => {
    if (y < 0 || x < 0 || x > SCALE) return false;
    const yy = big(y) * big(y);
    return yy <= 3n * big(x) * big(x) && yy <= 3n * big(SCALE - x) * big(SCALE - x);
  },
  inscribed: { x: SCALE / 2, y: 288_675_134, r: 288_675_134 },
};

// The right triangle with legs 1 along the axes: vertices (0,0), (1,0), (0,1).
// A disc clears the hypotenuse x + y = 1 when (1 − x − y)/√2 >= r, which is
// (1 − x − y)² >= 2r² with the left side non-negative — no square root taken.
export const triangle: Container = {
  id: "triangle", width: SCALE, height: SCALE, board: "triangle-board",
  name: "直角边为 1 的等腰直角三角形", nameEn: "a right isosceles triangle with legs 1",
  frame: "容器是直角边为 1 的等腰直角三角形，直角顶点在原点 (0, 0)，另两个顶点是 (1, 0) 与 (0, 1)。",
  frameEn: "The container is a right isosceles triangle with legs of length 1: the right angle sits at the origin (0, 0) and the other vertices are (1, 0) and (0, 1).",
  fitsDisc: (x, y, r) => {
    if (x < r || y < r) return false;
    const slack = big(SCALE - x - y);
    if (slack < 0n) return false;
    return slack * slack >= 2n * big(r) * big(r);
  },
  holds: (x, y) => x >= 0 && y >= 0 && x + y <= SCALE,
  // The incircle of this triangle has radius 1 - sqrt(2)/2; 0.29 is inside it.
  inscribed: { x: 290_000_000, y: 290_000_000, r: 290_000_000 },
};

// A 2 × 2 square with the top-right quarter removed.
export const ell: Container = {
  id: "ell", width: 2 * SCALE, height: 2 * SCALE, board: "l-board",
  name: "L 形（2 × 2 挖去右上角的 1 × 1）", nameEn: "an L (a 2 × 2 square with its top-right 1 × 1 removed)",
  frame: "容器是边长 2 的正方形挖掉右上角那块 1 × 1：左下角是原点 (0, 0)，缺口是 x 与 y 同时大于 1 的那一块。",
  frameEn: "The container is a square of side 2 with its top-right 1 × 1 quarter removed: the origin (0, 0) is its lower-left corner and the missing piece is where x and y are both greater than 1.",
  fitsDisc: (x, y, r) => inBox(x, y, 2 * SCALE, 2 * SCALE, r)
    && boxDistanceSquared(x, y, SCALE, SCALE, 2 * SCALE, 2 * SCALE) >= big(r) * big(r),
  holds: (x, y) => inBox(x, y, 2 * SCALE, 2 * SCALE, 0) && !(x > SCALE && y > SCALE),
  inscribed: { x: SCALE / 2, y: SCALE / 2, r: SCALE / 2 },
};

// A plus sign: 3 × 3 with all four corner squares removed.
const CROSS = 3 * SCALE;
const cornerBoxes: [number, number, number, number][] = [
  [0, 0, SCALE, SCALE],
  [2 * SCALE, 0, CROSS, SCALE],
  [0, 2 * SCALE, SCALE, CROSS],
  [2 * SCALE, 2 * SCALE, CROSS, CROSS],
];
export const cross: Container = {
  id: "cross", width: CROSS, height: CROSS, board: "cross-board",
  name: "十字形（3 × 3 挖去四个角上的 1 × 1）", nameEn: "a plus sign (a 3 × 3 square with all four corner squares removed)",
  frame: "容器是边长 3 的正方形挖掉四个角上的 1 × 1，形成一个十字：左下角是原点 (0, 0)，右上角是 (3, 3)。",
  frameEn: "The container is a square of side 3 with all four of its 1 × 1 corners removed, leaving a plus sign: the origin (0, 0) is its lower-left corner and (3, 3) its upper-right.",
  fitsDisc: (x, y, r) => inBox(x, y, CROSS, CROSS, r)
    && cornerBoxes.every(([l, b, rt, t]) => boxDistanceSquared(x, y, l, b, rt, t) >= big(r) * big(r)),
  // The plus is the union of its two bars, and a point is in it when it is in
  // either one. Written this way rather than as "in the 3 × 3 box and in none
  // of the corner squares", which is what it used to say: excluding a bounded
  // box with strict inequalities keeps the corner square's whole boundary —
  // and that boundary includes the square's OUTER edges, which are not part of
  // the plus at all. So (0, 0.5) and all four outer corners were accepted,
  // three quarters of a unit outside the shape, and a submitter found it by
  // dragging a point there and watching the board stay green.
  holds: (x, y) => inBox(x, y, CROSS, CROSS, 0)
    && ((x >= SCALE && x <= 2 * SCALE) || (y >= SCALE && y <= 2 * SCALE)),
  inscribed: { x: (3 * SCALE) / 2, y: (3 * SCALE) / 2, r: SCALE / 2 },
};

// The upper half of a disc of radius 1, sitting on its diameter.
export const semicircle: Container = {
  id: "semicircle", width: 2 * SCALE, height: SCALE, board: "semi-board",
  name: "半径 1 的半圆", nameEn: "a half-disc of radius 1",
  frame: "容器是半径 1 的半圆：直径落在 y = 0 上，从 (0, 0) 到 (2, 0)，圆心在 (1, 0)，弧在上方。",
  frameEn: "The container is a half-disc of radius 1: its diameter lies along y = 0 from (0, 0) to (2, 0), centred at (1, 0), with the arc above.",
  fitsDisc: (x, y, r) => {
    if (y < r || r > SCALE) return false;
    const room = big(SCALE - r);
    const dx = big(x - SCALE), dy = big(y);
    return dx * dx + dy * dy <= room * room;
  },
  holds: (x, y) => {
    if (y < 0) return false;
    const dx = big(x - SCALE), dy = big(y);
    return dx * dx + dy * dy <= big(SCALE) * big(SCALE);
  },
  inscribed: { x: SCALE, y: SCALE / 2, r: SCALE / 2 },
};


// A ring: radius 1 with the middle half removed. P27 spreads points in it and
// P28 hunts the smallest triangle there. It was also packed with equal circles,
// which turned out to have no question in it — a circle can never be wider than
// the ring, so up to n = 9 every answer was half the ring's width, and past
// that a single evenly-spaced ring beats anything a search finds until n is
// about sixteen, which was outside the range that shipped. It
// forces everything onto a band, which is a different problem from a disc
// rather than a smaller one.
const INNER = SCALE / 2;
export const annulus: Container = {
  id: "annulus", width: 2 * SCALE, height: 2 * SCALE, board: "annulus-board",
  name: "外半径 1、内半径 0.5 的圆环", nameEn: "an annulus with outer radius 1 and inner radius 0.5",
  frame: "容器是外半径 1、内半径 0.5 的圆环，圆心在 (1, 1)，所以坐标范围是 0 到 2，中间那块半径 0.5 的圆是空的。",
  frameEn: "The container is an annulus of outer radius 1 and inner radius 0.5 centred at (1, 1), so coordinates run from 0 to 2 and the disc of radius 0.5 in the middle is not part of it.",
  fitsDisc: (x, y, r) => {
    if (r > INNER) return false;
    const dx = big(x - SCALE), dy = big(y - SCALE);
    const distance = dx * dx + dy * dy;
    const outer = big(SCALE - r), inner = big(INNER + r);
    return distance <= outer * outer && distance >= inner * inner;
  },
  holds: (x, y) => {
    const dx = big(x - SCALE), dy = big(y - SCALE);
    const distance = dx * dx + dy * dy;
    return distance <= big(SCALE) * big(SCALE) && distance >= big(INNER) * big(INNER);
  },
// Sits on the mid-line of the band, where the ring is widest.
  inscribed: { x: SCALE + (3 * SCALE) / 4, y: SCALE, r: SCALE / 4 },
};

// The quarter-disc: radius 1 quadrant sitting in [0, 1] x [0, 1].
export const quadrant: Container = {
  id: "quadrant", width: SCALE, height: SCALE, board: "quadrant-board",
  name: "半径 1 的扇形（四分之一圆）", nameEn: "a quadrant (quarter-disc) of radius 1",
  frame: "容器是半径 1 的扇形（四分之一圆）：圆心在原点 (0, 0)，直角边沿 x 轴和 y 轴延伸到 1，弧在第一象限。",
  frameEn: "The container is a quarter-disc of radius 1: centred at the origin (0, 0), with its straight edges along the axes from 0 to 1 and the arc in the first quadrant.",
  fitsDisc: (x, y, r) => {
    if (x < r || y < r || r > SCALE) return false;
    const room = big(SCALE - r);
    const dx = big(x), dy = big(y);
    return dx * dx + dy * dy <= room * room;
  },
  holds: (x, y) => {
    if (x < 0 || y < 0) return false;
    const dx = big(x), dy = big(y);
    return dx * dx + dy * dy <= big(SCALE) * big(SCALE);
  },
  // Incircle of a quadrant with radius 1: r0 = sqrt(2) - 1 ≈ 0.4142.
  inscribed: { x: 400_000_000, y: 400_000_000, r: 400_000_000 },
};

export const containers = { square, rectangle, disc, triangle, equilateral, ell, cross, semicircle, annulus, quadrant };
