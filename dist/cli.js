#!/usr/bin/env node

// src/cli.ts
import { readFileSync } from "node:fs";

// src/problem-kit.ts
var SCALE = 1e9;
var ok = (score, displayScore = score.toString()) => ({ valid: true, score: score.toString(), displayScore, message: "\u7B54\u6848\u6709\u6548\uFF0C\u9A8C\u8BC1\u5668\u5DF2\u63A5\u53D7\u8FD9\u4EFD\u7B54\u6848\u3002", messageEn: "The answer is valid; the verifier accepted it." });
var fail = (errorCode, message, messageEn) => ({ valid: false, errorCode, message, messageEn });
var Refusal = class extends Error {
  messageEn;
  constructor(message, messageEn) {
    super(message);
    this.name = "Refusal";
    this.messageEn = messageEn;
  }
};
function refuse(message, messageEn) {
  throw new Refusal(message, messageEn);
}
var isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
var isInt = (value) => typeof value === "number" && Number.isSafeInteger(value);
var asInt = (value, name) => {
  if (!isInt(value)) refuse(`${name} \u5FC5\u987B\u662F\u5B89\u5168\u6574\u6570`, `${name} must be a safe integer`);
  return value;
};
var asArray = (value, name) => {
  if (!Array.isArray(value)) refuse(`${name} \u5FC5\u987B\u662F\u6570\u7EC4`, `${name} must be an array`);
  return value;
};
var sq = (value) => BigInt(value) * BigInt(value);
function formatFixedPoint(value) {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const whole = Math.floor(magnitude / SCALE);
  const fraction = String(magnitude % SCALE).padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
var FIXED_DECIMALS = 9;
function parseFixed(value, name) {
  if (typeof value !== "string") refuse(`${name} \u5FC5\u987B\u5199\u6210\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5" \u6216 "1"`, `${name} must be written as a string, for example "0.5" or "1"`);
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) refuse(`${name} \u5FC5\u987B\u662F\u5341\u8FDB\u5236\u6570\u5B57\uFF0C\u4E0D\u652F\u6301\u6307\u6570\u5199\u6CD5`, `${name} must be a decimal number; exponent notation is not supported`);
  const negative = trimmed.startsWith("-");
  const [whole, fraction = ""] = (negative ? trimmed.slice(1) : trimmed).split(".");
  if (fraction.length > FIXED_DECIMALS) refuse(`${name} \u6700\u591A ${FIXED_DECIMALS} \u4F4D\u5C0F\u6570`, `${name} may have at most ${FIXED_DECIMALS} decimal places`);
  if (whole.length > 12) refuse(`${name} \u6570\u503C\u8FC7\u5927`, `${name} is too large`);
  const units = Number(whole) * SCALE + Number(fraction.padEnd(FIXED_DECIMALS, "0"));
  if (!Number.isSafeInteger(units)) refuse(`${name} \u6570\u503C\u8FC7\u5927`, `${name} is too large`);
  return negative ? -units : units;
}
function printFixed(units) {
  return formatFixedPoint(units);
}
function parseFixedPoint(value, name) {
  const pair = asArray(value, name);
  if (pair.length !== 2) refuse(`${name} \u5FC5\u987B\u5305\u542B\u4E24\u4E2A\u5750\u6807`, `${name} must contain exactly two coordinates`);
  return [parseFixed(pair[0], `${name}.x`), parseFixed(pair[1], `${name}.y`)];
}
var SQUARE_SCALE = BigInt(SCALE) * BigInt(SCALE);
function printSquared(units) {
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  const whole = magnitude / SQUARE_SCALE;
  const fraction = (magnitude % SQUARE_SCALE).toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
var FIXED_SCALE = BigInt(SCALE);
function printFixedBig(units) {
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  const whole = magnitude / FIXED_SCALE;
  const fraction = (magnitude % FIXED_SCALE).toString().padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
function integerSqrt(value) {
  if (value < 0n) throw new Error("integerSqrt does not take a negative");
  if (value < 2n) return value;
  let guess = value;
  let next = (value >> 1n) + 1n;
  while (next < guess) {
    guess = next;
    next = guess + value / guess >> 1n;
  }
  return guess;
}

// src/problems/p01-square-circle-packing.ts
var SQUARE_CIRCLE_MAX_N = 30;
function squareCircleBaseline(n) {
  const write = (units) => printFixed(units);
  if (n === 1) return { radius: write(5e8), centers: [[write(5e8), write(5e8)]] };
  if (n === 5) return {
    radius: write(1e8),
    centers: [[1e8, 1e8], [9e8, 1e8], [1e8, 9e8], [9e8, 9e8], [5e8, 5e8]].map(([x, y]) => [write(x), write(y)])
  };
  const columns = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / columns);
  const radius = Math.floor(SCALE / (2 * Math.max(columns, rows)));
  const width = columns * radius * 2;
  const height = rows * radius * 2;
  const startX = Math.floor((SCALE - width) / 2) + radius;
  const startY = Math.floor((SCALE - height) / 2) + radius;
  const centers = [];
  for (let row = 0; row < rows && centers.length < n; row += 1) {
    for (let column = 0; column < columns && centers.length < n; column += 1) {
      centers.push([startX + column * radius * 2, startY + row * radius * 2]);
    }
  }
  return { radius: write(radius), centers: centers.map(([x, y]) => [write(x), write(y)]) };
}
var squareCircleInstances = Array.from({ length: SQUARE_CIRCLE_MAX_N }, (_, index) => {
  const n = index + 1;
  return {
    instanceId: `p01-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: squareCircleBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition = {
  id: "p01",
  instanceId: "p01-n5-v1",
  code: "P01",
  slug: "square-circle-packing",
  category: "packing",
  title: "\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u7684\u7B49\u5706\u88C5\u7BB1",
  summary: "\u653E\u7F6E n \u4E2A\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u5171\u540C\u534A\u5F84",
  instanceName: "n = 5",
  parameters: { n: 5 },
  baselineAnswer: squareCircleBaseline(5),
  answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\u3002',
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u5750\u6807\u548C\u957F\u5EA6\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and lengths share one unit and are written as plain decimals such as "0.5", to at most nine decimal places.',
  titleEn: "Equal-circle packing in a unit square",
  summaryEn: "Place n equal circles and maximize their common radius.",
  scoreLabelEn: "common radius",
  instanceNameEn: "n = 5",
  answerHelpEn: 'Submit radius and centers. Write every number as a decimal string, for example "0.25".',
  definition: "\u5728\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u534A\u5F84\u76F8\u540C\u3001\u4E92\u4E0D\u91CD\u53E0\u7684\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n non-overlapping circles of one common radius inside the unit square, making that radius as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF1A\u4E00\u4E2A\u5171\u540C\u534A\u5F84 radius \u4E0E n \u4E2A\u5706\u5FC3 centers", textEn: "Exactly n circles: one shared radius and n centres" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927", textEn: "Make the common radius as large as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6700\u4F18\u6784\u5F62\u662F\u300C\u5361\u6B7B\u300D\u7684\u63A5\u89E6\u7ED3\u6784\uFF1A\u5706\u5F7C\u6B64\u9876\u4F4F\u3001\u9876\u4F4F\u8FB9\u754C\uFF0C\u5E38\u51FA\u73B0\u659C\u6392\u3001\u9519\u4F4D\u3001\u4EE5\u53CA\u4E0D\u78B0\u4EFB\u4F55\u90BB\u5C45\u7684\u6E38\u79BB\u5706\u3002\u89C4\u6574\u7684\u7F51\u683C\u6446\u6CD5\u51E0\u4E4E\u4ECE\u4E0D\u6700\u4F18\u3002",
      textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u8FD9\u4E09\u5341\u4E2A n \u5168\u90E8\u5DF2\u8BC1\u660E\uFF0C\u6700\u4F18\u6784\u5F62\u4E5F\u5DF2\u76F4\u63A5\u5C55\u793A\uFF0C\u6574\u9898\u4F5C\u4E3A\u5DF2\u5B8C\u6210\u9648\u5217\uFF0C\u4E0D\u518D\u63A5\u53D7\u7834\u7EAA\u5F55\uFF1Bcsq \u8868\u5F80\u4E0A\u6536\u5F55\u5230\u51E0\u767E\u4E2A n\uFF0C\u771F\u6B63\u7684\u524D\u6CBF\u5728\u90A3\u91CC\u3002",
      textEn: "All thirty n are proven and their optimal configurations are shown outright; the whole problem is exhibited as finished and takes no records. Specht's csq table runs to hundreds of n, and the real frontier lives there.",
      url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/csq/csq.html"
    }
  ],
  requirements: ["\u6240\u6709\u5706\u5FC5\u987B\u5B8C\u5168\u4F4D\u4E8E\u6B63\u65B9\u5F62\u5185", "\u4EFB\u610F\u4E24\u4E2A\u5706\u7684\u5185\u90E8\u4E0D\u80FD\u91CD\u53E0", "\u6240\u6709\u5706\u4F7F\u7528\u540C\u4E00\u4E2A\u534A\u5F84"],
  requirementsEn: ["Every circle stays inside the square", "No two circle interiors overlap", "Every circle has the same radius"],
  instances: squareCircleInstances
};
function verifySquareCircles(params, answer) {
  const n = asInt(params.n, "n"), size = SCALE;
  const radius = parseFixed(answer.radius, "radius");
  const centers = asArray(answer.centers, "centers").map((point, i) => parseFixedPoint(point, `centers[${i}]`));
  if (radius <= 0 || centers.length !== n) return fail("COUNT_OR_RADIUS", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\uFF0C\u4E14\u534A\u5F84\u4E3A\u6B63\u6570`, `exactly ${n} circles are needed, with a positive radius`);
  for (const [x, y] of centers) if (x < radius || y < radius || x > size - radius || y > size - radius) return fail("OUT_OF_BOUNDS", "\u81F3\u5C11\u4E00\u4E2A\u5706\u8D85\u51FA\u4E86\u6B63\u65B9\u5F62\u8FB9\u754C", "at least one circle reaches outside the square");
  const minDistance = 4n * sq(radius);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]) < minDistance) return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E\u5706 ${j + 1} \u76F8\u4EA4`, `circles ${i + 1} and ${j + 1} intersect`);
  return ok(BigInt(radius), printFixed(radius));
}
var problem = { definition, verify: verifySquareCircles };

// src/problems/p02-circle-circle-packing.ts
var instances = [
  { instanceId: "p02-n2-v1", instanceName: "n = 2", instanceNameEn: "n = 2", parameters: { n: 2 }, baselineAnswer: { "radius": "0.4", "centers": [["1.5", "1"], ["0.5", "1"]] } },
  { instanceId: "p02-n3-v1", instanceName: "n = 3", instanceNameEn: "n = 3", parameters: { n: 3 }, baselineAnswer: { "radius": "0.346410161", "centers": [["1.5", "1"], ["0.75", "1.433012702"], ["0.75", "0.566987298"]] } },
  { instanceId: "p02-n4-v1", instanceName: "n = 4", instanceNameEn: "n = 4", parameters: { n: 4 }, baselineAnswer: { "radius": "0.282842712", "centers": [["1.5", "1"], ["1", "1.5"], ["0.5", "1"], ["1", "0.5"]] } },
  { instanceId: "p02-n5-v1", instanceName: "n = 5", instanceNameEn: "n = 5", parameters: { n: 5 }, baselineAnswer: { "radius": "0.2351141", "centers": [["1.5", "1"], ["1.154508497", "1.475528258"], ["0.595491503", "1.293892626"], ["0.595491503", "0.706107374"], ["1.154508497", "0.524471742"]] } },
  { instanceId: "p02-n6-v1", instanceName: "n = 6", instanceNameEn: "n = 6", parameters: { n: 6 }, baselineAnswer: { "radius": "0.2", "centers": [["1.5", "1"], ["1.25", "1.433012702"], ["0.75", "1.433012702"], ["0.5", "1"], ["0.75", "0.566987298"], ["1.25", "0.566987298"]] } },
  { instanceId: "p02-n7-v1", instanceName: "n = 7", instanceNameEn: "n = 7", parameters: { n: 7 }, baselineAnswer: { "radius": "0.173553495", "centers": [["1.5", "1"], ["1.311744901", "1.390915741"], ["0.888739533", "1.487463956"], ["0.549515566", "1.21694187"], ["0.549515566", "0.78305813"], ["0.888739533", "0.512536044"], ["1.311744901", "0.609084259"]] } },
  { instanceId: "p02-n8-v1", instanceName: "n = 8", instanceNameEn: "n = 8", parameters: { n: 8 }, baselineAnswer: { "radius": "0.153073372", "centers": [["1.5", "1"], ["1.353553391", "1.353553391"], ["1", "1.5"], ["0.646446609", "1.353553391"], ["0.5", "1"], ["0.646446609", "0.646446609"], ["1", "0.5"], ["1.353553391", "0.646446609"]] } },
  { instanceId: "p02-n9-v1", instanceName: "n = 9", instanceNameEn: "n = 9", parameters: { n: 9 }, baselineAnswer: { "radius": "0.136808057", "centers": [["1.5", "1"], ["1.383022222", "1.321393805"], ["1.086824089", "1.492403877"], ["0.75", "1.433012702"], ["0.53015369", "1.171010072"], ["0.53015369", "0.828989928"], ["0.75", "0.566987298"], ["1.086824089", "0.507596123"], ["1.383022222", "0.678606195"]] } },
  { instanceId: "p02-n10-v1", instanceName: "n = 10", instanceNameEn: "n = 10", parameters: { n: 10 }, baselineAnswer: { "radius": "0.123606797", "centers": [["1.5", "1"], ["1.404508497", "1.293892626"], ["1.154508497", "1.475528258"], ["0.845491503", "1.475528258"], ["0.595491503", "1.293892626"], ["0.5", "1"], ["0.595491503", "0.706107374"], ["0.845491503", "0.524471742"], ["1.154508497", "0.524471742"], ["1.404508497", "0.706107374"]] } },
  { instanceId: "p02-n11-v1", instanceName: "n = 11", instanceNameEn: "n = 11", parameters: { n: 11 }, baselineAnswer: { "radius": "0.112693022", "centers": [["1.5", "1"], ["1.420626766", "1.270320409"], ["1.207707507", "1.454815998"], ["0.928842581", "1.494910721"], ["0.672569633", "1.377874787"], ["0.520253513", "1.140866278"], ["0.520253513", "0.859133722"], ["0.672569633", "0.622125213"], ["0.928842581", "0.505089279"], ["1.207707507", "0.545184002"], ["1.420626766", "0.729679591"]] } },
  { instanceId: "p02-n12-v1", instanceName: "n = 12", instanceNameEn: "n = 12", parameters: { n: 12 }, baselineAnswer: { "radius": "0.103527618", "centers": [["1.5", "1"], ["1.433012702", "1.25"], ["1.25", "1.433012702"], ["1", "1.5"], ["0.75", "1.433012702"], ["0.566987298", "1.25"], ["0.5", "1"], ["0.566987298", "0.75"], ["0.75", "0.566987298"], ["1", "0.5"], ["1.25", "0.566987298"], ["1.433012702", "0.75"]] } },
  { instanceId: "p02-n13-v1", instanceName: "n = 13", instanceNameEn: "n = 13", parameters: { n: 13 }, baselineAnswer: { "radius": "0.095726265", "centers": [["1.5", "1"], ["1.442728013", "1.232361586"], ["1.284032373", "1.411491933"], ["1.06026834", "1.496354437"], ["0.822697556", "1.467508121"], ["0.625744626", "1.331561329"], ["0.514529091", "1.119657832"], ["0.514529091", "0.880342168"], ["0.625744626", "0.668438671"], ["0.822697556", "0.532491879"], ["1.06026834", "0.503645563"], ["1.284032373", "0.588508067"], ["1.442728013", "0.767638414"]] } },
  { instanceId: "p02-n14-v1", instanceName: "n = 14", instanceNameEn: "n = 14", parameters: { n: 14 }, baselineAnswer: { "radius": "0.089008373", "centers": [["1.5", "1"], ["1.450484434", "1.21694187"], ["1.311744901", "1.390915741"], ["1.111260467", "1.487463956"], ["0.888739533", "1.487463956"], ["0.688255099", "1.390915741"], ["0.549515566", "1.21694187"], ["0.5", "1"], ["0.549515566", "0.78305813"], ["0.688255099", "0.609084259"], ["0.888739533", "0.512536044"], ["1.111260467", "0.512536044"], ["1.311744901", "0.609084259"], ["1.450484434", "0.78305813"]] } },
  { instanceId: "p02-n15-v1", instanceName: "n = 15", instanceNameEn: "n = 15", parameters: { n: 15 }, baselineAnswer: { "radius": "0.083164676", "centers": [["1.5", "1"], ["1.456772729", "1.203368322"], ["1.334565303", "1.371572413"], ["1.154508497", "1.475528258"], ["0.947735768", "1.497260948"], ["0.75", "1.433012702"], ["0.595491503", "1.293892626"], ["0.5109262", "1.103955845"], ["0.5109262", "0.896044155"], ["0.595491503", "0.706107374"], ["0.75", "0.566987298"], ["0.947735768", "0.502739052"], ["1.154508497", "0.524471742"], ["1.334565303", "0.628427587"], ["1.456772729", "0.796631678"]] } },
  { instanceId: "p02-n16-v1", instanceName: "n = 16", instanceNameEn: "n = 16", parameters: { n: 16 }, baselineAnswer: { "radius": "0.078036128", "centers": [["1.5", "1"], ["1.461939766", "1.191341716"], ["1.353553391", "1.353553391"], ["1.191341716", "1.461939766"], ["1", "1.5"], ["0.808658284", "1.461939766"], ["0.646446609", "1.353553391"], ["0.538060234", "1.191341716"], ["0.5", "1"], ["0.538060234", "0.808658284"], ["0.646446609", "0.646446609"], ["0.808658284", "0.538060234"], ["1", "0.5"], ["1.191341716", "0.538060234"], ["1.353553391", "0.646446609"], ["1.461939766", "0.808658284"]] } },
  { instanceId: "p02-n17-v1", instanceName: "n = 17", instanceNameEn: "n = 17", parameters: { n: 17 }, baselineAnswer: { "radius": "0.073499807", "centers": [["1.5", "1"], ["1.466236115", "1.180620833"], ["1.369504459", "1.336847822"], ["1.222869178", "1.447581646"], ["1.04613418", "1.497867088"], ["0.863168505", "1.480912822"], ["0.698682682", "1.399008614"], ["0.574891432", "1.263216081"], ["0.50851345", "1.091874759"], ["0.50851345", "0.908125241"], ["0.574891432", "0.736783919"], ["0.698682682", "0.600991386"], ["0.863168505", "0.519087178"], ["1.04613418", "0.502132912"], ["1.222869178", "0.552418354"], ["1.369504459", "0.663152178"], ["1.466236115", "0.819379167"]] } },
  { instanceId: "p02-n18-v1", instanceName: "n = 18", instanceNameEn: "n = 18", parameters: { n: 18 }, baselineAnswer: { "radius": "0.069459271", "centers": [["1.5", "1"], ["1.46984631", "1.171010072"], ["1.383022222", "1.321393805"], ["1.25", "1.433012702"], ["1.086824089", "1.492403877"], ["0.913175911", "1.492403877"], ["0.75", "1.433012702"], ["0.616977778", "1.321393805"], ["0.53015369", "1.171010072"], ["0.5", "1"], ["0.53015369", "0.828989928"], ["0.616977778", "0.678606195"], ["0.75", "0.566987298"], ["0.913175911", "0.507596123"], ["1.086824089", "0.507596123"], ["1.25", "0.566987298"], ["1.383022222", "0.678606195"], ["1.46984631", "0.828989928"]] } },
  { instanceId: "p02-n19-v1", instanceName: "n = 19", instanceNameEn: "n = 19", parameters: { n: 19 }, baselineAnswer: { "radius": "0.065837836", "centers": [["1.5", "1"], ["1.472908621", "1.162349735"], ["1.394570255", "1.307106356"], ["1.273474079", "1.418583239"], ["1.122742744", "1.484700133"], ["0.958710327", "1.498292247"], ["0.799152288", "1.457886663"], ["0.661359214", "1.367861955"], ["0.560263124", "1.237973697"], ["0.506819348", "1.082297295"], ["0.506819348", "0.917702705"], ["0.560263124", "0.762026303"], ["0.661359214", "0.632138045"], ["0.799152288", "0.542113337"], ["0.958710327", "0.501707753"], ["1.122742744", "0.515299867"], ["1.273474079", "0.581416761"], ["1.394570255", "0.692893644"], ["1.472908621", "0.837650265"]] } },
  { instanceId: "p02-n20-v1", instanceName: "n = 20", instanceNameEn: "n = 20", parameters: { n: 20 }, baselineAnswer: { "radius": "0.062573786", "centers": [["1.5", "1"], ["1.475528258", "1.154508497"], ["1.404508497", "1.293892626"], ["1.293892626", "1.404508497"], ["1.154508497", "1.475528258"], ["1", "1.5"], ["0.845491503", "1.475528258"], ["0.706107374", "1.404508497"], ["0.595491503", "1.293892626"], ["0.524471742", "1.154508497"], ["0.5", "1"], ["0.524471742", "0.845491503"], ["0.595491503", "0.706107374"], ["0.706107374", "0.595491503"], ["0.845491503", "0.524471742"], ["1", "0.5"], ["1.154508497", "0.524471742"], ["1.293892626", "0.595491503"], ["1.404508497", "0.706107374"], ["1.475528258", "0.845491503"]] } },
  { instanceId: "p02-n21-v1", instanceName: "n = 21", instanceNameEn: "n = 21", parameters: { n: 21 }, baselineAnswer: { "radius": "0.059616906", "centers": [["1.5", "1"], ["1.477786403", "1.147377587"], ["1.413119387", "1.281660029"], ["1.311744901", "1.390915741"], ["1.182670512", "1.465436874"], ["1.037365047", "1.498601899"], ["0.888739533", "1.487463956"], ["0.75", "1.433012702"], ["0.633474064", "1.340086369"], ["0.549515566", "1.21694187"], ["0.505584587", "1.074521133"], ["0.505584587", "0.925478867"], ["0.549515566", "0.78305813"], ["0.633474064", "0.659913631"], ["0.75", "0.566987298"], ["0.888739533", "0.512536044"], ["1.037365047", "0.501398101"], ["1.182670512", "0.534563126"], ["1.311744901", "0.609084259"], ["1.413119387", "0.718339971"], ["1.477786403", "0.852622413"]] } },
  { instanceId: "p02-n22-v1", instanceName: "n = 22", instanceNameEn: "n = 22", parameters: { n: 22 }, baselineAnswer: { "radius": "0.056925935", "centers": [["1.5", "1"], ["1.479746487", "1.140866278"], ["1.420626766", "1.270320409"], ["1.327430367", "1.377874787"], ["1.207707507", "1.454815998"], ["1.071157419", "1.494910721"], ["0.928842581", "1.494910721"], ["0.792292493", "1.454815998"], ["0.672569633", "1.377874787"], ["0.579373234", "1.270320409"], ["0.520253513", "1.140866278"], ["0.5", "1"], ["0.520253513", "0.859133722"], ["0.579373234", "0.729679591"], ["0.672569633", "0.622125213"], ["0.792292493", "0.545184002"], ["0.928842581", "0.505089279"], ["1.071157419", "0.505089279"], ["1.207707507", "0.545184002"], ["1.327430367", "0.622125213"], ["1.420626766", "0.729679591"], ["1.479746487", "0.859133722"]] } },
  { instanceId: "p02-n23-v1", instanceName: "n = 23", instanceNameEn: "n = 23", parameters: { n: 23 }, baselineAnswer: { "radius": "0.054466659", "centers": [["1.5", "1"], ["1.481458644", "1.134898386"], ["1.427209702", "1.259791975"], ["1.341276572", "1.365417982"], ["1.230032519", "1.443942609"], ["1.101728007", "1.489542044"], ["0.965878793", "1.498834385"], ["0.832560194", "1.471130461"], ["0.711659839", "1.408484947"], ["0.612144355", "1.315543972"], ["0.541394349", "1.199200545"], ["0.504657027", "1.068083325"], ["0.504657027", "0.931916675"], ["0.541394349", "0.800799455"], ["0.612144355", "0.684456028"], ["0.711659839", "0.591515053"], ["0.832560194", "0.528869539"], ["0.965878793", "0.501165615"], ["1.101728007", "0.510457956"], ["1.230032519", "0.556057391"], ["1.341276572", "0.634582018"], ["1.427209702", "0.740208025"], ["1.481458644", "0.865101614"]] } },
  { instanceId: "p02-n24-v1", instanceName: "n = 24", instanceNameEn: "n = 24", parameters: { n: 24 }, baselineAnswer: { "radius": "0.052210476", "centers": [["1.5", "1"], ["1.482962913", "1.129409523"], ["1.433012702", "1.25"], ["1.353553391", "1.353553391"], ["1.25", "1.433012702"], ["1.129409523", "1.482962913"], ["1", "1.5"], ["0.870590477", "1.482962913"], ["0.75", "1.433012702"], ["0.646446609", "1.353553391"], ["0.566987298", "1.25"], ["0.517037087", "1.129409523"], ["0.5", "1"], ["0.517037087", "0.870590477"], ["0.566987298", "0.75"], ["0.646446609", "0.646446609"], ["0.75", "0.566987298"], ["0.870590477", "0.517037087"], ["1", "0.5"], ["1.129409523", "0.517037087"], ["1.25", "0.566987298"], ["1.353553391", "0.646446609"], ["1.433012702", "0.75"], ["1.482962913", "0.870590477"]] } },
  { instanceId: "p02-n25-v1", instanceName: "n = 25", instanceNameEn: "n = 25", parameters: { n: 25 }, baselineAnswer: { "radius": "0.050133293", "centers": [["1.5", "1"], ["1.484291581", "1.124344944"], ["1.43815334", "1.240876837"], ["1.364484314", "1.342273553"], ["1.267913397", "1.422163963"], ["1.154508497", "1.475528258"], ["1.03139526", "1.499013364"], ["0.906309343", "1.491143625"], ["0.787110354", "1.452413526"], ["0.681288005", "1.385256621"], ["0.595491503", "1.293892626"], ["0.535111757", "1.184062276"], ["0.503942649", "1.062666617"], ["0.503942649", "0.937333383"], ["0.535111757", "0.815937724"], ["0.595491503", "0.706107374"], ["0.681288005", "0.614743379"], ["0.787110354", "0.547586474"], ["0.906309343", "0.508856375"], ["1.03139526", "0.500986636"], ["1.154508497", "0.524471742"], ["1.267913397", "0.577836037"], ["1.364484314", "0.657726447"], ["1.43815334", "0.759123163"], ["1.484291581", "0.875655056"]] } },
  { instanceId: "p02-n26-v1", instanceName: "n = 26", instanceNameEn: "n = 26", parameters: { n: 26 }, baselineAnswer: { "radius": "0.048214672", "centers": [["1.5", "1"], ["1.485470909", "1.119657832"], ["1.442728013", "1.232361586"], ["1.374255374", "1.331561329"], ["1.284032373", "1.411491933"], ["1.177302444", "1.467508121"], ["1.06026834", "1.496354437"], ["0.93973166", "1.496354437"], ["0.822697556", "1.467508121"], ["0.715967627", "1.411491933"], ["0.625744626", "1.331561329"], ["0.557271987", "1.232361586"], ["0.514529091", "1.119657832"], ["0.5", "1"], ["0.514529091", "0.880342168"], ["0.557271987", "0.767638414"], ["0.625744626", "0.668438671"], ["0.715967627", "0.588508067"], ["0.822697556", "0.532491879"], ["0.93973166", "0.503645563"], ["1.06026834", "0.503645563"], ["1.177302444", "0.532491879"], ["1.284032373", "0.588508067"], ["1.374255374", "0.668438671"], ["1.442728013", "0.767638414"], ["1.485470909", "0.880342168"]] } },
  { instanceId: "p02-n27-v1", instanceName: "n = 27", instanceNameEn: "n = 27", parameters: { n: 27 }, baselineAnswer: { "radius": "0.046437165", "centers": [["1.5", "1"], ["1.486522435", "1.115307935"], ["1.44681632", "1.22439959"], ["1.383022222", "1.321393805"], ["1.298579296", "1.401061596"], ["1.198039883", "1.459108053"], ["1.086824089", "1.492403877"], ["0.970927586", "1.499154079"], ["0.856598384", "1.478994756"], ["0.75", "1.433012702"], ["0.656879181", "1.363686821"], ["0.582256094", "1.274754489"], ["0.53015369", "1.171010072"], ["0.503380821", "1.058046457"], ["0.503380821", "0.941953543"], ["0.53015369", "0.828989928"], ["0.582256094", "0.725245511"], ["0.656879181", "0.636313179"], ["0.75", "0.566987298"], ["0.856598384", "0.521005244"], ["0.970927586", "0.500845921"], ["1.086824089", "0.507596123"], ["1.198039883", "0.540891947"], ["1.298579296", "0.598938404"], ["1.383022222", "0.678606195"], ["1.44681632", "0.77560041"], ["1.486522435", "0.884692065"]] } },
  { instanceId: "p02-n28-v1", instanceName: "n = 28", instanceNameEn: "n = 28", parameters: { n: 28 }, baselineAnswer: { "radius": "0.04478579", "centers": [["1.5", "1"], ["1.487463956", "1.111260467"], ["1.450484434", "1.21694187"], ["1.390915741", "1.311744901"], ["1.311744901", "1.390915741"], ["1.21694187", "1.450484434"], ["1.111260467", "1.487463956"], ["1", "1.5"], ["0.888739533", "1.487463956"], ["0.78305813", "1.450484434"], ["0.688255099", "1.390915741"], ["0.609084259", "1.311744901"], ["0.549515566", "1.21694187"], ["0.512536044", "1.111260467"], ["0.5", "1"], ["0.512536044", "0.888739533"], ["0.549515566", "0.78305813"], ["0.609084259", "0.688255099"], ["0.688255099", "0.609084259"], ["0.78305813", "0.549515566"], ["0.888739533", "0.512536044"], ["1", "0.5"], ["1.111260467", "0.512536044"], ["1.21694187", "0.549515566"], ["1.311744901", "0.609084259"], ["1.390915741", "0.688255099"], ["1.450484434", "0.78305813"], ["1.487463956", "0.888739533"]] } },
  { instanceId: "p02-n29-v1", instanceName: "n = 29", instanceNameEn: "n = 29", parameters: { n: 29 }, baselineAnswer: { "radius": "0.043247607", "centers": [["1.5", "1"], ["1.488310278", "1.10748522"], ["1.45378771", "1.209944551"], ["1.398046533", "1.302587108"], ["1.323693142", "1.381081028"], ["1.23420422", "1.441756022"], ["1.133764169", "1.481774996"], ["1.027069454", "1.499266707"], ["0.919109002", "1.493413261"], ["0.814930922", "1.46448836"], ["0.719406467", "1.413844499"], ["0.637002254", "1.343849729"], ["0.571571412", "1.257776929"], ["0.526173414", "1.159650765"], ["0.502931021", "1.054059509"], ["0.502931021", "0.945940491"], ["0.526173414", "0.840349235"], ["0.571571412", "0.742223071"], ["0.637002254", "0.656150271"], ["0.719406467", "0.586155501"], ["0.814930922", "0.53551164"], ["0.919109002", "0.506586739"], ["1.027069454", "0.500733293"], ["1.133764169", "0.518225004"], ["1.23420422", "0.558243978"], ["1.323693142", "0.618918972"], ["1.398046533", "0.697412892"], ["1.45378771", "0.790055449"], ["1.488310278", "0.89251478"]] } },
  { instanceId: "p02-n30-v1", instanceName: "n = 30", instanceNameEn: "n = 30", parameters: { n: 30 }, baselineAnswer: { "radius": "0.041811385", "centers": [["1.5", "1"], ["1.4890738", "1.103955845"], ["1.456772729", "1.203368322"], ["1.404508497", "1.293892626"], ["1.334565303", "1.371572413"], ["1.25", "1.433012702"], ["1.154508497", "1.475528258"], ["1.052264232", "1.497260948"], ["0.947735768", "1.497260948"], ["0.845491503", "1.475528258"], ["0.75", "1.433012702"], ["0.665434697", "1.371572413"], ["0.595491503", "1.293892626"], ["0.543227271", "1.203368322"], ["0.5109262", "1.103955845"], ["0.5", "1"], ["0.5109262", "0.896044155"], ["0.543227271", "0.796631678"], ["0.595491503", "0.706107374"], ["0.665434697", "0.628427587"], ["0.75", "0.566987298"], ["0.845491503", "0.524471742"], ["0.947735768", "0.502739052"], ["1.052264232", "0.502739052"], ["1.154508497", "0.524471742"], ["1.25", "0.566987298"], ["1.334565303", "0.628427587"], ["1.404508497", "0.706107374"], ["1.456772729", "0.796631678"], ["1.4890738", "0.896044155"]] } }
];
var definition2 = {
  id: "p02",
  instanceId: "p02-n6-v1",
  code: "P02",
  slug: "circle-circle-packing",
  category: "packing",
  title: "\u5355\u4F4D\u5706\u5185\u7684\u7B49\u5706\u88C5\u7BB1",
  summary: "\u5728\u5355\u4F4D\u5706\u5185\u653E\u7F6E n \u4E2A\u4E92\u4E0D\u76F8\u4EA4\u7684\u7B49\u5706\u3002",
  objective: "maximize",
  scoreLabel: "\u5171\u540C\u534A\u5F84",
  instanceName: "n = 6",
  parameters: { n: 6 },
  baselineAnswer: instances[4].baselineAnswer,
  answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.2"\u3002',
  extent: 2 * SCALE,
  frame: '\u5BB9\u5668\u662F\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u6240\u4EE5\u4E24\u4E2A\u5750\u6807\u90FD\u5728 0 \u5230 2 \u4E4B\u95F4\u3002\u5750\u6807\u548C\u534A\u5F84\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a circle of radius 1 centred at (1, 1), so both coordinates run from 0 to 2. Coordinates and radii share one unit and are written as plain decimals such as "0.5", to at most nine decimal places.',
  titleEn: "Equal-circle packing in a unit circle",
  summaryEn: "Place n non-overlapping equal circles inside the unit circle.",
  scoreLabelEn: "common radius",
  instanceNameEn: "n = 6",
  answerHelpEn: 'Submit radius and centers. Write every number as a decimal string, for example "0.2".',
  definition: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E\u7F6E n \u4E2A\u534A\u5F84\u76F8\u540C\u3001\u4E92\u4E0D\u91CD\u53E0\u7684\u5C0F\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n non-overlapping circles of one common radius inside a circle of radius 1, making that radius as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u4E24\u4E2A\u5750\u6807\u90FD\u5728 0 \u5230 2 \u4E4B\u95F4", textEn: "A circle of radius 1 centred at (1, 1), so both coordinates run from 0 to 2" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF1A\u4E00\u4E2A\u5171\u540C\u534A\u5F84 radius \u4E0E n \u4E2A\u5706\u5FC3 centers", textEn: "Exactly n circles: one shared radius and n centres" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927", textEn: "Make the common radius as large as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6700\u4F18\u6784\u5F62\u662F\u300C\u5361\u6B7B\u300D\u7684\u63A5\u89E6\u7ED3\u6784\uFF1A\u5706\u5F7C\u6B64\u9876\u4F4F\u3001\u9876\u4F4F\u8FB9\u754C\uFF0C\u5E38\u51FA\u73B0\u659C\u6392\u3001\u9519\u4F4D\u3001\u4EE5\u53CA\u4E0D\u78B0\u4EFB\u4F55\u90BB\u5C45\u7684\u6E38\u79BB\u5706\u3002\u89C4\u6574\u7684\u7F51\u683C\u6446\u6CD5\u51E0\u4E4E\u4ECE\u4E0D\u6700\u4F18\u3002",
      textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n = 2..14 \u4E0E 19 \u5DF2\u8BC1\u660E\uFF08Specht \u6C47\u603B\u8868 cci \u7684\u7C97\u4F53\u6807\u8BB0\uFF09\uFF1B15..18 \u4E0E 20 \u4EE5\u4E0A\u5168\u90E8\u5F00\u653E\uFF0C\u5305\u62EC\u672C\u7AD9\u5F00\u5230\u7684 29\u3002",
      textEn: "Proven for n = 2..14 and 19 (the bold marks in Specht's cci survey); 15..18 and everything from 20 up are open, including all n offered here.",
      url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/cci/cci.html"
    }
  ],
  requirements: ["\u6240\u6709\u5C0F\u5706\u5FC5\u987B\u5B8C\u5168\u4F4D\u4E8E\u5355\u4F4D\u5706\u5185", "\u5C0F\u5706\u4E4B\u95F4\u4E0D\u80FD\u91CD\u53E0", "\u6240\u6709\u5C0F\u5706\u534A\u5F84\u76F8\u540C"],
  requirementsEn: ["Every small circle stays inside the unit circle", "Small circles do not overlap", "All small circles have equal radius"],
  instances
};
function verifyCircleCircles(params, answer) {
  const n = asInt(params.n, "n"), container = SCALE, radius = parseFixed(answer.radius, "radius");
  const centers = asArray(answer.centers, "centers").map((point, i) => parseFixedPoint(point, `centers[${i}]`));
  if (radius <= 0 || radius > container || centers.length !== n) return fail("COUNT_OR_RADIUS", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\uFF0C\u4E14\u534A\u5F84\u6709\u6548`, `exactly ${n} circles are needed, with a valid radius`);
  const boundary = sq(container - radius);
  for (const [x, y] of centers) {
    if (x < 0 || y < 0) return fail("OUT_OF_BOUNDS", "\u5750\u6807\u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570", "coordinates must be non-negative integers");
    if (sq(x - container) + sq(y - container) > boundary) return fail("OUT_OF_BOUNDS", "\u81F3\u5C11\u4E00\u4E2A\u5706\u8D85\u51FA\u4E86\u5BB9\u5668\u5706", "at least one circle reaches outside the container");
  }
  const minDistance = 4n * sq(radius);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]) < minDistance) return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E\u5706 ${j + 1} \u76F8\u4EA4`, `circles ${i + 1} and ${j + 1} intersect`);
  return ok(BigInt(radius), printFixed(radius));
}
var problem2 = { definition: definition2, verify: verifyCircleCircles };

// src/problems/p03-heilbronn-triangle.ts
var instances2 = [
  { instanceId: "p03-n5-v1", instanceName: "n = 5", instanceNameEn: "n = 5", parameters: { n: 5 }, baselineAnswer: { "points": [["0", "0"], ["0.2", "0.2"], ["0.4", "0.8"], ["0.6", "0.8"], ["0.8", "0.2"]] } },
  { instanceId: "p03-n6-v1", instanceName: "n = 6", instanceNameEn: "n = 6", parameters: { n: 6 }, baselineAnswer: { "points": [["0", "0"], ["0.142857142", "0.142857142"], ["0.285714285", "0.571428571"], ["0.428571428", "0.285714285"], ["0.571428571", "0.285714285"], ["0.714285714", "0.571428571"]] } },
  { instanceId: "p03-n7-v1", instanceName: "n = 7", instanceNameEn: "n = 7", parameters: { n: 7 }, baselineAnswer: { "points": [["0", "0"], ["0.142857142", "0.142857142"], ["0.285714285", "0.571428571"], ["0.428571428", "0.285714285"], ["0.571428571", "0.285714285"], ["0.714285714", "0.571428571"], ["0.857142857", "0.142857142"]] } },
  { instanceId: "p03-n8-v1", instanceName: "n = 8", instanceNameEn: "n = 8", parameters: { n: 8 }, baselineAnswer: { "points": [["0", "0"], ["0.09090909", "0.09090909"], ["0.181818181", "0.363636363"], ["0.272727272", "0.818181818"], ["0.363636363", "0.454545454"], ["0.454545454", "0.272727272"], ["0.545454545", "0.272727272"], ["0.636363636", "0.454545454"]] } },
  { instanceId: "p03-n9-v1", instanceName: "n = 9", instanceNameEn: "n = 9", parameters: { n: 9 }, baselineAnswer: { "points": [["0", "0"], ["0.09090909", "0.09090909"], ["0.181818181", "0.363636363"], ["0.272727272", "0.818181818"], ["0.363636363", "0.454545454"], ["0.454545454", "0.272727272"], ["0.545454545", "0.272727272"], ["0.636363636", "0.454545454"], ["0.727272727", "0.818181818"]] } },
  { instanceId: "p03-n10-v1", instanceName: "n = 10", instanceNameEn: "n = 10", parameters: { n: 10 }, baselineAnswer: { "points": [["0", "0"], ["0.09090909", "0.09090909"], ["0.181818181", "0.363636363"], ["0.272727272", "0.818181818"], ["0.363636363", "0.454545454"], ["0.454545454", "0.272727272"], ["0.545454545", "0.272727272"], ["0.636363636", "0.454545454"], ["0.727272727", "0.818181818"], ["0.818181818", "0.363636363"]] } },
  { instanceId: "p03-n11-v1", instanceName: "n = 11", instanceNameEn: "n = 11", parameters: { n: 11 }, baselineAnswer: { "points": [["0", "0"], ["0.09090909", "0.09090909"], ["0.181818181", "0.363636363"], ["0.272727272", "0.818181818"], ["0.363636363", "0.454545454"], ["0.454545454", "0.272727272"], ["0.545454545", "0.272727272"], ["0.636363636", "0.454545454"], ["0.727272727", "0.818181818"], ["0.818181818", "0.363636363"], ["0.909090909", "0.09090909"]] } },
  { instanceId: "p03-n12-v1", instanceName: "n = 12", instanceNameEn: "n = 12", parameters: { n: 12 }, baselineAnswer: { "points": [["0", "0"], ["0.076923076", "0.076923076"], ["0.153846153", "0.307692307"], ["0.23076923", "0.692307692"], ["0.307692307", "0.23076923"], ["0.384615384", "0.923076923"], ["0.461538461", "0.769230769"], ["0.538461538", "0.769230769"], ["0.615384615", "0.923076923"], ["0.692307692", "0.23076923"], ["0.769230769", "0.692307692"], ["0.846153846", "0.307692307"]] } },
  { instanceId: "p03-n13-v1", instanceName: "n = 13", instanceNameEn: "n = 13", parameters: { n: 13 }, baselineAnswer: { "points": [["0", "0"], ["0.076923076", "0.076923076"], ["0.153846153", "0.307692307"], ["0.23076923", "0.692307692"], ["0.307692307", "0.23076923"], ["0.384615384", "0.923076923"], ["0.461538461", "0.769230769"], ["0.538461538", "0.769230769"], ["0.615384615", "0.923076923"], ["0.692307692", "0.23076923"], ["0.769230769", "0.692307692"], ["0.846153846", "0.307692307"], ["0.923076923", "0.076923076"]] } },
  { instanceId: "p03-n14-v1", instanceName: "n = 14", instanceNameEn: "n = 14", parameters: { n: 14 }, baselineAnswer: { "points": [["0", "0"], ["0.058823529", "0.058823529"], ["0.117647058", "0.235294117"], ["0.176470588", "0.529411764"], ["0.235294117", "0.94117647"], ["0.294117647", "0.470588235"], ["0.352941176", "0.117647058"], ["0.411764705", "0.882352941"], ["0.470588235", "0.764705882"], ["0.529411764", "0.764705882"], ["0.588235294", "0.882352941"], ["0.647058823", "0.117647058"], ["0.705882352", "0.470588235"], ["0.764705882", "0.94117647"]] } },
  { instanceId: "p03-n15-v1", instanceName: "n = 15", instanceNameEn: "n = 15", parameters: { n: 15 }, baselineAnswer: { "points": [["0", "0"], ["0.058823529", "0.058823529"], ["0.117647058", "0.235294117"], ["0.176470588", "0.529411764"], ["0.235294117", "0.94117647"], ["0.294117647", "0.470588235"], ["0.352941176", "0.117647058"], ["0.411764705", "0.882352941"], ["0.470588235", "0.764705882"], ["0.529411764", "0.764705882"], ["0.588235294", "0.882352941"], ["0.647058823", "0.117647058"], ["0.705882352", "0.470588235"], ["0.764705882", "0.94117647"], ["0.823529411", "0.529411764"]] } },
  { instanceId: "p03-n16-v1", instanceName: "n = 16", instanceNameEn: "n = 16", parameters: { n: 16 }, baselineAnswer: { "points": [["0", "0"], ["0.058823529", "0.058823529"], ["0.117647058", "0.235294117"], ["0.176470588", "0.529411764"], ["0.235294117", "0.94117647"], ["0.294117647", "0.470588235"], ["0.352941176", "0.117647058"], ["0.411764705", "0.882352941"], ["0.470588235", "0.764705882"], ["0.529411764", "0.764705882"], ["0.588235294", "0.882352941"], ["0.647058823", "0.117647058"], ["0.705882352", "0.470588235"], ["0.764705882", "0.94117647"], ["0.823529411", "0.529411764"], ["0.882352941", "0.235294117"]] } }
];
var definition3 = {
  id: "p03",
  instanceId: "p03-n6-v1",
  code: "P03",
  slug: "heilbronn-triangle",
  category: "extremal",
  title: "Heilbronn \u6700\u5C0F\u4E09\u89D2\u5F62\u9762\u79EF",
  summary: "\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u6700\u5927\u5316\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u9762\u79EF\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u4E09\u89D2\u5F62\u9762\u79EF",
  instanceName: "n = 6",
  parameters: { n: 6 },
  baselineAnswer: instances2[1].baselineAnswer,
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002',
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u5750\u6807\u548C\u957F\u5EA6\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and lengths share one unit and are written as plain decimals such as "0.5", to at most nine decimal places.',
  titleEn: "Heilbronn minimum triangle area",
  summaryEn: "Place n points and maximize the smallest triangle area among all triples.",
  scoreLabelEn: "minimum triangle area",
  instanceNameEn: "n = 6",
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5".',
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u4E09\u89D2\u5F62\u4E2D\u6700\u5C0F\u7684\u90A3\u4E2A\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n points in the unit square so that the smallest triangle formed by any three of them is as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9 points\uFF0C\u4EFB\u610F\u4E09\u70B9\u4E0D\u5171\u7EBF", textEn: "Exactly n points, no three collinear" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u6B63\u65B9\u5F62\u5185\u6216\u8FB9\u754C\u4E0A", textEn: "Every point lies inside the square or on its boundary" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u4E09\u89D2\u5F62\u4E2D\u6700\u5C0F\u7684\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u4E8C\u500D\u9762\u79EF\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the smallest triangle over all triples as large as possible; compared internally by twice the area, exactly" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u628A\u70B9\u6492\u5F97\u5747\u5300\u5E76\u4E0D\u591F\uFF1A\u4EFB\u4F55\u4E09\u70B9\u90FD\u4E0D\u80FD\u63A5\u8FD1\u5171\u7EBF\uFF0C\u800C\u8FD1\u5171\u7EBF\u6070\u6070\u662F\u770B\u8D77\u6765\u6574\u9F50\u7684\u6392\u5E03\u6700\u5BB9\u6613\u72AF\u7684\u9519\u3002\u6700\u4F18\u6784\u5F62\u5F80\u5F80\u4E0D\u5BF9\u79F0\uFF0C\u8FDE\u5F62\u72B6\u90FD\u96BE\u731C\u3002",
      textEn: "Even spreading is not enough: no three points may come close to collinear, and near-collinearity is exactly what tidy arrangements love to do. Optima are often asymmetric and hard even to guess."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n = 5..9 \u5DF2\u8BC1\u660E\uFF08Yang\u3001Zhang\u3001Zeng \u4E0E Dress \u7B49\uFF0C1991\u20131995\uFF09\uFF1Bn \u2265 10 \u53EA\u6709\u6570\u503C\u4E0B\u754C\uFF0C\u6700\u65B0\u7684\u7EFC\u8FF0\u4E0E\u6784\u9020\u89C1 arXiv:2603.11107\u3002Goldberg (1972) \u7684\u6784\u9020\u957F\u671F\u662F\u8FD9\u4E00\u65CF\u7684\u57FA\u51C6\u3002",
      textEn: "Proven for n = 5..9 (Yang, Zhang, Zeng and Dress, 1991\u20131995); for n \u2265 10 only numerical lower bounds exist \u2014 see arXiv:2603.11107 for the current survey. Goldberg's 1972 constructions were the benchmark for decades.",
      url: "https://arxiv.org/abs/2603.11107"
    }
  ],
  requirements: ["\u6240\u6709\u70B9\u4F4D\u4E8E\u5355\u4F4D\u6B63\u65B9\u5F62\u5185", "\u4EFB\u610F\u4E09\u70B9\u90FD\u4E0D\u80FD\u5171\u7EBF", "\u5206\u6570\u53D6\u6240\u6709\u4E09\u89D2\u5F62\u4E2D\u7684\u6700\u5C0F\u9762\u79EF"],
  requirementsEn: ["All points lie in the unit square", "No three selected points are collinear", "The score is the smallest triangle area"],
  instances: instances2
};
function verifyHeilbronn(params, answer) {
  const n = asInt(params.n, "n"), size = SCALE;
  const points = asArray(answer.points, "points").map((point, i) => parseFixedPoint(point, `points[${i}]`));
  if (points.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  for (const [x, y] of points) if (x < 0 || y < 0 || x > size || y > size) return fail("OUT_OF_BOUNDS", "\u81F3\u5C11\u4E00\u4E2A\u70B9\u4E0D\u5728\u6B63\u65B9\u5F62\u5185", "at least one point lies outside the square");
  let minimum = null;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    const [ax, ay] = points[i], [bx, by] = points[j], [cx, cy] = points[k];
    const area2 = absBig(BigInt(bx - ax) * BigInt(cy - ay) - BigInt(by - ay) * BigInt(cx - ax));
    if (minimum === null || area2 < minimum) minimum = area2;
  }
  if (!minimum || minimum === 0n) return fail("COLLINEAR", "\u5B58\u5728\u4E09\u4E2A\u5171\u7EBF\u70B9\uFF0C\u6700\u5C0F\u9762\u79EF\u4E3A 0", "three of the points are collinear, so the smallest area is 0");
  return ok(minimum, `${minimum} / (2\xB710\xB9\u2078)`);
}
function absBig(value) {
  return value < 0n ? -value : value;
}
var problem3 = { definition: definition3, verify: verifyHeilbronn };

// src/problems/p05-tilted-squares-in-circle.ts
var MIN_N = 3;
var MAX_N = 14;
var COORD_LIMIT = 4 * SCALE;
var RADIUS = SCALE;
var CENTRE = SCALE;
var dot = (a, b) => a[0] * b[0] + a[1] * b[1];
var absBig2 = (value) => value < 0n ? -value : value;
function separated(a, b) {
  const d = [b.c[0] - a.c[0], b.c[1] - a.c[1]];
  for (const axis of [a.u, a.v, b.u, b.v]) {
    const reach = absBig2(dot(axis, a.u)) + absBig2(dot(axis, a.v)) + absBig2(dot(axis, b.u)) + absBig2(dot(axis, b.v));
    if (absBig2(dot(axis, d)) >= reach) return true;
  }
  return false;
}
function rowBaseline(n) {
  const side2 = Math.floor(2 * RADIUS / Math.sqrt(n * n + 1)) - 4;
  const half = Math.floor(side2 / 2);
  const left = CENTRE - half * n;
  return {
    squares: Array.from({ length: n }, (_, index) => ({
      cx: printFixed(left + half * (2 * index + 1)),
      cy: printFixed(CENTRE),
      ux: printFixed(half),
      uy: printFixed(0)
    }))
  };
}
var instances3 = Array.from({ length: MAX_N - MIN_N + 1 }, (_, index) => {
  const n = MIN_N + index;
  return {
    instanceId: `p05-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition4 = {
  id: "p05",
  instanceId: "p05-n6-v2",
  code: "P05",
  slug: "tilted-squares-in-circle",
  category: "packing",
  title: "\u53EF\u503E\u659C\u7B49\u6B63\u65B9\u5F62\u88C5\u5165\u5706",
  summary: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E n \u4E2A\u6B63\u65B9\u5F62\uFF0C\u5927\u5C0F\u5B8C\u5168\u4E00\u6837\uFF0C\u6BCF\u4E2A\u90FD\u53EF\u4EE5\u4EFB\u610F\u8F6C\u89D2\u5EA6\uFF1B\u8BA9\u8FD9\u4E2A\u5171\u540C\u7684\u8FB9\u957F\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u8FB9\u957F\u7684\u5E73\u65B9",
  goalLabel: "\u6700\u5C0F\u8FB9\u957F",
  scoreIs: "square",
  goalLabelEn: "the smallest side",
  instanceName: "n = 6",
  parameters: { n: 6 },
  baselineAnswer: rowBaseline(6),
  answerHelp: '\u6BCF\u4E2A\u6B63\u65B9\u5F62\u63D0\u4EA4 {cx,cy,ux,uy}\uFF1A\u4E2D\u5FC3\u52A0\u4E00\u6761\u534A\u8FB9\u5411\u91CF\uFF0C\u53E6\u4E00\u6761\u534A\u8FB9\u5411\u91CF\u56FA\u5B9A\u53D6 (-uy,ux)\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.4"\uFF1B\u89D2\u5EA6\u5B8C\u5168\u81EA\u7531\uFF0C\u8BA1\u5206\u53D6\u6700\u5C0F\u6B63\u65B9\u5F62\u7684\u8FB9\u957F\uFF0C\u6240\u4EE5\u628A\u5B83\u4EEC\u5199\u5F97\u4E00\u6837\u5927\u6700\u5212\u7B97\u3002\u8FB9\u957F\u672C\u8EAB\u51E0\u4E4E\u603B\u662F\u65E0\u7406\u6570\uFF0C\u5199\u4E0D\u6210\u6709\u9650\u5C0F\u6570\uFF0C\u6240\u4EE5\u4F60\u5199\u7684\u662F\u90A3\u6761\u534A\u8FB9\u5411\u91CF\uFF0C\u8FB9\u957F\u7531\u5B83\u7CBE\u786E\u5B9A\u51FA\u3002',
  titleEn: "Tilted equal squares in a circle",
  summaryEn: "Place n equal squares inside a circle of radius 1, each free to tilt, and maximize their common side.",
  scoreLabelEn: "smallest side squared",
  instanceNameEn: "n = 6",
  answerHelpEn: 'Submit {cx,cy,ux,uy} per square: a centre plus one half-edge vector, the other half-edge being (-uy,ux). Write every number as a decimal string such as "0.4", every angle is free, and the smallest square is the one scored, so writing them equal is the winning move. The side is almost always irrational, so what you write is the half-edge vector and the side follows from it exactly.',
  definition: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E n \u4E2A\u53EF\u4EFB\u610F\u65CB\u8F6C\u7684\u6B63\u65B9\u5F62\uFF0C\u8FB9\u957F\u5B8C\u5168\u76F8\u540C\u3001\u4E92\u4E0D\u91CD\u53E0\uFF0C\u4F7F\u5171\u540C\u8FB9\u957F\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n freely rotatable squares of one common side inside a circle of radius 1, none overlapping, making that side as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u4E24\u4E2A\u5750\u6807\u90FD\u5728 0 \u5230 2 \u4E4B\u95F4", textEn: "A circle of radius 1 centred at (1, 1), so both coordinates run from 0 to 2" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6BCF\u4E2A\u6B63\u65B9\u5F62\u5199 {cx, cy, ux, uy}\uFF1A\u4E2D\u5FC3\u52A0\u4E00\u6761\u534A\u8FB9\u5411\u91CF\uFF0C\u53E6\u4E00\u6761\u56FA\u5B9A\u53D6 (\u2212uy, ux)", textEn: "Each square is {cx, cy, ux, uy}: a centre plus one half-edge vector, the other fixed as (\u2212uy, ux)" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u6B63\u65B9\u5F62\u7684\u89D2\u5EA6\u5B8C\u5168\u81EA\u7531\uFF1B\u5168\u90E8\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u8D34\u8FB9\u63A5\u89E6\u5141\u8BB8\u3002\u8BA1\u5206\u53EA\u770B\u6700\u5C0F\u7684\u90A3\u4E2A\u6B63\u65B9\u5F62\uFF0C\u6240\u4EE5\u8FB9\u957F\u4E0D\u4E00\u81F4\u5360\u4E0D\u5230\u4FBF\u5B9C", textEn: "Every square tilts freely; all lie inside the container; no two overlap in their interiors, touching allowed. Only the smallest square is scored, so unequal sides gain nothing" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u8FB9\u957F\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u5176\u5E73\u65B9\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the common side as large as possible; compared internally by its square, exactly" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u5706\u5F62\u5BB9\u5668\u6CA1\u6709\u89D2\uFF1A\u6B63\u65B9\u5F62\u7684\u76F4\u8FB9\u8D34\u4E0D\u4F4F\u5F27\u5F62\u8FB9\u754C\uFF0C\u6700\u4F18\u89E3\u51E0\u4E4E\u603B\u662F\u503E\u659C\u7684\uFF0C\u6B63\u65B9\u5F62\u5F7C\u6B64\u4EE5\u89D2\u76F8\u62B5\u3002",
      textEn: "A circular container has no corners: straight sides cannot hug the arc, so optima are almost always tilted, squares bracing corner against corner."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n = 4 \u5DF2\u8BC1\u660E\uFF1B\u5176\u4F59\u5DF2\u77E5\u6700\u597D\u503C\u53D6\u81EA Friedman \u7684 squares-in-circles \u6C47\u603B\uFF081997 \u5E74\u8D77\u591A\u4EBA\u8D21\u732E\uFF09\uFF0C\u5168\u90E8\u672A\u8BC1\u660E\u3002",
      textEn: "n = 4 is proven; the other best known values come from Friedman's squares-in-circles survey (many contributors since 1997), none of them proven.",
      url: "https://erich-friedman.github.io/packing/squincir/"
    }
  ],
  extent: 2 * SCALE,
  frame: '\u5BB9\u5668\u662F\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u6240\u4EE5\u5750\u6807\u8303\u56F4\u662F 0 \u5230 2\u3002\u5750\u6807\u548C\u5411\u91CF\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.4"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a circle of radius 1 centred at (1, 1), so coordinates run from 0 to 2. Coordinates and vectors share one unit and are written as plain decimals such as "0.4", to at most nine decimal places.',
  requirements: ["\u6070\u597D n \u4E2A\u6B63\u65B9\u5F62\uFF0C\u89D2\u5EA6\u81EA\u7531\uFF0C\u8BA1\u5206\u53D6\u6700\u5C0F\u7684\u8FB9\u957F", "\u6BCF\u4E2A\u6B63\u65B9\u5F62\u6574\u4F53\u843D\u5728\u5706\u5185", "\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u8D34\u8FB9\u63A5\u89E6\u662F\u5141\u8BB8\u7684"],
  requirementsEn: ["Exactly n squares, any angles; the smallest side is the score", "Every square lies entirely inside the circle", "No two overlap, though touching is allowed"],
  instances: instances3
};
function verifyTiltedSquaresInCircle(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 64) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const squares = asArray(answer.squares, "squares");
  if (squares.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u6B63\u65B9\u5F62`, `exactly ${n} squares are needed`);
  const centre = [BigInt(CENTRE), BigInt(CENTRE)];
  const radiusSquared = BigInt(RADIUS) * BigInt(RADIUS);
  const tiles = [];
  let smallest = null;
  for (let i = 0; i < n; i += 1) {
    const raw2 = squares[i];
    if (!isObject(raw2)) return fail("BAD_SQUARE", `squares[${i}] \u5FC5\u987B\u662F\u5BF9\u8C61`, `squares[${i}] must be an object`);
    const cx = parseFixed(raw2.cx, `squares[${i}].cx`);
    const cy = parseFixed(raw2.cy, `squares[${i}].cy`);
    const ux = parseFixed(raw2.ux, `squares[${i}].ux`);
    const uy = parseFixed(raw2.uy, `squares[${i}].uy`);
    for (const value of [cx, cy, ux, uy])
      if (value < -COORD_LIMIT || value > COORD_LIMIT) return fail("OUT_OF_BOUNDS", `squares[${i}] \u7684\u5750\u6807\u8D85\u51FA\u4E86\u5141\u8BB8\u8303\u56F4`, `the coordinates of squares[${i}] are outside the permitted range`);
    const u = [BigInt(ux), BigInt(uy)];
    const v = [-u[1], u[0]];
    const quarter = u[0] * u[0] + u[1] * u[1];
    if (quarter <= 0n) return fail("DEGENERATE", `squares[${i}] \u7684\u8FB9\u957F\u4E3A\u96F6`, `squares[${i}] has a side of zero`);
    if (smallest === null || quarter < smallest) smallest = quarter;
    const c = [BigInt(cx), BigInt(cy)];
    for (const su of [1n, -1n]) for (const sv of [1n, -1n]) {
      const x = c[0] + su * u[0] + sv * v[0] - centre[0];
      const y = c[1] + su * u[1] + sv * v[1] - centre[1];
      if (x * x + y * y > radiusSquared) return fail("OUT_OF_BOUNDS", `squares[${i}] \u6709\u89D2\u70B9\u843D\u5728\u5706\u5916`, `squares[${i}] has a corner outside the circle`);
    }
    tiles.push({ c, u, v });
  }
  if (smallest === null) return fail("COUNT", "\u7B54\u6848\u91CC\u6CA1\u6709\u4EFB\u4F55\u6B63\u65B9\u5F62", "the answer contains no squares at all");
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (!separated(tiles[i], tiles[j])) return fail("OVERLAP", `\u6B63\u65B9\u5F62 ${i + 1} \u4E0E ${j + 1} \u7684\u5185\u90E8\u91CD\u53E0`, `the interiors of squares ${i + 1} and ${j + 1} overlap`);
  const sideSquared = 4n * smallest;
  return ok(sideSquared, printSquared(sideSquared));
}
var problem4 = { definition: definition4, verify: verifyTiltedSquaresInCircle };

// src/problems/p06-graduated-circles-in-circle.ts
var UNIT = SCALE;
var MIN_N2 = 2;
var MAX_N2 = 30;
function rowBaseline2(n) {
  const span = n * (n + 1);
  const positions = Array.from({ length: n }, (_, index) => (index + 1) * (index + 1));
  let radius = span;
  for (; ; ) {
    const shift2 = radius - span / 2;
    const fits = positions.every((x, index) => Math.abs(x + shift2 - radius) + (index + 1) <= radius);
    if (fits) break;
    radius += 1;
  }
  const shift = radius - span / 2;
  return {
    radius: printFixed(radius * UNIT),
    centers: positions.map((x) => [printFixed((x + shift) * UNIT), printFixed(radius * UNIT)])
  };
}
var instances4 = Array.from({ length: MAX_N2 - MIN_N2 + 1 }, (_, index) => {
  const n = MIN_N2 + index;
  return {
    instanceId: `p06-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline2(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition5 = {
  id: "p06",
  instanceId: "p06-n5-v2",
  code: "P06",
  slug: "graduated-circles-in-circle",
  category: "packing",
  title: "\u534A\u5F84\u6210\u7B49\u5DEE\u7684\u5706\u88C5\u5165\u5706",
  summary: "\u628A\u534A\u5F84\u4F9D\u6B21\u4E3A 1,2,\u2026,n \u7684 n \u4E2A\u5706\u6309\u771F\u5B9E\u6BD4\u4F8B\u4E92\u4E0D\u91CD\u53E0\u5730\u653E\u8FDB\u4E00\u4E2A\u5706\uFF0C\u4F7F\u5BB9\u5668\u534A\u5F84\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u5BB9\u5668\u534A\u5F84",
  instanceName: "n = 5",
  parameters: { n: 5 },
  baselineAnswer: rowBaseline2(5),
  answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\uFF0Ccenters \u6309\u534A\u5F84 1,2,\u2026,n \u7684\u987A\u5E8F\u6392\u5217\u3002\u5BB9\u5668\u5706\u5FC3\u5728 (radius, radius)\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "7.5"\u3002',
  titleEn: "Packing circles of radius 1,2,\u2026,n into a circle",
  summaryEn: "Pack n mutually non-overlapping circles of radii 1,2,\u2026,n, drawn to scale, into a circle and minimize its radius.",
  scoreLabelEn: "container radius",
  instanceNameEn: "n = 5",
  answerHelpEn: 'Submit radius and centers, listed in order of radius 1,2,\u2026,n. The container is centred at (radius, radius). Write every number as a decimal string, for example "7.5".',
  definition: "\u628A\u534A\u5F84\u5206\u522B\u4E3A 1, 2, \u2026, n \u7684 n \u4E2A\u5706\u4E92\u4E0D\u91CD\u53E0\u5730\u653E\u8FDB\u4E00\u4E2A\u5706\u91CC\uFF0C\u4F7F\u5BB9\u5668\u7684\u534A\u5F84\u5C3D\u53EF\u80FD\u5C0F\u3002",
  definitionEn: "Fit n circles of radii 1, 2, \u2026, n, none overlapping, inside one circle, making the container radius as small as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5706\u5FC3\u5728 (radius, radius)\u3001\u534A\u5F84\u4E3A radius \u7684\u5706\uFF0Cradius \u7531\u4F60\u7ED9\u51FA\uFF0C\u5B83\u5C31\u662F\u5206\u6570\uFF1B\u5355\u4F4D\u53D6\u6700\u5C0F\u5706\u7684\u534A\u5F84", textEn: "A circle of radius radius centred at (radius, radius), where radius is yours to choose \u2014 it is the score; the unit is the smallest circle" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "radius \u4E0E centers\uFF0Ccenters \u6309\u534A\u5F84 1, 2, \u2026, n \u7684\u987A\u5E8F\u6392\u5217", textEn: "radius and centers, the centres listed in order of radii 1, 2, \u2026, n" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u7B2C i \u4E2A\u5706\u7684\u534A\u5F84\u6070\u597D\u662F i\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF1B\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5706\u5185", textEn: "Circle i has radius exactly i; no two overlap in their interiors; every circle lies wholly inside the container" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5BB9\u5668\u534A\u5F84\u5C3D\u53EF\u80FD\u5C0F", textEn: "Make the container radius as small as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u5927\u5706\u5B9A\u9AA8\u67B6\u3001\u5C0F\u5706\u586B\u7F1D\uFF1An \u6BCF\u52A0\u4E00\uFF0C\u65B0\u6765\u7684\u6700\u5927\u5706\u90FD\u53EF\u80FD\u98A0\u8986\u4E0A\u4E00\u8F6E\u7684\u6574\u4E2A\u5E03\u5C40\u3002",
      textEn: "The big circles set the skeleton and the small ones caulk the seams: each new largest circle can upend the whole previous layout."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u534A\u5F84 1..n \u88C5\u5165\u6700\u5C0F\u5706\u6B63\u662F 2005 \u5E74 Al Zimmermann \u7A0B\u5E8F\u8BBE\u8BA1\u7ADE\u8D5B\u7684\u8D5B\u9898\uFF08n = 5..50\uFF09\uFF0C\u5168\u90E8\u6700\u597D\u7ED3\u679C\u6536\u5F55\u5728 Packomania \u7684 ccin \u8868\uFF0C\u4F46\u8BC1\u660E\u4E00\u4E2A\u4E5F\u6CA1\u6709\u3002\u672C\u7AD9\u5C1A\u672A\u5F55\u5165\u8FD9\u4E9B\u503C\u3002",
      textEn: "Radii 1..n into the smallest circle was the 2005 Al Zimmermann programming contest (n = 5..50), with every best result collected in Packomania's ccin table \u2014 and not one of them proven. The values are not yet recorded here.",
      url: "https://www.packomania.com/ccin/ccin.html"
    }
  ],
  frame: '\u5355\u4F4D\u5C31\u662F\u6700\u5C0F\u90A3\u4E2A\u5706\u7684\u534A\u5F84\uFF1A\u7B2C i \u4E2A\u5706\u7684\u534A\u5F84\u6B63\u597D\u662F i\u3002\u5BB9\u5668\u662F\u4F60\u81EA\u5DF1\u7ED9\u51FA\u7684\u5706\uFF0C\u5706\u5FC3\u5728 (radius, radius)\uFF0C\u6240\u4EE5\u5750\u6807\u8303\u56F4\u662F 0 \u5230 2\xB7radius\uFF0Cradius \u8D8A\u5C0F\u8D8A\u597D\u3002\u5750\u6807\u548C\u534A\u5F84\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "7.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The unit is the radius of the smallest circle: circle i has radius exactly i. The container is the circle you name, centred at (radius, radius) so coordinates run from 0 to 2\xB7radius, and a smaller radius scores better. Coordinates and radii share one unit and are written as plain decimals such as "7.5", to at most nine decimal places.',
  requirements: ["\u7B2C i \u4E2A\u5706\u7684\u534A\u5F84\u6070\u597D\u662F i", "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185", "\u4E24\u4E24\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u662F\u5141\u8BB8\u7684"],
  requirementsEn: ["Circle i has radius exactly i", "Every circle lies entirely inside the container", "No two overlap, though tangency is allowed"],
  instances: instances4
};
function verifyGraduatedCirclesInCircle(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 60) return fail("COUNT", "n \u8D85\u51FA\u652F\u6301\u8303\u56F4", "n is outside the supported range");
  const radius = parseFixed(answer.radius, "radius");
  if (radius <= 0) return fail("RADIUS", "\u5BB9\u5668\u534A\u5F84\u5FC5\u987B\u4E3A\u6B63\u6570", "the container's radius must be a positive number");
  const raw2 = asArray(answer.centers, "centers");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\u5FC3`, `exactly ${n} centres are needed`);
  const centers = raw2.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const radii = Array.from({ length: n }, (_, index) => (index + 1) * UNIT);
  const container = BigInt(radius);
  for (let i = 0; i < n; i += 1) {
    const inner = BigInt(radii[i]);
    if (inner > container) return fail("OUT_OF_BOUNDS", `\u534A\u5F84\u4E3A ${i + 1} \u7684\u5706\u6BD4\u5BB9\u5668\u8FD8\u5927`, `the circle of radius ${i + 1} is larger than the container`);
    const dx = BigInt(centers[i][0]) - container, dy = BigInt(centers[i][1]) - container;
    const room = container - inner;
    if (dx * dx + dy * dy > room * room) return fail("OUT_OF_BOUNDS", `\u534A\u5F84\u4E3A ${i + 1} \u7684\u5706\u8D85\u51FA\u4E86\u5BB9\u5668`, `the circle of radius ${i + 1} reaches outside the container`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = BigInt(centers[i][0]) - BigInt(centers[j][0]), dy = BigInt(centers[i][1]) - BigInt(centers[j][1]);
    const gap = BigInt(radii[i] + radii[j]);
    if (dx * dx + dy * dy < gap * gap) return fail("OVERLAP", `\u534A\u5F84\u4E3A ${i + 1} \u4E0E ${j + 1} \u7684\u5706\u91CD\u53E0`, `the circles of radius ${i + 1} and ${j + 1} overlap`);
  }
  return ok(container, printFixed(radius));
}
var problem5 = { definition: definition5, verify: verifyGraduatedCirclesInCircle };

// src/problems/p07-spread-points-in-circle.ts
var MIN_N3 = 4;
var MAX_N3 = 20;
var RADIUS2 = SCALE;
var CENTRE2 = SCALE;
function ringBaseline(n) {
  const ring = Math.floor(RADIUS2 / 2);
  return {
    points: Array.from({ length: n }, (_, index) => {
      const angle = 2 * Math.PI * index / n;
      return [
        printFixed(CENTRE2 + Math.round(ring * Math.cos(angle))),
        printFixed(CENTRE2 + Math.round(ring * Math.sin(angle)))
      ];
    })
  };
}
var instances5 = Array.from({ length: MAX_N3 - MIN_N3 + 1 }, (_, index) => {
  const n = MIN_N3 + index;
  return {
    instanceId: `p07-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: ringBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition6 = {
  id: "p07",
  instanceId: "p07-n8-v2",
  code: "P07",
  slug: "spread-points-in-circle",
  category: "extremal",
  title: "\u5706\u5185\u7684\u6563\u70B9\u5206\u79BB",
  summary: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E24\u70B9\u4E4B\u95F4\u7684\u6700\u5C0F\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u7684\u5E73\u65B9",
  goalLabel: "\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB",
  scoreIs: "square",
  goalLabelEn: "the smallest distance between two points",
  instanceName: "n = 8",
  parameters: { n: 8 },
  baselineAnswer: ringBaseline(8),
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "1.5"\u3002',
  titleEn: "Spreading points in a circle",
  summaryEn: "Place n points inside a circle of radius 1 so that the smallest distance between any two is as large as possible.",
  scoreLabelEn: "squared minimum pairwise distance",
  instanceNameEn: "n = 8",
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "1.5".',
  definition: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4E24\u4E24\u4E4B\u95F4\u7684\u6700\u5C0F\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n points inside a circle of radius 1, maximizing the smallest distance between any two of them.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u4E24\u4E2A\u5750\u6807\u90FD\u5728 0 \u5230 2 \u4E4B\u95F4", textEn: "A circle of radius 1 centred at (1, 1), so both coordinates run from 0 to 2" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9 points\uFF0C\u4E24\u4E24\u4E0D\u91CD\u5408", textEn: "Exactly n points, no two coinciding" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5706\u5185\u6216\u5706\u5468\u4E0A", textEn: "Every point lies inside the circle or on it" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6700\u5C0F\u7684\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u5176\u5E73\u65B9\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the smallest pairwise distance as large as possible; compared internally by its square, exactly" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6563\u70B9\u5206\u79BB\u5C31\u662F\u88C5\u7B49\u5706\uFF1A\u4EE5\u6BCF\u4E2A\u70B9\u4E3A\u5706\u5FC3\u3001\u6700\u5C0F\u8DDD\u79BB\u4E00\u534A\u4E3A\u534A\u5F84\u7684\u5706\u5FC5\u987B\u4E92\u4E0D\u91CD\u53E0\u3002\u6700\u4F18\u6784\u5F62\u56E0\u6B64\u4E5F\u662F\u5361\u6B7B\u7684\u63A5\u89E6\u7ED3\u6784\uFF0C\u5BB9\u5668\u7684\u5F62\u72B6\u51B3\u5B9A\u4E00\u5207\u3002",
      textEn: "Spreading points IS packing equal circles: discs of half the minimum distance around each point must not overlap. Optima are jammed contact structures, and the container shape decides everything."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u5706\u5185\u6563\u70B9\u4E0E\u7B49\u5706\u88C5\u5706\u4E92\u4E3A\u5BF9\u5076\uFF1A\u6700\u5C0F\u95F4\u8DDD d \u7684\u70B9\u96C6\u5C31\u662F\u534A\u5F84 d/2 \u7684\u88C5\u5706\u3002cci \u8868\u7684\u8BC1\u660E\u7ECF\u6362\u7B97\u9002\u7528\uFF0Cn = 4 \u5728\u672C\u7AD9\u5DF2\u8BC1\uFF1B\u5176\u4F59\u6309\u5BF9\u5076\u968F cci \u7684\u8FDB\u5EA6\u5F00\u653E\u3002",
      textEn: "Spreading points in a disc is dual to packing equal circles in it: a point set with spacing d is a packing of radius d/2. Proofs in the cci table transfer; n = 4 is proven here, and the rest open or close as cci does.",
      url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/cci/cci.html"
    }
  ],
  extent: 2 * SCALE,
  frame: '\u5BB9\u5668\u662F\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u6240\u4EE5\u5750\u6807\u8303\u56F4\u662F 0 \u5230 2\u3002\u5750\u6807\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "1.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a circle of radius 1 centred at (1, 1), so coordinates run from 0 to 2. Coordinates are written as plain decimals such as "1.5", to at most nine decimal places.',
  requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E14\u4E24\u4E24\u4E0D\u91CD\u5408", "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5706\u5185\u6216\u5706\u5468\u4E0A", "\u5206\u6570\u662F\u6700\u5C0F\u7684\u90A3\u4E2A\u4E24\u70B9\u8DDD\u79BB"],
  requirementsEn: ["Exactly n points, no two coinciding", "Every point lies inside the circle or on it", "The score is the smallest distance between two points"],
  instances: instances5
};
function verifySpreadPointsInCircle(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 2 || n > 120) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  const radiusSquared = BigInt(RADIUS2) * BigInt(RADIUS2);
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (sq(x - CENTRE2) + sq(y - CENTRE2) > radiusSquared) return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u843D\u5728\u5706\u5916`, `point ${i + 1} lies outside the circle`);
  }
  let nearest = null;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (nearest === null || squared < nearest) nearest = squared;
  }
  if (nearest === null || nearest === 0n) return fail("COINCIDENT", "\u5B58\u5728\u4E24\u4E2A\u91CD\u5408\u7684\u70B9\uFF0C\u6700\u5C0F\u8DDD\u79BB\u4E3A 0", "two of the points coincide, so the smallest distance is 0");
  return ok(nearest, printSquared(nearest));
}
var problem6 = { definition: definition6, verify: verifySpreadPointsInCircle };

// src/problems/p08-circles-in-an-l.ts
var SPAN = 2 * SCALE;
var NOTCH = SCALE;
var MIN_N4 = 4;
var MAX_N4 = 18;
function rowBaseline3(n) {
  const radius = Math.floor(Math.min(SCALE / 2, SCALE / n));
  return {
    radius: printFixed(radius),
    centers: Array.from({ length: n }, (_, index) => [printFixed(radius * (2 * index + 1)), printFixed(radius)])
  };
}
var instances6 = Array.from({ length: MAX_N4 - MIN_N4 + 1 }, (_, index) => {
  const n = MIN_N4 + index;
  return {
    instanceId: `p08-n${n}-v2`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline3(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition7 = {
  id: "p08",
  instanceId: "p08-n7-v2",
  code: "P08",
  slug: "circles-in-an-l",
  category: "packing",
  title: "\u7B49\u5706\u88C5\u5165 L \u5F62",
  summary: "\u5728\u4E00\u4E2A L \u5F62\u533A\u57DF\u5185\u653E n \u4E2A\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u5171\u540C\u534A\u5F84",
  instanceName: "n = 7",
  parameters: { n: 7 },
  baselineAnswer: rowBaseline3(7),
  answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\u3002\u6240\u6709\u5706\u5171\u7528\u540C\u4E00\u4E2A\u534A\u5F84\u3002',
  titleEn: "Equal circles in an L",
  summaryEn: "Place n equal circles inside an L-shaped region, making their common radius as large as possible.",
  scoreLabelEn: "common radius",
  instanceNameEn: "n = 7",
  answerHelpEn: 'Submit radius and centers. Write every number as a decimal string such as "0.25". Every circle shares one radius.',
  definition: "\u5728 L \u5F62\u533A\u57DF\u5185\u653E\u7F6E n \u4E2A\u534A\u5F84\u76F8\u540C\u3001\u4E92\u4E0D\u91CD\u53E0\u7684\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n non-overlapping circles of one common radius inside the L-shaped region, making that radius as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u8FB9\u957F 2 \u7684\u6B63\u65B9\u5F62\u6316\u53BB\u53F3\u4E0A\u89D2\u7684 1\xD71\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0Cx \u4E0E y \u540C\u65F6\u8D85\u8FC7 1 \u7684\u533A\u57DF\u662F\u7F3A\u53E3", textEn: "A 2 \xD7 2 square with its top-right 1 \xD7 1 removed: the origin (0, 0) at the lower-left; the notch is where x and y both exceed 1" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF1A\u4E00\u4E2A\u5171\u540C\u534A\u5F84 radius \u4E0E n \u4E2A\u5706\u5FC3 centers", textEn: "Exactly n circles: one shared radius and n centres" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728 L \u5F62\u5185\uFF0C\u4E0D\u80FD\u538B\u5230\u7F3A\u53E3\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8", textEn: "Every circle lies wholly inside the L and clear of the notch; no two overlap in their interiors, tangency allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927", textEn: "Make the common radius as large as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6700\u4F18\u6784\u5F62\u662F\u300C\u5361\u6B7B\u300D\u7684\u63A5\u89E6\u7ED3\u6784\uFF1A\u5706\u5F7C\u6B64\u9876\u4F4F\u3001\u9876\u4F4F\u8FB9\u754C\uFF0C\u5E38\u51FA\u73B0\u659C\u6392\u3001\u9519\u4F4D\u3001\u4EE5\u53CA\u4E0D\u78B0\u4EFB\u4F55\u90BB\u5C45\u7684\u6E38\u79BB\u5706\u3002\u89C4\u6574\u7684\u7F51\u683C\u6446\u6CD5\u51E0\u4E4E\u4ECE\u4E0D\u6700\u4F18\u3002",
      textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u672C\u7AD9\u53D8\u4F53\uFF1A\u628A\u88C5\u7B49\u5706\u653E\u8FDB L \u5F62\u662F\u672C\u7AD9\u51FA\u7684\u9898\uFF0C\u6587\u732E\u91CC\u67E5\u4E0D\u5230\u3002\u6BCF\u4E00\u4E2A n \u90FD\u65E0\u4EBA\u7814\u7A76\u8FC7\uFF0C\u5F53\u524D\u7EAA\u5F55\u5C31\u662F\u4EBA\u7C7B\u5DF2\u77E5\u7684\u5168\u90E8\u3002",
      textEn: "Our own variant: equal-circle packing in an L was posed here, and there is no literature for it. Every n is unstudied; the standing record is all anybody knows."
    }
  ],
  extent: SPAN,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 2 \u7684\u6B63\u65B9\u5F62\u6316\u6389\u53F3\u4E0A\u89D2\u90A3\u5757 1\xD71\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u7F3A\u53E3\u662F x \u4E0E y \u540C\u65F6\u5927\u4E8E 1 \u7684\u90A3\u4E00\u5757\u3002\u5750\u6807\u548C\u534A\u5F84\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 2 with its top-right 1 \xD7 1 quarter removed: the origin (0, 0) is its lower-left corner, and the missing piece is where x and y are both greater than 1. Coordinates and radii share one unit and are written as plain decimals such as "0.25", to at most nine decimal places.',
  requirements: ["\u6070\u597D n \u4E2A\u5706\uFF0C\u534A\u5F84\u5B8C\u5168\u76F8\u540C", "\u6BCF\u4E2A\u5706\u6574\u4F53\u843D\u5728 L \u5F62\u5185\uFF0C\u4E0D\u80FD\u538B\u5230\u7F3A\u53E3", "\u4E24\u4E24\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u662F\u5141\u8BB8\u7684"],
  requirementsEn: ["Exactly n circles, all the same radius", "Every circle lies wholly inside the L and clear of the notch", "No two overlap, though tangency is allowed"],
  instances: instances6
};
function verifyCirclesInL(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 120) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const radius = parseFixed(answer.radius, "radius");
  if (radius <= 0) return fail("RADIUS", "\u534A\u5F84\u5FC5\u987B\u4E3A\u6B63\u6570", "the radius must be a positive number");
  const raw2 = asArray(answer.centers, "centers");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\u5FC3`, `exactly ${n} centres are needed`);
  const centers = raw2.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const r = BigInt(radius);
  const rSquared = r * r;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i];
    if (x < radius || y < radius || x > SPAN - radius || y > SPAN - radius)
      return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u8D85\u51FA\u4E86\u5916\u63A5\u6B63\u65B9\u5F62`, `circle ${i + 1} reaches outside the bounding square`);
    const dx = x < NOTCH ? BigInt(NOTCH - x) : 0n;
    const dy = y < NOTCH ? BigInt(NOTCH - y) : 0n;
    if (dx * dx + dy * dy < rSquared) return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u538B\u5230\u4E86\u7F3A\u53E3`, `circle ${i + 1} crosses into the notch`);
  }
  const gap = 4n * rSquared;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]);
    if (squared < gap) return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E ${j + 1} \u91CD\u53E0`, `circles ${i + 1} and ${j + 1} overlap`);
  }
  return ok(r, printFixed(radius));
}
var problem7 = { definition: definition7, verify: verifyCirclesInL };

// src/containers.ts
var big = BigInt;
function boxDistanceSquared(x, y, left, bottom, right, top) {
  const dx = x < left ? big(left - x) : x > right ? big(x - right) : 0n;
  const dy = y < bottom ? big(bottom - y) : y > top ? big(y - top) : 0n;
  return dx * dx + dy * dy;
}
var inBox = (x, y, width, height, margin) => x >= margin && y >= margin && x <= width - margin && y <= height - margin;
var square = {
  id: "square",
  width: SCALE,
  height: SCALE,
  board: "square-board",
  name: "\u5355\u4F4D\u6B63\u65B9\u5F62",
  nameEn: "the unit square",
  frame: "\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002",
  frameEn: "The container is a square of side 1, with the origin (0, 0) at its lower-left corner and (1, 1) at its upper-right.",
  fitsDisc: (x, y, r) => inBox(x, y, SCALE, SCALE, r),
  holds: (x, y) => inBox(x, y, SCALE, SCALE, 0),
  inscribed: { x: SCALE / 2, y: SCALE / 2, r: SCALE / 2 }
};
var rectangle = {
  id: "rectangle",
  width: 2 * SCALE,
  height: SCALE,
  board: "square-board",
  name: "2 \xD7 1 \u7684\u957F\u65B9\u5F62",
  nameEn: "a 2 \xD7 1 rectangle",
  frame: "\u5BB9\u5668\u662F 2 \xD7 1 \u7684\u957F\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (2, 1)\u3002",
  frameEn: "The container is a 2 \xD7 1 rectangle, with the origin (0, 0) at its lower-left corner and (2, 1) at its upper-right.",
  fitsDisc: (x, y, r) => inBox(x, y, 2 * SCALE, SCALE, r),
  holds: (x, y) => inBox(x, y, 2 * SCALE, SCALE, 0),
  inscribed: { x: SCALE, y: SCALE / 2, r: SCALE / 2 }
};
var disc = {
  id: "disc",
  width: 2 * SCALE,
  height: 2 * SCALE,
  board: "circle-board",
  name: "\u534A\u5F84 1 \u7684\u5706",
  nameEn: "a circle of radius 1",
  frame: "\u5BB9\u5668\u662F\u534A\u5F84 1 \u7684\u5706\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u6240\u4EE5\u5750\u6807\u8303\u56F4\u662F 0 \u5230 2\u3002",
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
  inscribed: { x: SCALE, y: SCALE, r: SCALE }
};
var equilateral = {
  id: "equilateral",
  width: SCALE,
  height: 866025404,
  board: "equilateral-board",
  name: "\u8FB9\u957F 1 \u7684\u7B49\u8FB9\u4E09\u89D2\u5F62",
  nameEn: "an equilateral triangle of side 1",
  frame: "\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u7B49\u8FB9\u4E09\u89D2\u5F62\uFF1A\u5E95\u8FB9\u4ECE (0, 0) \u5230 (1, 0)\uFF0C\u9876\u70B9\u5728 (1/2, \u221A3/2)\u3002",
  frameEn: "The container is an equilateral triangle of side 1: its base runs from (0, 0) to (1, 0) and its apex is at (1/2, \u221A3/2).",
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
  inscribed: { x: SCALE / 2, y: 288675134, r: 288675134 }
};
var triangle = {
  id: "triangle",
  width: SCALE,
  height: SCALE,
  board: "triangle-board",
  name: "\u76F4\u89D2\u8FB9\u4E3A 1 \u7684\u7B49\u8170\u76F4\u89D2\u4E09\u89D2\u5F62",
  nameEn: "a right isosceles triangle with legs 1",
  frame: "\u5BB9\u5668\u662F\u76F4\u89D2\u8FB9\u4E3A 1 \u7684\u7B49\u8170\u76F4\u89D2\u4E09\u89D2\u5F62\uFF0C\u76F4\u89D2\u9876\u70B9\u5728\u539F\u70B9 (0, 0)\uFF0C\u53E6\u4E24\u4E2A\u9876\u70B9\u662F (1, 0) \u4E0E (0, 1)\u3002",
  frameEn: "The container is a right isosceles triangle with legs of length 1: the right angle sits at the origin (0, 0) and the other vertices are (1, 0) and (0, 1).",
  fitsDisc: (x, y, r) => {
    if (x < r || y < r) return false;
    const slack = big(SCALE - x - y);
    if (slack < 0n) return false;
    return slack * slack >= 2n * big(r) * big(r);
  },
  holds: (x, y) => x >= 0 && y >= 0 && x + y <= SCALE,
  // The incircle of this triangle has radius 1 - sqrt(2)/2; 0.29 is inside it.
  inscribed: { x: 29e7, y: 29e7, r: 29e7 }
};
var ell = {
  id: "ell",
  width: 2 * SCALE,
  height: 2 * SCALE,
  board: "l-board",
  name: "L \u5F62\uFF082 \xD7 2 \u6316\u53BB\u53F3\u4E0A\u89D2\u7684 1 \xD7 1\uFF09",
  nameEn: "an L (a 2 \xD7 2 square with its top-right 1 \xD7 1 removed)",
  frame: "\u5BB9\u5668\u662F\u8FB9\u957F 2 \u7684\u6B63\u65B9\u5F62\u6316\u6389\u53F3\u4E0A\u89D2\u90A3\u5757 1 \xD7 1\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u7F3A\u53E3\u662F x \u4E0E y \u540C\u65F6\u5927\u4E8E 1 \u7684\u90A3\u4E00\u5757\u3002",
  frameEn: "The container is a square of side 2 with its top-right 1 \xD7 1 quarter removed: the origin (0, 0) is its lower-left corner and the missing piece is where x and y are both greater than 1.",
  fitsDisc: (x, y, r) => inBox(x, y, 2 * SCALE, 2 * SCALE, r) && boxDistanceSquared(x, y, SCALE, SCALE, 2 * SCALE, 2 * SCALE) >= big(r) * big(r),
  holds: (x, y) => inBox(x, y, 2 * SCALE, 2 * SCALE, 0) && !(x > SCALE && y > SCALE),
  inscribed: { x: SCALE / 2, y: SCALE / 2, r: SCALE / 2 }
};
var CROSS = 3 * SCALE;
var cornerBoxes = [
  [0, 0, SCALE, SCALE],
  [2 * SCALE, 0, CROSS, SCALE],
  [0, 2 * SCALE, SCALE, CROSS],
  [2 * SCALE, 2 * SCALE, CROSS, CROSS]
];
var cross = {
  id: "cross",
  width: CROSS,
  height: CROSS,
  board: "cross-board",
  name: "\u5341\u5B57\u5F62\uFF083 \xD7 3 \u6316\u53BB\u56DB\u4E2A\u89D2\u4E0A\u7684 1 \xD7 1\uFF09",
  nameEn: "a plus sign (a 3 \xD7 3 square with all four corner squares removed)",
  frame: "\u5BB9\u5668\u662F\u8FB9\u957F 3 \u7684\u6B63\u65B9\u5F62\u6316\u6389\u56DB\u4E2A\u89D2\u4E0A\u7684 1 \xD7 1\uFF0C\u5F62\u6210\u4E00\u4E2A\u5341\u5B57\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (3, 3)\u3002",
  frameEn: "The container is a square of side 3 with all four of its 1 \xD7 1 corners removed, leaving a plus sign: the origin (0, 0) is its lower-left corner and (3, 3) its upper-right.",
  fitsDisc: (x, y, r) => inBox(x, y, CROSS, CROSS, r) && cornerBoxes.every(([l, b, rt, t]) => boxDistanceSquared(x, y, l, b, rt, t) >= big(r) * big(r)),
  // The plus is the union of its two bars, and a point is in it when it is in
  // either one. Written this way rather than as "in the 3 × 3 box and in none
  // of the corner squares", which is what it used to say: excluding a bounded
  // box with strict inequalities keeps the corner square's whole boundary —
  // and that boundary includes the square's OUTER edges, which are not part of
  // the plus at all. So (0, 0.5) and all four outer corners were accepted,
  // three quarters of a unit outside the shape, and a submitter found it by
  // dragging a point there and watching the board stay green.
  holds: (x, y) => inBox(x, y, CROSS, CROSS, 0) && (x >= SCALE && x <= 2 * SCALE || y >= SCALE && y <= 2 * SCALE),
  inscribed: { x: 3 * SCALE / 2, y: 3 * SCALE / 2, r: SCALE / 2 }
};
var semicircle = {
  id: "semicircle",
  width: 2 * SCALE,
  height: SCALE,
  board: "semi-board",
  name: "\u534A\u5F84 1 \u7684\u534A\u5706",
  nameEn: "a half-disc of radius 1",
  frame: "\u5BB9\u5668\u662F\u534A\u5F84 1 \u7684\u534A\u5706\uFF1A\u76F4\u5F84\u843D\u5728 y = 0 \u4E0A\uFF0C\u4ECE (0, 0) \u5230 (2, 0)\uFF0C\u5706\u5FC3\u5728 (1, 0)\uFF0C\u5F27\u5728\u4E0A\u65B9\u3002",
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
  inscribed: { x: SCALE, y: SCALE / 2, r: SCALE / 2 }
};
var INNER = SCALE / 2;
var annulus = {
  id: "annulus",
  width: 2 * SCALE,
  height: 2 * SCALE,
  board: "annulus-board",
  name: "\u5916\u534A\u5F84 1\u3001\u5185\u534A\u5F84 0.5 \u7684\u5706\u73AF",
  nameEn: "an annulus with outer radius 1 and inner radius 0.5",
  frame: "\u5BB9\u5668\u662F\u5916\u534A\u5F84 1\u3001\u5185\u534A\u5F84 0.5 \u7684\u5706\u73AF\uFF0C\u5706\u5FC3\u5728 (1, 1)\uFF0C\u6240\u4EE5\u5750\u6807\u8303\u56F4\u662F 0 \u5230 2\uFF0C\u4E2D\u95F4\u90A3\u5757\u534A\u5F84 0.5 \u7684\u5706\u662F\u7A7A\u7684\u3002",
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
  inscribed: { x: SCALE + 3 * SCALE / 4, y: SCALE, r: SCALE / 4 }
};
var quadrant = {
  id: "quadrant",
  width: SCALE,
  height: SCALE,
  board: "quadrant-board",
  name: "\u534A\u5F84 1 \u7684\u6247\u5F62\uFF08\u56DB\u5206\u4E4B\u4E00\u5706\uFF09",
  nameEn: "a quadrant (quarter-disc) of radius 1",
  frame: "\u5BB9\u5668\u662F\u534A\u5F84 1 \u7684\u6247\u5F62\uFF08\u56DB\u5206\u4E4B\u4E00\u5706\uFF09\uFF1A\u5706\u5FC3\u5728\u539F\u70B9 (0, 0)\uFF0C\u76F4\u89D2\u8FB9\u6CBF x \u8F74\u548C y \u8F74\u5EF6\u4F38\u5230 1\uFF0C\u5F27\u5728\u7B2C\u4E00\u8C61\u9650\u3002",
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
  inscribed: { x: 4e8, y: 4e8, r: 4e8 }
};
var containers = { square, rectangle, disc, triangle, equilateral, ell, cross, semicircle, annulus, quadrant };

// src/problem-tags.ts
var problemTags = {
  // --- studied elsewhere, under their own names -----------------------------
  P01: ["classic"],
  // circle packing in a square
  P02: ["classic", "easyBaseline"],
  // circle packing in a circle; ceilings beat the loose-ring baseline by up to 3.1x
  P03: ["classic"],
  // Heilbronn's triangle problem
  P05: ["classic"],
  // tilted squares in a circle
  P06: ["classic"],
  // circles of radius 1…n in a circle
  P07: ["classic"],
  // spreading points in a disc
  P09: ["classic"],
  // circles in a semicircle
  P11: ["classic"],
  // circles in a right triangle
  P12: ["classic"],
  // circles in a 2:1 rectangle
  P13: ["classic"],
  // circles of radius 1…n in a square
  P15: ["classic"],
  // spreading points in a square
  P18: ["classic", "easyBaseline"],
  // tilted squares in a square; a grid beats the single-row baseline 25x at n = 20
  P22: ["classic"],
  // Heilbronn in a disc
  P29: ["classic"],
  // Heilbronn in a triangle
  P58: ["classic"],
  // Heilbronn in an equilateral triangle
  P59: ["classic", "applied"],
  // L2-star discrepancy: QMC / rendering sampling, Warnock's formula
  P60: ["classic", "applied"],
  // real projective line packing, Sloane's tables
  P61: ["classic", "applied"],
  // complex projective packing, Game of Sloanes
  P62: ["original", "applied"],
  // worst 2D-projection uniformity, formed here on P59's kernel
  P63: ["original", "applied"],
  // torus quadrature with the site's fixed lambda = 6 kernel
  P64: ["classic", "applied"],
  // Grassmannian subspace packing, chordal distance
  P65: ["original", "applied"],
  // maximin-volume erasure-robust frames
  P33: ["classic", "easyBaseline"],
  // Riesz energy in a square; corners-plus-centre beats the baseline 77x at n = 5
  P34: ["classic"],
  // Riesz energy in a disc; every row now ships a best-known in-house certificate
  P51: ["classic"],
  // Friedman, lighting a square
  P57: ["classic", "easyBaseline"],
  // sum of radii in a square; growing the shrunken grid back beats the seed by 25%
  P52: ["classic"],
  // Friedman, ratio of largest to smallest distance
  P53: ["classic", "applied", "easyBaseline"],
  // biggest little polygon; the ring at its legal radius beats the shipped one 1.5625x
  P54: ["classic", "applied", "easyBaseline"],
  // star discrepancy; unsquashing the shipped Hammersley set beats it
  P55: ["classic", "applied", "easyBaseline"],
  P56: ["original", "applied", "easyBaseline"],
  // uniform mesh; restoring the dragged grid point beats the baseline ~1.4x          // optimal quantization; unsquashing the shipped grid beats it 1.6x at n=6, 3.2x at n=30
  // --- formed here, by putting a question into a container ------------------
  P08: ["original"],
  // circles in an L
  P10: ["original"],
  // circles in a plus sign
  P16: ["original"],
  // spreading points in a right triangle
  P17: ["original"],
  // spreading points in a rectangle
  P19: ["original"],
  // spreading points in an L
  P20: ["original"],
  // spreading points in a semicircle
  P21: ["original"],
  // spreading points in a plus sign
  P24: ["original"],
  // the smallest triangle in an L
  P25: ["original"],
  // the smallest triangle in a plus sign
  P26: ["original"],
  // the smallest triangle in a semicircle
  P27: ["original"],
  // spreading points in an annulus
  P28: ["original"],
  // the smallest triangle in an annulus
  P30: ["classic"],
  // circles in a quadrant; Specht ccq table records the family
  P31: ["original"],
  // spreading points in a quadrant
  P32: ["original"]
  // the smallest triangle in a quadrant
};

// src/packing-kit.ts
function familyInstances(family) {
  const [from, to] = family.range;
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const n = from + index;
    return {
      instanceId: family.instanceIds(n),
      instanceName: `n = ${n}`,
      parameters: { n },
      baselineAnswer: family.baseline(n, family.container),
      instanceNameEn: `n = ${n}`
    };
  });
}
function familyFrontier(code, subject, subjectEn, container) {
  const classic = (problemTags[code] ?? []).includes("classic");
  return classic ? {
    title: "\u524D\u6CBF\u5728\u54EA\u91CC",
    titleEn: "Where the frontier is",
    tone: "frontier",
    text: "\u7ECF\u5178\u95EE\u9898\uFF1A\u6587\u732E\u7684\u5DF2\u77E5\u6700\u597D\u503C\u9010\u4E2A n \u6807\u5728\u6BCF\u4E2A\u5B50\u9898\u9875\u7684\u300C\u5DF2\u77E5\u6700\u597D\u300D\u680F\u91CC\uFF0C\u6765\u6E90\u53EF\u70B9\uFF1B\u53EA\u6709\u6807\u7740\u300C\u5DF2\u8BC1\u660E\u6700\u4F18\u300D\u7684 n \u624D\u662F\u5B9A\u7406\uFF0C\u5176\u4F59\u5168\u90E8\u5F00\u653E\u3002",
    textEn: "A classic: the literature's best known values are cited per n in each sub-problem's known-best row. Only the ones marked proven are theorems; everything else is open."
  } : {
    title: "\u524D\u6CBF\u5728\u54EA\u91CC",
    titleEn: "Where the frontier is",
    tone: "frontier",
    text: `\u672C\u7AD9\u53D8\u4F53\uFF1A\u628A${subject}\u653E\u8FDB${container.name}\u662F\u672C\u7AD9\u51FA\u7684\u9898\uFF0C\u6587\u732E\u91CC\u67E5\u4E0D\u5230\u3002\u6BCF\u4E00\u4E2A n \u90FD\u65E0\u4EBA\u7814\u7A76\u8FC7\uFF0C\u5F53\u524D\u7EAA\u5F55\u5C31\u662F\u4EBA\u7C7B\u5DF2\u77E5\u7684\u5168\u90E8\u3002`,
    textEn: `Our own variant: ${subjectEn} in ${container.nameEn} was posed here, and there is no literature for it. Every n is unstudied; the standing record is all anybody knows.`
  };
}
function equalCircles(family, copy) {
  const { container } = family;
  const instances24 = familyInstances(family);
  const definition28 = {
    id: family.id,
    instanceId: family.instanceIds(family.primary),
    code: family.code,
    slug: family.slug,
    category: "packing",
    title: copy.title,
    summary: copy.summary,
    objective: "maximize",
    scoreLabel: "\u5171\u540C\u534A\u5F84",
    instanceName: `n = ${family.primary}`,
    parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\u3002\u6240\u6709\u5706\u5171\u7528\u540C\u4E00\u4E2A\u534A\u5F84\u3002',
    titleEn: copy.titleEn,
    summaryEn: copy.summaryEn,
    scoreLabelEn: "common radius",
    instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: 'Submit radius and centers. Write every number as a decimal string such as "0.25". Every circle shares one radius.',
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}\u5750\u6807\u548C\u534A\u5F84\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002`,
    frameEn: `${container.frameEn} Coordinates and radii share one unit and are written as plain decimals such as "0.25", to at most nine decimal places.`,
    definition: `\u5728${container.name}\u5185\u653E\u7F6E n \u4E2A\u534A\u5F84\u76F8\u540C\u7684\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002`,
    definitionEn: `Place n circles of one common radius inside ${container.nameEn}, making that radius as large as possible.`,
    strict: [
      { label: "\u5BB9\u5668", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF1A\u4E00\u4E2A\u5171\u540C\u534A\u5F84\u4E0E n \u4E2A\u5706\u5FC3\uFF1B\u6240\u6709\u5706\u5171\u7528\u540C\u4E00\u4E2A\u534A\u5F84", textEn: "Exactly n circles: one shared radius and n centres; every circle uses the same radius" },
      { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
      { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927", textEn: "Make the common radius as large as possible" }
    ],
    intuition: [
      {
        title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
        titleEn: "Where the room for improvement is",
        text: "\u6700\u4F18\u6784\u5F62\u662F\u300C\u5361\u6B7B\u300D\u7684\u63A5\u89E6\u7ED3\u6784\uFF1A\u5706\u5F7C\u6B64\u9876\u4F4F\u3001\u9876\u4F4F\u8FB9\u754C\uFF0C\u5E38\u51FA\u73B0\u659C\u6392\u3001\u9519\u4F4D\u3001\u4EE5\u53CA\u4E0D\u78B0\u4EFB\u4F55\u90BB\u5C45\u7684\u6E38\u79BB\u5706\u3002\u89C4\u6574\u7684\u7F51\u683C\u6446\u6CD5\u51E0\u4E4E\u4ECE\u4E0D\u6700\u4F18\u3002",
        textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal."
      },
      copy.frontier ?? familyFrontier(family.code, "\u88C5\u7B49\u5706", "equal-circle packing", container)
    ],
    requirements: ["\u6070\u597D n \u4E2A\u5706\uFF0C\u534A\u5F84\u5B8C\u5168\u76F8\u540C", "\u6BCF\u4E2A\u5706\u6574\u4F53\u843D\u5728\u5BB9\u5668\u5185", "\u4E24\u4E24\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u662F\u5141\u8BB8\u7684"],
    requirementsEn: ["Exactly n circles, all the same radius", "Every circle lies wholly inside the container", "No two overlap, though tangency is allowed"],
    instances: instances24
  };
  function verify2(params, answer) {
    const n = asInt(params.n, "n");
    if (n < 1 || n > 200) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
    const radius = parseFixed(answer.radius, "radius");
    if (radius <= 0) return fail("RADIUS", "\u534A\u5F84\u5FC5\u987B\u4E3A\u6B63\u6570", "the radius must be a positive number");
    const raw2 = asArray(answer.centers, "centers");
    if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\u5FC3`, `exactly ${n} centres are needed`);
    const centers = raw2.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.fitsDisc(centers[i][0], centers[i][1], radius)) return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u6CA1\u6709\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185`, `circle ${i + 1} does not lie entirely inside the container`);
    const gap = 4n * BigInt(radius) * BigInt(radius);
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
      if (sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]) < gap)
        return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E ${j + 1} \u91CD\u53E0`, `circles ${i + 1} and ${j + 1} overlap`);
    return ok(BigInt(radius), printFixed(radius));
  }
  return { definition: definition28, verify: verify2 };
}
function spreadPoints(family, copy) {
  const { container } = family;
  const instances24 = familyInstances(family);
  const definition28 = {
    id: family.id,
    instanceId: family.instanceIds(family.primary),
    code: family.code,
    slug: family.slug,
    category: "extremal",
    title: copy.title,
    summary: copy.summary,
    objective: "maximize",
    scoreLabel: "\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u7684\u5E73\u65B9",
    goalLabel: "\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB",
    scoreIs: "square",
    goalLabelEn: "the smallest distance between two points",
    instanceName: `n = ${family.primary}`,
    parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002',
    titleEn: copy.titleEn,
    summaryEn: copy.summaryEn,
    scoreLabelEn: "squared minimum pairwise distance",
    instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5".',
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}\u5750\u6807\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002`,
    frameEn: `${container.frameEn} Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.`,
    definition: `\u5728${container.name}\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4E24\u4E24\u4E4B\u95F4\u7684\u6700\u5C0F\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002`,
    definitionEn: `Place n points inside ${container.nameEn}, maximizing the smallest distance between any two of them.`,
    strict: [
      { label: "\u5BB9\u5668", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E24\u4E24\u4E0D\u91CD\u5408", textEn: "Exactly n points, no two coinciding" },
      { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5BB9\u5668\u5185\u6216\u8FB9\u754C\u4E0A", textEn: "Every point lies inside the container or on its boundary" },
      { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6700\u5C0F\u7684\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u5176\u5E73\u65B9\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the smallest pairwise distance as large as possible; compared internally by its square, exactly" }
    ],
    intuition: [
      {
        title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
        titleEn: "Where the room for improvement is",
        text: "\u6563\u70B9\u5206\u79BB\u5C31\u662F\u88C5\u7B49\u5706\uFF1A\u4EE5\u6BCF\u4E2A\u70B9\u4E3A\u5706\u5FC3\u3001\u6700\u5C0F\u8DDD\u79BB\u4E00\u534A\u4E3A\u534A\u5F84\u7684\u5706\u5FC5\u987B\u4E92\u4E0D\u91CD\u53E0\u3002\u6700\u4F18\u6784\u5F62\u56E0\u6B64\u4E5F\u662F\u5361\u6B7B\u7684\u63A5\u89E6\u7ED3\u6784\uFF0C\u5BB9\u5668\u7684\u5F62\u72B6\u51B3\u5B9A\u4E00\u5207\u3002",
        textEn: "Spreading points IS packing equal circles: discs of half the minimum distance around each point must not overlap. Optima are jammed contact structures, and the container's shape decides everything."
      },
      copy.frontier ?? familyFrontier(family.code, "\u6563\u70B9\u5206\u79BB", "point spreading", container)
    ],
    requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E14\u4E24\u4E24\u4E0D\u91CD\u5408", "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5BB9\u5668\u5185\u6216\u8FB9\u754C\u4E0A", "\u5206\u6570\u662F\u6700\u5C0F\u7684\u90A3\u4E2A\u4E24\u70B9\u8DDD\u79BB"],
    requirementsEn: ["Exactly n points, no two coinciding", "Every point lies inside the container or on its boundary", "The score is the smallest distance between two points"],
    instances: instances24
  };
  function verify2(params, answer) {
    const n = asInt(params.n, "n");
    if (n < 2 || n > 200) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
    const raw2 = asArray(answer.points, "points");
    if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
    const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.holds(points[i][0], points[i][1])) return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u4E0D\u5728\u5BB9\u5668\u5185`, `point ${i + 1} is outside the container`);
    let nearest = null;
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
      const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
      if (nearest === null || squared < nearest) nearest = squared;
    }
    if (nearest === null || nearest === 0n) return fail("COINCIDENT", "\u5B58\u5728\u4E24\u4E2A\u91CD\u5408\u7684\u70B9\uFF0C\u6700\u5C0F\u8DDD\u79BB\u4E3A 0", "two of the points coincide, so the smallest distance is 0");
    return ok(nearest, printSquared(nearest));
  }
  return { definition: definition28, verify: verify2 };
}
function heilbronn(family, copy) {
  const { container } = family;
  const instances24 = familyInstances(family);
  const definition28 = {
    id: family.id,
    instanceId: family.instanceIds(family.primary),
    code: family.code,
    slug: family.slug,
    category: "extremal",
    title: copy.title,
    summary: copy.summary,
    objective: "maximize",
    scoreLabel: "\u6700\u5C0F\u4E09\u89D2\u5F62\u7684\u4E8C\u500D\u9762\u79EF",
    goalLabel: "\u6700\u5C0F\u4E09\u89D2\u5F62\u7684\u9762\u79EF",
    scoreIs: "double",
    goalLabelEn: "the smallest triangle's area",
    instanceName: `n = ${family.primary}`,
    parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002',
    titleEn: copy.titleEn,
    summaryEn: copy.summaryEn,
    scoreLabelEn: "twice the smallest triangle's area",
    instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5".',
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}\u5750\u6807\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002`,
    frameEn: `${container.frameEn} Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.`,
    definition: `\u5728${container.name}\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u4E09\u89D2\u5F62\u4E2D\u6700\u5C0F\u7684\u90A3\u4E2A\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002`,
    definitionEn: `Place n points inside ${container.nameEn} so that the smallest triangle formed by any three of them is as large as possible.`,
    strict: [
      { label: "\u5BB9\u5668", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\uFF0C\u4EFB\u610F\u4E09\u70B9\u4E0D\u5171\u7EBF", textEn: "Exactly n points, no three collinear" },
      { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5BB9\u5668\u5185\u6216\u8FB9\u754C\u4E0A", textEn: "Every point lies inside the container or on its boundary" },
      { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u4E09\u89D2\u5F62\u4E2D\u6700\u5C0F\u7684\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u4E8C\u500D\u9762\u79EF\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the smallest triangle over all triples as large as possible; compared internally by twice the area, exactly" }
    ],
    intuition: [
      {
        title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
        titleEn: "Where the room for improvement is",
        text: "\u628A\u70B9\u6492\u5F97\u5747\u5300\u5E76\u4E0D\u591F\uFF1A\u4EFB\u4F55\u4E09\u70B9\u90FD\u4E0D\u80FD\u63A5\u8FD1\u5171\u7EBF\uFF0C\u800C\u8FD1\u5171\u7EBF\u6070\u6070\u662F\u770B\u8D77\u6765\u6574\u9F50\u7684\u6392\u5E03\u6700\u5BB9\u6613\u72AF\u7684\u9519\u3002\u6700\u4F18\u6784\u5F62\u5F80\u5F80\u4E0D\u5BF9\u79F0\uFF0C\u8FDE\u5F62\u72B6\u90FD\u96BE\u731C\u3002",
        textEn: "Even spreading is not enough: no three points may come close to collinear, and near-collinearity is exactly what tidy arrangements love to do. Optima are often asymmetric and hard even to guess."
      },
      copy.frontier ?? familyFrontier(family.code, "Heilbronn \u95EE\u9898", "Heilbronn's problem", container)
    ],
    requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u4EFB\u610F\u4E09\u70B9\u4E0D\u5171\u7EBF", "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5BB9\u5668\u5185\u6216\u8FB9\u754C\u4E0A", "\u5206\u6570\u662F\u6700\u5C0F\u4E09\u89D2\u5F62\u7684\u9762\u79EF"],
    requirementsEn: ["Exactly n points, no three collinear", "Every point lies inside the container or on its boundary", "The score is the smallest triangle's area"],
    instances: instances24
  };
  function verify2(params, answer) {
    const n = asInt(params.n, "n");
    if (n < 3 || n > 40) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
    const raw2 = asArray(answer.points, "points");
    if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
    const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.holds(points[i][0], points[i][1])) return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u4E0D\u5728\u5BB9\u5668\u5185`, `point ${i + 1} is outside the container`);
    let smallest = null;
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) for (let k = j + 1; k < n; k += 1) {
      const area = BigInt(points[j][0] - points[i][0]) * BigInt(points[k][1] - points[i][1]) - BigInt(points[j][1] - points[i][1]) * BigInt(points[k][0] - points[i][0]);
      const magnitude = area < 0n ? -area : area;
      if (magnitude === 0n) return fail("COLLINEAR", `\u70B9 ${i + 1}\u3001${j + 1}\u3001${k + 1} \u5171\u7EBF`, `points ${i + 1}, ${j + 1} and ${k + 1} are collinear`);
      if (smallest === null || magnitude < smallest) smallest = magnitude;
    }
    if (smallest === null) return fail("COUNT", "\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u70B9", "at least three points are needed");
    return ok(smallest, printSquared(smallest));
  }
  return { definition: definition28, verify: verify2 };
}
var fixed = (units) => printFixed(Math.round(units));
function gridCentres(container, radius) {
  const centers = [];
  for (let y = radius; y <= container.height - radius; y += 2 * radius)
    for (let x = radius; x <= container.width - radius; x += 2 * radius)
      if (container.fitsDisc(x, y, radius)) centers.push([x, y]);
  return centers;
}
function largestGridCircles(n, container) {
  for (let denominator = 1; denominator <= 200; denominator += 1) {
    const radius = Math.floor(Math.min(container.width, container.height) / (2 * denominator));
    if (radius <= 0) break;
    const centers = gridCentres(container, radius);
    if (centers.length >= n) return { radius, centers: centers.slice(0, n) };
  }
  throw new Error(`no grid of circles fits n = ${n} in ${container.id}`);
}
function gridCircles(n, container) {
  const full = largestGridCircles(n, container);
  const radius = Math.max(1, Math.floor(full.radius * 4 / 5));
  return { radius: fixed(radius), centers: full.centers.map(([x, y]) => [fixed(x), fixed(y)]) };
}
function gridLattice(container, spacing) {
  const all = [];
  for (let y = 0; y <= container.height; y += spacing)
    for (let x = 0; x <= container.width; x += spacing)
      if (container.holds(x, y)) all.push([x, y]);
  return all;
}
function largestGridPoints(n, container, from = 1) {
  for (let denominator = from; denominator <= 400; denominator += 1) {
    const spacing = Math.floor(Math.max(container.width, container.height) / denominator);
    if (spacing <= 0) break;
    const all = gridLattice(container, spacing);
    if (all.length >= n) return { denominator, spacing, points: all.slice(0, n) };
  }
  throw new Error(`no lattice fits n = ${n} in ${container.id}`);
}
function gridPoints(n, container) {
  const full = largestGridPoints(n, container);
  const finer = largestGridPoints(n, container, full.denominator + 1);
  return { points: finer.points.map(([x, y]) => [fixed(x), fixed(y)]) };
}
function ringPoints(n, container) {
  const { x, y, r } = container.inscribed;
  const radius = Math.floor(r * 0.8);
  return {
    points: Array.from({ length: n }, (_, index) => {
      const angle = 2 * Math.PI * index / n;
      return [fixed(x + radius * Math.cos(angle)), fixed(y + radius * Math.sin(angle))];
    })
  };
}
var ENERGY_NUMERATOR = BigInt(SCALE) * BigInt(SCALE) * BigInt(SCALE);
function rieszEnergy(family, copy) {
  const { container } = family;
  const instances24 = familyInstances(family);
  const definition28 = {
    id: family.id,
    instanceId: family.instanceIds(family.primary),
    code: family.code,
    slug: family.slug,
    category: "extremal",
    frontier: true,
    title: copy.title,
    summary: copy.summary,
    objective: "minimize",
    scoreLabel: "Riesz 2-\u80FD\u91CF",
    instanceName: `n = ${family.primary}`,
    parameters: { n: family.primary },
    baselineAnswer: family.baseline(family.primary, container),
    answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002\u5206\u6570\u662F\u6240\u6709\u70B9\u5BF9 1/\u8DDD\u79BB\xB2 \u4E4B\u548C\uFF0C\u8D8A\u5C0F\u8D8A\u597D\u3002',
    titleEn: copy.titleEn,
    summaryEn: copy.summaryEn,
    scoreLabelEn: "Riesz 2-energy",
    instanceNameEn: `n = ${family.primary}`,
    answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5". The score is the sum of 1/distance\xB2 over every pair, and smaller is better.',
    extent: Math.max(container.width, container.height),
    frame: `${container.frame}\u5750\u6807\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002`,
    frameEn: `${container.frameEn} Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.`,
    definition: `\u5728${container.name}\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u6240\u6709\u70B9\u5BF9\u7684 1/\u8DDD\u79BB\xB2 \u4E4B\u548C\u5C3D\u53EF\u80FD\u5C0F\u3002`,
    definitionEn: `Place n points inside ${container.nameEn}, minimizing the sum of 1/distance\xB2 taken over every pair.`,
    strict: [
      { label: "\u5BB9\u5668", labelEn: "Container", text: container.frame, textEn: container.frameEn },
      { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E24\u4E24\u4E0D\u91CD\u5408", textEn: "Exactly n points, no two coinciding" },
      { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5BB9\u5668\u5185\u6216\u8FB9\u754C\u4E0A", textEn: "Every point lies inside the container or on its boundary" },
      { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5168\u90E8\u70B9\u5BF9\u7684 1/\u8DDD\u79BB\xB2 \u4E4B\u548C\u5C3D\u53EF\u80FD\u5C0F\u3002\u4EE5\u7CBE\u786E\u6709\u7406\u6570\u8BA1\u5206", textEn: "Make the sum of 1/distance\xB2 over all pairs as small as possible; scored in exact rationals" }
    ],
    intuition: [
      {
        title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
        titleEn: "Where the room for improvement is",
        text: "1/\u8DDD\u79BB\xB2 \u628A\u9760\u5F97\u8FD1\u60E9\u7F5A\u5F97\u6781\u91CD\uFF1A\u70B9\u5148\u88AB\u63A8\u5230\u8FB9\u754C\u6392\u6210\u4E00\u5708\uFF0C\u518D\u968F n \u589E\u5927\u5411\u5185\u5206\u5C42\u3002\u5C42\u6570\u548C\u6BCF\u5C42\u7684\u70B9\u6570\u5728\u7279\u5B9A\u7684 n \u8DF3\u53D8\uFF0C\u8DF3\u53D8\u9644\u8FD1\u4F18\u5316\u7A7A\u95F4\u6700\u5927\u3002",
        textEn: "1/distance\xB2 punishes closeness brutally: points get pushed out to a boundary ring first, then shed inner layers as n grows. Layer counts jump at particular n, and the jumps are where the contest lives."
      },
      copy.frontier ?? familyFrontier(family.code, "Riesz \u80FD\u91CF", "the Riesz energy", container)
    ],
    requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E14\u4E24\u4E24\u4E0D\u91CD\u5408", "\u6BCF\u4E2A\u70B9\u90FD\u5728\u5BB9\u5668\u5185\u6216\u8FB9\u754C\u4E0A", "\u5206\u6570\u662F\u6BCF\u5BF9\u70B9 1/\u8DDD\u79BB\xB2 \u7684\u603B\u548C\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
    requirementsEn: ["Exactly n points, no two coinciding", "Every point lies inside the container or on its boundary", "The score is the sum of 1/distance\xB2 over all pairs, and smaller is better"],
    instances: instances24
  };
  function verify2(params, answer) {
    const n = asInt(params.n, "n");
    if (n < 2 || n > 80) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
    const raw2 = asArray(answer.points, "points");
    if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
    const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
    for (let i = 0; i < n; i += 1)
      if (!container.holds(points[i][0], points[i][1])) return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u4E0D\u5728\u5BB9\u5668\u5185`, `point ${i + 1} is outside the container`);
    let total = 0n;
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
      const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
      if (squared === 0n) return fail("COINCIDENT", `\u70B9 ${i + 1} \u4E0E ${j + 1} \u91CD\u5408\uFF0C\u80FD\u91CF\u65E0\u7A77\u5927`, `points ${i + 1} and ${j + 1} coincide, so the energy is infinite`);
      total += (ENERGY_NUMERATOR + squared - 1n) / squared;
    }
    return ok(total, printFixedBig(total));
  }
  return { definition: definition28, verify: verify2 };
}
function huddledPoints(n, container) {
  const { x, y, r } = container.inscribed;
  let columns = 1;
  while (columns * columns < n) columns += 1;
  const spacing = Math.max(1, Math.floor(r / (2 * columns)));
  const offset = (columns - 1) * spacing / 2;
  return {
    points: Array.from({ length: n }, (_, index) => [
      fixed(x - offset + index % columns * spacing),
      fixed(y - offset + Math.floor(index / columns) * spacing)
    ])
  };
}

// src/problems/grid.ts
var { rectangle: rectangle2, disc: disc2, triangle: triangle2, ell: ell2, cross: cross2, semicircle: semicircle2, annulus: annulus2, quadrant: quadrant2, equilateral: equilateral2 } = containers;
var p09 = equalCircles(
  {
    code: "P09",
    id: "p09",
    slug: "circles-in-a-semicircle",
    container: semicircle2,
    instanceIds: (n) => `p09-n${n}-v2`,
    range: [3, 16],
    primary: 6,
    baseline: gridCircles
  },
  {
    title: "\u7B49\u5706\u88C5\u5165\u534A\u5706",
    titleEn: "Equal circles in a half-disc",
    summary: "\u5728\u534A\u5F84 1 \u7684\u534A\u5706\u5185\u653E n \u4E2A\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n equal circles in a half-disc of radius 1, making their common radius as large as possible.",
    frontier: {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u534A\u5706\u88C5\u5706\u7684\u5DF2\u77E5\u6700\u597D\u503C\u5168\u90E8\u53D6\u81EA Specht \u7684 csc \u6C47\u603B\u8868\uFF0C\u8BE5\u8868\u6CA1\u6709\u628A\u4EFB\u4F55\u4E00\u9879\u6807\u4E3A\u5DF2\u8BC1\u660E\uFF1B\u5341\u56DB\u4E2A n \u5168\u90E8\u5F00\u653E\u3002",
      textEn: "Every best known value comes from Specht's csc survey table, which marks none of them proven; all fourteen n are open.",
      url: "https://web.archive.org/web/20260213011826/http://hydra.nat.uni-magdeburg.de/packing/csc/csc.html"
    }
  }
);
var p10 = equalCircles(
  {
    code: "P10",
    id: "p10",
    slug: "circles-in-a-cross",
    container: cross2,
    instanceIds: (n) => `p10-n${n}-v2`,
    range: [3, 18],
    primary: 8,
    baseline: gridCircles
  },
  {
    title: "\u7B49\u5706\u88C5\u5165\u5341\u5B57\u5F62",
    titleEn: "Equal circles in a plus sign",
    summary: "\u5728\u4E00\u4E2A\u5341\u5B57\u5F62\u533A\u57DF\u5185\u653E n \u4E2A\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n equal circles inside a plus-shaped region, making their common radius as large as possible."
  }
);
var p30 = equalCircles(
  {
    code: "P30",
    id: "p30",
    slug: "circles-in-a-quadrant",
    container: quadrant2,
    instanceIds: (n) => `p30-n${n}-v2`,
    range: [3, 16],
    primary: 6,
    baseline: gridCircles
  },
  {
    title: "\u7B49\u5706\u88C5\u5165\u6247\u5F62",
    titleEn: "Equal circles in a quadrant",
    summary: "\u5728\u534A\u5F84 1 \u7684\u6247\u5F62\uFF08\u56DB\u5206\u4E4B\u4E00\u5706\uFF09\u5185\u653E n \u4E2A\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n equal circles in a quarter-disc of radius 1, making their common radius as large as possible.",
    frontier: {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u6247\u5F62\u88C5\u5706\u7684\u5DF2\u77E5\u6700\u597D\u503C\u53D6\u81EA Specht \u7684 ccq \u6C47\u603B\u8868\uFF0C\u65E0\u4E00\u5DF2\u8BC1\u660E\uFF1B\u5341\u56DB\u4E2A n \u5168\u90E8\u5F00\u653E\u3002",
      textEn: "The best known values come from Specht's ccq survey table, none proven; all fourteen n are open.",
      url: "https://web.archive.org/web/20260213011826/http://hydra.nat.uni-magdeburg.de/packing/ccq/ccq.html"
    }
  }
);
var p16 = spreadPoints(
  {
    code: "P16",
    id: "p16",
    slug: "spread-points-in-triangle",
    container: triangle2,
    instanceIds: (n) => `p16-n${n}-v2`,
    range: [4, 18],
    primary: 8,
    baseline: gridPoints
  },
  {
    title: "\u76F4\u89D2\u4E09\u89D2\u5F62\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in a right triangle",
    summary: "\u5728\u76F4\u89D2\u8FB9\u4E3A 1 \u7684\u7B49\u8170\u76F4\u89D2\u4E09\u89D2\u5F62\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a right isosceles triangle with legs 1, maximizing the smallest distance between any two."
  }
);
var p17 = spreadPoints(
  {
    code: "P17",
    id: "p17",
    slug: "spread-points-in-rectangle",
    container: rectangle2,
    instanceIds: (n) => `p17-n${n}-v2`,
    range: [4, 20],
    primary: 9,
    baseline: gridPoints
  },
  {
    title: "\u957F\u65B9\u5F62\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in a rectangle",
    summary: "\u5728 2 \xD7 1 \u7684\u957F\u65B9\u5F62\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a 2 \xD7 1 rectangle, maximizing the smallest distance between any two."
  }
);
var p19 = spreadPoints(
  {
    code: "P19",
    id: "p19",
    slug: "spread-points-in-an-l",
    container: ell2,
    instanceIds: (n) => `p19-n${n}-v2`,
    range: [4, 20],
    primary: 9,
    baseline: gridPoints
  },
  {
    title: "L \u5F62\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in an L",
    summary: "\u5728 L \u5F62\u533A\u57DF\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in an L-shaped region, maximizing the smallest distance between any two."
  }
);
var p20 = spreadPoints(
  {
    code: "P20",
    id: "p20",
    slug: "spread-points-in-a-semicircle",
    container: semicircle2,
    instanceIds: (n) => `p20-n${n}-v2`,
    range: [4, 18],
    primary: 8,
    baseline: gridPoints
  },
  {
    title: "\u534A\u5706\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in a half-disc",
    summary: "\u5728\u534A\u5F84 1 \u7684\u534A\u5706\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a half-disc of radius 1, maximizing the smallest distance between any two."
  }
);
var p21 = spreadPoints(
  {
    code: "P21",
    id: "p21",
    slug: "spread-points-in-a-cross",
    container: cross2,
    instanceIds: (n) => `p21-n${n}-v2`,
    range: [4, 20],
    primary: 9,
    baseline: gridPoints
  },
  {
    title: "\u5341\u5B57\u5F62\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in a plus sign",
    summary: "\u5728\u4E00\u4E2A\u5341\u5B57\u5F62\u533A\u57DF\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a plus-shaped region, maximizing the smallest distance between any two."
  }
);
var p27 = spreadPoints(
  {
    code: "P27",
    id: "p27",
    slug: "spread-points-in-an-annulus",
    container: annulus2,
    instanceIds: (n) => `p27-n${n}-v2`,
    range: [4, 20],
    primary: 9,
    baseline: gridPoints
  },
  {
    title: "\u5706\u73AF\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in an annulus",
    summary: "\u5728\u5916\u534A\u5F84 1\u3001\u5185\u534A\u5F84 0.5 \u7684\u5706\u73AF\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in an annulus of outer radius 1 and inner radius 0.5, maximizing the smallest distance between any two."
  }
);
var p31 = spreadPoints(
  {
    code: "P31",
    id: "p31",
    slug: "spread-points-in-a-quadrant",
    container: quadrant2,
    instanceIds: (n) => `p31-n${n}-v2`,
    range: [4, 18],
    primary: 8,
    baseline: gridPoints
  },
  {
    title: "\u6247\u5F62\u5185\u7684\u6563\u70B9\u5206\u79BB",
    titleEn: "Spreading points in a quadrant",
    summary: "\u5728\u534A\u5F84 1 \u7684\u6247\u5F62\uFF08\u56DB\u5206\u4E4B\u4E00\u5706\uFF09\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a quarter-disc of radius 1, maximizing the smallest distance between any two."
  }
);
var p22 = heilbronn(
  {
    code: "P22",
    id: "p22",
    slug: "heilbronn-in-a-circle",
    container: disc2,
    instanceIds: (n) => `p22-n${n}-v2`,
    range: [5, 14],
    primary: 7,
    baseline: ringPoints
  },
  {
    title: "\u5706\u76D8\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in a disc",
    summary: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a disc of radius 1 so the smallest triangle any three of them make is as large as possible.",
    frontier: {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u5706\u76D8\u7248 Heilbronn\uFF1AMathWorld \u6C47\u603B\u4E86\u8FD9\u4E00\u65CF\u7684\u5DF2\u77E5\u503C\uFF0C\u90E8\u5206\u5E26\u5C01\u95ED\u5F62\u5F0F\uFF0C\u4F46\u5168\u90E8\u672A\u8BC1\u660E\uFF1B\u6B63\u65B9\u5F62\u7248\u7684\u8BC1\u660E\u6280\u672F\u8FD8\u6CA1\u6709\u4EBA\u642C\u8FC7\u6765\u3002",
      textEn: "Heilbronn in a disc: MathWorld collects the known values, some in closed form, none proven; the proof techniques from the square version have not been carried over.",
      url: "https://mathworld.wolfram.com/HeilbronnTriangleProblem.html"
    }
  }
);
var p58 = heilbronn(
  {
    code: "P58",
    id: "p58",
    slug: "heilbronn-in-equilateral",
    container: equilateral2,
    instanceIds: (n) => `p58-n${n}-v1`,
    range: [5, 14],
    primary: 11,
    baseline: ringPoints
  },
  {
    title: "\u7B49\u8FB9\u4E09\u89D2\u5F62\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in an equilateral triangle",
    summary: "\u5728\u8FB9\u957F 1 \u7684\u7B49\u8FB9\u4E09\u89D2\u5F62\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in an equilateral triangle of side 1 so the smallest triangle any three of them make is as large as possible.",
    frontier: {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u7B49\u8FB9\u4E09\u89D2\u5F62\u7248\u7531 AlphaEvolve \u7684\u5927\u89C4\u6A21\u6570\u5B66\u53D1\u73B0\u5B9E\u9A8C\u63A8\u8FDB\uFF1A\u5176 n = 11 \u6784\u578B\u5728 EinsteinArena \u4E0A\u88AB\u591A\u4E2A\u667A\u80FD\u4F53\u590D\u6838\u5E76\u5217\uFF0C\u81F3\u4ECA\u65E0\u4EBA\u8D85\u8D8A\uFF1B\u9010 n \u7684\u6700\u4F18\u6784\u5F62\u5168\u90E8\u672A\u8BC1\u660E\u3002",
      textEn: "The equilateral version was pushed by AlphaEvolve's large-scale mathematical discovery runs: its n = 11 configuration has been reproduced but never beaten by the agents on EinsteinArena, and no per-n optimum is proven.",
      url: "https://einsteinarena.com/problems/heilbronn-triangles"
    }
  }
);
var p24 = heilbronn(
  {
    code: "P24",
    id: "p24",
    slug: "heilbronn-in-an-l",
    container: ell2,
    instanceIds: (n) => `p24-n${n}-v2`,
    range: [5, 14],
    primary: 7,
    baseline: ringPoints
  },
  {
    title: "L \u5F62\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in an L",
    summary: "\u5728 L \u5F62\u533A\u57DF\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in an L-shaped region so the smallest triangle any three of them make is as large as possible."
  }
);
var p25 = heilbronn(
  {
    code: "P25",
    id: "p25",
    slug: "heilbronn-in-a-cross",
    container: cross2,
    instanceIds: (n) => `p25-n${n}-v2`,
    range: [5, 14],
    primary: 7,
    baseline: ringPoints
  },
  {
    title: "\u5341\u5B57\u5F62\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in a plus sign",
    summary: "\u5728\u4E00\u4E2A\u5341\u5B57\u5F62\u533A\u57DF\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a plus-shaped region so the smallest triangle any three of them make is as large as possible."
  }
);
var p26 = heilbronn(
  {
    code: "P26",
    id: "p26",
    slug: "heilbronn-in-a-semicircle",
    container: semicircle2,
    instanceIds: (n) => `p26-n${n}-v2`,
    range: [5, 14],
    primary: 7,
    baseline: ringPoints
  },
  {
    title: "\u534A\u5706\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in a half-disc",
    summary: "\u5728\u534A\u5F84 1 \u7684\u534A\u5706\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a half-disc of radius 1 so the smallest triangle any three of them make is as large as possible."
  }
);
var p28 = heilbronn(
  {
    code: "P28",
    id: "p28",
    slug: "heilbronn-in-an-annulus",
    container: annulus2,
    instanceIds: (n) => `p28-n${n}-v2`,
    range: [5, 14],
    primary: 7,
    baseline: ringPoints
  },
  {
    title: "\u5706\u73AF\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in an annulus",
    summary: "\u5728\u5916\u534A\u5F84 1\u3001\u5185\u534A\u5F84 0.5 \u7684\u5706\u73AF\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in an annulus of outer radius 1 and inner radius 0.5 so the smallest triangle any three of them make is as large as possible."
  }
);
var p32 = heilbronn(
  {
    code: "P32",
    id: "p32",
    slug: "heilbronn-in-a-quadrant",
    container: quadrant2,
    instanceIds: (n) => `p32-n${n}-v2`,
    range: [5, 14],
    primary: 7,
    baseline: ringPoints
  },
  {
    title: "\u6247\u5F62\u5185\u7684\u6700\u5C0F\u4E09\u89D2\u5F62",
    titleEn: "The smallest triangle in a quadrant",
    summary: "\u5728\u534A\u5F84 1 \u7684\u6247\u5F62\uFF08\u56DB\u5206\u4E4B\u4E00\u5706\uFF09\u5185\u653E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u5C3D\u53EF\u80FD\u5927\u3002",
    summaryEn: "Place n points in a quarter-disc of radius 1 so the smallest triangle any three of them make is as large as possible."
  }
);
var gridDrawings = {
  P33: { kind: "points", container: containers.square },
  P34: { kind: "points", container: disc2 },
  P09: { kind: "circles", container: semicircle2 },
  P10: { kind: "circles", container: cross2 },
  P30: { kind: "circles", container: quadrant2 },
  P16: { kind: "points", container: triangle2 },
  P17: { kind: "points", container: rectangle2 },
  P19: { kind: "points", container: ell2 },
  P20: { kind: "points", container: semicircle2 },
  P21: { kind: "points", container: cross2 },
  P27: { kind: "points", container: annulus2 },
  P31: { kind: "points", container: quadrant2 },
  P22: { kind: "triangle", container: disc2 },
  P58: { kind: "triangle", container: equilateral2 },
  P24: { kind: "triangle", container: ell2 },
  P25: { kind: "triangle", container: cross2 },
  P26: { kind: "triangle", container: semicircle2 },
  P28: { kind: "triangle", container: annulus2 },
  P32: { kind: "triangle", container: quadrant2 }
};
var p33 = rieszEnergy(
  {
    code: "P33",
    id: "p33",
    slug: "riesz-energy-in-a-square",
    container: containers.square,
    instanceIds: (n) => `p33-n${n}-v2`,
    range: [5, 24],
    primary: 10,
    baseline: huddledPoints
  },
  {
    title: "\u6B63\u65B9\u5F62\u5185\u7684 Riesz 2-\u80FD\u91CF",
    titleEn: "Riesz 2-energy in a square",
    summary: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u6240\u6709\u70B9\u5BF9 1/\u8DDD\u79BB\xB2 \u4E4B\u548C\u5C3D\u53EF\u80FD\u5C0F\u3002",
    summaryEn: "Place n points in the unit square, minimizing the sum of 1/distance\xB2 over every pair.",
    frontier: {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u9010\u70B9\u5BF9 1/r\xB2 \u80FD\u91CF\u7684\u4E00\u822C\u7406\u8BBA\uFF08\u6E10\u8FD1\u5206\u5E03\u3001\u5206\u79BB\u6027\uFF09\u89C1 Borodachov\u3001Hardin \u4E0E Saff \u7684\u300ADiscrete Energy on Rectifiable Sets\u300B(2019)\uFF1B\u4F46\u6B63\u65B9\u5F62\u4E0A\u9010 n \u7684\u6700\u4F18\u6784\u5F62\u6CA1\u6709\u6587\u732E\u8868\uFF0C\u8FD9\u91CC\u7684\u6BCF\u4E2A n \u90FD\u5F00\u653E\u3002\u5C11\u6570\u5E73\u51E1\u95ED\u5F0F\u662F\u672C\u7AD9\u81EA\u8BC1\u7684\u3002",
      textEn: "The general theory of pairwise 1/r\xB2 energy (asymptotics, separation) is Borodachov, Hardin and Saff, Discrete Energy on Rectifiable Sets (2019); a per-n table of optima in the square does not exist, and every n here is open. The few trivial closed forms are proved on site.",
      url: "https://www.semanticscholar.org/paper/f368b230a66f0b67493b922eb598a0178de39f25"
    }
  }
);
var p34 = rieszEnergy(
  {
    code: "P34",
    id: "p34",
    slug: "riesz-energy-in-a-disc",
    container: disc2,
    instanceIds: (n) => `p34-n${n}-v2`,
    range: [9, 24],
    primary: 10,
    baseline: huddledPoints
  },
  {
    title: "\u5706\u76D8\u5185\u7684 Riesz 2-\u80FD\u91CF",
    titleEn: "Riesz 2-energy in a disc",
    summary: "\u5728\u534A\u5F84 1 \u7684\u5706\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u6240\u6709\u70B9\u5BF9 1/\u8DDD\u79BB\xB2 \u4E4B\u548C\u5C3D\u53EF\u80FD\u5C0F\u3002",
    summaryEn: "Place n points in a disc of radius 1, minimizing the sum of 1/distance\xB2 over every pair.",
    frontier: {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u80FD\u91CF\u7406\u8BBA\u540C\u6B63\u65B9\u5F62\u7248\uFF1ABorodachov\u2013Hardin\u2013Saff (2019)\u3002\u5706\u76D8\u4E0A\u6CA1\u6709\u9010 n \u7684\u6700\u4F18\u6784\u5F62\u8868\uFF1Bn = 9\u201311 \u5C55\u793A\u672C\u7AD9\u7684\u7B80\u5355\u5BF9\u79F0\u6784\u9020\uFF0Cn = 12 \u8D77\u5C55\u793A\u672C\u7AD9\u79BB\u7EBF\u6570\u503C\u641C\u7D22\u6240\u5F97\u6784\u5F62\u3002n = 5\u20138 \u66FE\u7ECF\u5728\u6B64\uFF0C\u5DF2\u7ECF\u4E0B\u67B6\uFF1A\u6B63 n \u8FB9\u5F62\u7684\u80FD\u91CF\u6709\u95ED\u5F0F n(n\xB2\u22121)/24\uFF0C\u53C2\u8003\u7B54\u6848\u672C\u8EAB\u5C31\u5750\u5728\u6700\u597D\u5DF2\u77E5\u503C\u4E0A\uFF0C\u6CA1\u6709\u53EF\u4E89\u7684\u4F59\u5730\u3002\u5B83\u4EEC\u90FD\u53EA\u662F\u5F85\u6311\u6218\u7684\u6700\u597D\u5DF2\u77E5\u503C\uFF0C\u6CA1\u6709\u4E00\u9879\u88AB\u6807\u6210\u5DF2\u8BC1\u660E\u6700\u4F18\u3002",
      textEn: "The general theory is the same as for the square: Borodachov, Hardin and Saff (2019). There is no per-n table of optima in a disc; n = 9\u201311 show our elementary symmetric constructions, and n = 12 onward show configurations from our offline numerical search. n = 5\u20138 were here and have been retired: the regular n-gon's energy is the closed form n(n\xB2\u22121)/24, so the reference answer already sat on the best known value and there was nothing left to take. Every one is a best-known target open to challenge, not a proved optimum.",
      url: "https://www.semanticscholar.org/paper/f368b230a66f0b67493b922eb598a0178de39f25"
    }
  }
);

// src/problems/p11-circles-in-right-triangle.ts
var RIGHT_TRIANGLE_LEG_X = SCALE;
var RIGHT_TRIANGLE_LEG_Y = 75e7;
var RIGHT_TRIANGLE_HYPOTENUSE = 125e7;
var RIGHT_TRIANGLE_MAX_N = 200;
function rightTriangleBaseline(n) {
  const a = BigInt(RIGHT_TRIANGLE_LEG_Y), b = BigInt(RIGHT_TRIANGLE_LEG_X), c = BigInt(RIGHT_TRIANGLE_HYPOTENUSE);
  const radius = Number(a * b / (a * BigInt(2 * n - 1) + b + c));
  return { radius: printFixed(radius), centers: Array.from({ length: n }, (_, index) => [printFixed(radius * (2 * index + 1)), printFixed(radius)]) };
}
var rightTriangleInstances = Array.from({ length: 11 }, (_, index) => {
  const n = index + 2;
  return {
    instanceId: `p11-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rightTriangleBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition8 = {
  id: "p11",
  instanceId: "p11-n5-v1",
  code: "P11",
  slug: "circles-in-right-triangle",
  category: "packing",
  title: "\u76F4\u89D2\u4E09\u89D2\u5F62\u5185\u7684\u7B49\u5706\u88C5\u7BB1",
  summary: "\u5728\u76F4\u89D2\u8FB9\u4E3A 1 \u4E0E 0.75 \u7684\u56FA\u5B9A\u76F4\u89D2\u4E09\u89D2\u5F62\u5185\u653E\u7F6E n \u4E2A\u4E92\u4E0D\u76F8\u4EA4\u7684\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u5171\u540C\u534A\u5F84",
  instanceName: "n = 5",
  parameters: { n: 5 },
  baselineAnswer: rightTriangleBaseline(5),
  answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.15"\u3002',
  titleEn: "Equal-circle packing in a right triangle",
  summaryEn: "Place n non-overlapping equal circles inside a fixed right triangle with legs 1 and 0.75, maximizing their common radius.",
  scoreLabelEn: "common radius",
  instanceNameEn: "n = 5",
  answerHelpEn: 'Submit radius and centers. Write every number as a decimal string, for example "0.15".',
  definition: "\u5728\u76F4\u89D2\u8FB9\u4E3A 1 \u4E0E 0.75 \u7684\u76F4\u89D2\u4E09\u89D2\u5F62\u5185\u653E\u7F6E n \u4E2A\u4E92\u4E0D\u91CD\u53E0\u7684\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n non-overlapping equal circles inside the right triangle with legs 1 and 0.75, making the common radius as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u76F4\u89D2\u4E09\u89D2\u5F62\uFF1A\u76F4\u89D2\u9876\u70B9\u5728\u539F\u70B9 (0, 0)\uFF0C\u4E00\u6761\u76F4\u89D2\u8FB9\u6CBF x \u8F74\u5230 (1, 0)\uFF0C\u53E6\u4E00\u6761\u6CBF y \u8F74\u5230 (0, 0.75)", textEn: "A right triangle: the right angle at the origin (0, 0), one leg along the x-axis to (1, 0), the other along the y-axis to (0, 0.75)" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF1A\u4E00\u4E2A\u5171\u540C\u534A\u5F84 radius \u4E0E n \u4E2A\u5706\u5FC3 centers", textEn: "Exactly n circles: one shared radius and n centres" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927", textEn: "Make the common radius as large as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6700\u4F18\u6784\u5F62\u662F\u300C\u5361\u6B7B\u300D\u7684\u63A5\u89E6\u7ED3\u6784\uFF1A\u5706\u5F7C\u6B64\u9876\u4F4F\u3001\u9876\u4F4F\u8FB9\u754C\uFF0C\u5E38\u51FA\u73B0\u659C\u6392\u3001\u9519\u4F4D\u3001\u4EE5\u53CA\u4E0D\u78B0\u4EFB\u4F55\u90BB\u5C45\u7684\u6E38\u79BB\u5706\u3002\u89C4\u6574\u7684\u7F51\u683C\u6446\u6CD5\u51E0\u4E4E\u4ECE\u4E0D\u6700\u4F18\u3002",
      textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u76F4\u89D2\u8FB9 1 \u4E0E 0.75 \u8FD9\u4E2A\u5177\u4F53\u4E09\u89D2\u5F62\u6CA1\u6709\u6587\u732E\u8868\uFF1B\u7B49\u8170\u76F4\u89D2\u4E09\u89D2\u5F62\u7B49\u8FD1\u4EB2\u6536\u5F55\u5728 Friedman \u7684 Packing Center\u3002\u672C\u7AD9\u672A\u5F55\u503C\uFF0C\u6BCF\u4E2A n \u90FD\u5F00\u653E\u3002",
      textEn: "This particular triangle, legs 1 and 0.75, has no literature table; close relatives such as the isosceles right triangle are collected on Friedman's Packing Center. No values are recorded here, and every n is open.",
      url: "https://erich-friedman.github.io/packing/"
    }
  ],
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u76F4\u89D2\u4E09\u89D2\u5F62\uFF1A\u76F4\u89D2\u9876\u70B9\u5C31\u662F\u539F\u70B9 (0, 0)\uFF0C\u4E00\u6761\u76F4\u89D2\u8FB9\u6CBF x \u8F74\u5230 (1, 0)\uFF0C\u53E6\u4E00\u6761\u6CBF y \u8F74\u5230 (0, 0.75)\uFF0C\u659C\u8FB9\u8FDE\u63A5\u8FD9\u4E24\u70B9\u3002\u5750\u6807\u548C\u957F\u5EA6\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.15"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a right triangle: the right angle is the origin (0, 0), one leg runs along the x axis to (1, 0), the other along the y axis to (0, 0.75), and the hypotenuse joins those two points. Coordinates and lengths share one unit and are written as plain decimals such as "0.15", to at most nine decimal places.',
  instances: rightTriangleInstances
};
function verifyRightTriangleCircles(params, answer) {
  const n = asInt(params.n, "n"), legX = RIGHT_TRIANGLE_LEG_X, legY = RIGHT_TRIANGLE_LEG_Y;
  if (n < 1 || n > RIGHT_TRIANGLE_MAX_N) return fail("COUNT", `n \u5FC5\u987B\u5728 1 \u4E0E ${RIGHT_TRIANGLE_MAX_N} \u4E4B\u95F4`, `n must be between 1 and ${RIGHT_TRIANGLE_MAX_N}`);
  if (legX <= 0 || legY <= 0) return fail("BAD_PARAMS", "\u4E09\u89D2\u5F62\u7684\u76F4\u89D2\u8FB9\u5FC5\u987B\u4E3A\u6B63\u6570", "the triangle's legs must be positive");
  const radius = parseFixed(answer.radius, "radius");
  const raw2 = asArray(answer.centers, "centers");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\u5FC3`, `exactly ${n} centres are needed`);
  if (radius <= 0) return fail("RADIUS", "\u534A\u5F84\u5FC5\u987B\u4E3A\u6B63\u6570", "the radius must be a positive number");
  const centers = raw2.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const a = BigInt(legY), b = BigInt(legX), r = BigInt(radius);
  const doubledArea = a * b, normSquared = a * a + b * b, reach = r * r * normSquared;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i];
    if (x < radius || y < radius) return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u8D8A\u8FC7\u4E86\u4E00\u6761\u76F4\u89D2\u8FB9`, `circle ${i + 1} crosses one of the legs`);
    const slack = doubledArea - a * BigInt(x) - b * BigInt(y);
    if (slack < 0n || slack * slack < reach) return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u8D8A\u8FC7\u4E86\u659C\u8FB9`, `circle ${i + 1} crosses the hypotenuse`);
  }
  const minDistance = 4n * r * r;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = BigInt(centers[i][0] - centers[j][0]), dy = BigInt(centers[i][1] - centers[j][1]);
    if (dx * dx + dy * dy < minDistance) return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E\u5706 ${j + 1} \u76F8\u4EA4`, `circles ${i + 1} and ${j + 1} intersect`);
  }
  return ok(r, printFixed(radius));
}
var problem8 = { definition: definition8, verify: verifyRightTriangleCircles };

// src/problems/p12-circles-in-rectangle.ts
var RECTANGLE_WIDTH = 2 * SCALE;
var RECTANGLE_HEIGHT = SCALE;
var RECTANGLE_MAX_N = 200;
function rectangleBaseline(n) {
  const radius = Math.min(Math.floor(RECTANGLE_HEIGHT / 2), Math.floor(RECTANGLE_WIDTH / (2 * n)));
  const startX = Math.floor((RECTANGLE_WIDTH - 2 * radius * n) / 2) + radius;
  const y = Math.floor(RECTANGLE_HEIGHT / 2);
  return { radius: printFixed(radius), centers: Array.from({ length: n }, (_, index) => [printFixed(startX + 2 * radius * index), printFixed(y)]) };
}
var rectangleInstances = Array.from({ length: 10 }, (_, index) => {
  const n = index + 3;
  return {
    instanceId: `p12-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rectangleBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition9 = {
  id: "p12",
  instanceId: "p12-n6-v1",
  code: "P12",
  slug: "circles-in-rectangle",
  category: "packing",
  title: "2:1 \u957F\u65B9\u5F62\u5185\u7684\u7B49\u5706\u88C5\u7BB1",
  summary: "\u5728 2\xD71 \u7684\u957F\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u4E92\u4E0D\u76F8\u4EA4\u7684\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u5171\u540C\u534A\u5F84",
  instanceName: "n = 6",
  parameters: { n: 6 },
  baselineAnswer: rectangleBaseline(6),
  answerHelp: '\u63D0\u4EA4 radius \u4E0E centers\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\u3002',
  titleEn: "Equal-circle packing in a 2:1 rectangle",
  summaryEn: "Place n non-overlapping equal circles in a 2\xD71 rectangle, maximizing their common radius.",
  scoreLabelEn: "common radius",
  instanceNameEn: "n = 6",
  answerHelpEn: 'Submit radius and centers. Write every number as a decimal string, for example "0.25".',
  definition: "\u5728 2\xD71 \u7684\u957F\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u4E92\u4E0D\u91CD\u53E0\u7684\u7B49\u5706\uFF0C\u4F7F\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n non-overlapping equal circles inside a 2 \xD7 1 rectangle, making the common radius as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5BBD 2\u3001\u9AD8 1 \u7684\u957F\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (2, 1)", textEn: "A rectangle 2 wide and 1 tall: the origin (0, 0) at its lower-left corner, (2, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF1A\u4E00\u4E2A\u5171\u540C\u534A\u5F84 radius \u4E0E n \u4E2A\u5706\u5FC3 centers", textEn: "Exactly n circles: one shared radius and n centres" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8", textEn: "Every circle lies wholly inside the container; no two overlap in their interiors, tangency allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u534A\u5F84\u5C3D\u53EF\u80FD\u5927", textEn: "Make the common radius as large as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6700\u4F18\u6784\u5F62\u662F\u300C\u5361\u6B7B\u300D\u7684\u63A5\u89E6\u7ED3\u6784\uFF1A\u5706\u5F7C\u6B64\u9876\u4F4F\u3001\u9876\u4F4F\u8FB9\u754C\uFF0C\u5E38\u51FA\u73B0\u659C\u6392\u3001\u9519\u4F4D\u3001\u4EE5\u53CA\u4E0D\u78B0\u4EFB\u4F55\u90BB\u5C45\u7684\u6E38\u79BB\u5706\u3002\u89C4\u6574\u7684\u7F51\u683C\u6446\u6CD5\u51E0\u4E4E\u4ECE\u4E0D\u6700\u4F18\u3002",
      textEn: "Optimal packings are jammed contact structures: circles brace against each other and the boundary, with tilted rows, offsets, and the odd rattler touching nothing. Neat grids are almost never optimal."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n = 3..6 \u7531\u4E4B\u5B57\u5F62\u6784\u9020\u7684\u521D\u7B49\u8BBA\u8BC1\u8BC1\u660E\uFF08\u89C1\u5404\u5B50\u9898\u7684\u5DF2\u77E5\u6700\u597D\u680F\uFF09\uFF1B2\xD71 \u957F\u65B9\u5F62\u66F4\u5927\u7684 n \u6CA1\u6709\u7CFB\u7EDF\u6587\u732E\u8868\uFF0C\u5168\u90E8\u5F00\u653E\u3002",
      textEn: "n = 3..6 are proven by elementary zig-zag arguments (see each sub-problem's known-best row); larger n in the 2 \xD7 1 rectangle have no systematic table and are all open."
    }
  ],
  extent: 2 * SCALE,
  frame: '\u5BB9\u5668\u662F\u5BBD 2\u3001\u9AD8 1 \u7684\u957F\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (2, 1)\u3002\u5750\u6807\u548C\u957F\u5EA6\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a rectangle 2 wide and 1 tall. Its lower-left corner is the origin (0, 0) and its upper-right corner is (2, 1). Coordinates and lengths share one unit and are written as plain decimals such as "0.25", to at most nine decimal places.',
  instances: rectangleInstances
};
function verifyRectangleCircles(params, answer) {
  const n = asInt(params.n, "n"), width = RECTANGLE_WIDTH, height = RECTANGLE_HEIGHT;
  if (n < 1 || n > RECTANGLE_MAX_N) return fail("COUNT", `n \u5FC5\u987B\u5728 1 \u4E0E ${RECTANGLE_MAX_N} \u4E4B\u95F4`, `n must be between 1 and ${RECTANGLE_MAX_N}`);
  if (width <= 0 || height <= 0) return fail("BAD_PARAMS", "\u957F\u65B9\u5F62\u7684\u8FB9\u957F\u5FC5\u987B\u4E3A\u6B63\u6570", "the rectangle's sides must be positive");
  const radius = parseFixed(answer.radius, "radius");
  const raw2 = asArray(answer.centers, "centers");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\u5FC3`, `exactly ${n} centres are needed`);
  if (radius <= 0 || radius > Math.floor(width / 2) || radius > Math.floor(height / 2)) return fail("RADIUS", "\u534A\u5F84\u5FC5\u987B\u4E3A\u6B63\u6570\u4E14\u4E0D\u8D85\u8FC7\u957F\u65B9\u5F62\u77ED\u8FB9\u7684\u4E00\u534A", "the radius must be positive and at most half the rectangle's shorter side");
  const centers = raw2.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i];
    if (x < radius || y < radius || x > width - radius || y > height - radius) return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u8D85\u51FA\u4E86\u957F\u65B9\u5F62\u8FB9\u754C`, `circle ${i + 1} reaches outside the rectangle`);
  }
  const minDistance = 4n * sq(radius);
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    if (sq(centers[i][0] - centers[j][0]) + sq(centers[i][1] - centers[j][1]) < minDistance) return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E\u5706 ${j + 1} \u76F8\u4EA4`, `circles ${i + 1} and ${j + 1} intersect`);
  }
  return ok(BigInt(radius), printFixed(radius));
}
var problem9 = { definition: definition9, verify: verifyRectangleCircles };

// src/problems/p13-graduated-circles-in-square.ts
var GRADUATED_UNIT = SCALE;
var GRADUATED_MAX_N = 60;
function graduatedBaseline(n) {
  return {
    side: printFixed(n * (n + 1) * GRADUATED_UNIT),
    // 第 i 个圆左侧到原点的距离是 2(1+…+(i-1))+i = i²，所以圆心横坐标恰好是 i²。
    centers: Array.from({ length: n }, (_, index) => [printFixed((index + 1) * (index + 1) * GRADUATED_UNIT), printFixed(n * GRADUATED_UNIT)])
  };
}
var graduatedInstances = Array.from({ length: 29 }, (_, index) => {
  const n = index + 2;
  return {
    instanceId: `p13-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: graduatedBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition10 = {
  id: "p13",
  instanceId: "p13-n5-v1",
  code: "P13",
  slug: "graduated-circles-in-square",
  category: "packing",
  title: "\u534A\u5F84\u6210\u7B49\u5DEE\u7684\u5706\u88C5\u5165\u6B63\u65B9\u5F62",
  summary: "\u628A\u534A\u5F84\u4F9D\u6B21\u4E3A 1,2,\u2026,n \u7684 n \u4E2A\u5706\u6309\u771F\u5B9E\u6BD4\u4F8B\u4E92\u4E0D\u91CD\u53E0\u5730\u653E\u8FDB\u4E00\u4E2A\u6B63\u65B9\u5F62\uFF0C\u4F7F\u6B63\u65B9\u5F62\u8FB9\u957F\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u6B63\u65B9\u5F62\u8FB9\u957F",
  instanceName: "n = 5",
  parameters: { n: 5 },
  baselineAnswer: graduatedBaseline(5),
  answerHelp: '\u63D0\u4EA4 side \u4E0E centers\uFF0Ccenters \u6309\u534A\u5F84 1,2,\u2026,n \u7684\u987A\u5E8F\u6392\u5217\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "3.5"\u3002',
  titleEn: "Packing circles of radius 1,2,\u2026,n into a square",
  summaryEn: "Pack n mutually non-overlapping circles of radii 1,2,\u2026,n, drawn to scale, into a square and minimize its side.",
  scoreLabelEn: "square side",
  instanceNameEn: "n = 5",
  answerHelpEn: 'Submit side and centers, listed in order of radius 1,2,\u2026,n. Write every number as a decimal string, for example "3.5".',
  definition: "\u628A\u534A\u5F84\u5206\u522B\u4E3A 1, 2, \u2026, n \u7684 n \u4E2A\u5706\u4E92\u4E0D\u91CD\u53E0\u5730\u653E\u8FDB\u4E00\u4E2A\u6B63\u65B9\u5F62\uFF0C\u4F7F\u6B63\u65B9\u5F62\u8FB9\u957F\u5C3D\u53EF\u80FD\u5C0F\u3002",
  definitionEn: "Fit n circles of radii 1, 2, \u2026, n, none overlapping, inside one square, making the side of that square as small as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u8FB9\u957F side \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9\uFF0Cside \u7531\u4F60\u7ED9\u51FA\uFF0C\u5B83\u5C31\u662F\u5206\u6570\uFF1B\u5355\u4F4D\u53D6\u6700\u5C0F\u5706\u7684\u534A\u5F84", textEn: "A square of side side with the origin at its lower-left corner, where side is yours to choose \u2014 it is the score; the unit is the smallest circle" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "side \u4E0E centers\uFF0Ccenters \u6309\u534A\u5F84 1, 2, \u2026, n \u7684\u987A\u5E8F\u6392\u5217", textEn: "side and centers, the centres listed in order of radii 1, 2, \u2026, n" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u7B2C i \u4E2A\u5706\u7684\u534A\u5F84\u6070\u597D\u662F i\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF1B\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u6B63\u65B9\u5F62\u5185", textEn: "Circle i has radius exactly i; no two overlap in their interiors; every circle lies wholly inside the square" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6B63\u65B9\u5F62\u8FB9\u957F\u5C3D\u53EF\u80FD\u5C0F", textEn: "Make the side of the square as small as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u5927\u5706\u5B9A\u9AA8\u67B6\u3001\u5C0F\u5706\u586B\u7F1D\uFF1An \u6BCF\u52A0\u4E00\uFF0C\u65B0\u6765\u7684\u6700\u5927\u5706\u90FD\u53EF\u80FD\u98A0\u8986\u4E0A\u4E00\u8F6E\u7684\u6574\u4E2A\u5E03\u5C40\u3002",
      textEn: "The big circles set the skeleton and the small ones caulk the seams: each new largest circle can upend the whole previous layout."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n \u2264 4 \u7531\u5706\u5FC3\u8DDD\u7684\u521D\u7B49\u4E0B\u754C\u8BC1\u660E\uFF08\u89C1\u5404\u5B50\u9898\uFF09\u3002\u5706\u5BB9\u5668\u7248\u662F Zimmermann \u7ADE\u8D5B\u7684\u8D5B\u9898\uFF08\u89C1 Packomania\uFF09\uFF0C\u6B63\u65B9\u5F62\u5BB9\u5668\u7248\u672A\u89C1\u6587\u732E\u8868\uFF0C\u5176\u4F59 n \u5F00\u653E\u3002",
      textEn: "n \u2264 4 follow from elementary centre-distance bounds (see the sub-problems). The circular-container version was the Zimmermann contest problem (see Packomania); this square version has no table, and the rest are open.",
      url: "https://www.packomania.com/"
    }
  ],
  frame: '\u5355\u4F4D\u5C31\u662F\u6700\u5C0F\u90A3\u4E2A\u5706\u7684\u534A\u5F84\uFF1A\u7B2C i \u4E2A\u5706\u7684\u534A\u5F84\u6B63\u597D\u662F i\u3002\u5BB9\u5668\u662F\u4F60\u81EA\u5DF1\u7ED9\u51FA\u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (side, side)\uFF0Cside \u8D8A\u5C0F\u8D8A\u597D\u3002\u5750\u6807\u548C\u534A\u5F84\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "3.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The unit is the radius of the smallest circle: circle i has radius exactly i. The container is the square you name \u2014 lower-left corner at the origin (0, 0), upper-right at (side, side) \u2014 and a smaller side scores better. Coordinates and radii share one unit and are written as plain decimals such as "3.5", to at most nine decimal places.',
  instances: graduatedInstances
};
function verifyGraduatedCircles(params, answer) {
  const n = asInt(params.n, "n"), unit = GRADUATED_UNIT;
  if (n < 1 || n > GRADUATED_MAX_N) return fail("COUNT", `n \u5FC5\u987B\u5728 1 \u4E0E ${GRADUATED_MAX_N} \u4E4B\u95F4`, `n must be between 1 and ${GRADUATED_MAX_N}`);
  if (unit <= 0) return fail("BAD_PARAMS", "unit \u5FC5\u987B\u4E3A\u6B63\u6570", "unit must be a positive number");
  const side2 = parseFixed(answer.side, "side");
  const raw2 = asArray(answer.centers, "centers");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706\u5FC3`, `exactly ${n} centres are needed`);
  if (side2 <= 0) return fail("SIDE", "\u6B63\u65B9\u5F62\u8FB9\u957F\u5FC5\u987B\u4E3A\u6B63\u6570", "the square's side must be a positive number");
  const centers = raw2.map((point, index) => parseFixedPoint(point, `centers[${index}]`));
  const radii = Array.from({ length: n }, (_, index) => (index + 1) * unit);
  for (let i = 0; i < n; i += 1) {
    const [x, y] = centers[i], radius = radii[i];
    if (x < radius || y < radius || x > side2 - radius || y > side2 - radius) return fail("OUT_OF_BOUNDS", `\u534A\u5F84\u4E3A ${i + 1} \u7684\u5706\u8D85\u51FA\u4E86\u6B63\u65B9\u5F62`, `the circle of radius ${i + 1} reaches outside the square`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = BigInt(centers[i][0]) - BigInt(centers[j][0]), dy = BigInt(centers[i][1]) - BigInt(centers[j][1]);
    const gap = BigInt(radii[i] + radii[j]);
    if (dx * dx + dy * dy < gap * gap) return fail("OVERLAP", `\u534A\u5F84\u4E3A ${i + 1} \u4E0E ${j + 1} \u7684\u5706\u91CD\u53E0`, `the circles of radius ${i + 1} and ${j + 1} overlap`);
  }
  return ok(BigInt(side2), printFixed(side2));
}
var problem10 = { definition: definition10, verify: verifyGraduatedCircles };

// src/problems/p15-spread-points-in-square.ts
var SPREAD_MAX_N = 120;
function spreadBaseline(n) {
  let columns = 1;
  while (columns * columns < n) columns += 1;
  const step = Math.floor(SCALE / columns), offset = Math.floor(step / 2);
  return {
    points: Array.from({ length: n }, (_, index) => [
      printFixed(offset + index % columns * step),
      printFixed(offset + Math.floor(index / columns) * step)
    ])
  };
}
var spreadInstances = Array.from({ length: 11 }, (_, index) => {
  const n = index + 2;
  return {
    instanceId: `p15-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: spreadBaseline(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition11 = {
  id: "p15",
  instanceId: "p15-n6-v1",
  code: "P15",
  slug: "spread-points-in-square",
  category: "packing",
  title: "\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u7684\u6563\u70B9\u5206\u79BB",
  summary: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E24\u70B9\u4E4B\u95F4\u7684\u6700\u5C0F\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB\u7684\u5E73\u65B9",
  goalLabel: "\u6700\u5C0F\u4E24\u70B9\u8DDD\u79BB",
  scoreIs: "square",
  goalLabelEn: "the smallest distance between two points",
  instanceName: "n = 6",
  parameters: { n: 6 },
  baselineAnswer: spreadBaseline(6),
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002',
  titleEn: "Spreading points in the unit square",
  summaryEn: "Place n points in the unit square so that the smallest distance between any two of them is as large as possible.",
  scoreLabelEn: "squared minimum pairwise distance",
  instanceNameEn: "n = 6",
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5".',
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4E24\u4E24\u4E4B\u95F4\u7684\u6700\u5C0F\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n points in the unit square, maximizing the smallest distance between any two of them.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9 points\uFF0C\u4E24\u4E24\u4E0D\u91CD\u5408", textEn: "Exactly n points, no two coinciding" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u6B63\u65B9\u5F62\u5185\u6216\u8FB9\u754C\u4E0A", textEn: "Every point lies inside the square or on its boundary" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6700\u5C0F\u7684\u4E24\u70B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u5176\u5E73\u65B9\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the smallest pairwise distance as large as possible; compared internally by its square, exactly" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6563\u70B9\u5206\u79BB\u5C31\u662F\u88C5\u7B49\u5706\uFF1A\u4EE5\u6BCF\u4E2A\u70B9\u4E3A\u5706\u5FC3\u3001\u6700\u5C0F\u8DDD\u79BB\u4E00\u534A\u4E3A\u534A\u5F84\u7684\u5706\u5FC5\u987B\u4E92\u4E0D\u91CD\u53E0\u3002\u6700\u4F18\u6784\u5F62\u56E0\u6B64\u4E5F\u662F\u5361\u6B7B\u7684\u63A5\u89E6\u7ED3\u6784\uFF0C\u5BB9\u5668\u7684\u5F62\u72B6\u51B3\u5B9A\u4E00\u5207\u3002",
      textEn: "Spreading points IS packing equal circles: discs of half the minimum distance around each point must not overlap. Optima are jammed contact structures, and the container shape decides everything."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u6B63\u65B9\u5F62\u6563\u70B9\u4E0E\u7B49\u5706\u88C5\u65B9\u4E92\u4E3A\u5BF9\u5076\uFF0Ccsq \u8868\u7684\u8BC1\u660E\u7ECF\u6362\u7B97\u9002\u7528\uFF1B\u672C\u7AD9\u5DF2\u8BC1 n = 2, 4, 5, 9\uFF08\u521D\u7B49\u8BBA\u8BC1\uFF0C\u89C1\u5404\u5B50\u9898\uFF09\uFF0C\u5176\u4F59\u6309\u5BF9\u5076\u968F csq \u7684\u8FDB\u5EA6\u3002",
      textEn: "Spreading points in a square is dual to packing equal circles in one; proofs in the csq table transfer. n = 2, 4, 5 and 9 are proven here by elementary arguments, and the rest follow csq's progress.",
      url: "https://web.archive.org/web/20260508083819/http://hydra.nat.uni-magdeburg.de/packing/csq/csq.html"
    }
  ],
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u5750\u6807\u548C\u957F\u5EA6\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and lengths share one unit and are written as plain decimals such as "0.5", to at most nine decimal places.',
  instances: spreadInstances
};
function verifySpreadPoints(params, answer) {
  const n = asInt(params.n, "n"), size = SCALE;
  if (n < 2 || n > SPREAD_MAX_N) return fail("COUNT", `n \u5FC5\u987B\u5728 2 \u4E0E ${SPREAD_MAX_N} \u4E4B\u95F4`, `n must be between 2 and ${SPREAD_MAX_N}`);
  if (size <= 0) return fail("BAD_PARAMS", "\u6B63\u65B9\u5F62\u8FB9\u957F\u5FC5\u987B\u4E3A\u6B63\u6570", "the square's side must be a positive number");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > size || y > size) return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u4E0D\u5728\u6B63\u65B9\u5F62\u5185`, `point ${i + 1} is outside the square`);
  }
  let minimum = null;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (minimum === null || squared < minimum) minimum = squared;
  }
  if (minimum === null || minimum === 0n) return fail("COINCIDENT", "\u5B58\u5728\u4E24\u4E2A\u91CD\u5408\u7684\u70B9\uFF0C\u6700\u5C0F\u8DDD\u79BB\u4E3A 0", "two of the points coincide, so the smallest distance is 0");
  return ok(minimum, printSquared(minimum));
}
var problem11 = { definition: definition11, verify: verifySpreadPoints };

// src/problems/p18-tilted-squares-in-square.ts
var MIN_N5 = 3;
var MAX_N5 = 30;
var COORD_LIMIT2 = 4 * SCALE;
var dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
var absBig3 = (value) => value < 0n ? -value : value;
function separated2(a, b) {
  const d = [b.c[0] - a.c[0], b.c[1] - a.c[1]];
  for (const axis of [a.u, a.v, b.u, b.v]) {
    const reach = absBig3(dot2(axis, a.u)) + absBig3(dot2(axis, a.v)) + absBig3(dot2(axis, b.u)) + absBig3(dot2(axis, b.v));
    if (absBig3(dot2(axis, d)) >= reach) return true;
  }
  return false;
}
function rowBaseline4(n) {
  const half = Math.floor(SCALE / (2 * n));
  return { squares: Array.from({ length: n }, (_, index) => ({ cx: printFixed(half * (2 * index + 1)), cy: printFixed(half), ux: printFixed(half), uy: printFixed(0) })) };
}
var instances7 = Array.from({ length: MAX_N5 - MIN_N5 + 1 }, (_, index) => {
  const n = MIN_N5 + index;
  return {
    instanceId: `p18-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: rowBaseline4(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition12 = {
  id: "p18",
  instanceId: "p18-n5-v1",
  code: "P18",
  slug: "tilted-squares-in-square",
  category: "packing",
  title: "\u53EF\u503E\u659C\u7B49\u6B63\u65B9\u5F62\u88C5\u5165\u5355\u4F4D\u6B63\u65B9\u5F62",
  summary: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E n \u4E2A\u5C0F\u6B63\u65B9\u5F62\uFF0C\u5927\u5C0F\u5B8C\u5168\u4E00\u6837\uFF0C\u6BCF\u4E2A\u90FD\u53EF\u4EE5\u4EFB\u610F\u8F6C\u89D2\u5EA6\uFF1B\u8BA9\u8FD9\u4E2A\u5171\u540C\u7684\u8FB9\u957F\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u8FB9\u957F\u7684\u5E73\u65B9",
  goalLabel: "\u6700\u5C0F\u8FB9\u957F",
  scoreIs: "square",
  goalLabelEn: "the smallest side",
  instanceName: "n = 5",
  parameters: { n: 5 },
  baselineAnswer: rowBaseline4(5),
  answerHelp: '\u6BCF\u4E2A\u6B63\u65B9\u5F62\u63D0\u4EA4 {cx,cy,ux,uy}\uFF1A\u4E2D\u5FC3\u52A0\u4E00\u6761\u534A\u8FB9\u5411\u91CF\uFF0C\u53E6\u4E00\u6761\u534A\u8FB9\u5411\u91CF\u56FA\u5B9A\u53D6 (-uy,ux)\u3002\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.1"\uFF1B\u89D2\u5EA6\u5B8C\u5168\u81EA\u7531\uFF0C\u8BA1\u5206\u53D6\u6700\u5C0F\u6B63\u65B9\u5F62\u7684\u8FB9\u957F\uFF0C\u6240\u4EE5\u628A\u5B83\u4EEC\u5199\u5F97\u4E00\u6837\u5927\u6700\u5212\u7B97\u3002\u8FB9\u957F\u672C\u8EAB\u51E0\u4E4E\u603B\u662F\u65E0\u7406\u6570\uFF0C\u5199\u4E0D\u6210\u6709\u9650\u5C0F\u6570\uFF0C\u6240\u4EE5\u4F60\u5199\u7684\u662F\u90A3\u6761\u534A\u8FB9\u5411\u91CF\uFF0C\u8FB9\u957F\u7531\u5B83\u7CBE\u786E\u5B9A\u51FA\u3002',
  titleEn: "Tilted equal squares in the unit square",
  summaryEn: "Place n equal squares inside the unit square, each free to tilt, and maximize their common side.",
  scoreLabelEn: "smallest side squared",
  instanceNameEn: "n = 5",
  answerHelpEn: 'Submit {cx,cy,ux,uy} per square: a centre plus one half-edge vector, the other half-edge being (-uy,ux). Write every number as a decimal string such as "0.1", every angle is free, and the smallest square is the one scored, so writing them equal is the winning move. The side is almost always irrational, so what you write is the half-edge vector and the side follows from it exactly.',
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E n \u4E2A\u5927\u5C0F\u5B8C\u5168\u76F8\u540C\u7684\u5C0F\u6B63\u65B9\u5F62\uFF0C\u6BCF\u4E2A\u90FD\u53EF\u4EE5\u4EFB\u610F\u8F6C\u89D2\u5EA6\uFF0C\u4E92\u4E0D\u91CD\u53E0\uFF1B\u8BA9\u5171\u540C\u8FB9\u957F\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n equal squares in the unit square, each free to tilt, none overlapping, and make their common side as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6BCF\u4E2A\u6B63\u65B9\u5F62\u5199 {cx, cy, ux, uy}\uFF1A\u4E2D\u5FC3\u52A0\u4E00\u6761\u534A\u8FB9\u5411\u91CF\uFF0C\u53E6\u4E00\u6761\u56FA\u5B9A\u53D6 (\u2212uy, ux)", textEn: "Each square is {cx, cy, ux, uy}: a centre plus one half-edge vector, the other fixed as (\u2212uy, ux)" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u6B63\u65B9\u5F62\u7684\u89D2\u5EA6\u5B8C\u5168\u81EA\u7531\uFF1B\u5168\u90E8\u843D\u5728\u5BB9\u5668\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u8D34\u8FB9\u63A5\u89E6\u5141\u8BB8\u3002\u8BA1\u5206\u53EA\u770B\u6700\u5C0F\u7684\u90A3\u4E2A\u6B63\u65B9\u5F62\uFF0C\u6240\u4EE5\u8FB9\u957F\u4E0D\u4E00\u81F4\u5360\u4E0D\u5230\u4FBF\u5B9C", textEn: "Every square tilts freely; all lie inside the container; no two overlap in their interiors, touching allowed. Only the smallest square is scored, so unequal sides gain nothing" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u5171\u540C\u8FB9\u957F\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u5176\u5E73\u65B9\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the common side as large as possible; compared internally by its square, exactly" }
  ],
  intuition: [
    {
      title: "\u4E3A\u4EC0\u4E48\u5141\u8BB8\u503E\u659C",
      titleEn: "Why tilting is the point",
      text: "\u6B63\u7740\u6446\u662F\u7F51\u683C\uFF1B\u659C\u7740\u6446\u80FD\u5728\u7F51\u683C\u6F0F\u4E0B\u7684\u7F1D\u91CC\u518D\u6324\u51FA\u7A7A\u95F4\u3002n = 5 \u7684\u5DF2\u77E5\u6700\u597D\u89E3\u5C31\u6709\u4E00\u4E2A 45\xB0 \u7684\u6B63\u65B9\u5F62\u5361\u5728\u56DB\u4E2A\u6B63\u653E\u7684\u4E2D\u95F4\u3002\u503E\u659C\u662F\u8FD9\u9053\u9898\u548C\u666E\u901A\u88C5\u7BB1\u7684\u5168\u90E8\u533A\u522B\u3002",
      textEn: "Straight is a grid; tilting squeezes space out of the seams a grid leaves \u2014 the best known n = 5 has one square at 45\xB0 wedged between four straight ones. Tilting is the entire difference between this and plain packing."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "s(n) \u8BB0\u53F7\u4E0B\u7684\u7ECF\u5178\u95EE\u9898\uFF1An = 3, 4, 6..9, 14..16, 25 \u5DF2\u8BC1\u660E\uFF08G\xF6bel\u3001Kearney\u2013Shiu \u7B49\uFF09\uFF0C\u5176\u4F59\u5F00\u653E\uFF1BFriedman \u7684 squares \u7EFC\u8FF0\u6301\u7EED\u66F4\u65B0\u8FD9\u4E00\u65CF\u3002",
      textEn: "The classic s(n) problem: proven for n = 3, 4, 6..9, 14..16 and 25 (G\xF6bel, Kearney\u2013Shiu and others), the rest open; Friedman's squares survey keeps the running record.",
      url: "https://erich-friedman.github.io/papers/squares/squares.html"
    }
  ],
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u5750\u6807\u548C\u5411\u91CF\u7528\u540C\u4E00\u4E2A\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.1"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and vectors share one unit and are written as plain decimals such as "0.1", to at most nine decimal places.',
  instances: instances7
};
function verifyTiltedSquares(params, answer) {
  const n = asInt(params.n, "n");
  const size = SCALE;
  if (n < 1 || n > 64 || size <= 0) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const squares = asArray(answer.squares, "squares");
  if (squares.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u6B63\u65B9\u5F62`, `exactly ${n} squares are needed`);
  const tiles = [];
  let smallest = null;
  for (let i = 0; i < n; i += 1) {
    const raw2 = squares[i];
    if (!isObject(raw2)) return fail("BAD_SQUARE", `squares[${i}] \u5FC5\u987B\u662F\u5BF9\u8C61`, `squares[${i}] must be an object`);
    const cx = parseFixed(raw2.cx, `squares[${i}].cx`);
    const cy = parseFixed(raw2.cy, `squares[${i}].cy`);
    const ux = parseFixed(raw2.ux, `squares[${i}].ux`);
    const uy = parseFixed(raw2.uy, `squares[${i}].uy`);
    for (const value of [cx, cy, ux, uy]) if (value < -COORD_LIMIT2 || value > COORD_LIMIT2) return fail("OUT_OF_BOUNDS", `squares[${i}] \u7684\u5750\u6807\u8D85\u51FA\u4E86\u5141\u8BB8\u8303\u56F4`, `the coordinates of squares[${i}] are outside the permitted range`);
    const u = [BigInt(ux), BigInt(uy)];
    const v = [-u[1], u[0]];
    const quarter = u[0] * u[0] + u[1] * u[1];
    if (quarter <= 0n) return fail("DEGENERATE", `squares[${i}] \u7684\u8FB9\u957F\u4E3A\u96F6`, `squares[${i}] has a side of zero`);
    if (smallest === null || quarter < smallest) smallest = quarter;
    const c = [BigInt(cx), BigInt(cy)];
    const limit = BigInt(size);
    for (const su of [1n, -1n]) for (const sv of [1n, -1n]) {
      const x = c[0] + su * u[0] + sv * v[0];
      const y = c[1] + su * u[1] + sv * v[1];
      if (x < 0n || y < 0n || x > limit || y > limit) return fail("OUT_OF_BOUNDS", `squares[${i}] \u6709\u89D2\u70B9\u843D\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u4E4B\u5916`, `squares[${i}] has a corner outside the unit square`);
    }
    tiles.push({ c, u, v });
  }
  if (smallest === null) return fail("COUNT", "\u7B54\u6848\u91CC\u6CA1\u6709\u4EFB\u4F55\u6B63\u65B9\u5F62", "the answer contains no squares at all");
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (!separated2(tiles[i], tiles[j])) return fail("OVERLAP", `\u6B63\u65B9\u5F62 ${i + 1} \u4E0E ${j + 1} \u7684\u5185\u90E8\u91CD\u53E0`, `the interiors of squares ${i + 1} and ${j + 1} overlap`);
  const sideSquared = 4n * smallest;
  return ok(sideSquared, printSquared(sideSquared));
}
var problem12 = { definition: definition12, verify: verifyTiltedSquares };

// src/problems/p29-heilbronn-in-triangle.ts
var MAX_N6 = 40;
var latticeBaselines = {
  5: { denominator: 6, cells: [[0, 1], [3, 0], [3, 3], [4, 1], [6, 0]] },
  6: { denominator: 6, cells: [[0, 2], [0, 5], [1, 0], [2, 4], [3, 1], [5, 1]] },
  7: { denominator: 6, cells: [[0, 1], [0, 5], [1, 0], [2, 2], [2, 4], [4, 0], [5, 1]] },
  8: { denominator: 6, cells: [[0, 0], [0, 1], [1, 4], [1, 5], [2, 2], [2, 4], [3, 1], [5, 0]] },
  9: { denominator: 6, cells: [[0, 2], [0, 5], [1, 1], [1, 3], [2, 2], [2, 3], [3, 0], [5, 1], [6, 0]] },
  10: { denominator: 7, cells: [[0, 2], [0, 5], [1, 3], [1, 5], [2, 0], [3, 0], [3, 1], [4, 3], [5, 1], [5, 2]] }
};
var pointCounts = [5, 6, 7, 8, 9, 10];
function latticeBaseline(n) {
  const { denominator, cells } = latticeBaselines[n];
  const step = Math.floor(SCALE / denominator);
  return { points: cells.map(([a, b]) => [printFixed(a * step), printFixed(b * step)]) };
}
var instances8 = pointCounts.map((n) => ({
  instanceId: `p29-n${n}-v1`,
  instanceName: `n = ${n}`,
  instanceNameEn: `n = ${n}`,
  parameters: { n },
  baselineAnswer: latticeBaseline(n)
}));
var definition13 = {
  id: "p29",
  instanceId: "p29-n6-v1",
  code: "P29",
  slug: "heilbronn-in-triangle",
  category: "extremal",
  title: "\u4E09\u89D2\u5F62\u5BB9\u5668\u5185\u7684 Heilbronn \u95EE\u9898",
  summary: "\u5728\u76F4\u89D2\u4E09\u89D2\u5F62 (0,0)\u3001(size,0)\u3001(0,size) \u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u6700\u5927\u5316\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u9762\u79EF\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u4E09\u89D2\u5F62\u7684\u4E8C\u500D\u9762\u79EF",
  goalLabel: "\u6700\u5C0F\u4E09\u89D2\u5F62\u7684\u9762\u79EF",
  scoreIs: "double",
  goalLabelEn: "the smallest triangle's area",
  instanceName: "n = 6",
  parameters: { n: 6 },
  baselineAnswer: latticeBaseline(6),
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002',
  titleEn: "Heilbronn's problem in a triangle",
  summaryEn: "Place n points inside the right triangle (0,0), (size,0), (0,size) and maximize the smallest triangle area among all triples.",
  scoreLabelEn: "minimum triangle area, doubled",
  instanceNameEn: "n = 6",
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5".',
  definition: "\u5728\u9876\u70B9\u4E3A (0, 0)\u3001(1, 0)\u3001(0, 1) \u7684\u76F4\u89D2\u4E09\u89D2\u5F62\u5185\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u6700\u5C0F\u4E09\u89D2\u5F62\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n points inside the right triangle with vertices (0, 0), (1, 0) and (0, 1), maximizing the smallest triangle formed by any three of them.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u76F4\u89D2\u4E09\u89D2\u5F62\uFF0C\u9876\u70B9 (0, 0)\u3001(1, 0)\u3001(0, 1)\uFF1A\u5185\u90E8\u5C31\u662F x \u2265 0\u3001y \u2265 0\u3001x + y \u2264 1", textEn: "A right triangle with vertices (0, 0), (1, 0) and (0, 1): the region x \u2265 0, y \u2265 0, x + y \u2264 1" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9 points\uFF0C\u4EFB\u610F\u4E09\u70B9\u4E0D\u5171\u7EBF", textEn: "Exactly n points, no three collinear" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u70B9\u90FD\u5728\u4E09\u89D2\u5F62\u5185\u6216\u8FB9\u754C\u4E0A", textEn: "Every point lies inside the triangle or on its boundary" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u4EFB\u610F\u4E09\u70B9\u6784\u6210\u7684\u4E09\u89D2\u5F62\u4E2D\u6700\u5C0F\u7684\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u4E8C\u500D\u9762\u79EF\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the smallest triangle over all triples as large as possible; compared internally by twice the area, exactly" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u628A\u70B9\u6492\u5F97\u5747\u5300\u5E76\u4E0D\u591F\uFF1A\u4EFB\u4F55\u4E09\u70B9\u90FD\u4E0D\u80FD\u63A5\u8FD1\u5171\u7EBF\uFF0C\u800C\u8FD1\u5171\u7EBF\u6070\u6070\u662F\u770B\u8D77\u6765\u6574\u9F50\u7684\u6392\u5E03\u6700\u5BB9\u6613\u72AF\u7684\u9519\u3002\u6700\u4F18\u6784\u5F62\u5F80\u5F80\u4E0D\u5BF9\u79F0\uFF0C\u8FDE\u5F62\u72B6\u90FD\u96BE\u731C\u3002",
      textEn: "Even spreading is not enough: no three points may come close to collinear, and near-collinearity is exactly what tidy arrangements love to do. Optima are often asymmetric and hard even to guess."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n = 5, 6 \u7531 Yang\u3001Zhang \u4E0E Zeng \u8BC1\u660E\uFF0Cn = 7 \u7531 Sudermann-Merx \u8BC1\u660E\uFF0C\u89C1 arXiv:2607.15021\uFF1Bn \u2265 8 \u5168\u90E8\u5F00\u653E\u3002",
      textEn: "n = 5 and 6 were proven by Yang, Zhang and Zeng, n = 7 by Sudermann-Merx \u2014 see arXiv:2607.15021; everything from n = 8 up is open.",
      url: "https://arxiv.org/abs/2607.15021"
    }
  ],
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u76F4\u89D2\u4E09\u89D2\u5F62\uFF0C\u4E09\u4E2A\u9876\u70B9\u662F (0, 0)\u3001(1, 0) \u4E0E (0, 1)\uFF1A\u5185\u90E8\u5C31\u662F x \u2265 0\u3001y \u2265 0\u3001x + y \u2264 1\u3002\u5750\u6807\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.5"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is the right triangle with vertices (0, 0), (1, 0) and (0, 1): its interior is exactly x \u2265 0, y \u2265 0, x + y \u2264 1. Coordinates are written as plain decimals such as "0.5", to at most nine decimal places.',
  instances: instances8
};
var absBig4 = (value) => value < 0n ? -value : value;
function verifyHeilbronnInTriangle(params, answer) {
  const n = asInt(params.n, "n"), size = SCALE;
  if (n < 3 || n > MAX_N6) refuse("n \u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "n is outside the range the verifier supports");
  if (size < 2 || size > SCALE) refuse("size \u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "size is outside the range the verifier supports");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (const [x, y] of points) if (x < 0 || y < 0 || x + y > size) return fail("OUT_OF_BOUNDS", "\u81F3\u5C11\u4E00\u4E2A\u70B9\u843D\u5728\u4E09\u89D2\u5F62\u4E4B\u5916", "at least one point lies outside the triangle");
  const seen = /* @__PURE__ */ new Set();
  for (const [x, y] of points) {
    const key = `${x},${y}`;
    if (seen.has(key)) return fail("DUPLICATE", `\u70B9 (${x}, ${y}) \u51FA\u73B0\u4E86\u4E24\u6B21`, `the point (${x}, ${y}) appears twice`);
    seen.add(key);
  }
  let minimum = null;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    const [ax, ay] = points[i], [bx, by] = points[j], [cx, cy] = points[k];
    const doubledArea = absBig4((BigInt(bx) - BigInt(ax)) * (BigInt(cy) - BigInt(ay)) - (BigInt(by) - BigInt(ay)) * (BigInt(cx) - BigInt(ax)));
    if (minimum === null || doubledArea < minimum) minimum = doubledArea;
  }
  if (minimum === null || minimum === 0n) return fail("COLLINEAR", "\u5B58\u5728\u4E09\u70B9\u5171\u7EBF\uFF0C\u6700\u5C0F\u9762\u79EF\u4E3A 0", "three of the points are collinear, so the smallest area is 0");
  return ok(minimum, printSquared(minimum));
}
var problem13 = { definition: definition13, verify: verifyHeilbronnInTriangle };

// src/problems/p51-lights-in-a-square.ts
var MAX_LIGHTS = 60;
var INTENSITY_UNIT = 1000000n;
var INTERNAL = 1000000000000n;
var CLAIM_STEP = 1000n;
var BOX_BUDGET = 5e5;
var SPAN2 = BigInt(SCALE);
var TERM = INTERNAL * SPAN2 * SPAN2;
var maxAbs = (a, b) => {
  const p = a < 0n ? -a : a, q = b < 0n ? -b : b;
  return p > q ? p : q;
};
function boxLowerBound(lights, x0, y0, x1, y1) {
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
function intensityAt(lights, x, y) {
  let total = 0n;
  for (const light of lights) {
    const dx = light.x - x, dy = light.y - y;
    const squared = dx * dx + dy * dy;
    if (squared === 0n) return -1n;
    total += TERM / squared;
  }
  return total;
}
function proveMinimumAtLeast(lights, claim) {
  let boxes = 0;
  const stack = [[0n, 0n, SPAN2, SPAN2]];
  while (stack.length > 0) {
    const [x0, y0, x1, y1] = stack.pop();
    if ((boxes += 1) > BOX_BUDGET) return { verdict: "undecided", boxes };
    if (boxLowerBound(lights, x0, y0, x1, y1) >= claim) continue;
    const midX = (x0 + x1) / 2n, midY = (y0 + y1) / 2n;
    const here = intensityAt(lights, midX, midY);
    if (here >= 0n && here < claim) return { verdict: "refuted", boxes };
    if (x1 - x0 <= 1n && y1 - y0 <= 1n) return { verdict: "undecided", boxes };
    stack.push([x0, y0, midX, midY], [midX, y0, x1, midY], [x0, midY, midX, y1], [midX, midY, x1, y1]);
  }
  return { verdict: "proved", boxes };
}
var instances9 = [
  {
    instanceId: "p51-n2-v1",
    instanceName: "n = 2",
    instanceNameEn: "n = 2",
    parameters: { n: 2 },
    baselineAnswer: { lights: [["0.25", "0.5"], ["0.75", "0.5"]], intensity: "4.42" }
  },
  {
    instanceId: "p51-n3-v1",
    instanceName: "n = 3",
    instanceNameEn: "n = 3",
    parameters: { n: 3 },
    baselineAnswer: { lights: [["0.25", "0.25"], ["0.75", "0.25"], ["0.25", "0.75"]], intensity: "4.07" }
  },
  {
    instanceId: "p51-n4-v1",
    instanceName: "n = 4",
    instanceNameEn: "n = 4",
    parameters: { n: 4 },
    baselineAnswer: { lights: [["0.25", "0.25"], ["0.75", "0.25"], ["0.25", "0.75"], ["0.75", "0.75"]], intensity: "12.07" }
  },
  {
    instanceId: "p51-n5-v1",
    instanceName: "n = 5",
    instanceNameEn: "n = 5",
    parameters: { n: 5 },
    baselineAnswer: { lights: [["0.166666667", "0.25"], ["0.5", "0.25"], ["0.833333333", "0.25"], ["0.166666667", "0.75"], ["0.5", "0.75"]], intensity: "8.23" }
  },
  {
    instanceId: "p51-n6-v1",
    instanceName: "n = 6",
    instanceNameEn: "n = 6",
    parameters: { n: 6 },
    baselineAnswer: { lights: [["0.166666667", "0.25"], ["0.5", "0.25"], ["0.833333333", "0.25"], ["0.166666667", "0.75"], ["0.5", "0.75"], ["0.833333333", "0.75"]], intensity: "19.30" }
  },
  {
    instanceId: "p51-n7-v1",
    instanceName: "n = 7",
    instanceNameEn: "n = 7",
    parameters: { n: 7 },
    baselineAnswer: { lights: [["0.166666667", "0.166666667"], ["0.5", "0.166666667"], ["0.833333333", "0.166666667"], ["0.166666667", "0.5"], ["0.5", "0.5"], ["0.833333333", "0.5"], ["0.166666667", "0.833333333"]], intensity: "11.19" }
  },
  {
    instanceId: "p51-n8-v1",
    instanceName: "n = 8",
    instanceNameEn: "n = 8",
    parameters: { n: 8 },
    baselineAnswer: { lights: [["0.166666667", "0.166666667"], ["0.5", "0.166666667"], ["0.833333333", "0.166666667"], ["0.166666667", "0.5"], ["0.5", "0.5"], ["0.833333333", "0.5"], ["0.166666667", "0.833333333"], ["0.5", "0.833333333"]], intensity: "14.79" }
  },
  {
    instanceId: "p51-n9-v1",
    instanceName: "n = 9",
    instanceNameEn: "n = 9",
    parameters: { n: 9 },
    baselineAnswer: { lights: [["0.166666667", "0.166666667"], ["0.5", "0.166666667"], ["0.833333333", "0.166666667"], ["0.166666667", "0.5"], ["0.5", "0.5"], ["0.833333333", "0.5"], ["0.166666667", "0.833333333"], ["0.5", "0.833333333"], ["0.833333333", "0.833333333"]], intensity: "32.79" }
  },
  {
    instanceId: "p51-n10-v1",
    instanceName: "n = 10",
    instanceNameEn: "n = 10",
    parameters: { n: 10 },
    baselineAnswer: { lights: [["0.125", "0.166666667"], ["0.375", "0.166666667"], ["0.625", "0.166666667"], ["0.875", "0.166666667"], ["0.125", "0.5"], ["0.375", "0.5"], ["0.625", "0.5"], ["0.875", "0.5"], ["0.125", "0.833333333"], ["0.375", "0.833333333"]], intensity: "16.72" }
  },
  {
    instanceId: "p51-n11-v1",
    instanceName: "n = 11",
    instanceNameEn: "n = 11",
    parameters: { n: 11 },
    baselineAnswer: { lights: [["0.125", "0.166666667"], ["0.375", "0.166666667"], ["0.625", "0.166666667"], ["0.875", "0.166666667"], ["0.125", "0.5"], ["0.375", "0.5"], ["0.625", "0.5"], ["0.875", "0.5"], ["0.125", "0.833333333"], ["0.375", "0.833333333"], ["0.625", "0.833333333"]], intensity: "22.66" }
  },
  {
    instanceId: "p51-n12-v1",
    instanceName: "n = 12",
    instanceNameEn: "n = 12",
    parameters: { n: 12 },
    baselineAnswer: { lights: [["0.125", "0.166666667"], ["0.375", "0.166666667"], ["0.625", "0.166666667"], ["0.875", "0.166666667"], ["0.125", "0.5"], ["0.375", "0.5"], ["0.625", "0.5"], ["0.875", "0.5"], ["0.125", "0.833333333"], ["0.375", "0.833333333"], ["0.625", "0.833333333"], ["0.875", "0.833333333"]], intensity: "45.70" }
  },
  {
    instanceId: "p51-n13-v1",
    instanceName: "n = 13",
    instanceNameEn: "n = 13",
    parameters: { n: 13 },
    baselineAnswer: { lights: [["0.125", "0.125"], ["0.375", "0.125"], ["0.625", "0.125"], ["0.875", "0.125"], ["0.125", "0.375"], ["0.375", "0.375"], ["0.625", "0.375"], ["0.875", "0.375"], ["0.125", "0.625"], ["0.375", "0.625"], ["0.625", "0.625"], ["0.875", "0.625"], ["0.125", "0.875"]], intensity: "24.60" }
  },
  {
    instanceId: "p51-n14-v1",
    instanceName: "n = 14",
    instanceNameEn: "n = 14",
    parameters: { n: 14 },
    baselineAnswer: { lights: [["0.125", "0.125"], ["0.375", "0.125"], ["0.625", "0.125"], ["0.875", "0.125"], ["0.125", "0.375"], ["0.375", "0.375"], ["0.625", "0.375"], ["0.875", "0.375"], ["0.125", "0.625"], ["0.375", "0.625"], ["0.625", "0.625"], ["0.875", "0.625"], ["0.125", "0.875"], ["0.375", "0.875"]], intensity: "27.06" }
  },
  {
    instanceId: "p51-n15-v1",
    instanceName: "n = 15",
    instanceNameEn: "n = 15",
    parameters: { n: 15 },
    baselineAnswer: { lights: [["0.125", "0.125"], ["0.375", "0.125"], ["0.625", "0.125"], ["0.875", "0.125"], ["0.125", "0.375"], ["0.375", "0.375"], ["0.625", "0.375"], ["0.875", "0.375"], ["0.125", "0.625"], ["0.375", "0.625"], ["0.625", "0.625"], ["0.875", "0.625"], ["0.125", "0.875"], ["0.375", "0.875"], ["0.625", "0.875"]], intensity: "33.46" }
  },
  {
    instanceId: "p51-n16-v1",
    instanceName: "n = 16",
    instanceNameEn: "n = 16",
    parameters: { n: 16 },
    baselineAnswer: { lights: [["0.125", "0.125"], ["0.375", "0.125"], ["0.625", "0.125"], ["0.875", "0.125"], ["0.125", "0.375"], ["0.375", "0.375"], ["0.625", "0.375"], ["0.875", "0.375"], ["0.125", "0.625"], ["0.375", "0.625"], ["0.625", "0.625"], ["0.875", "0.625"], ["0.125", "0.875"], ["0.375", "0.875"], ["0.625", "0.875"], ["0.875", "0.875"]], intensity: "65.46" }
  },
  {
    instanceId: "p51-n17-v1",
    instanceName: "n = 17",
    instanceNameEn: "n = 17",
    parameters: { n: 17 },
    baselineAnswer: { lights: [["0.1", "0.125"], ["0.3", "0.125"], ["0.5", "0.125"], ["0.7", "0.125"], ["0.9", "0.125"], ["0.1", "0.375"], ["0.3", "0.375"], ["0.5", "0.375"], ["0.7", "0.375"], ["0.9", "0.375"], ["0.1", "0.625"], ["0.3", "0.625"], ["0.5", "0.625"], ["0.7", "0.625"], ["0.9", "0.625"], ["0.1", "0.875"], ["0.3", "0.875"]], intensity: "32.33" }
  },
  {
    instanceId: "p51-n18-v1",
    instanceName: "n = 18",
    instanceNameEn: "n = 18",
    parameters: { n: 18 },
    baselineAnswer: { lights: [["0.1", "0.125"], ["0.3", "0.125"], ["0.5", "0.125"], ["0.7", "0.125"], ["0.9", "0.125"], ["0.1", "0.375"], ["0.3", "0.375"], ["0.5", "0.375"], ["0.7", "0.375"], ["0.9", "0.375"], ["0.1", "0.625"], ["0.3", "0.625"], ["0.5", "0.625"], ["0.7", "0.625"], ["0.9", "0.625"], ["0.1", "0.875"], ["0.3", "0.875"], ["0.5", "0.875"]], intensity: "36.09" }
  },
  {
    instanceId: "p51-n19-v1",
    instanceName: "n = 19",
    instanceNameEn: "n = 19",
    parameters: { n: 19 },
    baselineAnswer: { lights: [["0.1", "0.125"], ["0.3", "0.125"], ["0.5", "0.125"], ["0.7", "0.125"], ["0.9", "0.125"], ["0.1", "0.375"], ["0.3", "0.375"], ["0.5", "0.375"], ["0.7", "0.375"], ["0.9", "0.375"], ["0.1", "0.625"], ["0.3", "0.625"], ["0.5", "0.625"], ["0.7", "0.625"], ["0.9", "0.625"], ["0.1", "0.875"], ["0.3", "0.875"], ["0.5", "0.875"], ["0.7", "0.875"]], intensity: "45.56" }
  },
  {
    instanceId: "p51-n20-v1",
    instanceName: "n = 20",
    instanceNameEn: "n = 20",
    parameters: { n: 20 },
    baselineAnswer: { lights: [["0.1", "0.125"], ["0.3", "0.125"], ["0.5", "0.125"], ["0.7", "0.125"], ["0.9", "0.125"], ["0.1", "0.375"], ["0.3", "0.375"], ["0.5", "0.375"], ["0.7", "0.375"], ["0.9", "0.375"], ["0.1", "0.625"], ["0.3", "0.625"], ["0.5", "0.625"], ["0.7", "0.625"], ["0.9", "0.625"], ["0.1", "0.875"], ["0.3", "0.875"], ["0.5", "0.875"], ["0.7", "0.875"], ["0.9", "0.875"]], intensity: "84.58" }
  }
];
var definition14 = {
  id: "p51",
  instanceId: "p51-n5-v1",
  code: "P51",
  slug: "lights-in-a-square",
  category: "extremal",
  title: "\u5355\u4F4D\u6B63\u65B9\u5F62\u91CC\u7684\u7167\u660E",
  summary: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E n \u4E2A\u5355\u4F4D\u4EAE\u5EA6\u7684\u5149\u6E90\uFF0C\u4F7F\u6B63\u65B9\u5F62\u5185\u6700\u6697\u7684\u90A3\u4E00\u70B9\u5C3D\u53EF\u80FD\u4EAE\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u5149\u5F3A",
  instanceName: "n = 5",
  parameters: instances9[3].parameters,
  baselineAnswer: instances9[3].baselineAnswer,
  answerHelp: "\u63D0\u4EA4 lights \u4E0E intensity\u3002lights \u662F n \u4E2A\u5149\u6E90\u5750\u6807\uFF0C\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u3002intensity \u662F\u4F60\u58F0\u79F0\u6B63\u65B9\u5F62\u5185\u4EFB\u4F55\u4E00\u70B9\u90FD\u4E0D\u4F4E\u4E8E\u7684\u5149\u5F3A\uFF0C\u6700\u591A\u516D\u4F4D\u5C0F\u6570\u3002\u9A8C\u8BC1\u5668\u4F1A\u4E25\u683C\u8BC1\u660E\u8FD9\u4E2A\u4E0B\u754C\uFF0C\u8BC1\u4E0D\u51FA\u6765\u5C31\u62D2\u6536\uFF0C\u6240\u4EE5\u628A\u5B83\u62A5\u5F97\u6BD4\u4F60\u5B9E\u9645\u8FBE\u5230\u7684\u6700\u5C0F\u503C\u7565\u4F4E\u4E00\u70B9\u3002\u67D0\u70B9\u7684\u5149\u5F3A\u662F\u5404\u5149\u6E90\u5230\u8BE5\u70B9\u8DDD\u79BB\u5E73\u65B9\u7684\u5012\u6570\u4E4B\u548C\u3002",
  answerHelpEn: "Submit lights and intensity. lights are the n positions, written as decimal strings. intensity is the value you claim no point in the square falls below, to at most six decimals \u2014 the verifier proves that bound and refuses what it cannot prove, so claim a little under the minimum you actually reach. The intensity at a point is the sum over lights of one over the squared distance to it.",
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E n \u4E2A\u5355\u4F4D\u4EAE\u5EA6\u7684\u5149\u6E90\uFF0C\u4E00\u70B9\u7684\u5149\u5F3A\u662F\u5404\u5149\u6E90\u5230\u5B83\u8DDD\u79BB\u5E73\u65B9\u5012\u6570\u4E4B\u548C\uFF1B\u8BA9\u6700\u6697\u7684\u90A3\u4E00\u70B9\u5C3D\u53EF\u80FD\u4EAE\u3002",
  definitionEn: "Place n unit-brightness lights in the unit square; the intensity at a point is the sum of 1/distance\xB2 to each light. Make the darkest point as bright as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "n \u4E2A\u5149\u6E90\u5750\u6807 lights\uFF0C\u5916\u52A0\u4F60\u58F0\u79F0\u7684\u6700\u5C0F\u5149\u5F3A intensity\uFF0C\u9A8C\u8BC1\u5668\u53EA\u63A5\u53D7\u5B83\u80FD\u8BC1\u660E\u7684\u4E0B\u754C", textEn: "The n light positions, plus the minimum intensity you claim \u2014 the verifier accepts only a bound it can prove" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u5149\u6E90\u90FD\u5728\u6B63\u65B9\u5F62\u5185\uFF0C\u4E24\u4E24\u4E0D\u91CD\u5408", textEn: "All lights inside the square, no two coinciding" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6B63\u65B9\u5F62\u5185\u6700\u6697\u4E00\u70B9\u7684\u5149\u5F3A\u5C3D\u53EF\u80FD\u5927", textEn: "Make the intensity at the darkest point of the square as large as possible" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6700\u6697\u70B9\u85CF\u5728\u5149\u6E90\u4E4B\u95F4\u7684\u978D\u70B9\u548C\u89D2\u843D\u91CC\uFF1A\u8865\u4EAE\u8FD9\u91CC\uFF0C\u522B\u5904\u5C31\u6697\u4E0B\u53BB\u3002\u5747\u5300\u7F51\u683C\u8FDC\u975E\u6700\u4F18\uFF0C\u8FB9\u89D2\u9700\u8981\u8D85\u914D\u3002",
      textEn: "The darkest point hides in saddles between lights and in the corners: brighten it and somewhere else goes dim. Uniform grids are far from optimal; edges and corners need overprovisioning."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u9898\u578B\u6E90\u81EA Friedman \u7684 light \u9875\uFF1B\u90A3\u9875\u53EA\u6709\u6784\u9020\u3001\u6CA1\u6709\u8BC1\u660E\uFF0C\u6309\u672C\u7AD9\u539F\u5219\u4E0D\u5F15\u7528\u672A\u8BC1\u660E\u7684\u5177\u4F53\u7B54\u6848\u3002\u6BCF\u4E2A n \u90FD\u5F00\u653E\uFF0C\u5F53\u524D\u7EAA\u5F55\u5C31\u662F\u8FD9\u91CC\u5DF2\u77E5\u7684\u5168\u90E8\u3002",
      textEn: "The problem shape comes from Friedman's light page, which offers constructions but no proofs, and this site does not cite unproven answers. Every n is open; the standing record is all that is known here.",
      url: "https://erich-friedman.github.io/packing/light/"
    }
  ],
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u5750\u6807\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u5149\u5F3A\u4E0D\u662F\u5750\u6807\uFF0C\u5B83\u662F\u4E00\u4E2A\u5927\u4E8E 1 \u7684\u6570\uFF0C\u6700\u591A\u516D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1, origin at the lower-left corner (0, 0) and (1, 1) at the upper right. Coordinates are decimals such as "0.25", to at most nine places. The intensity is not a coordinate: it is a number larger than 1, to at most six decimal places.',
  titleEn: "Lighting a unit square",
  summaryEn: "Place n lights of unit brightness in a unit square so the darkest point of the square is as bright as possible.",
  scoreLabelEn: "minimum intensity",
  instanceNameEn: "n = 5",
  requirements: ["\u6240\u6709\u5149\u6E90\u90FD\u5728\u6B63\u65B9\u5F62\u5185\uFF0C\u4E14\u4E24\u4E24\u4E0D\u91CD\u5408", "\u5206\u6570\u662F\u6574\u4E2A\u6B63\u65B9\u5F62\u4E0A\u7684\u6700\u5C0F\u5149\u5F3A\uFF0C\u4E0D\u662F\u67D0\u51E0\u4E2A\u70B9\u4E0A\u7684", "\u4F60\u8981\u81EA\u5DF1\u62A5\u51FA\u8FD9\u4E2A\u6700\u5C0F\u503C\uFF0C\u9A8C\u8BC1\u5668\u53EA\u63A5\u53D7\u5B83\u80FD\u8BC1\u660E\u7684\u4E0B\u754C"],
  requirementsEn: ["Every light lies in the square and no two coincide", "The score is the minimum over the whole square, not over a few sample points", "You state that minimum yourself, and the verifier only accepts a bound it can prove"],
  instances: instances9
};
function verifyLights(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 1 || n > MAX_LIGHTS) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570 n \u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's n is outside the supported range");
  const raw2 = asArray(answer.lights, "lights");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5149\u6E90\uFF0C\u6536\u5230 ${raw2.length} \u4E2A`, `exactly ${n} lights are needed, ${raw2.length} were given`);
  const lights = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < n; i += 1) {
    const [x, y] = parseFixedPoint(raw2[i], `lights[${i}]`);
    if (x < 0 || y < 0 || x > SCALE || y > SCALE) return fail("OUT_OF_BOUNDS", `\u5149\u6E90 ${i + 1} \u4E0D\u5728\u6B63\u65B9\u5F62\u5185`, `light ${i + 1} is outside the square`);
    const key = `${x},${y}`;
    if (seen.has(key)) return fail("DUPLICATE", `\u5149\u6E90 ${i + 1} \u4E0E\u53E6\u4E00\u4E2A\u5149\u6E90\u91CD\u5408`, `light ${i + 1} sits on top of another light`);
    seen.add(key);
    lights.push({ x: BigInt(x), y: BigInt(y) });
  }
  const claimUnits = parseFixed(answer.intensity, "intensity");
  if (claimUnits <= 0) return fail("CLAIM", "intensity \u5FC5\u987B\u662F\u6B63\u6570", "intensity must be a positive number");
  if (claimUnits % Number(CLAIM_STEP) !== 0) return fail("CLAIM", "intensity \u6700\u591A\u53EA\u80FD\u6709\u516D\u4F4D\u5C0F\u6570", "intensity may have at most six decimal places");
  const claim = BigInt(claimUnits) * 1000n;
  const proof = proveMinimumAtLeast(lights, claim);
  if (proof.verdict === "refuted") return fail("CLAIM_TOO_HIGH", "\u6B63\u65B9\u5F62\u91CC\u5B58\u5728\u6BD4 intensity \u66F4\u6697\u7684\u70B9\uFF0C\u8FD9\u4E2A\u4E0B\u754C\u4E0D\u6210\u7ACB", "somewhere in the square is darker than intensity, so that bound does not hold");
  if (proof.verdict === "undecided")
    return fail("CLAIM_TOO_TIGHT", `\u5728 ${BOX_BUDGET} \u4E2A\u5B50\u533A\u57DF\u5185\u6CA1\u80FD\u8BC1\u660E\u8FD9\u4E2A\u4E0B\u754C\u3002\u628A intensity \u8C03\u4F4E\u4E00\u70B9\u518D\u8BD5\uFF1A\u9A8C\u8BC1\u5668\u53EA\u63A5\u53D7\u5B83\u80FD\u8BC1\u660E\u7684\u503C\u3002`, `the bound could not be proved within ${BOX_BUDGET} sub-regions. Claim a slightly lower intensity and try again \u2014 the verifier accepts only what it can prove.`);
  const score = BigInt(claimUnits) / CLAIM_STEP;
  return ok(score, formatIntensity(score));
}
function formatIntensity(units) {
  const whole = units / INTENSITY_UNIT;
  const fraction = (units % INTENSITY_UNIT).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}
var problem14 = { definition: definition14, verify: verifyLights };

// src/problems/p52-min-distance-ratio.ts
var MIN_N6 = 9;
var MAX_N7 = 28;
function latticeBaseline2(n) {
  let columns = 1;
  while (columns * columns < n) columns += 1;
  const rows = Math.ceil(n / columns);
  const stepX = Math.floor(SCALE / Math.max(1, columns - 1));
  const stepY = Math.floor(SCALE / Math.max(1, rows - 1));
  const step = Math.min(stepX, stepY);
  return {
    points: Array.from({ length: n }, (_, index) => [
      printFixed(index % columns * step),
      printFixed(Math.floor(index / columns) * step)
    ])
  };
}
var instances10 = Array.from({ length: MAX_N7 - MIN_N6 + 1 }, (_, index) => {
  const n = MIN_N6 + index;
  return {
    instanceId: `p52-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: latticeBaseline2(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition15 = {
  id: "p52",
  instanceId: "p52-n12-v1",
  code: "P52",
  slug: "min-distance-ratio",
  category: "extremal",
  title: "\u6700\u8FDC\u4E0E\u6700\u8FD1\u8DDD\u79BB\u4E4B\u6BD4",
  summary: "\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u4F7F\u6700\u8FDC\u4E24\u70B9\u7684\u8DDD\u79BB\u9664\u4EE5\u6700\u8FD1\u4E24\u70B9\u7684\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u6700\u8FDC\u4E0E\u6700\u8FD1\u8DDD\u79BB\u4E4B\u6BD4",
  instanceName: "n = 12",
  parameters: { n: 12 },
  baselineAnswer: latticeBaseline2(12),
  answerHelp: '\u63D0\u4EA4 points\uFF0C\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.5"\u3002\u6BD4\u503C\u4E0E\u6574\u4F53\u7684\u7F29\u653E\u548C\u5E73\u79FB\u65E0\u5173\uFF0C\u6B63\u65B9\u5F62\u53EA\u662F\u5199\u4E0B\u7B54\u6848\u7684\u5730\u65B9\u3002',
  titleEn: "Smallest ratio of largest to smallest distance",
  summaryEn: "Place n points so the distance between the furthest pair, divided by the distance between the closest pair, is as small as possible.",
  scoreLabelEn: "max-to-min distance ratio",
  instanceNameEn: "n = 12",
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.5". The ratio ignores scale and position, so the square is only where you write the answer down.',
  definition: "\u5728\u5E73\u9762\u4E0A\u653E\u7F6E n \u4E2A\u70B9\uFF0C\u8BB0\u6700\u8FDC\u4E24\u70B9\u8DDD\u79BB\u4E3A D\u3001\u6700\u8FD1\u4E24\u70B9\u8DDD\u79BB\u4E3A d\uFF0C\u4F7F\u6BD4\u503C D/d \u5C3D\u53EF\u80FD\u5C0F\u3002",
  definitionEn: "Place n points in the plane; with D the largest and d the smallest pairwise distance, make the ratio D/d as small as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u6CA1\u6709\u771F\u6B63\u7684\u5BB9\u5668\uFF1A\u6BD4\u503C\u4E0D\u968F\u7F29\u653E\u5E73\u79FB\u6539\u53D8\uFF0C\u7B54\u6848\u7F29\u653E\u5230\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u5199\u4E0B\u5373\u53EF", textEn: "No real container: the ratio is invariant under scaling and translation, so the answer is written scaled into the unit square" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9 points\uFF0C\u4E24\u4E24\u4E0D\u91CD\u5408", textEn: "Exactly n points, no two coinciding" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9 D/d \u5C3D\u53EF\u80FD\u5C0F\u3002\u5185\u90E8\u4EE5\u5E73\u65B9\u6BD4\u7CBE\u786E\u6BD4\u8F83", textEn: "Make D/d as small as possible; compared internally by the squared ratio, exactly" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u65E2\u8981\u6700\u8FD1\u7684\u4E0D\u592A\u8FD1\u3001\u53C8\u8981\u6700\u8FDC\u7684\u4E0D\u592A\u8FDC\uFF0C\u70B9\u96C6\u88AB\u8FEB\u53C8\u5706\u53C8\u5300\uFF1A\u5185\u90E8\u50CF\u516D\u8FB9\u5F62\u8702\u7A9D\uFF0C\u8F93\u8D62\u5374\u51B3\u5B9A\u5728\u8FB9\u754C\u7684\u53D6\u820D\u3002",
      textEn: "The nearest pair must not be near and the farthest must not be far, so the set is forced round and even: hexagonal inside, but won or lost at the boundary."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u8FD9\u4E00\u65CF\u6536\u5F55\u5728 Friedman \u7684 maxmin \u9875\uFF08Rechenberg\u3001Cantrell\u3001Audet \u7B49\u4EBA\u7684\u6784\u9020\uFF09\uFF0C\u5168\u90E8\u672A\u8BC1\u660E\uFF1B\u672C\u7AD9\u5DF2\u5F55\u4E09\u4E2A\u503C\uFF0C\u5176\u4F59 n \u672A\u5F55\uFF0C\u5F00\u653E\u3002",
      textEn: "The family is collected on Friedman's maxmin page (constructions by Rechenberg, Cantrell, Audet and others), none proven; three values are recorded here, the rest are open.",
      url: "https://erich-friedman.github.io/packing/maxmin/"
    }
  ],
  extent: SCALE,
  frame: "\u628A\u7B54\u6848\u7F29\u653E\u5E73\u79FB\u5230\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\u5185\u5199\u4E0B\u5373\u53EF\uFF1A\u6BD4\u503C\u4E0D\u968F\u7F29\u653E\u6539\u53D8\uFF0C\u800C\u4EFB\u4F55\u70B9\u96C6\u7684\u5BBD\u548C\u9AD8\u90FD\u4E0D\u8D85\u8FC7\u5B83\u81EA\u5DF1\u7684\u76F4\u5F84\uFF0C\u6240\u4EE5\u603B\u653E\u5F97\u4E0B\u3002\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\uFF0C\u5750\u6807\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002",
  frameEn: "Scale and shift your configuration into the unit square to write it down: the ratio does not change under scaling, and any point set is no wider than its own diameter, so it always fits. The lower-left corner is (0, 0) and the upper-right is (1, 1); coordinates take at most nine decimal places.",
  requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E14\u4E24\u4E24\u4E0D\u91CD\u5408", "\u5750\u6807\u5199\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185", "\u5206\u6570\u662F D / d\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
  requirementsEn: ["Exactly n points, no two coinciding", "Coordinates are written inside the unit square", "The score is D / d, and smaller is better"],
  instances: instances10
};
function verifyDistanceRatio(params, answer) {
  const n = asInt(params.n, "n");
  if (n < MIN_N6 || n > MAX_N7) return fail("BAD_PARAMS", `n \u5FC5\u987B\u5728 ${MIN_N6} \u4E0E ${MAX_N7} \u4E4B\u95F4`, `n must be between ${MIN_N6} and ${MAX_N7}`);
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE) return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u4E0D\u5728\u6B63\u65B9\u5F62\u5185`, `point ${i + 1} is outside the square`);
  }
  let nearest = null, furthest = 0n;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const squared = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (nearest === null || squared < nearest) nearest = squared;
    if (squared > furthest) furthest = squared;
  }
  if (nearest === null) return fail("COUNT", "\u81F3\u5C11\u9700\u8981\u4E24\u4E2A\u70B9\u624D\u80FD\u8C08\u8DDD\u79BB", "at least two points are needed before there is a distance to speak of");
  if (nearest === 0n) return fail("COINCIDENT", "\u5B58\u5728\u4E24\u4E2A\u91CD\u5408\u7684\u70B9\uFF0C\u6700\u8FD1\u8DDD\u79BB\u4E3A 0", "two of the points coincide, so the closest distance is 0");
  const target = furthest * BigInt(SCALE) * BigInt(SCALE);
  let units = integerSqrt(target / nearest);
  while (units * units * nearest < target) units += 1n;
  return ok(units, printFixedBig(units));
}
var problem15 = { definition: definition15, verify: verifyDistanceRatio };

// src/problems/p53-biggest-little-polygon.ts
var MIN_N7 = 6;
var MAX_N8 = 30;
var FRAME = 15e8;
function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o, a, b) => BigInt(a[0] - o[0]) * BigInt(b[1] - o[1]) - BigInt(a[1] - o[1]) * BigInt(b[0] - o[0]);
  const chain = (sequence) => {
    const out = [];
    for (const point of sequence) {
      while (out.length >= 2 && turn(out[out.length - 2], out[out.length - 1], point) <= 0n) out.pop();
      out.push(point);
    }
    return out;
  };
  const lower = chain(sorted);
  const upper = chain([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function ringBaseline2(n) {
  const radius = Math.round(SCALE * 0.4);
  const centre = FRAME / 2;
  return {
    points: Array.from({ length: n }, (_, index) => {
      const angle = 2 * Math.PI * index / n;
      return [
        printFixed(Math.round(centre + radius * Math.cos(angle))),
        printFixed(Math.round(centre + radius * Math.sin(angle)))
      ];
    })
  };
}
var evenSizes = Array.from({ length: (MAX_N8 - MIN_N7) / 2 + 1 }, (_, index) => MIN_N7 + 2 * index);
var instances11 = evenSizes.map((n) => ({
  instanceId: `p53-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: ringBaseline2(n),
  instanceNameEn: `n = ${n}`
}));
var PRIMARY = 10;
var definition16 = {
  id: "p53",
  instanceId: `p53-n${PRIMARY}-v1`,
  code: "P53",
  slug: "biggest-little-polygon",
  category: "extremal",
  title: "\u6700\u5927\u7684\u5C0F\u591A\u8FB9\u5F62",
  summary: "\u53D6 n \u4E2A\u70B9\uFF0C\u4E24\u4E24\u8DDD\u79BB\u90FD\u4E0D\u8D85\u8FC7 1\uFF0C\u4F7F\u5B83\u4EEC\u56F4\u6210\u7684\u51F8\u591A\u8FB9\u5F62\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u9762\u79EF\u7684\u4E24\u500D",
  goalLabel: "\u9762\u79EF",
  scoreIs: "double",
  goalLabelEn: "the area",
  instanceName: `n = ${PRIMARY}`,
  parameters: { n: PRIMARY },
  baselineAnswer: ringBaseline2(PRIMARY),
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  titleEn: "The biggest little polygon",
  summaryEn: "Take n points with no two further than 1 apart, and make the convex polygon they enclose as large as possible.",
  scoreLabelEn: "twice the area",
  instanceNameEn: `n = ${PRIMARY}`,
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.25", to at most nine decimal places.',
  definition: "\u53D6 n \u4E2A\u70B9\uFF0C\u4E24\u4E24\u8DDD\u79BB\u90FD\u4E0D\u8D85\u8FC7 1\uFF0C\u4F7F\u5B83\u4EEC\u56F4\u6210\u7684\u51F8\u591A\u8FB9\u5F62\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\uFF1B\u6BCF\u4E2A\u70B9\u90FD\u5FC5\u987B\u662F\u51F8\u5305\u7684\u9876\u70B9\u3002",
  definitionEn: "Take n points, no two further apart than 1, and make the convex polygon they span as large as possible; every point must be a vertex of the hull.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u6CA1\u6709\u5BB9\u5668\uFF1A\u552F\u4E00\u7684\u5168\u5C40\u7EA6\u675F\u662F\u4EFB\u610F\u4E24\u70B9\u8DDD\u79BB\u4E0D\u8D85\u8FC7 1\uFF1B\u5750\u6807\u5199\u5728 [0, 1.5] \xD7 [0, 1.5] \u5185", textEn: "No container: the one global constraint is that no two points are further than 1 apart; coordinates are written inside [0, 1.5] \xD7 [0, 1.5]" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9 points", textEn: "Exactly n points" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u4E24\u4E24\u8DDD\u79BB \u2264 1\uFF1B\u6BCF\u4E2A\u70B9\u90FD\u662F\u51F8\u5305\u7684\u771F\u9876\u70B9\uFF0C\u843D\u5728\u522B\u4EBA\u8FDE\u7EBF\u4E0A\u6216\u5185\u90E8\u90FD\u4E0D\u7B97", textEn: "All pairwise distances at most 1; every point a genuine hull vertex \u2014 on another pair's segment or inside does not count" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u51F8\u591A\u8FB9\u5F62\u9762\u79EF\u5C3D\u53EF\u80FD\u5927\u3002\u5185\u90E8\u4EE5\u4E8C\u500D\u9762\u79EF\u7CBE\u786E\u6BD4\u8F83", textEn: "Make the polygon area as large as possible; compared internally by twice the area, exactly" }
  ],
  intuition: [
    {
      title: "\u4E3A\u4EC0\u4E48\u5076\u6570\u624D\u96BE",
      titleEn: "Why the even cases are the hard ones",
      text: "\u5947\u6570 n \u7684\u6B63\u591A\u8FB9\u5F62\u5DF2\u88AB\u8BC1\u660E\u6700\u4F18\uFF0C\u6CA1\u4EC0\u4E48\u53EF\u4E89\uFF1B\u5076\u6570 n \u65F6\u6B63\u591A\u8FB9\u5F62\u53CD\u800C\u4E0D\u662F\u6700\u4F18\uFF1AGraham \u7684\u516D\u8FB9\u5F62\u6BD4\u6B63\u516D\u8FB9\u5F62\u591A\u51FA\u7EA6 4% \u7684\u9762\u79EF\u3002\u6240\u4EE5\u672C\u7AD9\u53EA\u5F00\u5076\u6570 n\u3002",
      textEn: "For odd n the regular polygon is provably optimal \u2014 nothing to contest. For even n it is NOT: Graham hexagon beats the regular one by about 4% of area. That is why only even n are offered here."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u5947\u6570 n \u7684\u6B63\u591A\u8FB9\u5F62\u7531 Reinhardt (1922) \u8BC1\u660E\u6700\u4F18\uFF0C\u6240\u4EE5\u53EA\u5F00\u5076\u6570\u3002\u5076\u6570\u4FA7 n = 6, 8, 10, 12 \u5DF2\u8BC1\u660E\uFF08Graham 1975 \u8D77\uFF0C\u81F3 Audet \u7B49\uFF09\uFF0Cn \u2265 14 \u53EA\u6709\u6570\u503C\u6700\u597D\u503C\uFF0C\u5F00\u653E\u3002",
      textEn: "Regular polygons are optimal for odd n (Reinhardt 1922), so only even n are offered. On the even side n = 6, 8, 10 and 12 are proven (from Graham 1975 to Audet et al.); n \u2265 14 has only numerical best values and is open."
    }
  ],
  extent: FRAME,
  frame: '\u8FD9\u9053\u9898\u6CA1\u6709\u5BB9\u5668\uFF0C\u552F\u4E00\u7684\u7EA6\u675F\u662F\u4EFB\u610F\u4E24\u70B9\u8DDD\u79BB\u4E0D\u8D85\u8FC7 1\u3002\u5750\u6807\u5199\u5728 [0, 1.5] \xD7 [0, 1.5] \u7684\u6846\u91CC\uFF0C\u8FD9\u53EA\u662F\u4E00\u4E2A\u5750\u6807\u7CFB\u800C\u4E0D\u662F\u989D\u5916\u7684\u9650\u5236\uFF1A\u76F4\u5F84\u4E0D\u8D85\u8FC7 1 \u7684\u70B9\u96C6\u603B\u80FD\u88C5\u8FDB 1\xD71 \u7684\u65B9\u683C\uFF0C\u8FD9\u91CC\u56DB\u8FB9\u5404\u591A\u7559\u4E86\u56DB\u5206\u4E4B\u4E00\u4E2A\u5355\u4F4D\uFF0C\u6240\u4EE5\u653E\u5728\u54EA\u91CC\u90FD\u4E0D\u4F1A\u88AB\u6846\u5361\u4F4F\u3002\u5750\u6807\u662F\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'This problem has no container; the only constraint is that no two points are more than 1 apart. Coordinates are written inside a [0, 1.5] \xD7 [0, 1.5] frame, which is a coordinate system rather than an extra restriction: a set of diameter at most 1 always fits in a 1 \xD7 1 box, and this leaves a further quarter unit on every side so that where you centre it can never matter. Coordinates are plain decimals such as "0.25", to at most nine decimal places.',
  requirements: [
    "\u6070\u597D n \u4E2A\u70B9\uFF0C\u4E24\u4E24\u8DDD\u79BB\u4E0D\u8D85\u8FC7 1",
    "\u6BCF\u4E2A\u70B9\u90FD\u8981\u662F\u51F8\u5305\u7684\u9876\u70B9\uFF1A\u843D\u5728\u53E6\u5916\u4E24\u70B9\u8FDE\u7EBF\u4E0A\uFF0C\u6216\u843D\u5728\u51F8\u5305\u5185\u90E8\uFF0C\u90FD\u4E0D\u7B97",
    "\u5206\u6570\u662F\u8FD9\u4E2A\u51F8\u591A\u8FB9\u5F62\u7684\u9762\u79EF"
  ],
  requirementsEn: [
    "Exactly n points, with no two further apart than 1",
    "Every point is a corner of the hull: one lying on the segment between two others, or inside, does not count",
    "The score is the area of that convex polygon"
  ],
  instances: instances11
};
function verifyBiggestLittlePolygon(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 3 || n > 120) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > FRAME || y > FRAME)
      return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u8D85\u51FA\u4E86\u5750\u6807\u6846 [0, 1.5] \xD7 [0, 1.5]`, `point ${i + 1} lies outside the coordinate frame [0, 1.5] \xD7 [0, 1.5]`);
  }
  const limit = BigInt(SCALE) * BigInt(SCALE);
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const spread = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
    if (spread > limit)
      return fail("DIAMETER", `\u70B9 ${i + 1} \u4E0E ${j + 1} \u7684\u8DDD\u79BB\u8D85\u8FC7 1`, `points ${i + 1} and ${j + 1} are further apart than 1`);
  }
  const hull = convexHull(points);
  if (hull.length !== n)
    return fail("NOT_CONVEX", `\u53EA\u6709 ${hull.length} \u4E2A\u70B9\u662F\u51F8\u5305\u7684\u9876\u70B9\uFF0C\u9700\u8981\u5168\u90E8 ${n} \u4E2A`, `only ${hull.length} of the points are corners of the hull, and all ${n} must be`);
  let doubled = 0n;
  for (let i = 0; i < hull.length; i += 1) {
    const [ax, ay] = hull[i];
    const [bx, by] = hull[(i + 1) % hull.length];
    doubled += BigInt(ax) * BigInt(by) - BigInt(bx) * BigInt(ay);
  }
  if (doubled < 0n) doubled = -doubled;
  return ok(doubled, printSquared(doubled));
}
var problem16 = { definition: definition16, verify: verifyBiggestLittlePolygon };

// src/problems/p54-star-discrepancy.ts
var MIN_N8 = 22;
var MAX_N9 = 50;
function worstDeviation(points) {
  const n = BigInt(points.length);
  const square2 = BigInt(SCALE) * BigInt(SCALE);
  const xs = [.../* @__PURE__ */ new Set([...points.map((point) => point[0]), SCALE])].sort((a, b) => a - b);
  const ys = [.../* @__PURE__ */ new Set([...points.map((point) => point[1]), SCALE])].sort((a, b) => a - b);
  let score = -1n;
  let corner = [SCALE, SCALE];
  let closed = true;
  for (const x of xs) for (const y of ys) {
    let inside = 0n;
    let strictly = 0n;
    for (const [px, py] of points) {
      if (px <= x && py <= y) inside += 1n;
      if (px < x && py < y) strictly += 1n;
    }
    const area = n * BigInt(x) * BigInt(y);
    const over = inside * square2 - area;
    const under = area - strictly * square2;
    if (over > score) {
      score = over;
      corner = [x, y];
      closed = true;
    }
    if (under > score) {
      score = under;
      corner = [x, y];
      closed = false;
    }
  }
  return { score, corner, closed };
}
var PLACES = 15n;
function readable(score, n) {
  const denominator = BigInt(n) * BigInt(SCALE) * BigInt(SCALE);
  const scaled = 10n ** PLACES;
  const units = (score * scaled + denominator - 1n) / denominator;
  return `${units / scaled}.${(units % scaled).toString().padStart(Number(PLACES), "0")}`;
}
var SQUASH = 0.8;
function squashedHammersley(n) {
  const vanDerCorput = (index) => {
    let digits = 0;
    let weight = 0.5;
    for (let rest = index; rest > 0; rest >>= 1) {
      digits += (rest & 1) * weight;
      weight /= 2;
    }
    return digits;
  };
  return {
    points: Array.from({ length: n }, (_, index) => [
      printFixed(Math.round(SQUASH * SCALE * ((index + 0.5) / n))),
      printFixed(Math.round(SQUASH * SCALE * (vanDerCorput(index) + 0.5 / n)))
    ])
  };
}
var sizes = Array.from({ length: MAX_N9 - MIN_N8 + 1 }, (_, index) => MIN_N8 + index);
var instances12 = sizes.map((n) => ({
  instanceId: `p54-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: squashedHammersley(n),
  instanceNameEn: `n = ${n}`
}));
var PRIMARY2 = 24;
var definition17 = {
  id: "p54",
  instanceId: `p54-n${PRIMARY2}-v1`,
  code: "P54",
  slug: "star-discrepancy",
  category: "extremal",
  title: "\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u7684\u6700\u4F4E\u661F\u504F\u5DEE",
  summary: "\u4F60\u6709 n \u4E2A\u91C7\u6837\u70B9\u8981\u94FA\u6EE1\u4E00\u5757\u65B9\u5F62\u753B\u9762\u3002\u4ECE\u4E00\u89D2\u91CF\u8D77\u7684\u4EFB\u610F\u4E00\u5757\u77E9\u5F62\uFF0C\u5360\u4E86\u591A\u5C11\u9762\u79EF\uFF0C\u5C31\u8BE5\u5206\u5230\u591A\u5C11\u6BD4\u4F8B\u7684\u91C7\u6837\u70B9\uFF1B\u504F\u5F97\u6700\u5389\u5BB3\u7684\u90A3\u4E00\u5757\u504F\u4E86\u591A\u5C11\uFF0C\u5C31\u662F\u4F60\u7684\u5206\u6570\u3002",
  objective: "minimize",
  scoreLabel: "\u6700\u5927\u8BEF\u5DEE D*",
  instanceName: `n = ${PRIMARY2}`,
  parameters: { n: PRIMARY2 },
  baselineAnswer: squashedHammersley(PRIMARY2),
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u699C\u4E0A\u7684\u6570\u5B57\u662F D*\uFF0C\u4E5F\u5C31\u662F\u6240\u6709\u77E9\u5F62\u91CC\u6700\u5927\u7684\u90A3\u4E2A\u8BEF\u5DEE\uFF1B\u5206\u6570\u8D8A\u5C0F\u8D8A\u597D\u3002',
  titleEn: "Minimum star discrepancy in the unit square",
  summaryEn: "You have n samples to spread over a square frame. Any rectangle measured from one corner should hold the same share of the samples as it holds of the area; the worst mismatch is your score.",
  scoreLabelEn: "the worst gap D*",
  instanceNameEn: `n = ${PRIMARY2}`,
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.25", to at most nine decimal places. The leaderboard number is D*, the largest gap over all rectangles; smaller is better.',
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u88AB\u6BD4\u8F83\u7684\u77E9\u5F62\u6C38\u8FDC\u4ECE\u539F\u70B9\u91CF\u8D77\uFF0C\u53F3\u4E0A\u89D2\u53EF\u4EE5\u843D\u5728\u6B63\u65B9\u5F62\u91CC\u7684\u4EFB\u4F55\u4F4D\u7F6E\uFF0C\u6240\u4EE5\u4E00\u5171\u6709\u65E0\u7A77\u591A\u5757\u77E9\u5F62\u8981\u540C\u65F6\u6EE1\u8DB3\uFF0C\u800C\u4E0D\u662F\u67D0\u51E0\u5757\u3002\u5750\u6807\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right. The rectangles being compared always start at the origin, and their upper-right corner may sit anywhere in the square \u2014 so there are infinitely many of them to satisfy at once, not a chosen few. Coordinates are plain decimals such as "0.25", to at most nine decimal places.',
  // The three registers, replacing the statement blob. The rendering-budget
  // framing moves to an intuition card; the frontier note — n ≤ 21 settled by
  // Clément, Doerr, Klamroth and Paquete, which is why this problem starts at
  // 22 — moves to the frontier card, citation kept, and a test holds it there.
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u91CC\u653E n \u4E2A\u91C7\u6837\u70B9\u3002\u4ECE\u539F\u70B9\u91CF\u8D77\u3001\u8FB9\u5E73\u884C\u4E8E\u5750\u6807\u8F74\u7684\u6BCF\u4E00\u5757\u77E9\u5F62\uFF0C\u5360\u4E86\u591A\u5C11\u9762\u79EF\uFF0C\u5C31\u8BE5\u5206\u5230\u591A\u5C11\u6BD4\u4F8B\u7684\u70B9\uFF1B\u4F60\u7684\u5206\u6570\uFF0C\u662F\u6240\u6709\u8FD9\u7C7B\u77E9\u5F62\u91CC\u6700\u5927\u7684\u90A3\u4E2A\u504F\u5DEE\u3002\u628A\u5B83\u538B\u5230\u6700\u4F4E\u3002",
  definitionEn: "Place n sample points in the unit square. Every axis-aligned rectangle anchored at the origin should hold the same share of the points as it holds of the area; your score is the largest mismatch over all such rectangles. Make it as small as you can.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\u7684\u5750\u6807\uFF0C\u5341\u8FDB\u5236\u5C0F\u6570\uFF0C\u6700\u591A\u4E5D\u4F4D\uFF1B\u4E24\u70B9\u4E0D\u5F97\u91CD\u5408", textEn: "Exactly n points, each coordinate a decimal with at most nine places; no two points may coincide" },
    { label: "\u77E9\u5F62", labelEn: "Rectangles", text: "\u88AB\u6BD4\u8F83\u7684\u77E9\u5F62\u662F\u534A\u5F00\u7684 [0, u) \xD7 [0, v)\uFF0C\u53F3\u4E0A\u89D2\u53EF\u843D\u5728\u6B63\u65B9\u5F62\u5185\u4EFB\u4F55\u4F4D\u7F6E\uFF1B\u6070\u597D\u538B\u5728\u4E0A\u8FB9\u6216\u53F3\u8FB9\u4E0A\u7684\u70B9\u7B97\u5728\u5916\u9762", textEn: "The rectangles compared are half-open, [0, u) \xD7 [0, v), their upper-right corner anywhere in the square; a point exactly on the top or right edge counts as outside" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6240\u6709\u77E9\u5F62\u4E2D\u6700\u5927\u7684\u504F\u5DEE D* \u5C3D\u53EF\u80FD\u5C0F\u3002\u4E0A\u786E\u754C\u5728\u63D0\u4EA4\u5750\u6807\u7684\u7F51\u683C\u4E0A\u53D6\u5F97\uFF0C\u4EE5\u6574\u6570\u7CBE\u786E\u8BA1\u5206", textEn: "Make D*, the largest mismatch over all rectangles, as small as possible. The supremum is attained on the grid of submitted coordinates and scored exactly in integers" }
  ],
  intuition: [
    {
      title: "\u4E00\u4E2A\u6BD4\u55BB\uFF1A\u91C7\u6837\u9884\u7B97",
      titleEn: "An analogy: a sampling budget",
      text: "\u628A\u6B63\u65B9\u5F62\u5F53\u6210\u4E00\u5E27\u8981\u6E32\u67D3\u7684\u753B\u9762\uFF0C\u8FD9 n \u4E2A\u70B9\u5C31\u662F\u4F60\u5168\u90E8\u7684\u91C7\u6837\u9884\u7B97\u3002\u54EA\u5757\u77E9\u5F62\u5206\u5230\u7684\u70B9\u6BD4\u9762\u79EF\u5E94\u5F97\u7684\u591A\uFF0C\u662F\u9884\u7B97\u6D6A\u8D39\u5728\u540C\u4E00\u5904\uFF1B\u5C11\u4E86\uFF0C\u662F\u90A3\u5757\u7684\u7EC6\u8282\u88AB\u6F0F\u6389\u3002",
      textEn: "Read the square as a frame you are about to render and the n points as your entire sampling budget. A rectangle holding more than its share of the points is budget spent twice in one place; fewer, and that region's detail is lost."
    },
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u683C\u70B9\u548C\u968F\u673A\u6492\u70B9\u90FD\u4F1A\u5728\u67D0\u4E9B\u77E9\u5F62\u4E0A\u7CFB\u7EDF\u6027\u504F\u7F6E\uFF1B\u4F4E\u504F\u5DEE\u6784\u9020\uFF08Hammersley\u3001van der Corput\uFF09\u538B\u5F97\u4F4E\u5F97\u591A\u3002\u4F46\u5BF9\u6BCF\u4E2A\u5177\u4F53\u7684 n\uFF0C\u6CA1\u4EBA\u77E5\u9053\u8FD8\u80FD\u538B\u5230\u54EA\u91CC\u3002",
      textEn: "Grids and random scatters are both systematically biased on some rectangle; low-discrepancy constructions (Hammersley, van der Corput) do far better \u2014 but for each particular n, nobody knows how low it goes."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n \u2264 21 \u7684\u6700\u4F18\u89E3\u5DF2\u7531 Cl\xE9ment\u3001Doerr\u3001Klamroth \u4E0E Paquete \u5728 2025 \u5E74\u8BC1\u660E\uFF08Proc. Amer. Math. Soc. Ser. B 12: 78\u201390\uFF09\uFF0C\u6240\u4EE5\u672C\u7AD9\u4ECE n = 22 \u8D77\uFF1B\u518D\u5F80\u4E0A\uFF0C\u6BCF\u4E00\u4E2A n \u90FD\u662F\u5F00\u653E\u7684\u3002",
      textEn: "Optima for n \u2264 21 were proven by Cl\xE9ment, Doerr, Klamroth and Paquete in 2025 (Proc. Amer. Math. Soc. Ser. B 12: 78\u201390), which is why this problem starts at n = 22; beyond that, every n is open."
    }
  ],
  requirements: [
    "\u6070\u597D n \u4E2A\u70B9\uFF0C\u90FD\u843D\u5728\u6B63\u65B9\u5F62\u5185\uFF0C\u4E24\u70B9\u4E0D\u80FD\u91CD\u5408",
    "\u77E9\u5F62\u662F\u534A\u5F00\u7684 [0, u) \xD7 [0, v)\uFF1A\u6070\u597D\u538B\u5728\u5B83\u4E0A\u8FB9\u6216\u53F3\u8FB9\u4E0A\u7684\u70B9\uFF0C\u7B97\u5728\u5916\u9762",
    "\u5206\u6570\u662F\u6240\u6709\u77E9\u5F62\u91CC\u6700\u5927\u7684\u90A3\u4E2A\u504F\u5DEE\uFF0C\u8D8A\u5C0F\u8D8A\u597D"
  ],
  requirementsEn: [
    "Exactly n points, all inside the square, no two in the same place",
    "The rectangles are half-open, [0, u) \xD7 [0, v): a point sitting exactly on the top or right edge counts as outside",
    "The score is the largest gap over all rectangles, and smaller is better"
  ],
  instances: instances12
};
function verifyStarDiscrepancy(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 120) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE)
      return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u843D\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5916`, `point ${i + 1} lies outside the unit square`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]) === 0n)
      return fail("COINCIDENT", `\u70B9 ${i + 1} \u4E0E ${j + 1} \u91CD\u5408`, `points ${i + 1} and ${j + 1} are in the same place`);
  const { score } = worstDeviation(points);
  return ok(score, readable(score, n));
}
var problem17 = { definition: definition17, verify: verifyStarDiscrepancy };

// src/exact-polygon.ts
var abs = (value) => value < 0n ? -value : value;
function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (b) {
    const rest = a % b;
    a = b;
    b = rest;
  }
  return a;
}
function vertex(nx, ny, d) {
  if (d === 0n) throw new Error("a corner with no denominator");
  if (d < 0n) {
    nx = -nx;
    ny = -ny;
    d = -d;
  }
  const common = gcd(gcd(nx, ny), d);
  return common > 1n ? [nx / common, ny / common, d / common] : [nx, ny, d];
}
var rational = (num, den) => {
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const common = gcd(num, den);
  return common > 1n ? { num: num / common, den: den / common } : { num, den };
};
var addRational = (a, b) => rational(a.num * b.den + b.num * a.den, a.den * b.den);
var side = ([nx, ny, d], a, b, c) => a * nx + b * ny - c * d;
function clipHalfPlane(poly, a, b, c) {
  if (a === 0n && b === 0n) return c >= 0n ? poly : [];
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const from = poly[i], to = poly[(i + 1) % poly.length];
    const here = side(from, a, b, c), there = side(to, a, b, c);
    if (here <= 0n) out.push(from);
    if (here < 0n && there > 0n || here > 0n && there < 0n) {
      const [px, py, pd] = from, [qx, qy, qd] = to;
      const lead = here * qd, span = lead - there * pd;
      out.push(vertex(
        px * qd * span + lead * (qx * pd - px * qd),
        py * qd * span + lead * (qy * pd - py * qd),
        pd * qd * span
      ));
    }
  }
  return out;
}
function twelveTimesSecondMoment(poly) {
  let total = 0n;
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    total += (x1 * y2 - x2 * y1) * (x1 * x1 + x1 * x2 + x2 * x2 + y1 * y1 + y1 * y2 + y2 * y2);
  }
  return total;
}
function overCommonDenominator(poly, about) {
  let common = 1n;
  for (const [, , d] of poly) common = common / gcd(common, d) * d;
  const corners = poly.map(([nx, ny, d]) => {
    const lift = common / d;
    return [(nx - about[0] * d) * lift, (ny - about[1] * d) * lift];
  });
  return { corners, common };
}
function secondMomentAbout(poly, about) {
  if (poly.length < 3) return { num: 0n, den: 1n };
  const { corners, common } = overCommonDenominator(poly, about);
  return rational(abs(twelveTimesSecondMoment(corners)), 12n * common ** 4n);
}
function cellOf(points, index, box3) {
  const [xi, yi] = points[index];
  let poly = box3;
  for (let j = 0; j < points.length; j += 1) {
    if (j === index) continue;
    const [xj, yj] = points[j];
    const a = 2n * (xj - xi), b = 2n * (yj - yi), c = xj * xj + yj * yj - xi * xi - yi * yi;
    poly = a === 0n && b === 0n && c === 0n ? j < index ? [] : poly : clipHalfPlane(poly, a, b, c);
    if (poly.length < 3) return [];
  }
  return poly;
}
var squareBox = (size) => [vertex(0n, 0n, 1n), vertex(size, 0n, 1n), vertex(size, size, 1n), vertex(0n, size, 1n)];

// src/problems/p55-optimal-quantization.ts
var MIN_N9 = 6;
var MAX_N10 = 30;
var PLACES2 = 18n;
var READABLE_PLACES = 15n;
var box = squareBox(BigInt(SCALE));
function quantizationEnergy(points) {
  const sites = points.map(([x, y]) => [BigInt(x), BigInt(y)]);
  let total = { num: 0n, den: 1n };
  for (let i = 0; i < sites.length; i += 1)
    total = addRational(total, secondMomentAbout(cellOf(sites, i, box), sites[i]));
  return rational(total.num, total.den * BigInt(SCALE) ** 4n);
}
var ceilDiv = (num, den) => (num + den - 1n) / den;
function readable2(score) {
  const units = ceilDiv(score, 10n ** (PLACES2 - READABLE_PLACES));
  const scale = 10n ** READABLE_PLACES;
  return `${units / scale}.${(units % scale).toString().padStart(Number(READABLE_PLACES), "0")}`;
}
var SQUASH2 = 0.8;
function squashedGrid(n) {
  const columns = Math.ceil(Math.sqrt(n));
  const points = [];
  for (let i = 0; points.length < n; i += 1)
    points.push([
      printFixed(Math.round(SQUASH2 * SCALE * ((Math.floor(i / columns) + 0.5) / columns))),
      printFixed(Math.round(SQUASH2 * SCALE * ((i % columns + 0.5) / columns)))
    ]);
  return { points };
}
var sizes2 = Array.from({ length: MAX_N10 - MIN_N9 + 1 }, (_, index) => MIN_N9 + index);
function fejesTothFloor(n) {
  let guess = 3n * 10n ** 30n, next = (guess >> 1n) + 1n;
  while (next < guess) {
    guess = next;
    next = guess + 3n * 10n ** 30n / guess >> 1n;
  }
  const units = 5n * guess / (54n * BigInt(n));
  const scale = 10n ** 15n;
  return `${units / scale}.${(units % scale).toString().padStart(15, "0")}`;
}
var FLOOR_SOURCE = "Fejes T\xF3th \u77E9\u5B9A\u7406\uFF1A\u5E73\u5747\u5E73\u65B9\u8DDD\u79BB\u4E0D\u53EF\u80FD\u4F4E\u4E8E\u628A\u5730\u56FE\u5256\u6210 n \u4E2A\u7B49\u9762\u79EF\u6B63\u516D\u8FB9\u5F62\u7684\u6C34\u5E73\uFF1B\u6B63\u65B9\u5F62\u94FA\u4E0D\u51FA\u6B63\u516D\u8FB9\u5F62\uFF0C\u8FD9\u6761\u7EBF\u6C38\u8FDC\u53D6\u4E0D\u5230\uFF0C\u53EA\u80FD\u903C\u8FD1";
var FLOOR_SOURCE_EN = "Fejes T\xF3th's moment theorem: the mean squared distance cannot go below what n equal-area regular hexagons would achieve \u2014 and hexagons do not tile a square, so the line can be approached but never reached";
var FLOOR_URL = "https://link.springer.com/article/10.1007/s000100050116";
var instances13 = sizes2.map((n) => ({
  instanceId: `p55-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: squashedGrid(n),
  instanceNameEn: `n = ${n}`,
  floor: { display: fejesTothFloor(n), exact: `5/(18\u221A3\xB7${n})`, source: FLOOR_SOURCE, sourceEn: FLOOR_SOURCE_EN, url: FLOOR_URL }
}));
var PRIMARY3 = 12;
var definition18 = {
  id: "p55",
  instanceId: `p55-n${PRIMARY3}-v1`,
  code: "P55",
  slug: "optimal-quantization",
  category: "extremal",
  title: "\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u7684\u6700\u4F18\u91CF\u5316",
  summary: "\u5728\u4E00\u5F20\u65B9\u5F62\u5730\u56FE\u4E0A\u653E n \u4E2A\u590D\u6D3B\u70B9\u3002\u73A9\u5BB6\u5747\u5300\u5730\u968F\u673A\u51FA\u73B0\u5728\u4EFB\u4F55\u4F4D\u7F6E\uFF0C\u7136\u540E\u88AB\u9001\u5230\u79BB\u4ED6\u6700\u8FD1\u7684\u90A3\u4E2A\u590D\u6D3B\u70B9\uFF1B\u8BA9\u8FD9\u6BB5\u8DEF\u7684\u5E73\u5747\u5E73\u65B9\u8DDD\u79BB\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u5E73\u5747\u5E73\u65B9\u8DDD\u79BB",
  instanceName: `n = ${PRIMARY3}`,
  parameters: { n: PRIMARY3 },
  baselineAnswer: squashedGrid(PRIMARY3),
  answerHelp: '\u63D0\u4EA4 points\u3002\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u5206\u6570\u662F\u6574\u5757\u5730\u56FE\u4E0A\u7684\u5E73\u5747\u5E73\u65B9\u8DDD\u79BB\uFF0C\u8D8A\u5C0F\u8D8A\u597D\u3002',
  titleEn: "Optimal quantization in the unit square",
  summaryEn: "Place n respawn points on a square map. A player appears uniformly at random and is sent to the nearest one; make the average squared trip as short as you can.",
  scoreLabelEn: "the average squared distance",
  instanceNameEn: `n = ${PRIMARY3}`,
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.25", to at most nine decimal places. The score is the average squared distance over the whole map, and smaller is better.',
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u6BCF\u4E00\u4E2A\u4F4D\u7F6E\u90FD\u5F52\u79BB\u5B83\u6700\u8FD1\u7684\u90A3\u4E2A\u70B9\u7BA1\uFF0C\u6240\u4EE5\u6574\u5757\u6B63\u65B9\u5F62\u88AB\u5212\u6210 n \u5757\uFF0C\u8C01\u4E5F\u4E0D\u91CD\u53E0\u3001\u8C01\u4E5F\u4E0D\u6F0F\u4E0B\u3002\u5750\u6807\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right. Every place belongs to whichever point is nearest, so the square is divided into n regions that neither overlap nor leave a gap. Coordinates are plain decimals such as "0.25", to at most nine decimal places.',
  // The three registers, piloted here. `definition` states the problem and
  // nothing else; `strict` is the contract a verifier could be rebuilt from;
  // `intuition` is everything that helps without defining — the analogy, why
  // there is anything to win, and where the frontier is, citation included.
  // The old `statement` blob carried all four at once and is retired for this
  // problem; the family page's frame/requirements duplication dies with it.
  definition: "\u5728\u8FB9\u957F\u4E3A 1 \u7684\u6B63\u65B9\u5F62\u91CC\u653E n \u4E2A\u70B9\u3002\u6B63\u65B9\u5F62\u5185\u7684\u6BCF\u4E00\u4E2A\u4F4D\u7F6E\uFF0C\u90FD\u7531\u79BB\u5B83\u6700\u8FD1\u7684\u90A3\u4E2A\u70B9\u8D1F\u8D23\uFF1B\u4F60\u7684\u5206\u6570\uFF0C\u662F\u300C\u4F4D\u7F6E\u5230\u8D1F\u8D23\u5B83\u7684\u70B9\u7684\u8DDD\u79BB\u7684\u5E73\u65B9\u300D\u5728\u6574\u4E2A\u6B63\u65B9\u5F62\u4E0A\u7684\u5E73\u5747\u503C\u3002\u628A\u8FD9\u4E2A\u5E73\u5747\u503C\u538B\u5230\u6700\u4F4E\u3002",
  definitionEn: "Place n points in the square of side 1. Every location in the square is served by whichever point is nearest; your score is the average, over the whole square, of the squared distance from a location to the point serving it. Make that average as small as you can.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\u7684\u5750\u6807\uFF0C\u5341\u8FDB\u5236\u5C0F\u6570\uFF0C\u6700\u591A\u4E5D\u4F4D\uFF1B\u4E24\u70B9\u4E0D\u5F97\u91CD\u5408", textEn: "Exactly n points, each coordinate a decimal with at most nine places; no two points may coincide" },
    { label: "\u5F52\u5C5E", labelEn: "Assignment", text: "\u6BCF\u4E2A\u4F4D\u7F6E\u5F52\u79BB\u5B83\u6700\u8FD1\u7684\u90A3\u4E2A\u70B9\uFF1B\u6070\u597D\u7B49\u8DDD\u7684\u4F4D\u7F6E\u6784\u6210\u96F6\u9762\u79EF\u96C6\u5408\uFF0C\u5F52\u7ED9\u8C01\u4E0D\u5F71\u54CD\u5206\u6570", textEn: "Every location belongs to the nearest point; the exactly-equidistant locations form a set of zero area, so their assignment cannot change the score" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9 E(P) = \u222B\u222B min\u2016x \u2212 p\u1D62\u2016\xB2 dx \u5C3D\u53EF\u80FD\u5C0F\u3002\u7CBE\u786E\u6709\u7406\u6570\u8BA1\u5206\uFF0C\u5411\u4E0A\u53D6\u6574\u5230 10\u207B\xB9\u2078", textEn: "Make E(P) = \u222B\u222B min\u2016x \u2212 p\u1D62\u2016\xB2 dx as small as possible. Scored in exact rationals, rounded up at 10\u207B\xB9\u2078" }
  ],
  intuition: [
    {
      title: "\u4E00\u4E2A\u6BD4\u55BB\uFF1A\u590D\u6D3B\u70B9",
      titleEn: "An analogy: respawn points",
      text: "\u628A\u6B63\u65B9\u5F62\u5F53\u6210\u4E00\u5F20\u5730\u56FE\uFF0C\u8FD9 n \u4E2A\u70B9\u5C31\u662F\u4F60\u653E\u7684\u590D\u6D3B\u70B9\u3002\u73A9\u5BB6\u5747\u5300\u5730\u968F\u673A\u51FA\u73B0\u5728\u5730\u56FE\u4E0A\u4EFB\u4F55\u4F4D\u7F6E\uFF0C\u7136\u540E\u88AB\u9001\u5230\u79BB\u4ED6\u6700\u8FD1\u7684\u590D\u6D3B\u70B9\u3002\u4F60\u7684\u5206\u6570\uFF0C\u5C31\u662F\u8FD9\u6BB5\u8DEF\u7A0B\u5E73\u65B9\u7684\u5E73\u5747\u503C\u3002",
      textEn: "Read the square as a map and the n points as respawn points. A player appears uniformly at random anywhere on it and is sent to the nearest one \u2014 your score is the average squared length of that trip."
    },
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u628A\u6BCF\u4E2A\u70B9\u632A\u5230\u5B83\u8F96\u533A\u7684\u91CD\u5FC3\u3001\u53CD\u590D\u8FED\u4EE3\uFF0C\u5C31\u662F Lloyd \u7B97\u6CD5\uFF1A\u5B83\u4E00\u5B9A\u4F1A\u505C\uFF0C\u4F46\u505C\u5728\u9A7B\u70B9\uFF0C\u4E0D\u662F\u6700\u4F18\u89E3\u3002\u8FD9\u4E2A\u80FD\u91CF\u6709\u5F88\u591A\u5C40\u90E8\u6781\u5C0F\uFF0C\u843D\u8FDB\u54EA\u4E00\u4E2A\uFF0C\u5B8C\u5168\u53D6\u51B3\u4E8E\u8D77\u70B9\u3002\u80FD\u4F18\u5316\u7684\u5C31\u662F\u8FD9\u4E00\u6BB5\u3002",
      textEn: "Moving every point to the centre of mass of its region, over and over, is Lloyd's algorithm: it always stops, but where it stops is a stationary point, not the best one. This energy has many local minima, and which one you fall into depends entirely on where you started \u2014 that gap is the contest."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "n \u2264 2 \u5DF2\u8BC1\u660E\uFF1Bn = 3\u30014\u30015 \u4F9D\u8D56\u4E00\u4E2A\u672A\u8BC1\u660E\u7684\u5BF9\u79F0\u6027\u731C\u60F3\uFF08Roychowdhury, arXiv:1608.03815\uFF09\uFF1Bn \u2265 6 \u6587\u732E\u539F\u8BDD\u662F\u300C\u6781\u5176\u56F0\u96BE\uFF0C\u81F3\u4ECA\u4E0D\u77E5\u9053\u7B54\u6848\u300D\u3002\u53E6\u6709\u4E00\u6761\u5BF9\u6BCF\u4E2A n \u90FD\u6210\u7ACB\u7684\u4E0B\u754C 5/(18\u221A3\xB7n)\uFF1A\u90A3\u662F\u6B63\u516D\u8FB9\u5F62\u7684\u6C34\u5E73\uFF0C\u6B63\u65B9\u5F62\u6C38\u8FDC\u94FA\u4E0D\u51FA\u3002",
      textEn: 'n \u2264 2 is proven; n = 3, 4 and 5 rest on an unproven symmetry conjecture (Roychowdhury, arXiv:1608.03815); of anything larger the literature says it "is extremely difficult and the answer is not known yet". One floor holds for every n: 5/(18\u221A3\xB7n), the level of regular hexagons \u2014 which never tile a square.'
    }
  ],
  requirements: [
    "\u6070\u597D n \u4E2A\u70B9\uFF0C\u90FD\u843D\u5728\u6B63\u65B9\u5F62\u5185\uFF0C\u4E24\u70B9\u4E0D\u80FD\u91CD\u5408",
    "\u6BCF\u4E00\u4E2A\u4F4D\u7F6E\u90FD\u5F52\u79BB\u5B83\u6700\u8FD1\u7684\u90A3\u4E2A\u70B9\u7BA1\uFF1B\u6B63\u597D\u7B49\u8DDD\u7684\u4F4D\u7F6E\u8FDE\u6210\u4E00\u6761\u7EBF\uFF0C\u9762\u79EF\u4E3A\u96F6\uFF0C\u7B97\u7ED9\u8C01\u90FD\u4E0D\u5F71\u54CD\u5206\u6570",
    "\u5206\u6570\u662F\u6574\u5757\u6B63\u65B9\u5F62\u4E0A\u5E73\u5747\u7684\u5E73\u65B9\u8DDD\u79BB\uFF0C\u8D8A\u5C0F\u8D8A\u597D"
  ],
  requirementsEn: [
    "Exactly n points, all inside the square, no two in the same place",
    "Every place belongs to whichever point is nearest; the places exactly equidistant form a line of zero area, so which side they fall on cannot change the score",
    "The score is the average squared distance over the whole square, and smaller is better"
  ],
  instances: instances13
};
function verifyQuantization(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 1 || n > 120) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE)
      return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u843D\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5916`, `point ${i + 1} lies outside the unit square`);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]) === 0n)
      return fail("COINCIDENT", `\u70B9 ${i + 1} \u4E0E ${j + 1} \u91CD\u5408`, `points ${i + 1} and ${j + 1} are in the same place`);
  const energy = quantizationEnergy(points);
  const score = ceilDiv(energy.num * 10n ** PLACES2, energy.den);
  return ok(score, readable2(score));
}
var problem18 = { definition: definition18, verify: verifyQuantization };

// src/problems/p56-uniform-mesh.ts
var MIN_N10 = 5;
var MAX_N11 = 40;
var PLACES3 = 15n;
var box2 = squareBox(BigInt(SCALE));
function worstHoleSquared(points) {
  const sites = points.map(([x, y]) => [BigInt(x), BigInt(y)]);
  let bestNum = 0n, bestDen = 1n;
  for (let i = 0; i < sites.length; i += 1) {
    const [x, y] = sites[i];
    for (const [nx, ny, d] of cellOf(sites, i, box2)) {
      const dx = nx - x * d, dy = ny - y * d;
      const num = dx * dx + dy * dy, den = d * d;
      if (num * bestDen > bestNum * den) {
        bestNum = num;
        bestDen = den;
      }
    }
  }
  const common = gcd(bestNum, bestDen);
  return { num: bestNum / common, den: bestDen / common };
}
function closestPairSquared(points) {
  let best = -1n;
  for (let i = 0; i < points.length; i += 1)
    for (let j = i + 1; j < points.length; j += 1) {
      const d = sq(points[i][0] - points[j][0]) + sq(points[i][1] - points[j][1]);
      if (best < 0n || d < best) best = d;
    }
  return best;
}
var ceilDiv2 = (num, den) => (num + den - 1n) / den;
function ceilSqrt(value) {
  if (value < 2n) return value;
  let guess = value, next = (value >> 1n) + 1n;
  while (next < guess) {
    guess = next;
    next = guess + value / guess >> 1n;
  }
  return guess * guess < value ? guess + 1n : guess;
}
function readable3(score) {
  const units = ceilSqrt(score * 10n ** 9n);
  const scale = 10n ** 12n;
  return `${units / scale}.${(units % scale).toString().padStart(12, "0")}`;
}
function draggedGrid(n) {
  const columns = Math.ceil(Math.sqrt(n));
  const units = [];
  for (let i = 0; units.length < n; i += 1)
    units.push([
      Math.round(SCALE * ((Math.floor(i / columns) + 0.5) / columns)),
      Math.round(SCALE * ((i % columns + 0.5) / columns))
    ]);
  units[0] = [
    Math.round(units[0][0] + 0.3 * (units[1][0] - units[0][0])),
    Math.round(units[0][1] + 0.3 * (units[1][1] - units[0][1]))
  ];
  return { points: units.map(([x, y]) => [printFixed(x), printFixed(y)]) };
}
var sizes3 = Array.from({ length: MAX_N11 - MIN_N10 + 1 }, (_, index) => MIN_N10 + index);
var FLOOR_SOURCE2 = "\u6700\u8FD1\u70B9\u5BF9\u7684\u4E2D\u70B9\u5230\u4E24\u7AEF\u7684\u8DDD\u79BB\u90FD\u662F \u03B4/2\uFF0C\u800C\u4EFB\u4F55\u7B2C\u4E09\u4E2A\u70B9\u82E5\u79BB\u4E2D\u70B9\u4E0D\u8DB3 \u03B4/2\uFF0C\u5C31\u4F1A\u79BB\u4E24\u7AEF\u90FD\u4E0D\u8DB3 \u03B4\uFF0C\u4E0E \u03B4 \u7684\u6700\u5C0F\u6027\u77DB\u76FE\u3002\u6240\u4EE5 h \u2265 \u03B4/2\uFF0CM \u2265 1\uFF0C\u5BF9\u4EFB\u4F55\u5E03\u5C40\u6210\u7ACB";
var FLOOR_SOURCE_EN2 = "The closest pair's midpoint is \u03B4/2 from both endpoints, and a third point within \u03B4/2 of it would be within \u03B4 of both, contradicting \u03B4's minimality. So h \u2265 \u03B4/2 and M \u2265 1, for every arrangement";
var instances14 = sizes3.map((n) => ({
  instanceId: `p56-n${n}-v1`,
  instanceName: `n = ${n}`,
  parameters: { n },
  baselineAnswer: draggedGrid(n),
  instanceNameEn: `n = ${n}`,
  floor: { display: "1.000000000000000", exact: "1", source: FLOOR_SOURCE2, sourceEn: FLOOR_SOURCE_EN2 }
}));
var PRIMARY4 = 12;
var definition19 = {
  id: "p56",
  instanceId: `p56-n${PRIMARY4}-v1`,
  code: "P56",
  slug: "uniform-mesh",
  category: "extremal",
  title: "\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u7684\u6700\u5747\u5300\u91C7\u6837\u7F51\u683C",
  summary: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u91CC\u653E n \u4E2A\u70B9\uFF0C\u7EA2\u5708\u662F\u6CA1\u88AB\u8986\u76D6\u7684\u6700\u5927\u7A7A\u6D1E\uFF0C\u84DD\u7EBF\u662F\u6328\u5F97\u6700\u8FD1\u7684\u4E00\u5BF9\u70B9\uFF1B\u8BA9\u7A7A\u6D1E\u534A\u5F84\u4E0E\u70B9\u5BF9\u95F4\u8DDD\u7684\u6BD4\u503C\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u5747\u5300\u5EA6 M",
  instanceName: `n = ${PRIMARY4}`,
  parameters: { n: PRIMARY4 },
  baselineAnswer: draggedGrid(PRIMARY4),
  answerHelp: '\u63D0\u4EA4 points\uFF0C\u6BCF\u4E2A\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u5206\u6570\u662F M = 2h/\u03B4\uFF0C\u8D8A\u5C0F\u8D8A\u597D\u3002',
  titleEn: "The most uniform sampling mesh in the unit square",
  summaryEn: "Place n points in the unit square; the red circle is the largest uncovered hole and the blue line the closest pair. Make the ratio of hole radius to pair spacing as small as you can.",
  scoreLabelEn: "the uniformity M",
  instanceNameEn: `n = ${PRIMARY4}`,
  answerHelpEn: 'Submit points, each coordinate written as a decimal string such as "0.25", to at most nine decimal places. The score is M = 2h/\u03B4; smaller is better.',
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF1A\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002h \u662F\u6B63\u65B9\u5F62\u5185\u4EFB\u4F55\u4F4D\u7F6E\u5230\u6700\u8FD1\u63D0\u4EA4\u70B9\u8DDD\u79BB\u7684\u6700\u5927\u503C\uFF0C\u03B4 \u662F\u6700\u8FD1\u70B9\u5BF9\u7684\u8DDD\u79BB\u3002\u5750\u6807\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: `The container is a square of side 1: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right. h is the greatest distance any location in the square has to its nearest submitted point; \u03B4 is the closest pair's distance. Coordinates are plain decimals such as "0.25", to at most nine decimal places.`,
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u91CC\u653E n \u4E2A\u70B9\u3002h \u662F\u6B63\u65B9\u5F62\u5185\u4EFB\u4F55\u4F4D\u7F6E\u5230\u6700\u8FD1\u70B9\u8DDD\u79BB\u7684\u6700\u5927\u503C\uFF0C\u03B4 \u662F\u6700\u8FD1\u7684\u4E00\u5BF9\u70B9\u4E4B\u95F4\u7684\u8DDD\u79BB\uFF1B\u5206\u6570\u662F M = 2h/\u03B4\u3002\u628A\u5B83\u538B\u5230\u6700\u4F4E\u3002",
  definitionEn: "Place n points in the unit square. h is the greatest distance any location has to its nearest point, \u03B4 the distance of the closest pair; the score is M = 2h/\u03B4. Make it as small as you can.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u5355\u4F4D\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\u7684\u5750\u6807\uFF0C\u5341\u8FDB\u5236\u5C0F\u6570\uFF0C\u6700\u591A\u4E5D\u4F4D\uFF1B\u4E24\u70B9\u4E0D\u5F97\u91CD\u5408", textEn: "Exactly n points, each coordinate a decimal with at most nine places; no two points may coincide" },
    { label: "\u5EA6\u91CF", labelEn: "Measures", text: "h \u53D6\u6B63\u65B9\u5F62\u5185\u6240\u6709\u4F4D\u7F6E\u5230\u6700\u8FD1\u63D0\u4EA4\u70B9\u8DDD\u79BB\u7684\u6700\u5927\u503C\uFF1B\u03B4 \u53D6\u6240\u6709\u70B9\u5BF9\u8DDD\u79BB\u7684\u6700\u5C0F\u503C", textEn: "h is the maximum over all locations of the distance to the nearest submitted point; \u03B4 is the minimum over all pairs" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9 M = 2h/\u03B4 \u5C3D\u53EF\u80FD\u5C0F\u3002\u5185\u90E8\u4EE5 M\xB2 = 4h\xB2/\u03B4\xB2 \u7CBE\u786E\u8BA1\u5206\uFF0C\u5411\u4E0A\u53D6\u6574\u5230 10\u207B\xB9\u2075", textEn: "Make M = 2h/\u03B4 as small as possible. Scored internally as M\xB2 = 4h\xB2/\u03B4\xB2, exact, rounded up at 10\u207B\xB9\u2075" }
  ],
  intuition: [
    {
      title: "\u4E00\u4E2A\u6BD4\u55BB\uFF1A\u57FA\u7AD9\u9009\u5740",
      titleEn: "An analogy: siting base stations",
      text: "\u628A n \u4E2A\u70B9\u5F53\u6210 n \u5EA7\u57FA\u7AD9\u3002h \u662F\u4FE1\u53F7\u6700\u5DEE\u7684\u4F4D\u7F6E\u79BB\u6700\u8FD1\u57FA\u7AD9\u6709\u591A\u8FDC\uFF0C\u03B4 \u662F\u6328\u5F97\u6700\u8FD1\u7684\u4E24\u5EA7\u6D6A\u8D39\u4E86\u591A\u5C11\u91CD\u53E0\u8986\u76D6\u3002M \u540C\u65F6\u60E9\u7F5A\u8FD9\u4E24\u4EF6\u4E8B\uFF1A\u65E2\u4E0D\u8BB8\u6709\u5927\u6D1E\uFF0C\u4E5F\u4E0D\u8BB8\u6324\u6210\u4E00\u56E2\u3002",
      textEn: "Read the n points as n base stations. h is how far the worst-served location sits from its nearest station; \u03B4 is how much coverage the two closest stations waste on each other. M charges for both: no big holes, no huddles."
    },
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u6B63\u65B9\u5F62\u7F51\u683C\u7684 M \u662F \u221A2 \u2248 1.414\uFF0C\u516D\u8FB9\u5F62\u6392\u5E03\u80FD\u538B\u5F97\u66F4\u4F4E\uFF0C\u4F46\u8FB9\u754C\u4F1A\u9876\u56DE\u6765\uFF1A\u89D2\u843D\u8981\u4E48\u7559\u6D1E\u3001\u8981\u4E48\u6324\u70B9\u3002\u6700\u4F18\u6784\u5F62\u662F\u5185\u90E8\u8702\u7A9D\u4E0E\u8FB9\u754C\u59A5\u534F\u7684\u4EA7\u7269\uFF0C\u6BCF\u4E2A n \u7684\u59A5\u534F\u65B9\u5F0F\u90FD\u4E0D\u540C\u3002",
      textEn: "A square grid sits at M = \u221A2 \u2248 1.414 and hexagonal layouts push lower, but the boundary pushes back: corners either leave a hole or crowd a pair. Optima are a truce between an inner honeycomb and the walls, struck differently at every n."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u5747\u5300\u5EA6\uFF08mesh ratio\uFF09\u662F\u65E0\u7F51\u683C\u65B9\u6CD5\u8BC4\u4EF7\u91C7\u6837\u8D28\u91CF\u7684\u6807\u51C6\u91CF\uFF0C\u4F46\u300Cn \u4E2A\u70B9\u5728\u6B63\u65B9\u5F62\u91CC\u80FD\u8FBE\u5230\u7684\u6700\u5C0F M\u300D\u4F3C\u4E4E\u6CA1\u6709\u9010 n \u7684\u6587\u732E\uFF1B\u8FD9\u91CC\u628A\u6BCF\u4E2A n \u90FD\u5F53\u4F5C\u5F00\u653E\u95EE\u9898\u3002\u8C01\u77E5\u9053\u76F8\u5173\u7ED3\u679C\uFF0C\u6B22\u8FCE\u6765\u4FE1\u3002",
      textEn: "The mesh ratio is a standard uniformity measure in meshless methods, but a per-n table of the smallest M achievable in a square seems absent from the literature; every n here is treated as open. Pointers to sources are welcome."
    }
  ],
  requirements: [
    "\u6070\u597D n \u4E2A\u70B9\uFF0C\u90FD\u843D\u5728\u6B63\u65B9\u5F62\u5185\uFF0C\u4E24\u70B9\u4E0D\u80FD\u91CD\u5408",
    "h \u6309\u6574\u4E2A\u6B63\u65B9\u5F62\u5EA6\u91CF\uFF0C\u4E0D\u53EA\u5728\u63D0\u4EA4\u70B9\u4E0A",
    "\u5206\u6570\u662F M = 2h/\u03B4\uFF0C\u8D8A\u5C0F\u8D8A\u597D"
  ],
  requirementsEn: [
    "Exactly n points, all inside the square, no two in the same place",
    "h is measured over the whole square, not only at the submitted points",
    "The score is M = 2h/\u03B4, and smaller is better"
  ],
  instances: instances14
};
function verifyUniformMesh(params, answer) {
  const n = asInt(params.n, "n");
  if (n < 2 || n > 120) return fail("PARAMS", "\u5B50\u9898\u53C2\u6570\u8D85\u51FA\u652F\u6301\u8303\u56F4", "the sub-problem's parameters are outside the supported range");
  const raw2 = asArray(answer.points, "points");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u70B9`, `exactly ${n} points are needed`);
  const points = raw2.map((point, index) => parseFixedPoint(point, `points[${index}]`));
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    if (x < 0 || y < 0 || x > SCALE || y > SCALE)
      return fail("OUT_OF_BOUNDS", `\u70B9 ${i + 1} \u843D\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5916`, `point ${i + 1} lies outside the unit square`);
  }
  const delta = closestPairSquared(points);
  if (delta === 0n) return fail("COINCIDENT", "\u6709\u4E24\u4E2A\u70B9\u91CD\u5408", "two points are in the same place");
  const hole = worstHoleSquared(points);
  const score = ceilDiv2(4n * hole.num * 10n ** PLACES3, hole.den * delta);
  return ok(score, readable3(score));
}
var problem19 = { definition: definition19, verify: verifyUniformMesh };

// src/problems/p57-sum-of-radii.ts
var MIN_N11 = 1;
var MAX_N12 = 30;
function shrunkGrid(n) {
  const k = Math.ceil(Math.sqrt(n));
  const radius = Math.floor(SCALE / (2 * k) * 4 / 5);
  const fine = (units) => (units / SCALE).toFixed(9).replace(/0+$/, "").replace(/\.$/, "") || "0";
  const circles = [];
  for (let i = 0; i < k && circles.length < n; i += 1)
    for (let j = 0; j < k && circles.length < n; j += 1)
      circles.push([fine(Math.round((2 * j + 1) * SCALE / (2 * k))), fine(Math.round((2 * i + 1) * SCALE / (2 * k))), fine(radius)]);
  return { circles };
}
var instances15 = Array.from({ length: MAX_N12 - MIN_N11 + 1 }, (_, index) => {
  const n = MIN_N11 + index;
  return {
    instanceId: `p57-n${n}-v1`,
    instanceName: `n = ${n}`,
    parameters: { n },
    baselineAnswer: shrunkGrid(n),
    instanceNameEn: `n = ${n}`
  };
});
var definition20 = {
  id: "p57",
  instanceId: "p57-n26-v1",
  code: "P57",
  slug: "sum-of-radii",
  category: "packing",
  title: "\u6B63\u65B9\u5F62\u5185\u5706\u7684\u534A\u5F84\u4E4B\u548C",
  summary: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E n \u4E2A\u4E92\u4E0D\u91CD\u53E0\u7684\u5706\uFF0C\u5927\u5C0F\u968F\u610F\uFF0C\u4F7F\u6240\u6709\u534A\u5F84\u4E4B\u548C\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u534A\u5F84\u4E4B\u548C",
  instanceName: "n = 26",
  parameters: { n: 26 },
  baselineAnswer: shrunkGrid(26),
  answerHelp: '\u63D0\u4EA4 circles\uFF1A\u6070\u597D n \u4E2A\u4E09\u5143\u7EC4 [x, y, r]\uFF0C\u6BCF\u4E2A\u6570\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982 "0.25"\u3002',
  titleEn: "Sum of radii in the unit square",
  summaryEn: "Place n non-overlapping circles of any sizes in the unit square, maximizing the sum of their radii.",
  scoreLabelEn: "sum of the radii",
  instanceNameEn: "n = 26",
  answerHelpEn: 'Submit circles: exactly n triples [x, y, r], every number a decimal string such as "0.25".',
  extent: SCALE,
  frame: '\u5BB9\u5668\u662F\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)\u3002\u5750\u6807\u4E0E\u534A\u5F84\u5171\u7528\u4E00\u5957\u5355\u4F4D\uFF0C\u76F4\u63A5\u5199\u6210\u5C0F\u6570\uFF0C\u4F8B\u5982 "0.25"\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002',
  frameEn: 'The container is a square of side 1, with the origin (0, 0) at its lower-left corner and (1, 1) at its upper-right. Coordinates and radii share one unit and are written as plain decimals such as "0.25", to at most nine decimal places.',
  definition: "\u5728\u5355\u4F4D\u6B63\u65B9\u5F62\u5185\u653E\u7F6E n \u4E2A\u4E92\u4E0D\u91CD\u53E0\u7684\u5706\uFF0C\u6BCF\u4E2A\u5706\u7684\u534A\u5F84\u5404\u81EA\u968F\u610F\uFF0C\u4F7F\u6240\u6709\u534A\u5F84\u4E4B\u548C\u5C3D\u53EF\u80FD\u5927\u3002",
  definitionEn: "Place n non-overlapping circles in the unit square, each with its own radius, making the sum of the radii as large as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "\u8FB9\u957F 1 \u7684\u6B63\u65B9\u5F62\uFF0C\u5DE6\u4E0B\u89D2\u662F\u539F\u70B9 (0, 0)\uFF0C\u53F3\u4E0A\u89D2\u662F (1, 1)", textEn: "A square of side 1, origin (0, 0) at the lower-left corner, (1, 1) at the upper-right" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5706\uFF0C\u6BCF\u4E2A\u662F\u4E00\u7EC4 [x, y, r]\uFF1A\u5706\u5FC3\u52A0\u81EA\u5DF1\u7684\u534A\u5F84", textEn: "Exactly n circles, each a triple [x, y, r]: a centre plus its own radius" },
    { label: "\u7EA6\u675F", labelEn: "Constraints", text: "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u6B63\u65B9\u5F62\u5185\uFF1B\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8\uFF1B\u534A\u5F84\u4E3A\u6B63", textEn: "Every circle lies entirely inside the square; no two overlap in their interiors, tangency allowed; every radius is positive" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u8BA9\u6240\u6709\u534A\u5F84\u4E4B\u548C\u5C3D\u53EF\u80FD\u5927\u3002\u534A\u5F84\u90FD\u662F\u4E5D\u4F4D\u5C0F\u6570\uFF0C\u548C\u662F\u7CBE\u786E\u7684\u6574\u6570\u548C", textEn: "Make the sum of the radii as large as possible. Radii are nine-decimal numbers, and the sum is an exact integer sum" }
  ],
  intuition: [
    {
      title: "\u54EA\u91CC\u6709\u4F18\u5316\u7A7A\u95F4",
      titleEn: "Where the room for improvement is",
      text: "\u7B49\u5706\u662F\u6700\u5DEE\u7684\u7B56\u7565\u4E4B\u4E00\uFF1A\u51E0\u4E2A\u5927\u5706\u538B\u4F4F\u5899\u89D2\uFF0C\u518D\u7528\u5C0F\u5706\u94BB\u8FDB\u5B83\u4EEC\u7559\u4E0B\u7684\u7F1D\u9699\uFF0C\u6BD4\u4EFB\u4F55\u5747\u5300\u6392\u5E03\u90FD\u5F3A\u3002\u4E00\u4E2A\u5927\u5706\u6362\u51E0\u4E2A\u5C0F\u5706\u7684\u53D6\u820D\u5728\u6BCF\u4E2A\u89D2\u843D\u91CD\u6F14\uFF0C\u6700\u4F18\u6784\u5F62\u91CC\u5927\u5C0F\u80FD\u5DEE\u51FA\u4E00\u4E2A\u6570\u91CF\u7EA7\u3002",
      textEn: "Equal circles are one of the worst strategies here: a few large circles pressed into the walls, with small ones tucked into the gaps they leave, beat any uniform arrangement. The trade of one big circle for several small ones replays in every corner, and the optimum spans an order of magnitude in size."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u8FD9\u662F AlphaEvolve \u5927\u89C4\u6A21\u6570\u5B66\u53D1\u73B0\u5B9E\u9A8C\u4E2D\u7684\u95EE\u9898 6.36\u3002n = 26 \u5728 EinsteinArena \u4E0A\u88AB\u63A8\u5230\u7CBE\u786E\u7684 KKT \u89E3\uFF08\u548C\u7684\u524D 45 \u4F4D\u5DF2\u77E5\uFF09\uFF0C\u5176\u4F59 n \u51E0\u4E4E\u6CA1\u6709\u53D1\u8868\u8FC7\u7684\u503C\uFF0C\u5168\u90E8\u5F00\u653E\u3002",
      textEn: "This is problem 6.36 of AlphaEvolve's large-scale mathematical discovery runs. On EinsteinArena, n = 26 was pushed to the exact KKT optimum (the first 45 digits of the sum are known); almost no other n has a published value, and every one of them is open.",
      url: "https://einsteinarena.com/problems/circle-packing"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u5706\uFF0C\u6BCF\u4E2A\u5E26\u81EA\u5DF1\u7684\u534A\u5F84", "\u6BCF\u4E2A\u5706\u5B8C\u6574\u843D\u5728\u6B63\u65B9\u5F62\u5185", "\u4E24\u4E24\u5185\u90E8\u4E0D\u91CD\u53E0\uFF0C\u76F8\u5207\u5141\u8BB8"],
  requirementsEn: ["Exactly n circles, each with its own radius", "Every circle lies entirely inside the square", "No two overlap in their interiors, tangency allowed"],
  instances: instances15
};
var big2 = BigInt;
function verifySumOfRadii(params, answer) {
  const n = asInt(params.n, "n");
  if (n < MIN_N11 || n > MAX_N12) refuse("n \u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "n is outside the range the verifier supports");
  const raw2 = asArray(answer.circles, "circles");
  if (raw2.length !== n) return fail("COUNT", `\u9700\u8981\u6070\u597D ${n} \u4E2A\u5706`, `exactly ${n} circles are needed`);
  const circles = [];
  for (let i = 0; i < n; i += 1) {
    const triple = raw2[i];
    if (!Array.isArray(triple) || triple.length !== 3)
      return fail("BAD_CIRCLE", `circles[${i}] \u5FC5\u987B\u662F [x, y, r] \u4E09\u5143\u7EC4`, `circles[${i}] must be an [x, y, r] triple`);
    const x = parseFixed(triple[0], `circles[${i}][0]`);
    const y = parseFixed(triple[1], `circles[${i}][1]`);
    const r = parseFixed(triple[2], `circles[${i}][2]`);
    if (r <= 0) return fail("DEGENERATE", `circles[${i}] \u7684\u534A\u5F84\u5FC5\u987B\u4E3A\u6B63`, `circles[${i}] must have a positive radius`);
    if (x < r || y < r || x + r > SCALE || y + r > SCALE)
      return fail("OUT_OF_BOUNDS", `\u5706 ${i + 1} \u6CA1\u6709\u5B8C\u6574\u843D\u5728\u6B63\u65B9\u5F62\u5185`, `circle ${i + 1} does not lie entirely inside the square`);
    circles.push([x, y, r]);
  }
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    const dx = big2(circles[i][0] - circles[j][0]), dy = big2(circles[i][1] - circles[j][1]);
    const reach = big2(circles[i][2] + circles[j][2]);
    if (dx * dx + dy * dy < reach * reach)
      return fail("OVERLAP", `\u5706 ${i + 1} \u4E0E\u5706 ${j + 1} \u76F8\u4EA4`, `circles ${i + 1} and ${j + 1} intersect`);
  }
  let sum = 0n;
  for (const [, , r] of circles) sum += big2(r);
  return ok(sum, printFixedBig(sum));
}
var problem20 = { definition: definition20, verify: verifySumOfRadii };

// src/problems/frontier-kit.ts
var big3 = BigInt;
var S = big3(SCALE);
function ceilDiv3(p, q) {
  if (q <= 0n) throw new Error("ceilDiv wants a positive denominator");
  return p >= 0n ? (p + q - 1n) / q : -(-p / q);
}
function floorDiv(p, q) {
  if (q <= 0n) throw new Error("floorDiv wants a positive denominator");
  return p >= 0n ? p / q : -ceilDiv3(-p, q);
}
function integerSqrtCeil(value) {
  const root = integerSqrt(value);
  return root * root === value ? root : root + 1n;
}
function printScaled(units, places) {
  const scale = 10n ** big3(places);
  const whole = units / scale;
  const fraction = (units % scale).toString().padStart(places, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}
function readMatrix(value, name, rows, columns, low, high) {
  const raw2 = asArray(value, name);
  if (raw2.length !== rows) refuse(`${name} \u9700\u8981\u6070\u597D ${rows} \u884C`, `${name} needs exactly ${rows} rows`);
  return raw2.map((entry, i) => {
    const row = asArray(entry, `${name}[${i}]`);
    if (row.length !== columns) refuse(`${name}[${i}] \u9700\u8981\u6070\u597D ${columns} \u4E2A\u6570`, `${name}[${i}] needs exactly ${columns} numbers`);
    return row.map((cell, j) => {
      const units = parseFixed(cell, `${name}[${i}][${j}]`);
      if (units < low || units > high)
        refuse(`${name}[${i}][${j}] \u8D85\u51FA\u5141\u8BB8\u8303\u56F4`, `${name}[${i}][${j}] is outside the allowed range`);
      return units;
    });
  });
}
var ratioLess = (a, b) => a.p * b.q < b.p * a.q;
function lcg(seed) {
  let state = big3(seed) * 2654435761n + 1013904223n;
  const modulus = 1n << 63n;
  return () => {
    state = (state * 6364136223846793005n + 1442695040888963407n) % modulus;
    return Number(state >> 30n) % SCALE;
  };
}
function signedUnit(next) {
  const magnitude = next() % (SCALE + 1);
  const sign = next() % 2 === 0 ? 1 : -1;
  return printFixed(sign * magnitude);
}

// src/problems/p59-l2-star-discrepancy.ts
var MAX_N13 = 64;
var MAX_D = 12;
var DIMS = [2, 3, 4, 6, 8];
var COUNTS = [8, 12, 16, 24, 32];
function diagonalBaseline(n, d) {
  return { points: Array.from({ length: n }, (_, i) => {
    const coordinate = printFixed(Math.round((2 * i + 1) * SCALE / (2 * n)));
    return Array.from({ length: d }, () => coordinate);
  }) };
}
var instances16 = DIMS.flatMap((d) => COUNTS.map((n) => ({
  instanceId: `p59-d${d}-n${n}-v1`,
  instanceName: `d = ${d}, n = ${n}`,
  instanceNameEn: `d = ${d}, n = ${n}`,
  parameters: { n, d },
  baselineAnswer: diagonalBaseline(n, d)
})));
var definition21 = {
  id: "p59",
  instanceId: "p59-d3-n16-v1",
  code: "P59",
  slug: "l2-star-discrepancy",
  category: "extremal",
  title: "\u8D85\u7ACB\u65B9\u4F53\u5185\u7684\u6700\u4F4E L2 \u661F\u504F\u5DEE",
  summary: "\u5728 d \u7EF4\u5355\u4F4D\u8D85\u7ACB\u65B9\u4F53\u91CC\u653E n \u4E2A\u91C7\u6837\u70B9\uFF0C\u8BA9\u6240\u6709\u539F\u70B9\u89D2\u77E9\u5F62\u4E0A\u7684\u5747\u65B9\u5206\u5E03\u8BEF\u5DEE\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "L2 \u661F\u504F\u5DEE",
  scoreLabelEn: "L2-star discrepancy",
  instanceName: "d = 3, n = 16",
  instanceNameEn: "d = 3, n = 16",
  parameters: { n: 16, d: 3 },
  baselineAnswer: diagonalBaseline(16, 3),
  answerHelp: '\u63D0\u4EA4 points\uFF1A\u6070\u597D n \u884C\uFF0C\u6BCF\u884C d \u4E2A [0, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u5750\u6807\uFF0C\u4F8B\u5982 "0.25"\u3002',
  answerHelpEn: 'Submit points: exactly n rows of d decimal-string coordinates in [0, 1], such as "0.25".',
  titleEn: "Minimum L2-star discrepancy in the unit hypercube",
  summaryEn: "Place n sample points in the d-dimensional unit hypercube, making the mean-squared distribution error over all origin-anchored boxes as small as possible.",
  extent: SCALE,
  frame: "\u5BB9\u5668\u662F d \u7EF4\u5355\u4F4D\u8D85\u7ACB\u65B9\u4F53 [0,1]^d\u3002\u6BCF\u4E2A\u70B9\u662F d \u4E2A\u5750\u6807\uFF0C\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002",
  frameEn: "The container is the d-dimensional unit hypercube [0,1]^d. Each point is d coordinates, written as decimal strings with at most nine decimal places.",
  definition: "\u5728 [0,1]^d \u4E2D\u653E\u7F6E n \u4E2A\u70B9\u3002\u5BF9\u6BCF\u4E2A\u4EE5\u539F\u70B9\u4E3A\u89D2\u3001\u8FB9\u5E73\u884C\u4E8E\u5750\u6807\u8F74\u7684\u77E9\u5F62\u76D2\uFF0C\u6BD4\u8F83\u76D2\u7684\u4F53\u79EF\u4E0E\u843D\u5165\u76D2\u4E2D\u7684\u70B9\u7684\u6BD4\u4F8B\uFF1B\u628A\u8FD9\u4E2A\u8BEF\u5DEE\u7684\u5E73\u65B9\u5BF9\u6240\u6709\u76D2\u5B50\u79EF\u5206\uFF0C\u5373 L2 \u661F\u504F\u5DEE\u7684\u5E73\u65B9\u3002\u8BA9\u5B83\u5C3D\u53EF\u80FD\u5C0F\u3002",
  definitionEn: "Place n points in [0,1]^d. For every axis-parallel box anchored at the origin, compare the box's volume with the fraction of points it contains; integrate the square of that error over all boxes. That integral is the squared L2-star discrepancy. Make it as small as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u5355\u4F4D\u8D85\u7ACB\u65B9\u4F53 [0,1]^d\uFF0C\u5750\u6807\u95ED\u533A\u95F4", textEn: "The d-dimensional unit hypercube [0,1]^d, coordinates in the closed interval" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\uFF0C\u6BCF\u4E2A\u662F d \u4E2A\u5341\u8FDB\u5236\u5750\u6807\uFF1B\u5141\u8BB8\u91CD\u5408", textEn: "Exactly n points, each d decimal coordinates; coincidences are allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5C0F\u5316 Warnock \u95ED\u5F0F\u516C\u5F0F\u7ED9\u51FA\u7684 L2 \u661F\u504F\u5DEE\uFF1B\u9A8C\u8BC1\u5668\u5728\u4E5D\u4F4D\u7F51\u683C\u4E0A\u7CBE\u786E\u8BA1\u7B97\u5B83\u7684\u5E73\u65B9", textEn: "Minimize the L2-star discrepancy given by Warnock's closed formula; the verifier computes its square exactly on the nine-decimal grid" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F\u6E05\u5206\u6BCD\u540E\u7684\u7CBE\u786E\u6574\u6570 M\xB7D\xB2\uFF1B\u9875\u9762\u663E\u793A D\uFF0C\u5411\u4E0A\u53D6\u6574\u5230\u7B2C 12 \u4F4D\u5C0F\u6570", textEn: "The record is the exact integer M\xB7D\xB2 with the common denominator cleared; the page shows D, rounded up at the twelfth decimal" }
  ],
  intuition: [
    {
      title: "\u5B83\u8861\u91CF\u4EC0\u4E48",
      titleEn: "What it measures",
      text: "\u6E32\u67D3\u548C\u6570\u503C\u79EF\u5206\u7684\u9884\u7B97\u6709\u9650\u65F6\uFF0C\u91C7\u6837\u70B9\u8981\u6A21\u4EFF\u5747\u5300\u5206\u5E03\u3002\u661F\u504F\u5DEE\u95EE\u7684\u662F\uFF1A\u54EA\u4E2A\u89D2\u843D\u77E9\u5F62\u88AB\u7CFB\u7EDF\u6027\u5730\u8FC7\u91C7\u6837\u6216\u5FFD\u7565\u4E86\uFF1FL\u221E \u7248\uFF08P54\uFF09\u7F5A\u6700\u574F\u7684\u4E00\u4E2A\u76D2\u5B50\uFF0C\u8FD9\u91CC\u7F5A\u6240\u6709\u76D2\u5B50\u7684\u5747\u65B9\u8BEF\u5DEE\uFF0C\u6240\u4EE5\u5B83\u53EF\u4EE5\u8FDB\u5165\u9AD8\u7EF4\uFF0C\u800C\u9A8C\u8BC1\u5668\u53CD\u800C\u66F4\u7B80\u5355\u3002",
      textEn: "With a finite budget for rendering or numerical integration, sample points have to imitate the uniform distribution. Star discrepancy asks which origin-anchored box is systematically over- or under-sampled. The L\u221E version (P54) punishes the single worst box; this one punishes the mean square over all boxes \u2014 which is what lets it climb into higher dimensions while the verifier gets simpler."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u56FA\u5B9A (n, d) \u7684\u6700\u4F18 L2 \u661F\u504F\u5DEE\u70B9\u96C6\u51E0\u4E4E\u6CA1\u6709\u5DF2\u8BC1\u660E\u7684\u7ED3\u679C\uFF1A\u6587\u732E\u53EA\u5BF9 n = 1\u30012 \u7ED9\u51FA\u7CBE\u786E\u6700\u4F18\u3002\u8FD9\u91CC\u7684\u6BCF\u4E2A\u5B50\u9898\u90FD\u5F00\u653E\u3002",
      textEn: "Provably optimal L2-star point sets for fixed (n, d) barely exist: the literature settles only n = 1 and 2 exactly. Every sub-problem here is open.",
      url: "https://doi.org/10.1090/bproc/254"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807", "\u5750\u6807\u5728 [0, 1] \u5185", "\u5206\u6570\u662F\u7CBE\u786E\u6574\u6570\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
  requirementsEn: ["Exactly n points, each with d coordinates", "Coordinates lie in [0, 1]", "The score is an exact integer; smaller is better"],
  frontier: true,
  instances: instances16
};
function l2StarNumerator(points, n, d) {
  const power2 = 1n << big3(d - 1);
  const power3 = 3n ** big3(d);
  const gridPower = S ** big3(2 * d);
  let single = 0n;
  for (let i = 0; i < n; i += 1) {
    let product = 1n;
    for (let r = 0; r < d; r += 1) {
      const a = big3(points[i][r]);
      product *= S * S - a * a;
    }
    single += product;
  }
  let pairs = 0n;
  for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) {
    let product = 1n;
    for (let r = 0; r < d; r += 1) product *= S - big3(Math.max(points[i][r], points[j][r]));
    pairs += product;
  }
  return power2 * big3(n) * big3(n) * gridPower - power3 * big3(n) * single + power2 * power3 * S ** big3(d) * pairs;
}
function l2StarDenominator(n, d) {
  return (1n << big3(d - 1)) * 3n ** big3(d) * big3(n) * big3(n) * S ** big3(2 * d);
}
function l2StarDisplay(score, denominator) {
  return printScaled(integerSqrtCeil(ceilDiv3(score * 10n ** 24n, denominator)), 12);
}
function verifyL2Star(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 1 || n > MAX_N13 || d < 1 || d > MAX_D) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const points = readMatrix(answer.points, "points", n, d, 0, SCALE);
  const score = l2StarNumerator(points, n, d);
  return ok(score, l2StarDisplay(score, l2StarDenominator(n, d)));
}
var problem21 = { definition: definition21, verify: verifyL2Star };

// src/problems/p60-line-packing.ts
var MAX_N14 = 48;
var MAX_D2 = 8;
var RANGES = {
  3: [9, 10, 11, 12, 13, 14, 15, 16],
  4: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  5: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
};
function momentBaseline(n, d) {
  const fine = (value) => (Math.round(value * SCALE) / SCALE).toFixed(9);
  return { vectors: Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return Array.from({ length: d }, (_2, r) => fine(t ** r));
  }) };
}
var instances17 = Object.entries(RANGES).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p60-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: momentBaseline(n, Number(dims))
})));
var definition22 = {
  id: "p60",
  instanceId: "p60-d3-n9-v1",
  code: "P60",
  slug: "line-packing",
  category: "extremal",
  title: "\u5B9E\u5C04\u5F71\u7A7A\u95F4\u4E2D\u7684\u76F4\u7EBF\u6253\u5305",
  summary: "\u5728 d \u7EF4\u7A7A\u95F4\u91CC\u9009 n \u6761\u8FC7\u539F\u70B9\u7684\u76F4\u7EBF\uFF0C\u8BA9\u4EFB\u610F\u4E24\u6761\u7684\u5939\u89D2\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "minimize",
  scoreLabel: "\u6700\u5927\u91CD\u5408\u5EA6 \u03BC",
  scoreLabelEn: "the largest coherence \u03BC",
  instanceName: "d = 3, n = 9",
  instanceNameEn: "d = 3, n = 9",
  parameters: { n: 9, d: 3 },
  baselineAnswer: momentBaseline(9, 3),
  answerHelp: "\u63D0\u4EA4 vectors\uFF1A\u6070\u597D n \u884C\uFF0C\u6BCF\u884C d \u4E2A [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u5750\u6807\u3002\u6BCF\u884C\u662F\u4E00\u4E2A\u975E\u96F6\u5411\u91CF\uFF0C\u4EE3\u8868\u5B83\u5F20\u6210\u7684\u76F4\u7EBF\uFF1B\u6B63\u8D1F\u4E0E\u7F29\u653E\u4E0D\u6539\u53D8\u7B54\u6848\u3002",
  answerHelpEn: "Submit vectors: exactly n rows of d decimal-string coordinates in [-1, 1]. Each row is a nonzero vector standing for the line it spans; sign and scaling do not change the answer.",
  titleEn: "Line packing in real projective space",
  summaryEn: "Choose n lines through the origin of R^d so that the smallest angle between any two is as large as possible.",
  extent: SCALE,
  frame: "\u6BCF\u6761\u76F4\u7EBF\u7531\u4E00\u4E2A\u975E\u96F6\u5411\u91CF\u8868\u793A\uFF0Cd \u4E2A\u5750\u6807\u5199\u6210 [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u5411\u91CF\u7684\u6B63\u8D1F\u548C\u975E\u96F6\u7F29\u653E\u4EE3\u8868\u540C\u4E00\u6761\u76F4\u7EBF\u3002",
  frameEn: "Each line is given by a nonzero vector: d coordinates written as decimal strings in [-1, 1], at most nine decimal places. Sign and nonzero scaling represent the same line.",
  definition: "\u5728 R^d \u4E2D\u9009\u62E9 n \u6761\u8FC7\u539F\u70B9\u7684\u76F4\u7EBF\uFF0C\u4F7F\u4EFB\u610F\u4E24\u6761\u4E4B\u95F4\u7684\u5939\u89D2\u7684\u6700\u5C0F\u503C\u5C3D\u53EF\u80FD\u5927\u3002\u7B49\u4EF7\u5730\uFF1A\u6700\u5C0F\u5316\u6700\u5927\u91CD\u5408\u5EA6 \u03BC = max |cos\u2220(v\u1D62, v\u2C7C)|\u3002",
  definitionEn: "Choose n lines through the origin of R^d so that the minimum angle between any two is as large as possible \u2014 equivalently, minimize the largest coherence \u03BC = max |cos \u2220(v_i, v_j)|.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u5B9E\u7A7A\u95F4 R^d\uFF0C\u6240\u6709\u76F4\u7EBF\u90FD\u8FC7\u539F\u70B9\uFF1B\u7B54\u6848\u662F\u5B9E\u5C04\u5F71\u7A7A\u95F4 RP^{d-1} \u4E2D\u7684 n \u4E2A\u70B9", textEn: "Real d-space R^d, every line through the origin; an answer is n points of real projective space RP^{d-1}" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u975E\u96F6\u5411\u91CF\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807\uFF1B\u5411\u91CF\u4EE3\u8868\u5B83\u5F20\u6210\u7684\u76F4\u7EBF", textEn: "Exactly n nonzero vectors, d coordinates each; a vector stands for the line it spans" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5C0F\u5316 \u03BC\xB2 = max (v\u1D62\xB7v\u2C7C)\xB2/(|v\u1D62|\xB2|v\u2C7C|\xB2)\uFF0C\u5168\u7A0B\u6709\u7406\u6570\u4EA4\u53C9\u76F8\u4E58\u6BD4\u8F83\uFF0C\u65E0\u5F52\u4E00\u5316\u65E0\u5F00\u65B9", textEn: "Minimize \u03BC\xB2 = max (v_i\xB7v_j)\xB2/(|v_i|\xB2|v_j|\xB2), compared exactly by cross-multiplication \u2014 no normalization, no square roots" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F ceil(\u03BC\xB2\xB710\xB9\u2078)\uFF0C\u5411\u4E0D\u5229\u4E8E\u63D0\u4EA4\u8005\u7684\u65B9\u5411\u53D6\u6574\uFF1B\u9875\u9762\u663E\u793A \u03BC\uFF0C\u5411\u4E0A\u53D6\u6574\u5230\u7B2C 9 \u4F4D\u5C0F\u6570", textEn: "The record is ceil(\u03BC\xB2\xB710\xB9\u2078), rounded against the submitter; the page shows \u03BC, rounded up at the ninth decimal" }
  ],
  intuition: [
    {
      title: "\u6362\u4E00\u79CD\u8BF4\u6CD5",
      titleEn: "Another way to say it",
      text: "d = 4 \u65F6\uFF0C\u4E00\u4E2A\u975E\u96F6\u5411\u91CF\u5F52\u4E00\u5316\u540E\u662F\u5355\u4F4D\u56DB\u5143\u6570\uFF0Cq \u4E0E \u2212q \u662F\u540C\u4E00\u4E2A\u4E09\u7EF4\u65CB\u8F6C\uFF0C\u6240\u4EE5 d = 4 \u7684\u5B50\u9898\u5C31\u662F\u300C\u9009 n \u4E2A\u5F7C\u6B64\u6700\u5206\u6563\u7684\u4E09\u7EF4\u59FF\u6001\u300D\uFF0C\u673A\u5668\u4EBA\u548C\u6E32\u67D3\u91CC\u771F\u5B9E\u4F7F\u7528\u7684\u95EE\u9898\u3002",
      textEn: "At d = 4 a normalized nonzero vector is a unit quaternion, and q and \u2212q are the same 3D rotation \u2014 so the d = 4 sub-problems ask for n maximally separated 3D orientations, a problem robotics and rendering actually use."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "Grassmannian frame \u7528\u4E8E\u6297\u566A\u58F0\u4E0E\u6297\u64E6\u9664\u7684\u6570\u636E\u8868\u793A\u3001\u65E0\u7EBF\u901A\u4FE1\u4E0E\u538B\u7F29\u611F\u77E5\u3002Sloane \u7684\u6253\u5305\u8868\u7EF4\u62A4\u7740\u8FD9\u4E9B\u53C2\u6570\u7684\u6700\u597D\u5DF2\u77E5\u503C\u5E76\u516C\u5F00\u9080\u8BF7\u6539\u8FDB\uFF1Bd = 3 \u7684\u6700\u4F18\u6027\u8BC1\u660E\u53EA\u5230 n = 8\u3002",
      textEn: "Grassmannian frames drive noise- and erasure-robust data representations, wireless communication and compressed sensing. Sloane's packing table maintains the best known values for these parameters and openly invites improvement; optimality proofs in d = 3 stop at n = 8.",
      url: "http://neilsloane.com/grass/"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u975E\u96F6\u5411\u91CF\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807", "\u5750\u6807\u5728 [-1, 1] \u5185", "\u5206\u6570\u662F ceil(\u03BC\xB2\xB710\xB9\u2078)\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
  requirementsEn: ["Exactly n nonzero vectors with d coordinates each", "Coordinates lie in [-1, 1]", "The score is ceil(\u03BC\xB2\xB710\xB9\u2078); smaller is better"],
  frontier: true,
  instances: instances17
};
function worstAlignment(vectors) {
  let worst = { p: 0n, q: 1n };
  let pair = [0, 1];
  for (let i = 0; i < vectors.length; i += 1) for (let j = i + 1; j < vectors.length; j += 1) {
    let dot3 = 0n, normI = 0n, normJ = 0n;
    for (let r = 0; r < vectors[i].length; r += 1) {
      const a = big3(vectors[i][r]), b = big3(vectors[j][r]);
      dot3 += a * b;
      normI += a * a;
      normJ += b * b;
    }
    const candidate = { p: dot3 * dot3, q: normI * normJ };
    if (ratioLess(worst, candidate)) {
      worst = candidate;
      pair = [i, j];
    }
  }
  return { ratio: worst, pair };
}
function coherenceScore(ratio) {
  return ceilDiv3(ratio.p * 10n ** 18n, ratio.q);
}
function coherenceDisplay(score) {
  return printScaled(integerSqrtCeil(score), 9);
}
function verifyLinePacking(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 2 || n > MAX_N14 || d < 2 || d > MAX_D2) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const vectors = readMatrix(answer.vectors, "vectors", n, d, -SCALE, SCALE);
  for (let i = 0; i < n; i += 1)
    if (vectors[i].every((value) => value === 0))
      return fail("DEGENERATE", `\u5411\u91CF ${i + 1} \u662F\u96F6\u5411\u91CF\uFF0C\u4EE3\u8868\u4E0D\u4E86\u76F4\u7EBF`, `vector ${i + 1} is zero and spans no line`);
  const { ratio, pair } = worstAlignment(vectors);
  const score = coherenceScore(ratio);
  const result2 = ok(score, coherenceDisplay(score));
  return {
    ...result2,
    message: `${result2.message} \u6700\u63A5\u8FD1\u7684\u4E00\u5BF9\u76F4\u7EBF\u662F ${pair[0] + 1} \u4E0E ${pair[1] + 1}\u3002`,
    messageEn: `${result2.messageEn} The closest pair of lines is ${pair[0] + 1} and ${pair[1] + 1}.`
  };
}
var problem22 = { definition: definition22, verify: verifyLinePacking };

// src/problems/p61-complex-projective.ts
var MAX_N15 = 48;
var MAX_D3 = 8;
var RANGES2 = {
  3: [5, 8, 13, 14, 15, 16],
  4: [6, 9, 10, 11, 12, 14, 15],
  5: [7, 8, 9, 12, 13, 14, 15, 16],
  6: [10, 13, 14, 15]
};
function momentBaseline2(n, d) {
  const fine = (value) => (Math.round(value * SCALE) / SCALE).toFixed(9);
  return { vectors: Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return Array.from({ length: d }, (_2, r) => [fine(t ** r), "0"]);
  }) };
}
var instances18 = Object.entries(RANGES2).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p61-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: momentBaseline2(n, Number(dims))
})));
var definition23 = {
  id: "p61",
  instanceId: "p61-d4-n9-v1",
  code: "P61",
  slug: "complex-projective-packing",
  category: "extremal",
  title: "\u590D\u5C04\u5F71\u7A7A\u95F4\u4E2D\u7684\u7801\u672C\u6253\u5305",
  summary: "\u5728 d \u7EF4\u590D\u7A7A\u95F4\u91CC\u9009 n \u4E2A\u65B9\u5411\uFF0C\u8BA9\u4EFB\u610F\u4E24\u4E2A\u7684\u91CD\u5408\u5EA6\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u6700\u5927\u91CD\u5408\u5EA6 \u03BC",
  scoreLabelEn: "the largest coherence \u03BC",
  instanceName: "d = 4, n = 9",
  instanceNameEn: "d = 4, n = 9",
  parameters: { n: 9, d: 4 },
  baselineAnswer: momentBaseline2(9, 4),
  answerHelp: "\u63D0\u4EA4 vectors\uFF1A\u6070\u597D n \u884C\uFF0C\u6BCF\u884C d \u4E2A [re, im] \u5BF9\uFF0C\u5B9E\u90E8\u865A\u90E8\u90FD\u662F [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u3002\u6BCF\u884C\u662F\u4E00\u4E2A\u975E\u96F6\u590D\u5411\u91CF\uFF1B\u6574\u4F53\u76F8\u4F4D\u548C\u975E\u96F6\u590D\u7F29\u653E\u4E0D\u6539\u53D8\u7B54\u6848\u3002",
  answerHelpEn: "Submit vectors: exactly n rows of d pairs [re, im], both decimal strings in [-1, 1]. Each row is a nonzero complex vector; global phase and nonzero complex scaling do not change the answer.",
  titleEn: "Codebook packing in complex projective space",
  summaryEn: "Choose n directions in complex d-space so that the largest pairwise coherence is as small as possible.",
  extent: SCALE,
  frame: "\u6BCF\u4E2A\u590D\u5411\u91CF\u662F d \u4E2A [re, im] \u5BF9\uFF0C\u5206\u91CF\u5199\u6210 [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u6574\u4F53\u76F8\u4F4D\u4E0E\u975E\u96F6\u590D\u7F29\u653E\u4EE3\u8868\u540C\u4E00\u4E2A\u5C04\u5F71\u70B9\u3002",
  frameEn: "Each complex vector is d pairs [re, im], components written as decimal strings in [-1, 1] with at most nine decimal places. Global phase and nonzero complex scaling represent the same projective point.",
  definition: "\u5728 C^d \u4E2D\u9009\u62E9 n \u4E2A\u975E\u96F6\u5411\u91CF\uFF08\u5373\u590D\u5C04\u5F71\u7A7A\u95F4\u4E2D\u7684 n \u4E2A\u70B9\uFF09\uFF0C\u6700\u5C0F\u5316\u6700\u5927\u5F52\u4E00\u5316 Hermitian \u91CD\u5408\u5EA6 \u03BC = max |\u27E8z\u1D62, z\u2C7C\u27E9| / (|z\u1D62||z\u2C7C|)\u3002",
  definitionEn: "Choose n nonzero vectors in C^d \u2014 n points of complex projective space \u2014 minimizing the largest normalized Hermitian overlap \u03BC = max |\u27E8z_i, z_j\u27E9| / (|z_i||z_j|).",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u590D\u7A7A\u95F4 C^d\uFF1B\u7B54\u6848\u662F\u590D\u5C04\u5F71\u7A7A\u95F4 CP^{d-1} \u4E2D\u7684 n \u4E2A\u70B9", textEn: "Complex d-space C^d; an answer is n points of complex projective space CP^{d-1}" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u975E\u96F6\u590D\u5411\u91CF\uFF0C\u6BCF\u4E2A d \u4E2A [re, im] \u5BF9", textEn: "Exactly n nonzero complex vectors, each d pairs [re, im]" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5C0F\u5316 \u03BC\xB2 = max |\u27E8z\u1D62,z\u2C7C\u27E9|\xB2/(|z\u1D62|\xB2|z\u2C7C|\xB2)\uFF1B\u6A21\u5E73\u65B9\u4E0E\u8303\u6570\u5E73\u65B9\u5168\u662F\u6709\u7406\u6570\uFF0C\u4EA4\u53C9\u76F8\u4E58\u7CBE\u786E\u6BD4\u8F83", textEn: "Minimize \u03BC\xB2 = max |\u27E8z_i,z_j\u27E9|\xB2/(|z_i|\xB2|z_j|\xB2); moduli and norms squared are rational, compared exactly by cross-multiplication" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F ceil(\u03BC\xB2\xB710\xB9\u2078)\uFF1B\u9875\u9762\u663E\u793A \u03BC\uFF0C\u5411\u4E0A\u53D6\u6574\u5230\u7B2C 9 \u4F4D\u5C0F\u6570", textEn: "The record is ceil(\u03BC\xB2\xB710\xB9\u2078); the page shows \u03BC, rounded up at the ninth decimal" }
  ],
  intuition: [
    {
      title: "\u5B83\u7528\u5728\u54EA\u91CC",
      titleEn: "Where it is used",
      text: "\u590D\u5C04\u5F71\u7801\u672C\u76F4\u63A5\u5BF9\u5E94\u91CF\u5B50\u6D4B\u91CF\uFF08SIC-POVM \u4E00\u65CF\uFF09\u3001\u901A\u4FE1\u7801\u672C\u4E0E\u6297\u566A\u6570\u636E\u8868\u793A\u3002\u5206\u5F97\u8D8A\u5F00\u7684\u7801\u5B57\uFF0C\u8D8A\u80FD\u5728\u566A\u58F0\u548C\u4E22\u5931\u4E0B\u533A\u5206\u3002",
      textEn: "Complex projective codebooks are quantum measurements (the SIC-POVM family), communication codebooks, and noise-robust data representations. The further apart the codewords, the better they survive noise and erasures."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "Game of Sloanes \u662F\u4E00\u5F20\u516C\u5F00\u7684\u300C\u63A8\u6D4B\u6700\u4F18\u300D\u6392\u884C\u699C\uFF0C\u660E\u786E\u9080\u8BF7\u4EFB\u4F55\u4EBA\u6539\u8FDB\u8868\u4E2D\u7684\u6253\u5305\u3002\u8FD9\u91CC\u7684\u6BCF\u4E2A\u5B50\u9898\u90FD\u9009\u81EA\u5B83\u4ECD\u7136\u5F00\u653E\u7684\u884C\uFF1A\u6700\u597D\u5DF2\u77E5\u503C\u4E0E\u4E0B\u754C\u4E4B\u95F4\u6709\u771F\u5B9E\u7684\u7F1D\u9699\u3002",
      textEn: "The Game of Sloanes is a public leader board of putatively optimal packings that explicitly invites improvement. Every sub-problem here is chosen from its still-open rows \u2014 the ones with a real gap between the best known value and the lower bound.",
      url: "https://github.com/gnikylime/GameofSloanes"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u975E\u96F6\u590D\u5411\u91CF\uFF0C\u6BCF\u4E2A d \u4E2A [re, im] \u5BF9", "\u6240\u6709\u5206\u91CF\u5728 [-1, 1] \u5185", "\u5206\u6570\u662F ceil(\u03BC\xB2\xB710\xB9\u2078)\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
  requirementsEn: ["Exactly n nonzero complex vectors with d pairs [re, im] each", "All components lie in [-1, 1]", "The score is ceil(\u03BC\xB2\xB710\xB9\u2078); smaller is better"],
  frontier: true,
  instances: instances18
};
function readComplexVectors(value, n, d) {
  const raw2 = asArray(value, "vectors");
  if (raw2.length !== n) refuse(`vectors \u9700\u8981\u6070\u597D ${n} \u884C`, `vectors needs exactly ${n} rows`);
  return raw2.map((entry, i) => {
    const row = asArray(entry, `vectors[${i}]`);
    if (row.length !== d) refuse(`vectors[${i}] \u9700\u8981\u6070\u597D ${d} \u4E2A\u5206\u91CF`, `vectors[${i}] needs exactly ${d} components`);
    const re = [], im = [];
    row.forEach((cell, j) => {
      const pair = asArray(cell, `vectors[${i}][${j}]`);
      if (pair.length !== 2) refuse(`vectors[${i}][${j}] \u5FC5\u987B\u662F [re, im] \u5BF9`, `vectors[${i}][${j}] must be a pair [re, im]`);
      const a = parseFixed(pair[0], `vectors[${i}][${j}][0]`), b = parseFixed(pair[1], `vectors[${i}][${j}][1]`);
      if (Math.abs(a) > SCALE || Math.abs(b) > SCALE)
        refuse(`vectors[${i}][${j}] \u8D85\u51FA [-1, 1]`, `vectors[${i}][${j}] is outside [-1, 1]`);
      re.push(a);
      im.push(b);
    });
    return { re, im };
  });
}
function worstHermitianAlignment(vectors) {
  const norms = vectors.map((vector) => {
    let norm = 0n;
    for (let r = 0; r < vector.re.length; r += 1) norm += big3(vector.re[r]) * big3(vector.re[r]) + big3(vector.im[r]) * big3(vector.im[r]);
    return norm;
  });
  let worst = { p: 0n, q: 1n };
  let pair = [0, 1];
  for (let i = 0; i < vectors.length; i += 1) for (let j = i + 1; j < vectors.length; j += 1) {
    let realPart = 0n, imagPart = 0n;
    for (let r = 0; r < vectors[i].re.length; r += 1) {
      const a = big3(vectors[i].re[r]), b = big3(vectors[i].im[r]);
      const c = big3(vectors[j].re[r]), e = big3(vectors[j].im[r]);
      realPart += a * c + b * e;
      imagPart += a * e - b * c;
    }
    const candidate = { p: realPart * realPart + imagPart * imagPart, q: norms[i] * norms[j] };
    if (ratioLess(worst, candidate)) {
      worst = candidate;
      pair = [i, j];
    }
  }
  return { ratio: worst, pair };
}
function verifyComplexPacking(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 2 || n > MAX_N15 || d < 2 || d > MAX_D3) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const vectors = readComplexVectors(answer.vectors, n, d);
  for (let i = 0; i < n; i += 1)
    if (vectors[i].re.every((value) => value === 0) && vectors[i].im.every((value) => value === 0))
      return fail("DEGENERATE", `\u5411\u91CF ${i + 1} \u662F\u96F6\u5411\u91CF`, `vector ${i + 1} is zero`);
  const { ratio, pair } = worstHermitianAlignment(vectors);
  const score = coherenceScore(ratio);
  const result2 = ok(score, coherenceDisplay(score));
  return {
    ...result2,
    message: `${result2.message} \u6700\u63A5\u8FD1\u7684\u4E00\u5BF9\u662F ${pair[0] + 1} \u4E0E ${pair[1] + 1}\u3002`,
    messageEn: `${result2.messageEn} The closest pair is ${pair[0] + 1} and ${pair[1] + 1}.`
  };
}
var problem23 = { definition: definition23, verify: verifyComplexPacking };

// src/problems/p62-worst-projection.ts
var MAX_N16 = 64;
var MAX_D4 = 12;
var RANGES3 = {
  4: [16, 24, 32],
  6: [16, 24, 32],
  8: [16, 24, 32]
};
function centreBaseline(n, d) {
  return { points: Array.from({ length: n }, () => Array.from({ length: d }, () => "0.5")) };
}
var instances19 = Object.entries(RANGES3).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p62-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: centreBaseline(n, Number(dims))
})));
var definition24 = {
  id: "p62",
  instanceId: "p62-d4-n16-v1",
  code: "P62",
  slug: "worst-projection",
  category: "extremal",
  title: "\u6700\u574F\u4E8C\u7EF4\u6295\u5F71\u4E0B\u7684\u5747\u5300\u91C7\u6837",
  summary: "\u5728 d \u7EF4\u8D85\u7ACB\u65B9\u4F53\u91CC\u653E n \u4E2A\u70B9\uFF0C\u8BA9\u6240\u6709\u4E8C\u7EF4\u5750\u6807\u6295\u5F71\u91CC\u6700\u4E0D\u5747\u5300\u7684\u90A3\u4E2A\u5C3D\u53EF\u80FD\u5747\u5300\u3002",
  objective: "minimize",
  scoreLabel: "\u6700\u574F\u6295\u5F71\u7684 L2 \u661F\u504F\u5DEE",
  scoreLabelEn: "the worst projection's L2-star discrepancy",
  instanceName: "d = 4, n = 16",
  instanceNameEn: "d = 4, n = 16",
  parameters: { n: 16, d: 4 },
  baselineAnswer: centreBaseline(16, 4),
  answerHelp: "\u63D0\u4EA4 points\uFF1A\u6070\u597D n \u884C\uFF0C\u6BCF\u884C d \u4E2A [0, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u5750\u6807\u3002",
  answerHelpEn: "Submit points: exactly n rows of d decimal-string coordinates in [0, 1].",
  titleEn: "Uniformity under the worst 2D projection",
  summaryEn: "Place n points in the d-dimensional hypercube so that the least uniform of all two-coordinate projections is as uniform as possible.",
  extent: SCALE,
  frame: "\u5BB9\u5668\u662F d \u7EF4\u5355\u4F4D\u8D85\u7ACB\u65B9\u4F53 [0,1]^d\u3002\u6BCF\u4E2A\u70B9\u662F d \u4E2A\u5750\u6807\uFF0C\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002",
  frameEn: "The container is the d-dimensional unit hypercube [0,1]^d. Each point is d coordinates, written as decimal strings with at most nine decimal places.",
  definition: "\u5728 [0,1]^d \u4E2D\u653E\u7F6E n \u4E2A\u70B9\u3002\u5BF9\u6BCF\u4E00\u5BF9\u5750\u6807 (r, s)\uFF0C\u4FDD\u7559\u8FD9\u4E24\u4E2A\u5750\u6807\u5F97\u5230\u5E73\u9762\u4E0A\u7684\u6295\u5F71\u70B9\u96C6\uFF0C\u7528 P59 \u7684\u7CBE\u786E\u516C\u5F0F\u7B97\u5B83\u7684 L2 \u661F\u504F\u5DEE\uFF1B\u5168\u90E8 C(d,2) \u4E2A\u6295\u5F71\u91CC\u6700\u5927\u7684\u90A3\u4E2A\u5C31\u662F\u5206\u6570\u3002\u8BA9\u5B83\u5C3D\u53EF\u80FD\u5C0F\u3002",
  definitionEn: "Place n points in [0,1]^d. For every pair of coordinates (r, s), keep just those two coordinates to get a planar projection and score it with P59's exact L2-star formula; the score is the largest over all C(d,2) projections. Make it as small as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u5355\u4F4D\u8D85\u7ACB\u65B9\u4F53 [0,1]^d", textEn: "The d-dimensional unit hypercube [0,1]^d" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\uFF0C\u6BCF\u4E2A d \u4E2A\u5341\u8FDB\u5236\u5750\u6807\uFF1B\u5141\u8BB8\u91CD\u5408", textEn: "Exactly n points, each d decimal coordinates; coincidences are allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5C0F\u5316\u6240\u6709\u4E8C\u7EF4\u5750\u6807\u6295\u5F71\u7684 L2 \u661F\u504F\u5DEE\u7684\u6700\u5927\u503C\uFF1BC(d,2) \u4E2A\u6295\u5F71\u5171\u7528\u540C\u4E00\u4E2A\u5206\u6BCD\uFF0C\u6700\u5927\u503C\u5728\u6574\u6570\u5206\u5B50\u4E0A\u7CBE\u786E\u53D6\u5F97", textEn: "Minimize the maximum L2-star discrepancy over all two-coordinate projections; the C(d,2) projections share one denominator, so the maximum is taken exactly on integer numerators" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F\u6700\u574F\u6295\u5F71\u6E05\u5206\u6BCD\u540E\u7684\u7CBE\u786E\u6574\u6570\uFF1B\u9875\u9762\u663E\u793A\u8BE5\u6295\u5F71\u7684\u504F\u5DEE\uFF0C\u5411\u4E0A\u53D6\u6574\u5230\u7B2C 12 \u4F4D\u5C0F\u6570", textEn: "The record is the worst projection's exact integer with the denominator cleared; the page shows that projection's discrepancy, rounded up at the twelfth decimal" }
  ],
  intuition: [
    {
      title: "\u4E3A\u4EC0\u4E48\u76EF\u7740\u6295\u5F71",
      titleEn: "Why stare at projections",
      text: "\u9AD8\u7EF4\u7684\u6574\u4F53\u6307\u6807\u518D\u597D\uFF0C\u4E5F\u6321\u4E0D\u4F4F\u67D0\u4E24\u5217\u5408\u8D77\u6765\u770B\u6761\u7EB9\u5BC6\u5E03\u3002\u8BA1\u7B97\u673A\u5B9E\u9A8C\u3001\u6E32\u67D3\u548C QMC \u5E38\u7531\u4F4E\u9636\u4EA4\u4E92\u4E3B\u5BFC\uFF0C\u6700\u574F\u7684\u4E8C\u7EF4\u6295\u5F71\u5C31\u662F\u8BBE\u8BA1\u91CC\u6700\u5148\u574F\u6389\u7684\u90A3\u9762\u955C\u5B50\u3002",
      textEn: "A fine full-dimensional score cannot stop two particular columns from striping when seen together. Computer experiments, rendering and QMC are dominated by low-order interactions, and the worst 2D projection is the first mirror to crack."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u6295\u5F71\u5747\u5300\u6027\u662F\u5B9E\u9A8C\u8BBE\u8BA1\u7684\u6D3B\u8DC3\u65B9\u5411\uFF0C\u4F46\u5BF9\u56FA\u5B9A (n, d) \u7684\u8FDE\u7EED\u6700\u574F\u6295\u5F71\u76EE\u6807\u6CA1\u6709\u5DF2\u53D1\u8868\u7684\u6700\u4F18\u8868\u3002\u6BCF\u4E2A\u5B50\u9898\u90FD\u5F00\u653E\u3002",
      textEn: "Projection uniformity is an active direction in experimental design, but the continuous worst-projection objective has no published table of optima for fixed (n, d). Every sub-problem is open.",
      url: "https://arxiv.org/abs/2605.19900"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807", "\u5750\u6807\u5728 [0, 1] \u5185", "\u5206\u6570\u662F\u6700\u574F\u6295\u5F71\u7684\u7CBE\u786E\u6574\u6570\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
  requirementsEn: ["Exactly n points, each with d coordinates", "Coordinates lie in [0, 1]", "The score is the worst projection's exact integer; smaller is better"],
  frontier: true,
  instances: instances19
};
function verifyWorstProjection(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 1 || n > MAX_N16 || d < 3 || d > MAX_D4) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const points = readMatrix(answer.points, "points", n, d, 0, SCALE);
  let worst = -1n;
  let pair = [0, 1];
  for (let r = 0; r < d; r += 1) for (let s = r + 1; s < d; s += 1) {
    const projected = points.map((point) => [point[r], point[s]]);
    const numerator = l2StarNumerator(projected, n, 2);
    if (numerator > worst) {
      worst = numerator;
      pair = [r, s];
    }
  }
  const result2 = ok(worst, l2StarDisplay(worst, l2StarDenominator(n, 2)));
  return {
    ...result2,
    message: `${result2.message} \u6700\u574F\u7684\u6295\u5F71\u662F\u5750\u6807 ${pair[0] + 1} \u4E0E ${pair[1] + 1}\u3002`,
    messageEn: `${result2.messageEn} The worst projection is onto coordinates ${pair[0] + 1} and ${pair[1] + 1}.`
  };
}
var problem24 = { definition: definition24, verify: verifyWorstProjection };

// src/problems/p63-torus-quadrature.ts
var MAX_N17 = 64;
var MAX_D5 = 6;
var RANGES4 = {
  2: [8, 13, 16, 21, 27, 34],
  3: [8, 12, 16, 21, 27, 32]
};
function axisBaseline(n, d) {
  return { points: Array.from({ length: n }, (_, i) => [
    printFixed(Math.floor(i * SCALE / n)),
    ...Array.from({ length: d - 1 }, () => "0")
  ]) };
}
var instances20 = Object.entries(RANGES4).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p63-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: axisBaseline(n, Number(dims))
})));
var definition25 = {
  id: "p63",
  instanceId: "p63-d2-n13-v1",
  code: "P63",
  slug: "torus-quadrature",
  category: "extremal",
  title: "\u73AF\u9762\u4E0A\u7684\u6700\u4F18\u79EF\u5206\u70B9\u96C6",
  summary: "\u5728 d \u7EF4\u73AF\u9762\u4E0A\u653E n \u4E2A\u7B49\u6743\u91C7\u6837\u70B9\uFF0C\u8BA9\u4E00\u7C7B\u5468\u671F\u51FD\u6570\u7684\u6700\u574F\u79EF\u5206\u8BEF\u5DEE\u5C3D\u53EF\u80FD\u5C0F\u3002",
  objective: "minimize",
  scoreLabel: "\u6700\u574F\u79EF\u5206\u8BEF\u5DEE",
  scoreLabelEn: "the worst-case integration error",
  instanceName: "d = 2, n = 13",
  instanceNameEn: "d = 2, n = 13",
  parameters: { n: 13, d: 2 },
  baselineAnswer: axisBaseline(13, 2),
  answerHelp: "\u63D0\u4EA4 points\uFF1A\u6070\u597D n \u884C\uFF0C\u6BCF\u884C d \u4E2A [0, 1) \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u5750\u6807\u3002\u5750\u6807\u6309\u6A21 1 \u7406\u89E3\uFF0C1 \u5199\u6210 0\u3002",
  answerHelpEn: "Submit points: exactly n rows of d decimal-string coordinates in [0, 1). Coordinates are read modulo 1; write 1 as 0.",
  titleEn: "Optimal quadrature points on the torus",
  summaryEn: "Place n equal-weight sample points on the d-dimensional torus, minimizing the worst-case integration error over a class of periodic functions.",
  extent: SCALE,
  frame: "\u5BB9\u5668\u662F d \u7EF4\u73AF\u9762\uFF1A\u6BCF\u4E2A\u5750\u6807\u5728 [0, 1) \u5185\u4E14\u6309\u6A21 1 \u7406\u89E3\uFF0C\u5BF9\u8FB9\u7C98\u5408\u3002\u5750\u6807\u5199\u6210\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002",
  frameEn: "The container is the d-dimensional torus: every coordinate lives in [0, 1) modulo 1, opposite faces glued. Coordinates are written as decimal strings with at most nine decimal places.",
  definition: "\u5728\u73AF\u9762 T^d \u4E0A\u653E\u7F6E n \u4E2A\u7B49\u6743\u79EF\u5206\u70B9\u3002\u56FA\u5B9A\u6838 K(x,y) = \u03A0 (1 + 6\xB7B\u2082({x\u1D63 \u2212 y\u1D63}))\uFF0C\u5176\u4E2D B\u2082(t) = t\xB2 \u2212 t + 1/6\uFF1B\u5206\u6570\u662F\u7B49\u6743\u6C42\u79EF\u89C4\u5219\u7684\u5E73\u65B9\u6700\u574F\u8BEF\u5DEE E = (1/n\xB2)\u03A3\u1D62\u2C7CK(x\u1D62,x\u2C7C) \u2212 1\u3002\u8BA9\u5B83\u5C3D\u53EF\u80FD\u5C0F\u3002",
  definitionEn: "Place n equal-weight quadrature points on the torus T^d. Fix the kernel K(x,y) = \u03A0 (1 + 6\xB7B\u2082({x_r \u2212 y_r})) with B\u2082(t) = t\xB2 \u2212 t + 1/6; the score is the squared worst-case error of the equal-weight rule, E = (1/n\xB2)\u03A3 K(x_i,x_j) \u2212 1. Make it as small as possible.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u73AF\u9762\uFF1A\u5750\u6807\u6A21 1\uFF0C\u5199\u5728 [0, 1) \u5185", textEn: "The d-dimensional torus: coordinates modulo 1, written in [0, 1)" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u70B9\uFF0C\u6BCF\u4E2A d \u4E2A\u5341\u8FDB\u5236\u5750\u6807\uFF1B\u5141\u8BB8\u91CD\u5408", textEn: "Exactly n points, each d decimal coordinates; coincidences are allowed" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5C0F\u5316\u7B49\u6743\u6C42\u79EF\u89C4\u5219\u7684\u5E73\u65B9\u6700\u574F\u8BEF\u5DEE E = (1/n\xB2)\u03A3\u1D62\u2C7CK(x\u1D62,x\u2C7C) \u2212 1\uFF1B\u6838\u79EF\u5206\u4E3A 1\uFF0C\u6240\u4EE5 E \u975E\u8D1F", textEn: "Minimize the squared worst-case error of the equal-weight rule, E = (1/n\xB2)\u03A3 K(x_i,x_j) \u2212 1; the kernel integrates to one, so E is non-negative" },
    { label: "\u6838", labelEn: "Kernel", text: "K = \u03A0(1 + 6\xB7B\u2082({x\u1D63\u2212y\u1D63}))\uFF0C\u03BB = 6 \u662F\u672C\u7AD9\u56FA\u5B9A\u7684\u6838\u7248\u672C\uFF0C\u6C38\u4E0D\u66F4\u6539\uFF1B\u5B83\u4E0E\u6587\u732E\u7684 periodic L2 discrepancy\uFF08\u03BB = 3\uFF09\u548C diaphony\uFF08\u03BB = 2\u03C0\xB2\uFF09\u540C\u65CF\u4E0D\u540C\u53C2", textEn: "K = \u03A0(1 + 6\xB7B\u2082({x_r\u2212y_r})); \u03BB = 6 is this site's fixed kernel version, never to change \u2014 same family as the literature's periodic L2 discrepancy (\u03BB = 3) and diaphony (\u03BB = 2\u03C0\xB2), deliberately its own parameter" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F\u6E05\u5206\u6BCD\u540E\u7684\u7CBE\u786E\u6574\u6570 n\xB2S^{2d}\xB7E\uFF1B\u9875\u9762\u663E\u793A\u8BEF\u5DEE \u221AE\uFF0C\u5411\u4E0A\u53D6\u6574\u5230\u7B2C 12 \u4F4D\u5C0F\u6570", textEn: "The record is the exact integer n\xB2S^{2d}\xB7E with the denominator cleared; the page shows the error \u221AE, rounded up at the twelfth decimal" }
  ],
  intuition: [
    {
      title: "\u5B83\u5728\u4F18\u5316\u4EC0\u4E48",
      titleEn: "What it optimizes",
      text: "\u5468\u671F\u51FD\u6570\u7684\u6570\u503C\u79EF\u5206\u91CC\uFF0C\u70B9\u96C6\u7684\u597D\u574F\u7531\u6700\u96BE\u79EF\u7684\u90A3\u4E2A\u51FD\u6570\u51B3\u5B9A\u3002\u5F20\u91CF\u79EF\u7684 B\u2082 \u6838\u5BF9\u6BCF\u4E2A\u5750\u6807\u65B9\u5411\u7684\u7A7A\u6D1E\u548C\u89C4\u5F8B\u6027\u90FD\u654F\u611F\uFF1A\u67D0\u4E00\u7EF4\u584C\u6210\u4E00\u56E2\uFF0C\u6574\u4E2A\u5206\u6570\u7ACB\u523B\u53D8\u5DEE\u3002",
      textEn: "In numerical integration of periodic functions, a point set is only as good as the hardest function it faces. The tensor-product B\u2082 kernel is sensitive to holes and regularity in every coordinate direction: let one dimension clump, and the score decays at once."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "\u540C\u65CF\u76EE\u6807\u7684\u5168\u5C40\u6700\u4F18\u81F3\u4ECA\u53EA\u5728\u6781\u5C0F\u7684 n \u4E0A\u88AB\u8BC1\u660E\uFF1AFibonacci \u683C\u7684\u6700\u4F18\u6027 2025 \u5E74\u624D\u5BF9\u5C11\u6570 n \u5EFA\u7ACB\uFF0C\u73AF\u9762\u5F20\u91CF\u79EF\u80FD\u91CF\u7684\u6781\u5C0F\u6784\u5F62\u4ECD\u662F\u6D3B\u8DC3\u7814\u7A76\u3002\u672C\u7AD9\u7684 \u03BB = 6 \u7248\u672C\u6CA1\u6709\u4EFB\u4F55\u5DF2\u53D1\u8868\u7684\u9010\u5B9E\u4F8B\u6700\u4F18\u503C\uFF0C\u5168\u90E8\u5F00\u653E\u3002",
      textEn: "Global optimality in this family has been proven only at tiny n: Fibonacci lattices were settled for a handful of n as recently as 2025, and minimizing tensor-product energies on the torus is active research. The site's \u03BB = 6 version has no published per-instance optima at all; everything is open.",
      url: "https://arxiv.org/abs/2502.17082"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u70B9\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807", "\u5750\u6807\u5728 [0, 1) \u5185\uFF0C\u6309\u6A21 1 \u7406\u89E3", "\u5206\u6570\u662F\u7CBE\u786E\u6574\u6570\uFF0C\u8D8A\u5C0F\u8D8A\u597D"],
  requirementsEn: ["Exactly n points, each with d coordinates", "Coordinates lie in [0, 1), read modulo 1", "The score is an exact integer; smaller is better"],
  frontier: true,
  instances: instances20
};
function factor(t) {
  const value = big3(t);
  return 2n * S * S - 6n * value * S + 6n * value * value;
}
function torusEnergyNumerator(points, n, d) {
  let sum = 0n;
  for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) {
    let product = 1n;
    for (let r = 0; r < d; r += 1) product *= factor(Math.abs(points[i][r] - points[j][r]));
    sum += product;
  }
  return sum - big3(n) * big3(n) * S ** big3(2 * d);
}
function verifyTorusQuadrature(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 1 || n > MAX_N17 || d < 1 || d > MAX_D5) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const points = readMatrix(answer.points, "points", n, d, 0, SCALE - 1);
  const score = torusEnergyNumerator(points, n, d);
  const display = printScaled(integerSqrtCeil(ceilDiv3(score * 10n ** 24n, big3(n) * big3(n) * S ** big3(2 * d))), 12);
  return ok(score, display);
}
var problem25 = { definition: definition25, verify: verifyTorusQuadrature };

// src/problems/p64-subspace-packing.ts
var K = 2;
var MAX_N18 = 24;
var MAX_D6 = 8;
var RANGES5 = {
  4: [9, 19, 20],
  5: [12, 13, 14, 15, 18, 19, 20],
  6: [15, 16, 17, 18, 19, 20]
};
function pinnedBaseline(n, d) {
  const fine = (value) => (Math.round(value * SCALE) / SCALE).toFixed(9);
  return { subspaces: Array.from({ length: n }, (_, i) => {
    const first = Array.from({ length: d }, (_2, r) => r === 0 ? "1" : "0");
    const angle = (i + 1) / (n + 1);
    const second = Array.from({ length: d }, (_2, r) => r === 1 ? fine(1 - angle) : r === 2 ? fine(angle) : "0");
    return [first, second];
  }) };
}
var instances21 = Object.entries(RANGES5).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p64-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims), k: K },
  baselineAnswer: pinnedBaseline(n, Number(dims))
})));
var definition26 = {
  id: "p64",
  instanceId: "p64-d5-n12-v1",
  code: "P64",
  slug: "subspace-packing",
  category: "extremal",
  title: "\u6700\u5206\u79BB\u7684\u5B50\u7A7A\u95F4\u65CF",
  summary: "\u5728 d \u7EF4\u7A7A\u95F4\u91CC\u9009 n \u4E2A\u4E8C\u7EF4\u5B50\u7A7A\u95F4\uFF08\u5E73\u9762\uFF09\uFF0C\u8BA9\u6700\u63A5\u8FD1\u7684\u4E00\u5BF9\u5C3D\u53EF\u80FD\u8FDC\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u5C0F\u5F26\u8DDD\u5E73\u65B9",
  scoreLabelEn: "the smallest squared chordal distance",
  instanceName: "d = 5, n = 12",
  instanceNameEn: "d = 5, n = 12",
  parameters: { n: 12, d: 5, k: K },
  baselineAnswer: pinnedBaseline(12, 5),
  answerHelp: "\u63D0\u4EA4 subspaces\uFF1A\u6070\u597D n \u4E2A\u5B50\u7A7A\u95F4\uFF0C\u6BCF\u4E2A\u662F 2 \u4E2A\u957F\u5EA6\u4E3A d \u7684\u57FA\u5411\u91CF\uFF08\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C[-1, 1]\uFF09\u3002\u57FA\u7684\u9009\u62E9\u4E0D\u5F71\u54CD\u5206\u6570\uFF1A\u540C\u4E00\u4E2A\u5E73\u9762\u7684\u4EFB\u4F55\u57FA\u5F97\u540C\u4E00\u4E2A\u5206\u3002",
  answerHelpEn: "Submit subspaces: exactly n subspaces, each 2 basis vectors of length d (decimal strings in [-1, 1]). The basis does not matter: any basis of the same plane scores the same.",
  titleEn: "The most separated family of subspaces",
  summaryEn: "Choose n two-dimensional subspaces (planes) of R^d so that the closest pair is as far apart as possible.",
  extent: SCALE,
  frame: "\u6BCF\u4E2A\u5B50\u7A7A\u95F4\u7531 2 \u4E2A\u7EBF\u6027\u65E0\u5173\u7684\u57FA\u5411\u91CF\u7ED9\u51FA\uFF0C\u5750\u6807\u5199\u6210 [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002\u5F20\u6210\u540C\u4E00\u5E73\u9762\u7684\u4EFB\u4F55\u57FA\u4EE3\u8868\u540C\u4E00\u4E2A\u7B54\u6848\u3002",
  frameEn: "Each subspace is given by 2 linearly independent basis vectors, coordinates written as decimal strings in [-1, 1] with at most nine decimal places. Any basis spanning the same plane represents the same answer.",
  definition: "\u5728 R^d \u4E2D\u9009\u62E9 n \u4E2A\u4E8C\u7EF4\u5B50\u7A7A\u95F4\u3002\u4E24\u4E2A\u5E73\u9762\u7684\u5F26\u8DDD\u5E73\u65B9\u662F\u5B83\u4EEC\u4E3B\u89D2\u6B63\u5F26\u7684\u5E73\u65B9\u548C\uFF0C\u7B49\u4EF7\u5730 2 \u2212 tr(P\u1D62P\u2C7C)\uFF0C\u5176\u4E2D P \u662F\u6B63\u4EA4\u6295\u5F71\u77E9\u9635\u3002\u6700\u5927\u5316\u6240\u6709\u5E73\u9762\u5BF9\u4E2D\u6700\u5C0F\u7684\u5F26\u8DDD\u5E73\u65B9\u3002",
  definitionEn: "Choose n two-dimensional subspaces of R^d. The squared chordal distance of two planes is the sum of the squared sines of their principal angles \u2014 equivalently 2 \u2212 tr(P_iP_j) with P the orthogonal projectors. Maximize the smallest squared chordal distance over all pairs.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u5B9E\u7A7A\u95F4 R^d\uFF1B\u7B54\u6848\u662F Grassmann \u6D41\u5F62 G(d, 2) \u4E2D\u7684 n \u4E2A\u70B9\uFF0C\u5373 n \u4E2A\u8FC7\u539F\u70B9\u7684\u5E73\u9762", textEn: "Real d-space R^d; an answer is n points of the Grassmannian G(d, 2) \u2014 n planes through the origin" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u5B50\u7A7A\u95F4\uFF0C\u6BCF\u4E2A 2 \u4E2A\u57FA\u5411\u91CF\uFF1B\u57FA\u5411\u91CF\u5FC5\u987B\u7EBF\u6027\u65E0\u5173", textEn: "Exactly n subspaces, each 2 basis vectors; the basis vectors must be linearly independent" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5927\u5316 min 2 \u2212 tr(P\u1D62P\u2C7C)\uFF1B\u6295\u5F71\u77E9\u9635\u7ECF 2\xD72 \u4F34\u968F\u77E9\u9635\u7CBE\u786E\u6784\u9020\uFF0C\u5168\u7A0B\u6709\u7406\u6570", textEn: "Maximize min 2 \u2212 tr(P_iP_j); projectors are built exactly through the 2\xD72 adjugate, rational throughout" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F floor(\u6700\u5C0F\u5F26\u8DDD\u5E73\u65B9 \xB7 10\xB9\u2078)\uFF0C\u5411\u4E0D\u5229\u4E8E\u63D0\u4EA4\u8005\u7684\u65B9\u5411\u53D6\u6574\uFF1B\u9875\u9762\u663E\u793A\u5F26\u8DDD\u5E73\u65B9\uFF0C\u5411\u4E0B\u53D6\u6574\u5230\u7B2C 9 \u4F4D\u5C0F\u6570", textEn: "The record is floor(min squared chordal distance \xB7 10\xB9\u2078), rounded against the submitter; the page shows the squared distance, rounded down at the ninth decimal" }
  ],
  intuition: [
    {
      title: "\u5B83\u7528\u5728\u54EA\u91CC",
      titleEn: "Where it is used",
      text: "Fusion frame \u628A\u4FE1\u53F7\u6295\u5F71\u5230\u591A\u4E2A\u4F4E\u7EF4\u5B50\u7A7A\u95F4\u3002\u5E73\u9762\u5F7C\u6B64\u5206\u5F97\u8D8A\u5F00\uFF0C\u5BF9\u566A\u58F0\u548C\u5176\u4E2D\u4E00\u4E2A\u6D4B\u91CF\u7684\u4E22\u5931\u8D8A\u9C81\u68D2\uFF0C\u7528\u4E8E\u5206\u5E03\u5F0F\u4F20\u611F\u3001\u5E76\u884C\u5904\u7406\u4E0E MIMO \u901A\u4FE1\u3002",
      textEn: "A fusion frame projects a signal onto several low-dimensional subspaces. The further apart the planes, the more robust the system is to noise and to losing one of the measurements \u2014 distributed sensing, parallel processing, MIMO communication."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "Sloane \u7684 Grassmannian \u6253\u5305\u8868\u6309\u5F26\u8DDD\u7EF4\u62A4\u8FD9\u4E9B\u53C2\u6570\u7684\u6700\u597D\u5DF2\u77E5\u503C\uFF0C\u591A\u6570\u53EA\u662F\u5927\u89C4\u6A21\u641C\u7D22\u7684\u4EA7\u7269\uFF1B\u672C\u7AD9\u7684\u5B50\u9898\u7279\u610F\u907F\u5F00\u4E86\u8868\u4E2D\u6070\u4E3A\u6709\u7406\u6570\u7684\u521A\u6027\u5E73\u53F0\u6BB5\uFF0C\u9009\u5728\u771F\u6B63\u7684\u641C\u7D22\u524D\u6CBF\u4E0A\u3002",
      textEn: "Sloane's Grassmannian packing tables maintain the best known chordal values for these parameters, most of them products of large searches; the sub-problems here deliberately skip the table's exactly-rational rigid plateaus and sit on the genuine search frontier.",
      url: "http://neilsloane.com/grass/"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u5B50\u7A7A\u95F4\uFF0C\u6BCF\u4E2A 2 \u4E2A\u957F\u5EA6 d \u7684\u57FA\u5411\u91CF", "\u5750\u6807\u5728 [-1, 1] \u5185\uFF1B\u4E24\u4E2A\u57FA\u5411\u91CF\u7EBF\u6027\u65E0\u5173", "\u5206\u6570\u662F floor(\u6700\u5C0F\u5F26\u8DDD\u5E73\u65B9 \xB7 10\xB9\u2078)\uFF0C\u8D8A\u5927\u8D8A\u597D"],
  requirementsEn: ["Exactly n subspaces, each 2 basis vectors of length d", "Coordinates in [-1, 1]; the two basis vectors linearly independent", "The score is floor(min squared chordal distance \xB7 10\xB9\u2078); larger is better"],
  frontier: true,
  instances: instances21
};
function readPlanes(value, n, d) {
  const raw2 = asArray(value, "subspaces");
  if (raw2.length !== n) refuse(`subspaces \u9700\u8981\u6070\u597D ${n} \u4E2A\u5B50\u7A7A\u95F4`, `subspaces needs exactly ${n} subspaces`);
  const planes = [];
  for (let i = 0; i < n; i += 1) {
    const pair = asArray(raw2[i], `subspaces[${i}]`);
    if (pair.length !== K) refuse(`subspaces[${i}] \u9700\u8981\u6070\u597D ${K} \u4E2A\u57FA\u5411\u91CF`, `subspaces[${i}] needs exactly ${K} basis vectors`);
    const basis = pair.map((entry, v) => {
      const row = asArray(entry, `subspaces[${i}][${v}]`);
      if (row.length !== d) refuse(`subspaces[${i}][${v}] \u9700\u8981 ${d} \u4E2A\u5750\u6807`, `subspaces[${i}][${v}] needs ${d} coordinates`);
      return row.map((cell, j) => {
        const units = parseFixed(cell, `subspaces[${i}][${v}][${j}]`);
        if (Math.abs(units) > SCALE) refuse(`subspaces[${i}][${v}][${j}] \u8D85\u51FA [-1, 1]`, `subspaces[${i}][${v}][${j}] is outside [-1, 1]`);
        return big3(units);
      });
    });
    let g11 = 0n, g12 = 0n, g22 = 0n;
    for (let r = 0; r < d; r += 1) {
      g11 += basis[0][r] * basis[0][r];
      g12 += basis[0][r] * basis[1][r];
      g22 += basis[1][r] * basis[1][r];
    }
    const det = g11 * g22 - g12 * g12;
    if (det === 0n)
      return fail("DEGENERATE", `\u5B50\u7A7A\u95F4 ${i + 1} \u7684\u57FA\u5411\u91CF\u7EBF\u6027\u76F8\u5173\uFF0C\u5F20\u4E0D\u6210\u5E73\u9762`, `subspace ${i + 1}'s basis vectors are linearly dependent and span no plane`);
    planes.push({ basis, gram: [g11, g12, g22], det });
  }
  return planes;
}
function smallestChordal(planes) {
  let best = null;
  let pair = [0, 1];
  for (let i = 0; i < planes.length; i += 1) for (let j = i + 1; j < planes.length; j += 1) {
    const a = planes[i], b = planes[j];
    const d = a.basis[0].length;
    let m11 = 0n, m12 = 0n, m21 = 0n, m22 = 0n;
    for (let r = 0; r < d; r += 1) {
      m11 += a.basis[0][r] * b.basis[0][r];
      m12 += a.basis[0][r] * b.basis[1][r];
      m21 += a.basis[1][r] * b.basis[0][r];
      m22 += a.basis[1][r] * b.basis[1][r];
    }
    const [ag11, ag12, ag22] = a.gram, [bg11, bg12, bg22] = b.gram;
    const t11 = ag22 * m11 - ag12 * m21, t12 = ag22 * m12 - ag12 * m22;
    const t21 = -ag12 * m11 + ag11 * m21, t22 = -ag12 * m12 + ag11 * m22;
    const u11 = t11 * bg22 - t12 * bg12, u12 = -t11 * bg12 + t12 * bg11;
    const u21 = t21 * bg22 - t22 * bg12, u22 = -t21 * bg12 + t22 * bg11;
    const traceNumerator = u11 * m11 + u12 * m12 + u21 * m21 + u22 * m22;
    const denominator = a.det * b.det;
    const candidate = { p: 2n * denominator - traceNumerator, q: denominator };
    if (best === null || ratioLess(candidate, best)) {
      best = candidate;
      pair = [i, j];
    }
  }
  return { ratio: best ?? { p: 2n, q: 1n }, pair };
}
function verifySubspacePacking(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (asInt(params.k ?? K, "k") !== K) refuse("\u672C\u9A8C\u8BC1\u5668\u53EA\u652F\u6301 k = 2", "this verifier supports only k = 2");
  if (n < 2 || n > MAX_N18 || d < 3 || d > MAX_D6) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const planes = readPlanes(answer.subspaces, n, d);
  if (!Array.isArray(planes)) return planes;
  const { ratio, pair } = smallestChordal(planes);
  const score = floorDiv(ratio.p * 10n ** 18n, ratio.q);
  const display = printScaled(floorDiv(ratio.p * 10n ** 9n, ratio.q), 9);
  const result2 = ok(score, display);
  return {
    ...result2,
    message: `${result2.message} \u6700\u63A5\u8FD1\u7684\u4E00\u5BF9\u5E73\u9762\u662F ${pair[0] + 1} \u4E0E ${pair[1] + 1}\u3002`,
    messageEn: `${result2.messageEn} The closest pair of planes is ${pair[0] + 1} and ${pair[1] + 1}.`
  };
}
var problem26 = { definition: definition26, verify: verifySubspacePacking };

// src/problems/p65-erasure-frames.ts
var MAX_N19 = 20;
var MAX_D7 = 6;
var RANGES6 = {
  3: [6, 8, 10, 12],
  4: [8, 10, 12, 14],
  5: [10, 12, 14]
};
function clusteredBaseline(n, d) {
  const next = lcg(65001);
  const rows = Array.from({ length: n }, () => Array.from({ length: d }, () => signedUnit(next)));
  rows[1] = rows[0].map((value, index) => {
    const nudged = Math.round(Number(value) * SCALE) + (index === 0 ? 1e6 : 0);
    return (Math.max(-SCALE, Math.min(SCALE, nudged)) / SCALE).toFixed(9);
  });
  return { vectors: rows };
}
var instances22 = Object.entries(RANGES6).flatMap(([dims, counts]) => counts.map((n) => ({
  instanceId: `p65-d${dims}-n${n}-v1`,
  instanceName: `d = ${dims}, n = ${n}`,
  instanceNameEn: `d = ${dims}, n = ${n}`,
  parameters: { n, d: Number(dims) },
  baselineAnswer: clusteredBaseline(n, Number(dims))
})));
var definition27 = {
  id: "p65",
  instanceId: "p65-d4-n10-v1",
  code: "P65",
  slug: "erasure-frames",
  category: "extremal",
  title: "\u6700\u9C81\u68D2\u7684\u5197\u4F59\u6D4B\u91CF\u65B9\u5411",
  summary: "\u9009 n \u4E2A\u6D4B\u91CF\u65B9\u5411\uFF0C\u4F7F\u4EFB\u610F d \u4E2A\u5E78\u5B58\u65B9\u5411\u5F20\u6210\u7684\u6700\u5C0F\u5F52\u4E00\u5316\u4F53\u79EF\u5C3D\u53EF\u80FD\u5927\u3002",
  objective: "maximize",
  scoreLabel: "\u6700\u574F\u5B50\u96C6\u7684\u5F52\u4E00\u5316\u4F53\u79EF",
  scoreLabelEn: "the worst subset's normalized volume",
  instanceName: "d = 4, n = 10",
  instanceNameEn: "d = 4, n = 10",
  parameters: { n: 10, d: 4 },
  baselineAnswer: clusteredBaseline(10, 4),
  answerHelp: "\u63D0\u4EA4 vectors\uFF1A\u6070\u597D n \u884C\uFF0C\u6BCF\u884C d \u4E2A [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\u5750\u6807\uFF0C\u6BCF\u884C\u662F\u4E00\u4E2A\u975E\u96F6\u5411\u91CF\u3002",
  answerHelpEn: "Submit vectors: exactly n rows of d decimal-string coordinates in [-1, 1], each row a nonzero vector.",
  titleEn: "The most erasure-robust measurement directions",
  summaryEn: "Choose n measurement directions so that the smallest normalized volume spanned by any d survivors is as large as possible.",
  extent: SCALE,
  frame: "\u6BCF\u4E2A\u6D4B\u91CF\u65B9\u5411\u662F\u4E00\u4E2A\u975E\u96F6\u5411\u91CF\uFF1Ad \u4E2A\u5750\u6807\u5199\u6210 [-1, 1] \u5185\u7684\u5341\u8FDB\u5236\u5B57\u7B26\u4E32\uFF0C\u6700\u591A\u4E5D\u4F4D\u5C0F\u6570\u3002",
  frameEn: "Each measurement direction is a nonzero vector: d coordinates written as decimal strings in [-1, 1], at most nine decimal places.",
  definition: "\u5728 R^d \u4E2D\u9009\u62E9 n \u4E2A\u975E\u96F6\u5411\u91CF\u3002\u5BF9\u6BCF\u4E2A\u5927\u5C0F\u4E3A d \u7684\u5B50\u96C6\uFF0C\u53D6\u4EE5\u8FD9\u4E9B\u5411\u91CF\u4E3A\u5217\u7684\u77E9\u9635\u7684\u884C\u5217\u5F0F\u5E73\u65B9\u9664\u4EE5\u5404\u5411\u91CF\u8303\u6570\u5E73\u65B9\u4E4B\u79EF\uFF1B\u6700\u5927\u5316\u6240\u6709\u5B50\u96C6\u4E2D\u8FD9\u4E2A\u5F52\u4E00\u5316\u4F53\u79EF\u7684\u6700\u5C0F\u503C\u3002\u4E3A\u96F6\u610F\u5473\u7740\u67D0 d \u4E2A\u5E78\u5B58\u6D4B\u91CF\u65E0\u6CD5\u6062\u590D\u6574\u4E2A\u7A7A\u95F4\u3002",
  definitionEn: "Choose n nonzero vectors in R^d. For every subset of size d, take the squared determinant of the matrix with those vectors as columns, divided by the product of their squared norms; maximize the minimum of this normalized volume over all subsets. Zero means some d surviving measurements cannot recover the space at all.",
  strict: [
    { label: "\u5BB9\u5668", labelEn: "Container", text: "d \u7EF4\u5B9E\u7A7A\u95F4 R^d\uFF1B\u7B54\u6848\u662F n \u4E2A\u6D4B\u91CF\u65B9\u5411", textEn: "Real d-space R^d; an answer is n measurement directions" },
    { label: "\u63D0\u4EA4", labelEn: "Submission", text: "\u6070\u597D n \u4E2A\u975E\u96F6\u5411\u91CF\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807", textEn: "Exactly n nonzero vectors with d coordinates each" },
    { label: "\u76EE\u6807", labelEn: "Objective", text: "\u6700\u5927\u5316 min det(V_S)\xB2/\u03A0|v\u1D62|\xB2\uFF0C\u5BF9\u5168\u90E8 C(n,d) \u4E2A\u5B50\u96C6\u53D6\u6700\u5C0F\uFF1B\u884C\u5217\u5F0F\u4E0E\u8303\u6570\u5168\u662F\u6709\u7406\u6570\uFF0C\u6BD4\u8F83\u4EA4\u53C9\u76F8\u4E58", textEn: "Maximize min det(V_S)\xB2/\u03A0|v_i|\xB2 over all C(n,d) subsets; determinants and norms are rational, compared by cross-multiplication" },
    { label: "\u63AA\u8F9E", labelEn: "Wording", text: "\u5F52\u4E00\u5316\u4F53\u79EF\u662F\u4E0E\u6570\u503C\u7A33\u5B9A\u6027\u4E00\u81F4\u7684\u9C81\u68D2\u6027\u4EE3\u7406\uFF0C\u4E0D\u7B49\u540C\u4E8E\u6240\u6709\u566A\u58F0\u6A21\u578B\u4E0B\u7684\u6700\u4F18\u91CD\u5EFA\u8BEF\u5DEE\uFF1B\u672C\u9898\u53EA\u58F0\u79F0 maximin volume", textEn: "The normalized volume is a robustness proxy aligned with numerical stability, not the optimal reconstruction error under every noise model; this problem claims maximin volume and nothing more" },
    { label: "\u8BA1\u5206", labelEn: "Scoring", text: "\u7EAA\u5F55\u662F floor(\u6700\u5C0F\u5F52\u4E00\u5316\u4F53\u79EF \xB7 10\xB9\u2078)\uFF0C\u5411\u4E0D\u5229\u4E8E\u63D0\u4EA4\u8005\u7684\u65B9\u5411\u53D6\u6574\uFF1B\u9875\u9762\u663E\u793A\u8BE5\u4F53\u79EF\uFF0C\u5411\u4E0B\u53D6\u6574\u5230\u7B2C 12 \u4F4D\u5C0F\u6570", textEn: "The record is floor(min normalized volume \xB7 10\xB9\u2078), rounded against the submitter; the page shows that volume, rounded down at the twelfth decimal" }
  ],
  intuition: [
    {
      title: "\u5B83\u9632\u7684\u662F\u4EC0\u4E48",
      titleEn: "What it defends against",
      text: "\u5197\u4F59\u6D4B\u91CF\u7684\u610F\u4E49\u662F\u574F\u6389\u51E0\u4E2A\u4E5F\u80FD\u6062\u590D\u4FE1\u53F7\u3002full-spark frame \u8981\u6C42\u4EFB\u4F55 d \u4E2A\u5E78\u5B58\u5411\u91CF\u90FD\u5F20\u6210\u5168\u7A7A\u95F4\uFF1B\u8FD9\u91CC\u66F4\u8FDB\u4E00\u6B65\uFF0C\u95EE\u6700\u574F\u7684\u90A3\u7EC4\u5E78\u5B58\u8005\u79BB\u9000\u5316\u6709\u591A\u8FDC\uFF0C\u8FD9\u51FA\u73B0\u5728\u7A00\u758F\u4FE1\u53F7\u5904\u7406\u3001\u6297\u64E6\u9664\u4F20\u8F93\u4E0E\u76F8\u4F4D\u6062\u590D\u91CC\u3002",
      textEn: "Redundant measurements exist so the signal survives losing a few. A full-spark frame demands that any d survivors span the space; this problem goes further and asks how far the worst set of survivors is from degenerate \u2014 the concern of sparse signal processing, erasure-robust transmission and phase retrieval."
    },
    {
      title: "\u524D\u6CBF\u5728\u54EA\u91CC",
      titleEn: "Where the frontier is",
      tone: "frontier",
      text: "full-spark frame \u7684\u5B58\u5728\u6027\u4E0E\u6784\u9020\u6709\u6210\u719F\u6587\u732E\uFF0C\u4F46\u56FA\u5B9A (n, d) \u4E0B\u6700\u5927\u5316\u6700\u574F\u5B50\u96C6\u4F53\u79EF\u6CA1\u6709\u5DF2\u53D1\u8868\u7684\u6700\u4F18\u8868\u3002\u6BCF\u4E2A\u5B50\u9898\u90FD\u5F00\u653E\u3002",
      textEn: "Existence and constructions of full-spark frames are well studied, but maximizing the worst subset volume at fixed (n, d) has no published table of optima. Every sub-problem is open.",
      url: "https://arxiv.org/abs/1110.3548"
    }
  ],
  requirements: ["\u6070\u597D n \u4E2A\u975E\u96F6\u5411\u91CF\uFF0C\u6BCF\u4E2A d \u4E2A\u5750\u6807", "\u5750\u6807\u5728 [-1, 1] \u5185", "\u5206\u6570\u662F floor(\u6700\u5C0F\u5F52\u4E00\u5316\u4F53\u79EF \xB7 10\xB9\u2078)\uFF0C\u8D8A\u5927\u8D8A\u597D"],
  requirementsEn: ["Exactly n nonzero vectors with d coordinates each", "Coordinates lie in [-1, 1]", "The score is floor(min normalized volume \xB7 10\xB9\u2078); larger is better"],
  frontier: true,
  instances: instances22
};
function integerDeterminant(matrix) {
  const size = matrix.length;
  const work = matrix.map((row) => row.slice());
  let sign = 1n, previous = 1n;
  for (let column = 0; column < size - 1; column += 1) {
    if (work[column][column] === 0n) {
      const swap = work.findIndex((row, index) => index > column && row[column] !== 0n);
      if (swap === -1) return 0n;
      [work[column], work[swap]] = [work[swap], work[column]];
      sign = -sign;
    }
    for (let row = column + 1; row < size; row += 1) {
      for (let entry = column + 1; entry < size; entry += 1)
        work[row][entry] = (work[row][entry] * work[column][column] - work[row][column] * work[column][entry]) / previous;
      work[row][column] = 0n;
    }
    previous = work[column][column];
  }
  return sign * work[size - 1][size - 1];
}
function worstSubsetVolume(vectors, d) {
  const n = vectors.length;
  const lifted = vectors.map((vector) => vector.map(big3));
  const norms = lifted.map((vector) => vector.reduce((sum, value) => sum + value * value, 0n));
  let best = null;
  let witness = [];
  const chosen = [];
  const walk = (start) => {
    if (chosen.length === d) {
      const det = integerDeterminant(chosen.map((index) => lifted[index]));
      const candidate = { p: det * det, q: chosen.reduce((product, index) => product * norms[index], 1n) };
      if (best === null || ratioLess(candidate, best)) {
        best = candidate;
        witness = chosen.slice();
      }
      return;
    }
    for (let index = start; index <= n - (d - chosen.length); index += 1) {
      chosen.push(index);
      walk(index + 1);
      chosen.pop();
      if (best && best.p === 0n) return;
    }
  };
  walk(0);
  return { ratio: best ?? { p: 0n, q: 1n }, subset: witness };
}
function verifyErasureFrame(params, answer) {
  const n = asInt(params.n, "n"), d = asInt(params.d, "d");
  if (n < 2 || n > MAX_N19 || d < 2 || d > MAX_D7 || n < d) refuse("\u53C2\u6570\u8D85\u51FA\u9A8C\u8BC1\u5668\u652F\u6301\u7684\u8303\u56F4", "the parameters are outside the range the verifier supports");
  if (!isObject(answer)) return fail("BAD_ANSWER", "\u7B54\u6848\u5FC5\u987B\u662F\u5BF9\u8C61", "the answer must be an object");
  const vectors = readMatrix(answer.vectors, "vectors", n, d, -SCALE, SCALE);
  for (let i = 0; i < n; i += 1)
    if (vectors[i].every((value) => value === 0))
      return fail("DEGENERATE", `\u5411\u91CF ${i + 1} \u662F\u96F6\u5411\u91CF`, `vector ${i + 1} is zero`);
  const { ratio, subset } = worstSubsetVolume(vectors, d);
  const score = floorDiv(ratio.p * 10n ** 18n, ratio.q);
  const display = printScaled(floorDiv(ratio.p * 10n ** 12n, ratio.q), 12);
  const result2 = ok(score, display);
  const listed = subset.map((index) => index + 1).join(", ");
  return {
    ...result2,
    message: `${result2.message} \u6700\u8106\u5F31\u7684\u5E78\u5B58\u7EC4\u5408\u662F\u5411\u91CF ${listed}\u3002`,
    messageEn: `${result2.messageEn} The most fragile surviving subset is vectors ${listed}.`
  };
}
var problem27 = { definition: definition27, verify: verifyErasureFrame };

// src/problems/index.ts
var problemModules = [problem, problem2, problem3, problem4, problem5, problem6, problem7, p09, p10, problem8, problem9, problem10, problem11, p16, p17, problem12, p19, p20, p21, p22, p24, p25, p26, p27, p28, problem13, p30, p31, p32, p33, p34, problem14, problem15, problem16, problem17, problem18, problem19, problem20, p58, problem21, problem22, problem23, problem24, problem25, problem26, problem27];

// src/frozen.ts
var frozen = {
  "P27": {
    "since": "2026-08-27",
    "why": "Suspected of the same degeneracy that once evicted equal circles from the annulus: a band this narrow may make evenly spaced rings provably optimal over a whole range of n. Delisted while that audit runs."
  },
  "P07": {
    "since": "2026-08-28",
    "why": "The same problem as P02, equal circles in a disc: a packing of radius r and a spread of smallest distance d are related by the strictly monotone bijection d = 2r/(1 \u2212 r), so a solution to either is a solution to both. The catalogue keeps the packing side, which is the one the literature cites."
  },
  "P15": {
    "since": "2026-08-28",
    "why": "The same problem as P01, equal circles in the unit square, under d = 2r/(1 \u2212 2r). Specht's table prints the two quantities as two columns of one table, which says it plainly enough. The catalogue keeps the packing side."
  }
};
var isFrozen = (code) => code in frozen;

// src/index.ts
function instances23(options = {}) {
  const found = /* @__PURE__ */ new Map();
  for (const module of problemModules) {
    const definition28 = module.definition;
    if (!options.includeFrozen && isFrozen(definition28.code)) continue;
    const list = definition28.instances ?? [{
      instanceId: definition28.instanceId,
      instanceName: definition28.instanceName,
      instanceNameEn: definition28.instanceNameEn ?? definition28.instanceName,
      parameters: definition28.parameters,
      baselineAnswer: definition28.baselineAnswer
    }];
    for (const instance of list) found.set(instance.instanceId, { definition: definition28, instance });
  }
  return found;
}
function verify(instanceId2, answer) {
  const found = instances23({ includeFrozen: true }).get(instanceId2);
  if (!found) return fail("UNKNOWN_INSTANCE", "\u627E\u4E0D\u5230\u8FD9\u9053\u5B50\u9898", "Instance not found");
  if (!isObject(answer)) return fail("BAD_SHAPE", "\u7B54\u6848\u5FC5\u987B\u662F\u4E00\u4E2A JSON \u5BF9\u8C61", "The answer must be a JSON object");
  const module = problemModules.find((candidate) => candidate.definition.code === found.definition.code);
  try {
    return module.verify(found.instance.parameters ?? found.definition.parameters, answer);
  } catch (error) {
    if (error instanceof Refusal) return fail("BAD_ANSWER", error.message, error.messageEn);
    const reason = error instanceof Error ? error.message : null;
    return fail("BAD_ANSWER", reason ?? "\u7B54\u6848\u683C\u5F0F\u9519\u8BEF", reason ?? "The answer is malformed");
  }
}

// src/cli.ts
var [instanceId, file] = process.argv.slice(2);
if (!instanceId) {
  console.error("usage: minmax-verify <instanceId> <answer.json>   (- reads stdin)");
  console.error("       minmax-verify --list [--all]");
  process.exit(2);
}
if (instanceId === "--list") {
  const all = process.argv.includes("--all");
  for (const [id, { definition: definition28 }] of instances23({ includeFrozen: all })) {
    const note = isFrozen(definition28.code) ? "  (frozen " + frozen[definition28.code].since + ")" : "";
    console.log(id.padEnd(18), definition28.code, definition28.titleEn + note);
  }
  if (!all) {
    console.log("");
    console.log("--all also lists problems the catalogue no longer offers. Their records still stand and still verify.");
  }
  process.exit(0);
}
var raw = !file || file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
var result = verify(instanceId, JSON.parse(raw));
console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
