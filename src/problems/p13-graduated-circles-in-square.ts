import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint, printFixed } from "../problem-kit";
import type { ProblemDefinition, ProblemModule, ProblemInstanceDefinition, Obj, VerificationResult } from "../problem-kit";

// 半径按 1,2,…,n 成比例给定：第 i 个圆的半径就是 i·unit，unit = 10⁻⁹ 精度下的 1。
// 正方形左下角在原点，边长由提交者自己给出，越小越好。
const GRADUATED_UNIT = SCALE;
const GRADUATED_MAX_N = 60;

// 基线故意平庸：n 个圆沿一条水平线依次外切排开，正方形被撑到 n(n+1)，
// 而圆心纵坐标统一取最大半径 n，上方与下方的空白全部浪费。
function graduatedBaseline(n: number) {
  return {
    side: printFixed(n * (n + 1) * GRADUATED_UNIT),
    // 第 i 个圆左侧到原点的距离是 2(1+…+(i-1))+i = i²，所以圆心横坐标恰好是 i²。
    centers: Array.from({ length: n }, (_, index) => [printFixed((index + 1) * (index + 1) * GRADUATED_UNIT), printFixed(n * GRADUATED_UNIT)]),
  };
}

const graduatedInstances: ProblemInstanceDefinition[] = Array.from({ length: 29 }, (_, index) => {
  const n = index + 2;
  return {
    instanceId: `p13-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: graduatedBaseline(n),
    instanceNameEn: `n = ${n}`,
  };
});

export const definition: ProblemDefinition = {
    id: "p13", instanceId: "p13-n5-v1", code: "P13", slug: "graduated-circles-in-square", category: "packing",
    title: "半径成等差的圆装入正方形",
    summary: "把半径依次为 1,2,…,n 的 n 个圆按真实比例互不重叠地放进一个正方形，使正方形边长尽可能小。",
    objective: "minimize", scoreLabel: "正方形边长",
    instanceName: "n = 5", parameters: { n: 5 },
    baselineAnswer: graduatedBaseline(5),
    answerHelp: "提交 side 与 centers，centers 按半径 1,2,…,n 的顺序排列。每个数写成十进制字符串，例如 \"3.5\"。",
    titleEn: "Packing circles of radius 1,2,…,n into a square",
    summaryEn: "Pack n mutually non-overlapping circles of radii 1,2,…,n, drawn to scale, into a square and minimize its side.",
    scoreLabelEn: "square side", instanceNameEn: "n = 5",
    answerHelpEn: "Submit side and centers, listed in order of radius 1,2,…,n. Write every number as a decimal string, for example \"3.5\".",
    definition: "把半径分别为 1, 2, …, n 的 n 个圆互不重叠地放进一个正方形，使正方形边长尽可能小。",
      definitionEn: "Fit n circles of radii 1, 2, …, n, none overlapping, inside one square, making the side of that square as small as possible.",
      strict: [
        { label: "容器", labelEn: "Container", text: "边长 side 的正方形，左下角是原点，side 由你给出，它就是分数；单位取最小圆的半径", textEn: "A square of side side with the origin at its lower-left corner, where side is yours to choose — it is the score; the unit is the smallest circle" },
        { label: "提交", labelEn: "Submission", text: "side 与 centers，centers 按半径 1, 2, …, n 的顺序排列", textEn: "side and centers, the centres listed in order of radii 1, 2, …, n" },
        { label: "约束", labelEn: "Constraints", text: "第 i 个圆的半径恰好是 i；两两内部不重叠；每个圆完整落在正方形内", textEn: "Circle i has radius exactly i; no two overlap in their interiors; every circle lies wholly inside the square" },
        { label: "目标", labelEn: "Objective", text: "让正方形边长尽可能小", textEn: "Make the side of the square as small as possible" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "大圆定骨架、小圆填缝：n 每加一，新来的最大圆都可能颠覆上一轮的整个布局。",
          textEn: "The big circles set the skeleton and the small ones caulk the seams: each new largest circle can upend the whole previous layout." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "n ≤ 4 由圆心距的初等下界证明（见各子题）。圆容器版是 Zimmermann 竞赛的赛题（见 Packomania），正方形容器版未见文献表，其余 n 开放。",
          textEn: "n ≤ 4 follow from elementary centre-distance bounds (see the sub-problems). The circular-container version was the Zimmermann contest problem (see Packomania); this square version has no table, and the rest are open." , url: "https://www.packomania.com/" },
      ],
    frame: "单位就是最小那个圆的半径：第 i 个圆的半径正好是 i。容器是你自己给出的正方形，左下角是原点 (0, 0)，右上角是 (side, side)，side 越小越好。坐标和半径用同一个单位，直接写成小数，例如 \"3.5\"，最多九位小数。",
    frameEn: "The unit is the radius of the smallest circle: circle i has radius exactly i. The container is the square you name — lower-left corner at the origin (0, 0), upper-right at (side, side) — and a smaller side scores better. Coordinates and radii share one unit and are written as plain decimals such as \"3.5\", to at most nine decimal places.",
    instances: graduatedInstances,
};

function verifyGraduatedCircles(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), unit = GRADUATED_UNIT;
  if (n < 1 || n > GRADUATED_MAX_N) return fail("COUNT", `n 必须在 1 与 ${GRADUATED_MAX_N} 之间`, `n must be between 1 and ${GRADUATED_MAX_N}`);
  if (unit <= 0) return fail("BAD_PARAMS", "unit 必须为正数", "unit must be a positive number");
  const side = parseFixed(answer.side, "side");
  const raw = asArray(answer.centers, "centers");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个圆心`, `exactly ${n} centres are needed`);
  if (side <= 0) return fail("SIDE", "正方形边长必须为正数", "the square's side must be a positive number");
  const centers = raw.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const radii = Array.from({ length: n }, (_, index) => (index + 1) * unit);
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i], radius = radii[i];
    if (x < radius || y < radius || x > side - radius || y > side - radius) return fail("OUT_OF_BOUNDS", `半径为 ${i + 1} 的圆超出了正方形`, `the circle of radius ${i + 1} reaches outside the square`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = BigInt(centers[i][0]) - BigInt(centers[j][0]), dy = BigInt(centers[i][1]) - BigInt(centers[j][1]);
    const gap = BigInt(radii[i] + radii[j]);
    if (dx * dx + dy * dy < gap * gap) return fail("OVERLAP", `半径为 ${i + 1} 与 ${j + 1} 的圆重叠`, `the circles of radius ${i + 1} and ${j + 1} overlap`);
  }
  return ok(BigInt(side), printFixed(side));
}

export const problem: ProblemModule = { definition, verify: verifyGraduatedCircles };
