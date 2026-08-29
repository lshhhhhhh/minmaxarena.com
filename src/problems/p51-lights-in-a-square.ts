import { SCALE, ok, fail, asInt, asArray, parseFixed, parseFixedPoint } from "../problem-kit";
import type { ProblemDefinition, ProblemInstanceDefinition, ProblemModule, Obj, VerificationResult } from "../problem-kit";

// Erich Friedman's "lights in a square". Every other problem on this site is
// scored by checking finitely many conditions; this one is scored by a minimum
// over a continuous region, so the certificate carries the claim and the
// verifier proves it.
//
// A submitter sends the light positions and the intensity they say the square
// never drops below. Proving that is a branch and bound: cover the square with
// boxes, bound the intensity from below on each, and split only the boxes that
// could still dip under the claim. Every term is rounded the safe way, so a
// proof is a proof — the verifier never accepts a claim it has not established.

const MAX_LIGHTS = 60;
// Intensities are carried as counts of 10^-12 internally and claimed to at most
// six decimals, which is finer than the published records and still leaves the
// proof a margin to work in.
const INTENSITY_UNIT = 1_000_000n;         // the score is a count of 10^-6
const INTERNAL = 1_000_000_000_000n;       // 10^-12
const CLAIM_STEP = 1_000n;                 // parseFixed gives 10^-9; six decimals means a multiple of this
// A configuration whose minimum sits on a nearly flat region needs the most
// splitting. The worst honest case measured was about 176000 boxes; past this
// the claim is refused rather than guessed at, and the submitter lowers it.
const BOX_BUDGET = 500_000;

const SPAN = BigInt(SCALE);            // the square, as a count of coordinate steps
// 1/d^2 with d^2 counted in 10^-18 is 10^18 / d^2 in absolute terms, and the
// result is carried in 10^-12, so each term is this constant over d^2.
const TERM = INTERNAL * SPAN * SPAN;

type Light = { x: bigint; y: bigint };

const maxAbs = (a: bigint, b: bigint) => { const p = a < 0n ? -a : a, q = b < 0n ? -b : b; return p > q ? p : q; };

// The smallest each term can be anywhere in the box, which is a true lower bound
// for the sum over the box. Flooring the division rounds it down again, so the
// bound stays valid.
function boxLowerBound(lights: Light[], x0: bigint, y0: bigint, x1: bigint, y1: bigint): bigint {
  let total = 0n;
  for (const light of lights) {
    const dx = maxAbs(light.x - x0, light.x - x1);
    const dy = maxAbs(light.y - y0, light.y - y1);
    const squared = dx * dx + dy * dy;
    if (squared === 0n) return -1n;
    total += TERM / squared;
  }
  return total;
}

// The intensity at one point, rounded down. Below the claim it is a
// counterexample, and rounding down cannot manufacture one.
function intensityAt(lights: Light[], x: bigint, y: bigint): bigint {
  let total = 0n;
  for (const light of lights) {
    const dx = light.x - x, dy = light.y - y;
    const squared = dx * dx + dy * dy;
    if (squared === 0n) return -1n;
    total += TERM / squared;
  }
  return total;
}

type Proof = { verdict: "proved" | "refuted" | "undecided"; boxes: number };

function proveMinimumAtLeast(lights: Light[], claim: bigint): Proof {
  let boxes = 0;
  const stack: [bigint, bigint, bigint, bigint][] = [[0n, 0n, SPAN, SPAN]];
  while (stack.length > 0) {
    const [x0, y0, x1, y1] = stack.pop()!;
    if ((boxes += 1) > BOX_BUDGET) return { verdict: "undecided", boxes };
    if (boxLowerBound(lights, x0, y0, x1, y1) >= claim) continue;

    const midX = (x0 + x1) / 2n, midY = (y0 + y1) / 2n;
    const here = intensityAt(lights, midX, midY);
    if (here >= 0n && here < claim) return { verdict: "refuted", boxes };
    // A box down to one coordinate step that still cannot be settled means the
    // claim sits inside the gap between neighbouring grid points. Refusing is
    // the only safe answer; a slightly lower claim goes through.
    if (x1 - x0 <= 1n && y1 - y0 <= 1n) return { verdict: "undecided", boxes };

    stack.push([x0, y0, midX, midY], [midX, y0, x1, midY], [x0, midY, midX, y1], [midX, midY, x1, y1]);
  }
  return { verdict: "proved", boxes };
}

// Lights on a grid, which leaves the corners dark — exactly the weakness a real
// answer fixes. Each claim was computed offline by scanning the square and then
// rounded down twice over, so the baseline verifies in a handful of boxes and
// has obvious room above it.
const instances: ProblemInstanceDefinition[] = [
  { instanceId: "p51-n2-v1", instanceName: "n = 2", instanceNameEn: "n = 2", parameters: { n: 2 },
    baselineAnswer: { lights: [["0.25","0.5"],["0.75","0.5"]], intensity: "4.42" } },
  { instanceId: "p51-n3-v1", instanceName: "n = 3", instanceNameEn: "n = 3", parameters: { n: 3 },
    baselineAnswer: { lights: [["0.25","0.25"],["0.75","0.25"],["0.25","0.75"]], intensity: "4.07" } },
  { instanceId: "p51-n4-v1", instanceName: "n = 4", instanceNameEn: "n = 4", parameters: { n: 4 },
    baselineAnswer: { lights: [["0.25","0.25"],["0.75","0.25"],["0.25","0.75"],["0.75","0.75"]], intensity: "12.07" } },
  { instanceId: "p51-n5-v1", instanceName: "n = 5", instanceNameEn: "n = 5", parameters: { n: 5 },
    baselineAnswer: { lights: [["0.166666667","0.25"],["0.5","0.25"],["0.833333333","0.25"],["0.166666667","0.75"],["0.5","0.75"]], intensity: "8.23" } },
  { instanceId: "p51-n6-v1", instanceName: "n = 6", instanceNameEn: "n = 6", parameters: { n: 6 },
    baselineAnswer: { lights: [["0.166666667","0.25"],["0.5","0.25"],["0.833333333","0.25"],["0.166666667","0.75"],["0.5","0.75"],["0.833333333","0.75"]], intensity: "19.30" } },
  { instanceId: "p51-n7-v1", instanceName: "n = 7", instanceNameEn: "n = 7", parameters: { n: 7 },
    baselineAnswer: { lights: [["0.166666667","0.166666667"],["0.5","0.166666667"],["0.833333333","0.166666667"],["0.166666667","0.5"],["0.5","0.5"],["0.833333333","0.5"],["0.166666667","0.833333333"]], intensity: "11.19" } },
  { instanceId: "p51-n8-v1", instanceName: "n = 8", instanceNameEn: "n = 8", parameters: { n: 8 },
    baselineAnswer: { lights: [["0.166666667","0.166666667"],["0.5","0.166666667"],["0.833333333","0.166666667"],["0.166666667","0.5"],["0.5","0.5"],["0.833333333","0.5"],["0.166666667","0.833333333"],["0.5","0.833333333"]], intensity: "14.79" } },
  { instanceId: "p51-n9-v1", instanceName: "n = 9", instanceNameEn: "n = 9", parameters: { n: 9 },
    baselineAnswer: { lights: [["0.166666667","0.166666667"],["0.5","0.166666667"],["0.833333333","0.166666667"],["0.166666667","0.5"],["0.5","0.5"],["0.833333333","0.5"],["0.166666667","0.833333333"],["0.5","0.833333333"],["0.833333333","0.833333333"]], intensity: "32.79" } },
  { instanceId: "p51-n10-v1", instanceName: "n = 10", instanceNameEn: "n = 10", parameters: { n: 10 },
    baselineAnswer: { lights: [["0.125","0.166666667"],["0.375","0.166666667"],["0.625","0.166666667"],["0.875","0.166666667"],["0.125","0.5"],["0.375","0.5"],["0.625","0.5"],["0.875","0.5"],["0.125","0.833333333"],["0.375","0.833333333"]], intensity: "16.72" } },
  { instanceId: "p51-n11-v1", instanceName: "n = 11", instanceNameEn: "n = 11", parameters: { n: 11 },
    baselineAnswer: { lights: [["0.125","0.166666667"],["0.375","0.166666667"],["0.625","0.166666667"],["0.875","0.166666667"],["0.125","0.5"],["0.375","0.5"],["0.625","0.5"],["0.875","0.5"],["0.125","0.833333333"],["0.375","0.833333333"],["0.625","0.833333333"]], intensity: "22.66" } },
  { instanceId: "p51-n12-v1", instanceName: "n = 12", instanceNameEn: "n = 12", parameters: { n: 12 },
    baselineAnswer: { lights: [["0.125","0.166666667"],["0.375","0.166666667"],["0.625","0.166666667"],["0.875","0.166666667"],["0.125","0.5"],["0.375","0.5"],["0.625","0.5"],["0.875","0.5"],["0.125","0.833333333"],["0.375","0.833333333"],["0.625","0.833333333"],["0.875","0.833333333"]], intensity: "45.70" } },
  { instanceId: "p51-n13-v1", instanceName: "n = 13", instanceNameEn: "n = 13", parameters: { n: 13 },
    baselineAnswer: { lights: [["0.125","0.125"],["0.375","0.125"],["0.625","0.125"],["0.875","0.125"],["0.125","0.375"],["0.375","0.375"],["0.625","0.375"],["0.875","0.375"],["0.125","0.625"],["0.375","0.625"],["0.625","0.625"],["0.875","0.625"],["0.125","0.875"]], intensity: "24.60" } },
  { instanceId: "p51-n14-v1", instanceName: "n = 14", instanceNameEn: "n = 14", parameters: { n: 14 },
    baselineAnswer: { lights: [["0.125","0.125"],["0.375","0.125"],["0.625","0.125"],["0.875","0.125"],["0.125","0.375"],["0.375","0.375"],["0.625","0.375"],["0.875","0.375"],["0.125","0.625"],["0.375","0.625"],["0.625","0.625"],["0.875","0.625"],["0.125","0.875"],["0.375","0.875"]], intensity: "27.06" } },
  { instanceId: "p51-n15-v1", instanceName: "n = 15", instanceNameEn: "n = 15", parameters: { n: 15 },
    baselineAnswer: { lights: [["0.125","0.125"],["0.375","0.125"],["0.625","0.125"],["0.875","0.125"],["0.125","0.375"],["0.375","0.375"],["0.625","0.375"],["0.875","0.375"],["0.125","0.625"],["0.375","0.625"],["0.625","0.625"],["0.875","0.625"],["0.125","0.875"],["0.375","0.875"],["0.625","0.875"]], intensity: "33.46" } },
  { instanceId: "p51-n16-v1", instanceName: "n = 16", instanceNameEn: "n = 16", parameters: { n: 16 },
    baselineAnswer: { lights: [["0.125","0.125"],["0.375","0.125"],["0.625","0.125"],["0.875","0.125"],["0.125","0.375"],["0.375","0.375"],["0.625","0.375"],["0.875","0.375"],["0.125","0.625"],["0.375","0.625"],["0.625","0.625"],["0.875","0.625"],["0.125","0.875"],["0.375","0.875"],["0.625","0.875"],["0.875","0.875"]], intensity: "65.46" } },
  { instanceId: "p51-n17-v1", instanceName: "n = 17", instanceNameEn: "n = 17", parameters: { n: 17 },
    baselineAnswer: { lights: [["0.1","0.125"],["0.3","0.125"],["0.5","0.125"],["0.7","0.125"],["0.9","0.125"],["0.1","0.375"],["0.3","0.375"],["0.5","0.375"],["0.7","0.375"],["0.9","0.375"],["0.1","0.625"],["0.3","0.625"],["0.5","0.625"],["0.7","0.625"],["0.9","0.625"],["0.1","0.875"],["0.3","0.875"]], intensity: "32.33" } },
  { instanceId: "p51-n18-v1", instanceName: "n = 18", instanceNameEn: "n = 18", parameters: { n: 18 },
    baselineAnswer: { lights: [["0.1","0.125"],["0.3","0.125"],["0.5","0.125"],["0.7","0.125"],["0.9","0.125"],["0.1","0.375"],["0.3","0.375"],["0.5","0.375"],["0.7","0.375"],["0.9","0.375"],["0.1","0.625"],["0.3","0.625"],["0.5","0.625"],["0.7","0.625"],["0.9","0.625"],["0.1","0.875"],["0.3","0.875"],["0.5","0.875"]], intensity: "36.09" } },
  { instanceId: "p51-n19-v1", instanceName: "n = 19", instanceNameEn: "n = 19", parameters: { n: 19 },
    baselineAnswer: { lights: [["0.1","0.125"],["0.3","0.125"],["0.5","0.125"],["0.7","0.125"],["0.9","0.125"],["0.1","0.375"],["0.3","0.375"],["0.5","0.375"],["0.7","0.375"],["0.9","0.375"],["0.1","0.625"],["0.3","0.625"],["0.5","0.625"],["0.7","0.625"],["0.9","0.625"],["0.1","0.875"],["0.3","0.875"],["0.5","0.875"],["0.7","0.875"]], intensity: "45.56" } },
  { instanceId: "p51-n20-v1", instanceName: "n = 20", instanceNameEn: "n = 20", parameters: { n: 20 },
    baselineAnswer: { lights: [["0.1","0.125"],["0.3","0.125"],["0.5","0.125"],["0.7","0.125"],["0.9","0.125"],["0.1","0.375"],["0.3","0.375"],["0.5","0.375"],["0.7","0.375"],["0.9","0.375"],["0.1","0.625"],["0.3","0.625"],["0.5","0.625"],["0.7","0.625"],["0.9","0.625"],["0.1","0.875"],["0.3","0.875"],["0.5","0.875"],["0.7","0.875"],["0.9","0.875"]], intensity: "84.58" } },
];

export const definition: ProblemDefinition = {
  id: "p51", instanceId: "p51-n5-v1", code: "P51", slug: "lights-in-a-square", category: "extremal",
  title: "单位正方形里的照明",
  summary: "在单位正方形内放 n 个单位亮度的光源，使正方形内最暗的那一点尽可能亮。",
  objective: "maximize", scoreLabel: "最小光强",
  instanceName: "n = 5", parameters: instances[3].parameters,
  baselineAnswer: instances[3].baselineAnswer,
  answerHelp: "提交 lights 与 intensity。lights 是 n 个光源坐标，写成十进制字符串。intensity 是你声称正方形内任何一点都不低于的光强，最多六位小数。验证器会严格证明这个下界，证不出来就拒收，所以把它报得比你实际达到的最小值略低一点。某点的光强是各光源到该点距离平方的倒数之和。",
  answerHelpEn: "Submit lights and intensity. lights are the n positions, written as decimal strings. intensity is the value you claim no point in the square falls below, to at most six decimals — the verifier proves that bound and refuses what it cannot prove, so claim a little under the minimum you actually reach. The intensity at a point is the sum over lights of one over the squared distance to it.",
  definition: "在单位正方形内放 n 个单位亮度的光源，一点的光强是各光源到它距离平方倒数之和；让最暗的那一点尽可能亮。",
    definitionEn: "Place n unit-brightness lights in the unit square; the intensity at a point is the sum of 1/distance² to each light. Make the darkest point as bright as possible.",
    strict: [
      { label: "容器", labelEn: "Container", text: "单位正方形：左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
      { label: "提交", labelEn: "Submission", text: "n 个光源坐标 lights，外加你声称的最小光强 intensity，验证器只接受它能证明的下界", textEn: "The n light positions, plus the minimum intensity you claim — the verifier accepts only a bound it can prove" },
      { label: "约束", labelEn: "Constraints", text: "光源都在正方形内，两两不重合", textEn: "All lights inside the square, no two coinciding" },
      { label: "目标", labelEn: "Objective", text: "让正方形内最暗一点的光强尽可能大", textEn: "Make the intensity at the darkest point of the square as large as possible" },
    ],
    intuition: [
      { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
        text: "最暗点藏在光源之间的鞍点和角落里：补亮这里，别处就暗下去。均匀网格远非最优，边角需要超配。",
        textEn: "The darkest point hides in saddles between lights and in the corners: brighten it and somewhere else goes dim. Uniform grids are far from optimal; edges and corners need overprovisioning." },
      { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
        text: "题型源自 Friedman 的 light 页；那页只有构造、没有证明，按本站原则不引用未证明的具体答案。每个 n 都开放，当前纪录就是这里已知的全部。",
        textEn: "The problem shape comes from Friedman's light page, which offers constructions but no proofs, and this site does not cite unproven answers. Every n is open; the standing record is all that is known here." , url: "https://erich-friedman.github.io/packing/light/" },
    ],
  extent: SCALE,
  frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。坐标写成小数，例如 \"0.25\"，最多九位小数。光强不是坐标，它是一个大于 1 的数，最多六位小数。",
  frameEn: "The container is a square of side 1, origin at the lower-left corner (0, 0) and (1, 1) at the upper right. Coordinates are decimals such as \"0.25\", to at most nine places. The intensity is not a coordinate: it is a number larger than 1, to at most six decimal places.",
  titleEn: "Lighting a unit square",
  summaryEn: "Place n lights of unit brightness in a unit square so the darkest point of the square is as bright as possible.",
  scoreLabelEn: "minimum intensity", instanceNameEn: "n = 5",
  requirements: ["所有光源都在正方形内，且两两不重合", "分数是整个正方形上的最小光强，不是某几个点上的", "你要自己报出这个最小值，验证器只接受它能证明的下界"],
  requirementsEn: ["Every light lies in the square and no two coincide", "The score is the minimum over the whole square, not over a few sample points", "You state that minimum yourself, and the verifier only accepts a bound it can prove"],
  instances,
};

function verifyLights(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n");
  if (n < 1 || n > MAX_LIGHTS) return fail("PARAMS", "子题参数 n 超出支持范围", "the sub-problem's n is outside the supported range");

  const raw = asArray(answer.lights, "lights");
  if (raw.length !== n) return fail("COUNT", `需要恰好 ${n} 个光源，收到 ${raw.length} 个`, `exactly ${n} lights are needed, ${raw.length} were given`);
  const lights: Light[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < n; i += 1) {
    const [x, y] = parseFixedPoint(raw[i], `lights[${i}]`);
    if (x < 0 || y < 0 || x > SCALE || y > SCALE) return fail("OUT_OF_BOUNDS", `光源 ${i + 1} 不在正方形内`, `light ${i + 1} is outside the square`);
    const key = `${x},${y}`;
    if (seen.has(key)) return fail("DUPLICATE", `光源 ${i + 1} 与另一个光源重合`, `light ${i + 1} sits on top of another light`);
    seen.add(key);
    lights.push({ x: BigInt(x), y: BigInt(y) });
  }

  const claimUnits = parseFixed(answer.intensity, "intensity");
  if (claimUnits <= 0) return fail("CLAIM", "intensity 必须是正数", "intensity must be a positive number");
  if (claimUnits % Number(CLAIM_STEP) !== 0) return fail("CLAIM", "intensity 最多只能有六位小数", "intensity may have at most six decimal places");
  // parseFixed counts 10^-9; the proof works in 10^-12.
  const claim = BigInt(claimUnits) * 1_000n;

  const proof = proveMinimumAtLeast(lights, claim);
  if (proof.verdict === "refuted") return fail("CLAIM_TOO_HIGH", "正方形里存在比 intensity 更暗的点，这个下界不成立", "somewhere in the square is darker than intensity, so that bound does not hold");
  if (proof.verdict === "undecided")
    return fail("CLAIM_TOO_TIGHT", `在 ${BOX_BUDGET} 个子区域内没能证明这个下界。把 intensity 调低一点再试：验证器只接受它能证明的值。`, `the bound could not be proved within ${BOX_BUDGET} sub-regions. Claim a slightly lower intensity and try again — the verifier accepts only what it can prove.`);

  const score = BigInt(claimUnits) / CLAIM_STEP;
  return ok(score, formatIntensity(score));
}

// The score is a count of 10^-6, printed back as the decimal that was claimed.
function formatIntensity(units: bigint): string {
  const whole = units / INTENSITY_UNIT;
  const fraction = (units % INTENSITY_UNIT).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export const problem: ProblemModule = { definition, verify: verifyLights };
