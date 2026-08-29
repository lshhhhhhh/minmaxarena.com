import { containers } from "../containers";
import { equalCircles, spreadPoints, heilbronn, rieszEnergy, gridCircles, gridPoints, ringPoints, huddledPoints } from "../packing-kit";
import type { ProblemModule } from "../problem-kit";

// The catalogue as a grid: a handful of things to place, a handful of shapes to
// place them in, and one entry per cell that can be judged exactly. Every
// verifier here is written once in packing-kit and every container once in
// containers, so a cell is a parameter table rather than a file — which is the
// only reason there can be thirteen of them without thirteen chances to get the
// same geometry subtly wrong.
//
// The cells already filled by hand elsewhere are skipped: circles in a square,
// a disc, a triangle, a rectangle, an annulus and an L; points in a square and
// a disc; smallest-triangle in a square and a triangle.

const { rectangle, disc, triangle, ell, cross, semicircle, annulus, quadrant, equilateral } = containers;

// --- equal circles, in the three containers that had none ---------------------

export const p09: ProblemModule = equalCircles(
  { code: "P09", id: "p09", slug: "circles-in-a-semicircle", container: semicircle,
    instanceIds: (n) => `p09-n${n}-v2`, range: [3, 16], primary: 6, baseline: gridCircles },
  { title: "等圆装入半圆", titleEn: "Equal circles in a half-disc",
    summary: "在半径 1 的半圆内放 n 个等圆，使共同半径尽可能大。",
    summaryEn: "Place n equal circles in a half-disc of radius 1, making their common radius as large as possible.",
    frontier: { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "半圆装圆的已知最好值全部取自 Specht 的 csc 汇总表，该表没有把任何一项标为已证明；十四个 n 全部开放。",
      textEn: "Every best known value comes from Specht's csc survey table, which marks none of them proven; all fourteen n are open.",
      url: "https://web.archive.org/web/20260213011826/http://hydra.nat.uni-magdeburg.de/packing/csc/csc.html" } });

export const p10: ProblemModule = equalCircles(
  { code: "P10", id: "p10", slug: "circles-in-a-cross", container: cross,
    instanceIds: (n) => `p10-n${n}-v2`, range: [3, 18], primary: 8, baseline: gridCircles },
  { title: "等圆装入十字形", titleEn: "Equal circles in a plus sign",
    summary: "在一个十字形区域内放 n 个等圆，使共同半径尽可能大。",
    summaryEn: "Place n equal circles inside a plus-shaped region, making their common radius as large as possible." });

export const p30: ProblemModule = equalCircles(
  { code: "P30", id: "p30", slug: "circles-in-a-quadrant", container: quadrant,
    instanceIds: (n) => `p30-n${n}-v2`, range: [3, 16], primary: 6, baseline: gridCircles },
  { title: "等圆装入扇形", titleEn: "Equal circles in a quadrant",
    summary: "在半径 1 的扇形（四分之一圆）内放 n 个等圆，使共同半径尽可能大。",
    summaryEn: "Place n equal circles in a quarter-disc of radius 1, making their common radius as large as possible.",
    frontier: { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "扇形装圆的已知最好值取自 Specht 的 ccq 汇总表，无一已证明；十四个 n 全部开放。",
      textEn: "The best known values come from Specht's ccq survey table, none proven; all fourteen n are open.",
      url: "https://web.archive.org/web/20260213011826/http://hydra.nat.uni-magdeburg.de/packing/ccq/ccq.html" } });

// --- spreading points, in the six containers that had none -----------------

export const p16: ProblemModule = spreadPoints(
  { code: "P16", id: "p16", slug: "spread-points-in-triangle", container: triangle,
    instanceIds: (n) => `p16-n${n}-v2`, range: [4, 18], primary: 8, baseline: gridPoints },
  { title: "直角三角形内的散点分离", titleEn: "Spreading points in a right triangle",
    summary: "在直角边为 1 的等腰直角三角形内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in a right isosceles triangle with legs 1, maximizing the smallest distance between any two." });

export const p17: ProblemModule = spreadPoints(
  { code: "P17", id: "p17", slug: "spread-points-in-rectangle", container: rectangle,
    instanceIds: (n) => `p17-n${n}-v2`, range: [4, 20], primary: 9, baseline: gridPoints },
  { title: "长方形内的散点分离", titleEn: "Spreading points in a rectangle",
    summary: "在 2 × 1 的长方形内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in a 2 × 1 rectangle, maximizing the smallest distance between any two." });

export const p19: ProblemModule = spreadPoints(
  { code: "P19", id: "p19", slug: "spread-points-in-an-l", container: ell,
    instanceIds: (n) => `p19-n${n}-v2`, range: [4, 20], primary: 9, baseline: gridPoints },
  { title: "L 形内的散点分离", titleEn: "Spreading points in an L",
    summary: "在 L 形区域内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in an L-shaped region, maximizing the smallest distance between any two." });

export const p20: ProblemModule = spreadPoints(
  { code: "P20", id: "p20", slug: "spread-points-in-a-semicircle", container: semicircle,
    instanceIds: (n) => `p20-n${n}-v2`, range: [4, 18], primary: 8, baseline: gridPoints },
  { title: "半圆内的散点分离", titleEn: "Spreading points in a half-disc",
    summary: "在半径 1 的半圆内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in a half-disc of radius 1, maximizing the smallest distance between any two." });

export const p21: ProblemModule = spreadPoints(
  { code: "P21", id: "p21", slug: "spread-points-in-a-cross", container: cross,
    instanceIds: (n) => `p21-n${n}-v2`, range: [4, 20], primary: 9, baseline: gridPoints },
  { title: "十字形内的散点分离", titleEn: "Spreading points in a plus sign",
    summary: "在一个十字形区域内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in a plus-shaped region, maximizing the smallest distance between any two." });

// A ring is not a smaller disc: it has no middle, so every point is pushed onto
// a band and the answers are arrangements around a circumference rather than
// across an area.
export const p27: ProblemModule = spreadPoints(
  { code: "P27", id: "p27", slug: "spread-points-in-an-annulus", container: annulus,
    instanceIds: (n) => `p27-n${n}-v2`, range: [4, 20], primary: 9, baseline: gridPoints },
  { title: "圆环内的散点分离", titleEn: "Spreading points in an annulus",
    summary: "在外半径 1、内半径 0.5 的圆环内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in an annulus of outer radius 1 and inner radius 0.5, maximizing the smallest distance between any two." });

export const p31: ProblemModule = spreadPoints(
  { code: "P31", id: "p31", slug: "spread-points-in-a-quadrant", container: quadrant,
    instanceIds: (n) => `p31-n${n}-v2`, range: [4, 18], primary: 8, baseline: gridPoints },
  { title: "扇形内的散点分离", titleEn: "Spreading points in a quadrant",
    summary: "在半径 1 的扇形（四分之一圆）内放 n 个点，使最小两点距离尽可能大。",
    summaryEn: "Place n points in a quarter-disc of radius 1, maximizing the smallest distance between any two." });

// --- the smallest triangle, in the seven containers that had none ------------

export const p22: ProblemModule = heilbronn(
  { code: "P22", id: "p22", slug: "heilbronn-in-a-circle", container: disc,
    instanceIds: (n) => `p22-n${n}-v2`, range: [5, 14], primary: 7, baseline: ringPoints },
  { title: "圆盘内的最小三角形", titleEn: "The smallest triangle in a disc",
    summary: "在半径 1 的圆内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in a disc of radius 1 so the smallest triangle any three of them make is as large as possible.",
    frontier: { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "圆盘版 Heilbronn：MathWorld 汇总了这一族的已知值，部分带封闭形式，但全部未证明；正方形版的证明技术还没有人搬过来。",
      textEn: "Heilbronn in a disc: MathWorld collects the known values, some in closed form, none proven; the proof techniques from the square version have not been carried over.",
      url: "https://mathworld.wolfram.com/HeilbronnTriangleProblem.html" } });

export const p58: ProblemModule = heilbronn(
  { code: "P58", id: "p58", slug: "heilbronn-in-equilateral", container: equilateral,
    instanceIds: (n) => `p58-n${n}-v1`, range: [5, 14], primary: 11, baseline: ringPoints },
  { title: "等边三角形内的最小三角形", titleEn: "The smallest triangle in an equilateral triangle",
    summary: "在边长 1 的等边三角形内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in an equilateral triangle of side 1 so the smallest triangle any three of them make is as large as possible.",
    frontier: { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "等边三角形版由 AlphaEvolve 的大规模数学发现实验推进：其 n = 11 构型在 EinsteinArena 上被多个智能体复核并列，至今无人超越；逐 n 的最优构形全部未证明。",
      textEn: "The equilateral version was pushed by AlphaEvolve's large-scale mathematical discovery runs: its n = 11 configuration has been reproduced but never beaten by the agents on EinsteinArena, and no per-n optimum is proven.",
      url: "https://einsteinarena.com/problems/heilbronn-triangles" } });

export const p24: ProblemModule = heilbronn(
  { code: "P24", id: "p24", slug: "heilbronn-in-an-l", container: ell,
    instanceIds: (n) => `p24-n${n}-v2`, range: [5, 14], primary: 7, baseline: ringPoints },
  { title: "L 形内的最小三角形", titleEn: "The smallest triangle in an L",
    summary: "在 L 形区域内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in an L-shaped region so the smallest triangle any three of them make is as large as possible." });

export const p25: ProblemModule = heilbronn(
  { code: "P25", id: "p25", slug: "heilbronn-in-a-cross", container: cross,
    instanceIds: (n) => `p25-n${n}-v2`, range: [5, 14], primary: 7, baseline: ringPoints },
  { title: "十字形内的最小三角形", titleEn: "The smallest triangle in a plus sign",
    summary: "在一个十字形区域内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in a plus-shaped region so the smallest triangle any three of them make is as large as possible." });

export const p26: ProblemModule = heilbronn(
  { code: "P26", id: "p26", slug: "heilbronn-in-a-semicircle", container: semicircle,
    instanceIds: (n) => `p26-n${n}-v2`, range: [5, 14], primary: 7, baseline: ringPoints },
  { title: "半圆内的最小三角形", titleEn: "The smallest triangle in a half-disc",
    summary: "在半径 1 的半圆内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in a half-disc of radius 1 so the smallest triangle any three of them make is as large as possible." });

export const p28: ProblemModule = heilbronn(
  { code: "P28", id: "p28", slug: "heilbronn-in-an-annulus", container: annulus,
    instanceIds: (n) => `p28-n${n}-v2`, range: [5, 14], primary: 7, baseline: ringPoints },
  { title: "圆环内的最小三角形", titleEn: "The smallest triangle in an annulus",
    summary: "在外半径 1、内半径 0.5 的圆环内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in an annulus of outer radius 1 and inner radius 0.5 so the smallest triangle any three of them make is as large as possible." });

export const p32: ProblemModule = heilbronn(
  { code: "P32", id: "p32", slug: "heilbronn-in-a-quadrant", container: quadrant,
    instanceIds: (n) => `p32-n${n}-v2`, range: [5, 14], primary: 7, baseline: ringPoints },
  { title: "扇形内的最小三角形", titleEn: "The smallest triangle in a quadrant",
    summary: "在半径 1 的扇形（四分之一圆）内放 n 个点，使任意三点构成的最小三角形尽可能大。",
    summaryEn: "Place n points in a quarter-disc of radius 1 so the smallest triangle any three of them make is as large as possible." });

// What each of these draws, so the board does not need a branch per problem.
// The container already knows its own shape and size; the kind says which of
// the three pictures to put in it.
export type GridDrawing = { kind: "circles" | "points" | "triangle"; container: typeof rectangle };
export const gridDrawings: Record<string, GridDrawing> = {
  P33: { kind: "points", container: containers.square },
  P34: { kind: "points", container: disc },
  P09: { kind: "circles", container: semicircle },
  P10: { kind: "circles", container: cross },
  P30: { kind: "circles", container: quadrant },
  P16: { kind: "points", container: triangle },
  P17: { kind: "points", container: rectangle },
  P19: { kind: "points", container: ell },
  P20: { kind: "points", container: semicircle },
  P21: { kind: "points", container: cross },
  P27: { kind: "points", container: annulus },
  P31: { kind: "points", container: quadrant },
  P22: { kind: "triangle", container: disc },
  P58: { kind: "triangle", container: equilateral },
  P24: { kind: "triangle", container: ell },
  P25: { kind: "triangle", container: cross },
  P26: { kind: "triangle", container: semicircle },
  P28: { kind: "triangle", container: annulus },
  P32: { kind: "triangle", container: quadrant },
};

// --- Riesz 2-energy ---------------------------------------------------------
//
// The hardest pair here, and deliberately so. Minimise the sum of 1/d² over
// every pair of points: not a packing, not a separation, but a whole
// configuration answering to a single number that every pair contributes to.
// Nothing is settled past a handful of points, the minimisers have no closed
// form, and the container's boundary distorts them in a way nobody has a
// formula for. Moving one point changes every term it appears in, so it does
// not decompose the way the packing problems do.
export const p33: ProblemModule = rieszEnergy(
  { code: "P33", id: "p33", slug: "riesz-energy-in-a-square", container: containers.square,
    instanceIds: (n) => `p33-n${n}-v2`, range: [5, 24], primary: 10, baseline: huddledPoints },
  { title: "正方形内的 Riesz 2-能量", titleEn: "Riesz 2-energy in a square",
    summary: "在单位正方形内放置 n 个点，使所有点对 1/距离² 之和尽可能小。",
    summaryEn: "Place n points in the unit square, minimizing the sum of 1/distance² over every pair.",
    frontier: { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "逐点对 1/r² 能量的一般理论（渐近分布、分离性）见 Borodachov、Hardin 与 Saff 的《Discrete Energy on Rectifiable Sets》(2019)；但正方形上逐 n 的最优构形没有文献表，这里的每个 n 都开放。少数平凡闭式是本站自证的。",
      textEn: "The general theory of pairwise 1/r² energy (asymptotics, separation) is Borodachov, Hardin and Saff, Discrete Energy on Rectifiable Sets (2019); a per-n table of optima in the square does not exist, and every n here is open. The few trivial closed forms are proved on site.",
      url: "https://www.semanticscholar.org/paper/f368b230a66f0b67493b922eb598a0178de39f25" } });

export const p34: ProblemModule = rieszEnergy(
  { code: "P34", id: "p34", slug: "riesz-energy-in-a-disc", container: disc,
    instanceIds: (n) => `p34-n${n}-v2`, range: [9, 24], primary: 10, baseline: huddledPoints },
  { title: "圆盘内的 Riesz 2-能量", titleEn: "Riesz 2-energy in a disc",
    summary: "在半径 1 的圆内放置 n 个点，使所有点对 1/距离² 之和尽可能小。",
    summaryEn: "Place n points in a disc of radius 1, minimizing the sum of 1/distance² over every pair.",
    frontier: { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
      text: "能量理论同正方形版：Borodachov–Hardin–Saff (2019)。圆盘上没有逐 n 的最优构形表；n = 9–11 展示本站的简单对称构造，n = 12 起展示本站离线数值搜索所得构形。n = 5–8 曾经在此，已经下架：正 n 边形的能量有闭式 n(n²−1)/24，参考答案本身就坐在最好已知值上，没有可争的余地。它们都只是待挑战的最好已知值，没有一项被标成已证明最优。",
      textEn: "The general theory is the same as for the square: Borodachov, Hardin and Saff (2019). There is no per-n table of optima in a disc; n = 9–11 show our elementary symmetric constructions, and n = 12 onward show configurations from our offline numerical search. n = 5–8 were here and have been retired: the regular n-gon's energy is the closed form n(n²−1)/24, so the reference answer already sat on the best known value and there was nothing left to take. Every one is a best-known target open to challenge, not a proved optimum.",
      url: "https://www.semanticscholar.org/paper/f368b230a66f0b67493b922eb598a0178de39f25" } });
