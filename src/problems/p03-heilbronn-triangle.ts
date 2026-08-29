import { SCALE, ok, fail, asInt, asArray, parseFixedPoint } from "../problem-kit";
import type { ProblemDefinition, ProblemInstanceDefinition, ProblemModule, Obj, VerificationResult } from "../problem-kit";

// Points on a parabola modulo a prime: three of them are collinear exactly
// when (b−a)(c−a)(c−b) ≡ 0 mod p, which distinct residues cannot do. Legal
// for every n and nowhere near optimal.
const instances: ProblemInstanceDefinition[] = [
  { instanceId: "p03-n5-v1", instanceName: "n = 5", instanceNameEn: "n = 5", parameters: { n: 5 }, baselineAnswer: {"points":[["0","0"],["0.2","0.2"],["0.4","0.8"],["0.6","0.8"],["0.8","0.2"]]} },
  { instanceId: "p03-n6-v1", instanceName: "n = 6", instanceNameEn: "n = 6", parameters: { n: 6 }, baselineAnswer: {"points":[["0","0"],["0.142857142","0.142857142"],["0.285714285","0.571428571"],["0.428571428","0.285714285"],["0.571428571","0.285714285"],["0.714285714","0.571428571"]]} },
  { instanceId: "p03-n7-v1", instanceName: "n = 7", instanceNameEn: "n = 7", parameters: { n: 7 }, baselineAnswer: {"points":[["0","0"],["0.142857142","0.142857142"],["0.285714285","0.571428571"],["0.428571428","0.285714285"],["0.571428571","0.285714285"],["0.714285714","0.571428571"],["0.857142857","0.142857142"]]} },
  { instanceId: "p03-n8-v1", instanceName: "n = 8", instanceNameEn: "n = 8", parameters: { n: 8 }, baselineAnswer: {"points":[["0","0"],["0.09090909","0.09090909"],["0.181818181","0.363636363"],["0.272727272","0.818181818"],["0.363636363","0.454545454"],["0.454545454","0.272727272"],["0.545454545","0.272727272"],["0.636363636","0.454545454"]]} },
  { instanceId: "p03-n9-v1", instanceName: "n = 9", instanceNameEn: "n = 9", parameters: { n: 9 }, baselineAnswer: {"points":[["0","0"],["0.09090909","0.09090909"],["0.181818181","0.363636363"],["0.272727272","0.818181818"],["0.363636363","0.454545454"],["0.454545454","0.272727272"],["0.545454545","0.272727272"],["0.636363636","0.454545454"],["0.727272727","0.818181818"]]} },
  { instanceId: "p03-n10-v1", instanceName: "n = 10", instanceNameEn: "n = 10", parameters: { n: 10 }, baselineAnswer: {"points":[["0","0"],["0.09090909","0.09090909"],["0.181818181","0.363636363"],["0.272727272","0.818181818"],["0.363636363","0.454545454"],["0.454545454","0.272727272"],["0.545454545","0.272727272"],["0.636363636","0.454545454"],["0.727272727","0.818181818"],["0.818181818","0.363636363"]]} },
  { instanceId: "p03-n11-v1", instanceName: "n = 11", instanceNameEn: "n = 11", parameters: { n: 11 }, baselineAnswer: {"points":[["0","0"],["0.09090909","0.09090909"],["0.181818181","0.363636363"],["0.272727272","0.818181818"],["0.363636363","0.454545454"],["0.454545454","0.272727272"],["0.545454545","0.272727272"],["0.636363636","0.454545454"],["0.727272727","0.818181818"],["0.818181818","0.363636363"],["0.909090909","0.09090909"]]} },
  { instanceId: "p03-n12-v1", instanceName: "n = 12", instanceNameEn: "n = 12", parameters: { n: 12 }, baselineAnswer: {"points":[["0","0"],["0.076923076","0.076923076"],["0.153846153","0.307692307"],["0.23076923","0.692307692"],["0.307692307","0.23076923"],["0.384615384","0.923076923"],["0.461538461","0.769230769"],["0.538461538","0.769230769"],["0.615384615","0.923076923"],["0.692307692","0.23076923"],["0.769230769","0.692307692"],["0.846153846","0.307692307"]]} },
  { instanceId: "p03-n13-v1", instanceName: "n = 13", instanceNameEn: "n = 13", parameters: { n: 13 }, baselineAnswer: {"points":[["0","0"],["0.076923076","0.076923076"],["0.153846153","0.307692307"],["0.23076923","0.692307692"],["0.307692307","0.23076923"],["0.384615384","0.923076923"],["0.461538461","0.769230769"],["0.538461538","0.769230769"],["0.615384615","0.923076923"],["0.692307692","0.23076923"],["0.769230769","0.692307692"],["0.846153846","0.307692307"],["0.923076923","0.076923076"]]} },
  { instanceId: "p03-n14-v1", instanceName: "n = 14", instanceNameEn: "n = 14", parameters: { n: 14 }, baselineAnswer: {"points":[["0","0"],["0.058823529","0.058823529"],["0.117647058","0.235294117"],["0.176470588","0.529411764"],["0.235294117","0.94117647"],["0.294117647","0.470588235"],["0.352941176","0.117647058"],["0.411764705","0.882352941"],["0.470588235","0.764705882"],["0.529411764","0.764705882"],["0.588235294","0.882352941"],["0.647058823","0.117647058"],["0.705882352","0.470588235"],["0.764705882","0.94117647"]]} },
  { instanceId: "p03-n15-v1", instanceName: "n = 15", instanceNameEn: "n = 15", parameters: { n: 15 }, baselineAnswer: {"points":[["0","0"],["0.058823529","0.058823529"],["0.117647058","0.235294117"],["0.176470588","0.529411764"],["0.235294117","0.94117647"],["0.294117647","0.470588235"],["0.352941176","0.117647058"],["0.411764705","0.882352941"],["0.470588235","0.764705882"],["0.529411764","0.764705882"],["0.588235294","0.882352941"],["0.647058823","0.117647058"],["0.705882352","0.470588235"],["0.764705882","0.94117647"],["0.823529411","0.529411764"]]} },
  { instanceId: "p03-n16-v1", instanceName: "n = 16", instanceNameEn: "n = 16", parameters: { n: 16 }, baselineAnswer: {"points":[["0","0"],["0.058823529","0.058823529"],["0.117647058","0.235294117"],["0.176470588","0.529411764"],["0.235294117","0.94117647"],["0.294117647","0.470588235"],["0.352941176","0.117647058"],["0.411764705","0.882352941"],["0.470588235","0.764705882"],["0.529411764","0.764705882"],["0.588235294","0.882352941"],["0.647058823","0.117647058"],["0.705882352","0.470588235"],["0.764705882","0.94117647"],["0.823529411","0.529411764"],["0.882352941","0.235294117"]]} },
];

export const definition: ProblemDefinition = {
    id: "p03", instanceId: "p03-n6-v1", code: "P03", slug: "heilbronn-triangle", category: "extremal",
    title: "Heilbronn 最小三角形面积", summary: "放置 n 个点，最大化任意三点构成的最小三角形面积。", objective: "maximize", scoreLabel: "最小三角形面积",
    instanceName: "n = 6", parameters: { n: 6 },
    baselineAnswer: instances[1].baselineAnswer,
    answerHelp: "提交 points。每个坐标写成十进制字符串，例如 \"0.5\"。",
    extent: SCALE,
    frame: "容器是边长 1 的正方形，左下角是原点 (0, 0)，右上角是 (1, 1)。坐标和长度用同一个单位，直接写成小数，例如 \"0.5\"，最多九位小数。",
    frameEn: "The container is a square of side 1. Its lower-left corner is the origin (0, 0) and its upper-right corner is (1, 1). Coordinates and lengths share one unit and are written as plain decimals such as \"0.5\", to at most nine decimal places.",
    titleEn: "Heilbronn minimum triangle area", summaryEn: "Place n points and maximize the smallest triangle area among all triples.", scoreLabelEn: "minimum triangle area", instanceNameEn: "n = 6", answerHelpEn: "Submit points, each coordinate written as a decimal string such as \"0.5\".",
    definition: "在单位正方形内放置 n 个点，使任意三点构成的三角形中最小的那个面积尽可能大。",
      definitionEn: "Place n points in the unit square so that the smallest triangle formed by any three of them is as large as possible.",
      strict: [
        { label: "容器", labelEn: "Container", text: "单位正方形：左下角是原点 (0, 0)，右上角是 (1, 1)", textEn: "The unit square: the origin (0, 0) at its lower-left corner, (1, 1) at its upper right" },
        { label: "提交", labelEn: "Submission", text: "恰好 n 个点 points，任意三点不共线", textEn: "Exactly n points, no three collinear" },
        { label: "约束", labelEn: "Constraints", text: "每个点都在正方形内或边界上", textEn: "Every point lies inside the square or on its boundary" },
        { label: "目标", labelEn: "Objective", text: "让任意三点构成的三角形中最小的面积尽可能大。内部以二倍面积精确比较", textEn: "Make the smallest triangle over all triples as large as possible; compared internally by twice the area, exactly" },
      ],
      intuition: [
        { title: "哪里有优化空间", titleEn: "Where the room for improvement is",
          text: "把点撒得均匀并不够：任何三点都不能接近共线，而近共线恰恰是看起来整齐的排布最容易犯的错。最优构形往往不对称，连形状都难猜。",
          textEn: "Even spreading is not enough: no three points may come close to collinear, and near-collinearity is exactly what tidy arrangements love to do. Optima are often asymmetric and hard even to guess." },
        { title: "前沿在哪里", titleEn: "Where the frontier is", tone: "frontier",
          text: "n = 5..9 已证明（Yang、Zhang、Zeng 与 Dress 等，1991–1995）；n ≥ 10 只有数值下界，最新的综述与构造见 arXiv:2603.11107。Goldberg (1972) 的构造长期是这一族的基准。",
          textEn: "Proven for n = 5..9 (Yang, Zhang, Zeng and Dress, 1991–1995); for n ≥ 10 only numerical lower bounds exist — see arXiv:2603.11107 for the current survey. Goldberg's 1972 constructions were the benchmark for decades." , url: "https://arxiv.org/abs/2603.11107" },
      ],
    requirements: ["所有点位于单位正方形内","任意三点都不能共线","分数取所有三角形中的最小面积"],
    requirementsEn: ["All points lie in the unit square","No three selected points are collinear","The score is the smallest triangle area"],
    instances,
};

function verifyHeilbronn(params: Obj, answer: Obj): VerificationResult {
  const n = asInt(params.n, "n"), size = SCALE;
  const points = asArray(answer.points, "points").map((point,i)=>parseFixedPoint(point,`points[${i}]`));
  if (points.length !== n) return fail("COUNT", `需要恰好 ${n} 个点`, `exactly ${n} points are needed`);
  for (const [x,y] of points) if (x<0 || y<0 || x>size || y>size) return fail("OUT_OF_BOUNDS", "至少一个点不在正方形内", "at least one point lies outside the square");
  let minimum: bigint | null = null;
  for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) for (let k=j+1;k<n;k++) {
    const [ax,ay]=points[i], [bx,by]=points[j], [cx,cy]=points[k];
    const area2 = absBig(BigInt(bx-ax)*BigInt(cy-ay)-BigInt(by-ay)*BigInt(cx-ax));
    if (minimum === null || area2 < minimum) minimum = area2;
  }
  if (!minimum || minimum === 0n) return fail("COLLINEAR", "存在三个共线点，最小面积为 0", "three of the points are collinear, so the smallest area is 0");
  return ok(minimum, `${minimum} / (2·10¹⁸)`);
}

function absBig(value:bigint){return value<0n?-value:value;}

export const problem: ProblemModule = { definition, verify: verifyHeilbronn };
