import { ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed, printFixedBig, printSquared, sq, SCALE } from "./problem-kit";
import type { IntuitionCard, ProblemDefinition, ProblemInstanceDefinition, ProblemModule, Obj, VerificationResult } from "./problem-kit";
import type { Container } from "./containers";

// The three shapes of problem that recur across containers, each written once.
// Thirteen problems are built from these, which is the reason they exist: one
// verifier to get right and one to test, rather than thirteen files differing
// only in a container and a noun.

type Family = {
  code: string;
  id: string;
  slug: string;
  container: Container;
  instanceIds: (n: number) => string;
  range: [number, number];
  primary: number;
  baseline: (n: number, container: Container) => unknown;
};

function familyInstances(family: Family): ProblemInstanceDefinition[] {
  const [from, to] = family.range;
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const n = from + index;
    return {
      instanceId: family.instanceIds(n),
      instanceName: `n = ${n}`,
      parameters: { n },
      baselineAnswer: family.baseline(n, family.container),
      instanceNameEn: `n = ${n}`,
    };
  });
}

// --- equal circles ----------------------------------------------------------

import { problemTags } from "./problem-tags";

// The frontier card for a template family, decided by provenance. A classic
// points at the cited known-best rows; an original says the honest thing --
// nobody has ever studied it, and the standing record is all anybody knows.
function familyFrontier(code: string, subject: string, subjectEn: string, container: { name: string; nameEn: string }) {
  const classic = (problemTags[code] ?? []).includes("classic");
  return classic
    ? { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier" as const,
        text: "经典问题：文献的已知最好值逐个 n 标在每个子题页的「已知最好」栏里，来源可点；只有标着「已证明最优」的 n 才是定理，其余全部开放。",
        textEn: "A classic: the literature's best known values are cited per n in each sub-problem's known-best row. Only the ones marked proven are theorems; everything else is open." }
    : { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier" as const,
        text: `本站变体：把${subject}放进${container.name}是本站出的题，文献里查不到。每一个 n 都无人研究过，当前纪录就是人类已知的全部。`,
        textEn: `Our own variant: ${subjectEn} in ${container.nameEn} was posed here, and there is no literature for it. Every n is unstudied; the standing record is all anybody knows.` };
}

export function equalCircles(family: Family, copy: {
  title: string; titleEn: string; summary: string; summaryEn: string; frontier?: IntuitionCard;
}): ProblemModule {
  const { container } = family;
  const instances = familyInstances(family);
  const definition: ProblemDefinition = {
    id: family.id, instanceId: family.instanceIds(family.primary), code: family.code, slug: family.slug, category: "packing",
    title: copy.title, summary: copy.summary, objective: "maximize", scoreLabel: "共同半径",
    instanceName: `n = ${family.primary}`, parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: "提交 radius 与 centers。每个数写成十进制字符串，例如 \"0.25\"。所有圆共用同一个半径。",
    titleEn: copy.titleEn, summaryEn: copy.summaryEn, scoreLabelEn: "common radius", instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: "Submit radius and centers. Write every number as a decimal string such as \"0.25\". Every circle shares one radius.",
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}坐标和半径用同一个单位，直接写成小数，例如 "0.25"，最多九位小数。`,
    frameEn: `${container.frameEn} Coordinates and radii share one unit and are written as plain decimals such as "0.25", to at most nine decimal places.`,
    definition: `在${container.name}内放置 n 个半径相同的圆，使共同半径尽可能大。`,
    definitionEn: `Place n circles of one common radius inside ${container.nameEn}, making that radius as large as possible.`,
    strict: [
      { label: "容器", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个圆：一个共同半径与 n 个圆心；所有圆共用同一个半径", textEn: "Exactly n circles: one shared radius and n centres; every circle uses the same radius" },
      { label: "约束", labelEn: "Constraints", text: "每个圆完整落在容器内；两两内部不重叠，相切允许", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
      { label: "目标", labelEn: "Objective", text: "让共同半径尽可能大", textEn: "Make the common radius as large as possible" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "最优构形是「卡死」的接触结构：圆彼此顶住、顶住边界，常出现斜排、错位、以及不碰任何邻居的游离圆。规整的网格摆法几乎从不最优。",
        textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal." },
      copy.frontier ?? familyFrontier(family.code, "装等圆", "equal-circle packing", container),
    ],
    requirements: ["恰好 n 个圆，半径完全相同", "每个圆整体落在容器内", "两两不重叠，相切是允许的"],
    requirementsEn: ["Exactly n circles, all the same radius", "Every circle lies wholly inside the container", "No two overlap, though tangency is allowed"],
    instances,
  };

  function verify(params: Obj, answer: Obj): VerificationResult {
    const n = asInt(params.n, "n");
    if (n < 1 || n > 200) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
    const radius = parseFixed(answer.radius, "radius");
    if (radius <= 0) return fail("RADIUS", "半径必须为正数", "the radius must be a positive number");
    const raw = asArray(answer.centers, "centers");
    if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆心`, `exactly ${n} centres are needed`);
    const centers = raw.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.fitsDisc(centers[i][0], centers[i][1], radius)) return fail("OUT_OF_BOUNDS", `圆 ${i + 1} 没有完整落在容器内`, `circle ${i + 1} does not lie entirely inside the container`);
    const gap = 4n * BigInt(radius) * BigInt(radius);
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
      if (sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]) < gap)
        return fail("OVERLAP", `圆 ${i + 1} 与 ${j + 1} 重叠`, `circles ${i + 1} and ${j + 1} overlap`);
    return ok(BigInt(radius), printFixed(radius));
  }

  return { definition, verify };
}

// --- points, scored by how far apart the closest pair is --------------------

export function spreadPoints(family: Family, copy: {
  title: string; titleEn: string; summary: string; summaryEn: string; frontier?: IntuitionCard;
}): ProblemModule {
  const { container } = family;
  const instances = familyInstances(family);
  const definition: ProblemDefinition = {
    id: family.id, instanceId: family.instanceIds(family.primary), code: family.code, slug: family.slug, category: "extremal",
    title: copy.title, summary: copy.summary, objective: "maximize", scoreLabel: "最小两点距离的平方", goalLabel: "最小两点距离", scoreIs: "square", goalLabelEn: "the smallest distance between two points",
    instanceName: `n = ${family.primary}`, parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.5\"。",
    titleEn: copy.titleEn, summaryEn: copy.summaryEn, scoreLabelEn: "squared minimum pairwise distance", instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\".",
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}坐标直接写成小数，例如 "0.5"，最多九位小数。`,
    frameEn: `${container.frameEn} Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.`,
    definition: `在${container.name}内放置 n 个点，使两两之间的最小距离尽可能大。`,
    definitionEn: `Place n points inside ${container.nameEn}, maximizing the smallest distance between any two of them.`,
    strict: [
      { label: "容器", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个点，两两不重合", textEn: "Exactly n points, no two coinciding" },
      { label: "约束", labelEn: "Constraints", text: "每个点都在容器内或边界上", textEn: "Every point lies inside the container or on its boundary" },
      { label: "目标", labelEn: "Objective", text: "让最小的两点距离尽可能大。内部以其平方精确比较", textEn: "Make the smallest pairwise distance as large as possible; compared internally by its square, exactly" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "散点分离就是装等圆：以每个点为圆心、最小距离一半为半径的圆必须互不重叠。最优构形因此也是卡死的接触结构，容器的形状决定一切。",
        textEn: "Spreading points IS packing equal circles: discs of half the minimum distance around each point must not overlap. Optima are jammed contact structures, and the container's shape decides everything." },
      copy.frontier ?? familyFrontier(family.code, "散点分离", "point spreading", container),
    ],
    requirements: ["恰好 n 个点，且两两不重合", "每个点都在容器内或边界上", "分数是最小的那个两点距离"],
    requirementsEn: ["Exactly n points, no two coinciding", "Every point lies inside the container or on its boundary", "The score is the smallest distance between two points"],
    instances,
  };

  function verify(params: Obj, answer: Obj): VerificationResult {
    const n = asInt(params.n, "n");
    if (n < 2 || n > 200) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
    const raw = asArray(answer.points, "points");
    if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
    const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.holds(points[i][0], points[i][1])) return fail("OUT_OF_BOUNDS", `点 ${i + 1} 不在容器内`, `point ${i + 1} is outside the container`);
    let nearest: bigint | null = null;
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
      const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
      if (nearest === null || squared < nearest) nearest = squared;
    }
    if (nearest === null || nearest === 0n) return fail("COINCIDENT", "存在两个重合的点，最小距离为 0", "two of the points coincide, so the smallest distance is 0");
    return ok(nearest, printSquared(nearest));
  }

  return { definition, verify };
}

// --- points, scored by the smallest triangle any three of them make ---------

export function heilbronn(family: Family, copy: {
  title: string; titleEn: string; summary: string; summaryEn: string; frontier?: IntuitionCard;
}): ProblemModule {
  const { container } = family;
  const instances = familyInstances(family);
  const definition: ProblemDefinition = {
    id: family.id, instanceId: family.instanceIds(family.primary), code: family.code, slug: family.slug, category: "extremal",
    title: copy.title, summary: copy.summary, objective: "maximize", scoreLabel: "最小三角形的二倍面积", goalLabel: "最小三角形的面积", scoreIs: "double", goalLabelEn: "the smallest triangle's area",
    instanceName: `n = ${family.primary}`, parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.5\"。",
    titleEn: copy.titleEn, summaryEn: copy.summaryEn, scoreLabelEn: "twice the smallest triangle's area", instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\".",
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}坐标直接写成小数，例如 "0.5"，最多九位小数。`,
    frameEn: `${container.frameEn} Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.`,
    definition: `在${container.name}内放置 n 个点，使任意三点构成的三角形中最小的那个面积尽可能大。`,
    definitionEn: `Place n points inside ${container.nameEn} so that the smallest triangle formed by any three of them is as large as possible.`,
    strict: [
      { label: "容器", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个点，任意三点不共线", textEn: "Exactly n points, no three collinear" },
      { label: "约束", labelEn: "Constraints", text: "每个点都在容器内或边界上", textEn: "Every point lies inside the container or on its boundary" },
      { label: "目标", labelEn: "Objective", text: "让任意三点构成的三角形中最小的面积尽可能大。内部以二倍面积精确比较", textEn: "Make the smallest triangle over all triples as large as possible; compared internally by twice the area, exactly" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "把点撒得均匀并不够：任何三点都不能接近共线，而近共线恰恰是看起来整齐的排布最容易犯的错。最优构形往往不对称，连形状都难猜。",
        textEn: "Even spreading is not enough: no three points may come close to collinear, and near-collinearity is exactly what tidy arrangements love to do. Optima are often asymmetric and hard even to guess." },
      copy.frontier ?? familyFrontier(family.code, "Heilbronn 问题", "Heilbronn's problem", container),
    ],
    requirements: ["恰好 n 个点，任意三点不共线", "每个点都在容器内或边界上", "分数是最小三角形的面积"],
    requirementsEn: ["Exactly n points, no three collinear", "Every point lies inside the container or on its boundary", "The score is the smallest triangle's area"],
    instances,
  };

  function verify(params: Obj, answer: Obj): VerificationResult {
    const n = asInt(params.n, "n");
    if (n < 3 || n > 40) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
    const raw = asArray(answer.points, "points");
    if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
    const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.holds(points[i][0], points[i][1])) return fail("OUT_OF_BOUNDS", `点 ${i + 1} 不在容器内`, `point ${i + 1} is outside the container`);
    let smallest: bigint | null = null;
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) for (let k = j + 1; k < n; k += 1) {
      // Twice the area is |cross product|, which is exact in these units.
      const area = (BigInt(points[j][0] - points[i][0]) * BigInt(points[k][1] - points[i][1]))
        - (BigInt(points[j][1] - points[i][1]) * BigInt(points[k][0] - points[i][0]));
      const magnitude = area < 0n ? -area : area;
      if (magnitude === 0n) return fail("COLLINEAR", `点 ${i + 1}、${j + 1}、${k + 1} 共线`, `points ${i + 1}, ${j + 1} and ${k + 1} are collinear`);
      if (smallest === null || magnitude < smallest) smallest = magnitude;
    }
    if (smallest === null) return fail("COUNT", "至少需要三个点", "at least three points are needed");
    return ok(smallest, printSquared(smallest));
  }

  return { definition, verify };
}


// --- baselines --------------------------------------------------------------
//
// Every one of these is meant to be beaten, and here that is a fact of the
// construction rather than something to hope for. Left to itself a grid is
// occasionally the best there is — the plus sign has arms exactly one wide, so
// a grid reaches the ceiling at small n — and a reference answer nobody can
// improve is the mistake this catalogue was pruned for. So each baseline is
// built from the best grid and then deliberately spoiled, in the one way that
// keeps it legal in every container.

const fixed = (units: number) => printFixed(Math.round(units));

function gridCentres(container: Container, radius: number) {
  const centers: number[][] = [];
  for (let y = radius; y <= container.height - radius; y += 2 * radius)
    for (let x = radius; x <= container.width - radius; x += 2 * radius)
      if (container.fitsDisc(x, y, radius)) centers.push([x, y]);
  return centers;
}

/** The largest grid of equal circles this container holds n of. */
export function largestGridCircles(n: number, container: Container) {
  for (let denominator = 1; denominator <= 200; denominator += 1) {
    const radius = Math.floor(Math.min(container.width, container.height) / (2 * denominator));
    if (radius <= 0) break;
    const centers = gridCentres(container, radius);
    if (centers.length >= n) return { radius, centers: centers.slice(0, n) };
  }
  throw new Error(`no grid of circles fits n = ${n} in ${container.id}`);
}

// Keep the positions, shrink the circles. A smaller disc centred where a larger
// one fitted still fits, and circles that did not overlap do not start to — so
// this is legal wherever the full-size grid was, including the awkward
// containers where re-laying a finer grid would have lost the good cells.
export function gridCircles(n: number, container: Container): unknown {
  const full = largestGridCircles(n, container);
  const radius = Math.max(1, Math.floor((full.radius * 4) / 5));
  return { radius: fixed(radius), centers: full.centers.map(([x, y]) => [fixed(x), fixed(y)]) };
}

function gridLattice(container: Container, spacing: number) {
  const all: number[][] = [];
  for (let y = 0; y <= container.height; y += spacing)
    for (let x = 0; x <= container.width; x += spacing)
      if (container.holds(x, y)) all.push([x, y]);
  return all;
}

/** The widest lattice spacing at which this container still holds n points. */
export function largestGridPoints(n: number, container: Container, from = 1) {
  for (let denominator = from; denominator <= 400; denominator += 1) {
    const spacing = Math.floor(Math.max(container.width, container.height) / denominator);
    if (spacing <= 0) break;
    const all = gridLattice(container, spacing);
    if (all.length >= n) return { denominator, spacing, points: all.slice(0, n) };
  }
  throw new Error(`no lattice fits n = ${n} in ${container.id}`);
}

// One step finer than the lattice that would have done, so the points sit
// closer and the score is worse. Not simply a fraction of the spacing: a finer
// lattice can hold FEWER points in a container with pieces missing, because its
// rows land inside the removed corners of the plus sign. Stepping to the next
// spacing that still holds n avoids having to reason about which ones do.
export function gridPoints(n: number, container: Container): unknown {
  const full = largestGridPoints(n, container);
  const finer = largestGridPoints(n, container, full.denominator + 1);
  return { points: finer.points.map(([x, y]) => [fixed(x), fixed(y)]) };
}

// A grid has collinear triples everywhere, and three collinear points make a
// triangle of area zero, which the smallest-triangle problems refuse outright.
// Points spread around a circle never have three on a line — a line meets a
// circle twice — so this baseline rides the container's inscribed circle, at
// less than its full radius so that riding it properly already does better.
export function ringPoints(n: number, container: Container): unknown {
  const { x, y, r } = container.inscribed;
  const radius = Math.floor(r * 0.8);
  return {
    points: Array.from({ length: n }, (_, index) => {
      const angle = (2 * Math.PI * index) / n;
      return [fixed(x + radius * Math.cos(angle)), fixed(y + radius * Math.sin(angle))];
    }),
  };
}

// --- Riesz 2-energy ---------------------------------------------------------
//
// E = Σ 1/d² over every pair, minimised. Nothing about it is settled past a
// handful of points: the minimisers are not lattices, they are not anything
// with a closed form, and the boundary of the container distorts them in a way
// nobody has a formula for. It is the hardest thing on this site and it is here
// on purpose.
//
// Scoring it exactly needs one decision. Each term 1/d² is an exact rational,
// but summing them exactly would want the product of every denominator, which
// is astronomical. So the score is DEFINED as the sum of ceilings rather than
// as an approximation of the true sum: a deterministic integer function of the
// answer, the same on every machine, and ceiling is the direction that cannot
// credit a minimiser with less energy than it achieved.
const ENERGY_NUMERATOR = BigInt(SCALE) * BigInt(SCALE) * BigInt(SCALE);

export function rieszEnergy(family: Family, copy: {
  title: string; titleEn: string; summary: string; summaryEn: string; frontier?: IntuitionCard;
}): ProblemModule {
  const { container } = family;
  const instances = familyInstances(family);
  const definition: ProblemDefinition = {
    id: family.id, instanceId: family.instanceIds(family.primary), code: family.code, slug: family.slug, category: "extremal",
    frontier: true,
    title: copy.title, summary: copy.summary, objective: "minimize", scoreLabel: "Riesz 2-能量",
    instanceName: `n = ${family.primary}`, parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.5\"。分数是所有点对 1/距离² 之和，越小越好。",
    titleEn: copy.titleEn, summaryEn: copy.summaryEn, scoreLabelEn: "Riesz 2-energy", instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\". The score is the sum of 1/distance² over every pair, and smaller is better.",
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}坐标直接写成小数，例如 "0.5"，最多九位小数。`,
    frameEn: `${container.frameEn} Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.`,
    definition: `在${container.name}内放置 n 个点，使所有点对的 1/距离² 之和尽可能小。`,
    definitionEn: `Place n points inside ${container.nameEn}, minimizing the sum of 1/distance² taken over every pair.`,
    strict: [
      { label: "容器", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "提交", labelEn: "Submission", text: "恰好 n 个点，两两不重合", textEn: "Exactly n points, no two coinciding" },
      { label: "约束", labelEn: "Constraints", text: "每个点都在容器内或边界上", textEn: "Every point lies inside the container or on its boundary" },
      { label: "目标", labelEn: "Objective", text: "让全部点对的 1/距离² 之和尽可能小。以精确有理数计分", textEn: "Make the sum of 1/distance² over all pairs as small as possible; scored in exact rationals" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "1/距离² 把靠得近惩罚得极重：点先被推到边界排成一圈，再随 n 增大向内分层。层数和每层的点数在特定的 n 跳变，跳变附近优化空间最大。",
        textEn: "1/distance² punishes closeness brutally: points get pushed out to a boundary ring first, then shed inner layers as n grows. Layer counts jump at particular n, and the jumps are where the contest lives." },
      copy.frontier ?? familyFrontier(family.code, "Riesz 能量", "the Riesz energy", container),
    ],
    requirements: ["恰好 n 个点，且两两不重合", "每个点都在容器内或边界上", "分数是每对点 1/距离² 的总和，越小越好"],
    requirementsEn: ["Exactly n points, no two coinciding", "Every point lies inside the container or on its boundary", "The score is the sum of 1/distance² over all pairs, and smaller is better"],
    instances,
  };

  function verify(params: Obj, answer: Obj): VerificationResult {
    const n = asInt(params.n, "n");
    if (n < 2 || n > 80) return fail("PARAMS", "子题参数超出支持范围", "the sub-problem's parameters are outside the supported range");
    const raw = asArray(answer.points, "points");
    if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
    const points = raw.map((point, index) => parseFixedPoint(point, `points[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.holds(points[i][0], points[i][1])) return fail("OUT_OF_BOUNDS", `点 ${i + 1} 不在容器内`, `point ${i + 1} is outside the container`);
    let total = 0n;
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
      const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
      if (squared === 0n) return fail("COINCIDENT", `点 ${i + 1} 与 ${j + 1} 重合，能量无穷大`, `points ${i + 1} and ${j + 1} coincide, so the energy is infinite`);
      total += (ENERGY_NUMERATOR + squared - 1n) / squared;
    }
    return ok(total, printFixedBig(total));
  }

  return { definition, verify };
}

// A deliberately bad start for a minimiser: the points crowded into a small
// patch, where every pair is close and every term is large. Spreading them over
// the container beats it by orders of magnitude, which is the whole first move.
export function huddledPoints(n: number, container: Container): unknown {
  const { x, y, r } = container.inscribed;
  let columns = 1;
  while (columns * columns < n) columns += 1;
  const spacing = Math.max(1, Math.floor(r / (2 * columns)));
  const offset = ((columns - 1) * spacing) / 2;
  return {
    points: Array.from({ length: n }, (_, index) => [
      fixed(x - offset + (index % columns) * spacing),
      fixed(y - offset + Math.floor(index / columns) * spacing),
    ]),
  };
}
