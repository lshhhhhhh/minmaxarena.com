import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// P13's problem with a round container. Circle i has radius exactly i; the
// submitter names the container's radius and smaller wins. Both tests are one
// squared comparison: a circle is inside when its centre is within R − r of the
// container's centre, and two circles miss when their centres are at least the
// sum of their radii apart. No square roots anywhere.
//
// Round changes the shape of the answer completely. A square rewards pushing
// the big circle into a corner and filling the opposite one; a disc has no
// corner to push into, so the large circles have to be arranged against each
// other and the small ones fill the crescents they leave.
const UNIT = SCALE;
const MIN_N = 2;
const MAX_N = 30;

// Deliberately poor: every circle strung along one diameter, touching in turn.
// It uses a line through a disc and wastes everything off that line, which is
// most of the disc.
function rowBaseline(n: number) {
  // Circle i sits at distance i² from the left end of the row, which is
  // n(n+1) long. Centre that row on the container's diameter.
  const span = n * (n + 1);
  // The container has to hold the row: try radii upward until every circle fits.
  const positions = Array.from({ length: n }, (_, index) => (index + 1) * (index + 1));
  let radius = span;
  for (;;) {
    const shift = radius - span / 2;
    const fits = positions.every((x, index) => Math.abs(x + shift - radius) + (index + 1) <= radius);
    if (fits) break;
    radius += 1;
  }
  const shift = radius - span / 2;
  return {
    radius: printFixed(radius * UNIT),
    centers: positions.map((x) => [printFixed((x + shift) * UNIT), printFixed(radius * UNIT)]),
  };
}

const instances: ProblemInstanceDefinition[] = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p06-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
  id: "p06", instanceId: "p06-n5-v2", code: "P06", slug: "graduated-circles-in-circle", category: "packing",
  title: "半径成等差的圆装入圆",
  summary: "把半径依次为 1,2,…,n 的 n 个圆按真实比例互不重叠地放进一个圆，使容器半径尽可能小。",
  objective: "minimize", scoreLabel: "容器半径",
  instanceName: "n = 5", parameters: { n: 5 },
  baselineAnswer: rowBaseline(5),
  answerHelp: "提交 radius 与 centers，centers 按半径 1,2,…,n 的顺序排列。容器圆心在 (radius, radius)。每个数写成十进制字符串，例如 \"7.5\"。",
  titleEn: "Packing circles of radius 1,2,…,n into a circle",
  summaryEn: "Pack n mutually non-overlapping circles of radii 1,2,…,n, drawn to scale, into a circle and minimize its radius.",
  scoreLabelEn: "container radius", instanceNameEn: "n = 5",
  answerHelpEn: "Submit radius and centers, listed in order of radius 1,2,…,n. The container is centred at (radius, radius). Write every number as a decimal string, for example \"7.5\".",
  definition: "把半径分别为 1, 2, …, n 的 n 个圆互不重叠地放进一个圆里，使容器的半径尽可能小。",
    definitionEn: "Fit n circles of radii 1, 2, …, n, none overlapping, inside one circle, making the container radius as small as possible.",
    strict: [
      { label: "容器", labelEn: "Container", text: "圆心在 (radius, radius)、半径为 radius 的圆，radius 由你给出，它就是分数；单位取最小圆的半径", textEn: "A circle of radius radius centred at (radius, radius), where radius is yours to choose — it is the score; the unit is the smallest circle" },
      { label: "提交", labelEn: "Submission", text: "radius 与 centers，centers 按半径 1, 2, …, n 的顺序排列", textEn: "radius and centers, the centres listed in order of radii 1, 2, …, n" },
      { label: "约束", labelEn: "Constraints", text: "第 i 个圆的半径恰好是 i；两两内部不重叠；每个圆完整落在容器圆内", textEn: "Circle i has radius exactly i; no two overlap in their interiors; every circle lies wholly inside the container" },
      { label: "目标", labelEn: "Objective", text: "让容器半径尽可能小", textEn: "Make the container radius as small as possible" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "大圆定骨架、小圆填缝：n 每加一，新来的最大圆都可能颠覆上一轮的整个布局。",
        textEn: "The big circles set the skeleton and the small ones caulk the seams: each new largest circle can upend the whole previous layout." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "半径 1..n 装入最小圆正是 2005 年 Al Zimmermann 程序设计竞赛的赛题（n = 5..50），全部最好结果收录在 Packomania 的 ccin 表，但证明一个也没有。本站尚未录入这些值。",
        textEn: "Radii 1..n into the smallest circle was the 2005 Al Zimmermann programming contest (n = 5..50), with every best result collected in Packomania's ccin table — and not one of them proven. The values are not yet recorded here." , url: "https://www.packomania.com/ccin/ccin.html" },
    ],
  frame: "单位就是最小那个圆的半径：第 i 个圆的半径正好是 i。容器是你自己给出的圆，圆心在 (radius, radius)，所以坐标范围是 0 到 2·radius，radius 越小越好。坐标和半径用同一个单位，直接写成小数，例如 \"7.5\"，最多九位小数。",
  frameEn: "The unit is the radius of the smallest circle: circle i has radius exactly i. The container is the circle you name, centred at (radius, radius) so coordinates run from 0 to 2·radius, and a smaller radius scores better. Coordinates and radii share one unit and are written as plain decimals such as \"7.5\", to at most nine decimal places.",
  requirements: ["第 i 个圆的半径恰好是 i", "每个圆完整落在容器内", "两两不重叠，相切是允许的"],
  requirementsEn: ["Circle i has radius exactly i", "Every circle lies entirely inside the container", "No two overlap, though tangency is allowed"],
  instances,
};

function verifyGraduatedCirclesInCircle(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 60) return fail("COUNT", "n 超出支持范围", "n is outside the supported range");
  const radius = parseFixed(answer.radius, "radius");
  if (radius <= 0) return fail("RADIUS", "容器半径必须为正数", "the container's radius must be a positive number");
  const raw = asArray(answer.centers, "centers");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆心`, `exactly ${n} centres are needed`);
  const centers = raw.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const radii = Array.from({ length: n }, (_, index) => (index + 1) * UNIT);

  const container = BigInt(radius);
  for (let i = 0; i < n; i += 1) {
    const inner = BigInt(radii[i]);
    if (inner > container) return fail("OUT_OF_BOUNDS", `半径为 ${i + 1} 的圆比容器还大`, `the circle of radius ${i + 1} is larger than the container`);
    // Inside means the centre is within R − r of the container's centre, which
    // sits at (R, R) so that the container's own bounding box starts at 0.
    const dx = BigInt(centers[i][0]) - container, dy = BigInt(centers[i][1]) - container;
    const room = container - inner;
    if (dx * dx + dy * dy > room * room) return fail("OUT_OF_BOUNDS", `半径为 ${i + 1} 的圆超出了容器`, `the circle of radius ${i + 1} reaches outside the container`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = BigInt(centers[i][0]) - BigInt(centers[j][0]), dy = BigInt(centers[i][1]) - BigInt(centers[j][1]);
    const gap = BigInt(radii[i] + radii[j]);
    if (dx * dx + dy * dy < gap * gap) return fail("OVERLAP", `半径为 ${i + 1} 与 ${j + 1} 的圆重叠`, `the circles of radius ${i + 1} and ${j + 1} overlap`);
  }
  return ok(container, printFixed(radius));
}

export const problem: ProblemModule = { definition, verify: verifyGraduatedCirclesInCircle };
