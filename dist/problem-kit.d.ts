export declare const SCALE = 1000000000;
export type Objective = "maximize" | "minimize";
export declare const problemCategories: readonly [{
    readonly id: "packing";
    readonly name: "装箱与覆盖";
    readonly nameEn: "Packing and covering";
}, {
    readonly id: "extremal";
    readonly name: "极值构型";
    readonly nameEn: "Extremal configurations";
}];
export type ProblemCategory = (typeof problemCategories)[number]["id"];
export type ProblemTag = "classic" | "original" | "applied" | "solved" | "easyBaseline";
export type KnownBest = {
    display: string;
    kind: "proven" | "best";
    source: string;
    sourceEn: string;
    url?: string;
    exact?: string;
};
export type Floor = {
    display: string;
    exact: string;
    source: string;
    sourceEn: string;
    url?: string;
};
export type StrictTerm = {
    label: string;
    labelEn: string;
    text: string;
    textEn: string;
};
export type IntuitionCard = {
    title: string;
    titleEn: string;
    text: string;
    textEn: string;
    tone?: "frontier";
    url?: string;
};
export type ProblemInstanceDefinition = {
    instanceId: string;
    instanceName: string;
    parameters: Record<string, unknown>;
    baselineAnswer: unknown;
    instanceNameEn: string;
    knownBest?: KnownBest;
    referenceAnswer?: boolean;
    floor?: Floor;
    trivial?: boolean;
};
export type ProblemDefinition = {
    id: string;
    instanceId: string;
    code: string;
    slug: string;
    category: ProblemCategory;
    title: string;
    summary: string;
    objective: Objective;
    scoreLabel: string;
    goalLabel?: string;
    goalLabelEn?: string;
    scoreIs?: "square" | "double";
    instanceName: string;
    parameters: Record<string, unknown>;
    baselineAnswer: unknown;
    answerHelp: string;
    titleEn: string;
    summaryEn: string;
    scoreLabelEn: string;
    instanceNameEn: string;
    answerHelpEn: string;
    extent?: number;
    frame?: string;
    frameEn?: string;
    definition?: string;
    definitionEn?: string;
    strict?: StrictTerm[];
    intuition?: IntuitionCard[];
    statement?: string;
    statementEn?: string;
    requirements?: string[];
    requirementsEn?: string[];
    frontier?: boolean;
    instances?: ProblemInstanceDefinition[];
};
export type VerificationResult = {
    valid: boolean;
    score?: string;
    displayScore?: string;
    errorCode?: string;
    message: string;
    messageEn?: string;
};
export type Obj = Record<string, unknown>;
export type Point = [number, number];
export type ProblemModule = {
    definition: ProblemDefinition;
    verify: (params: Obj, answer: Obj) => VerificationResult;
};
export declare const ok: (score: bigint, displayScore?: string) => VerificationResult;
export declare const fail: (errorCode: string, message: string, messageEn?: string) => VerificationResult;
export declare class Refusal extends Error {
    readonly messageEn: string;
    constructor(message: string, messageEn: string);
}
export declare function refuse(message: string, messageEn: string): never;
export declare const isObject: (value: unknown) => value is Obj;
export declare const isInt: (value: unknown) => value is number;
export declare const asInt: (value: unknown, name: string) => number;
export declare const asArray: (value: unknown, name: string) => unknown[];
export declare const sq: (value: number) => bigint;
export declare function formatFixedPoint(value: number): string;
export declare const FIXED_DECIMALS = 9;
export declare function parseFixed(value: unknown, name: string): number;
export declare function printFixed(units: number): string;
export declare function parseFixedPoint(value: unknown, name: string): [number, number];
export declare function printSquared(units: bigint): string;
export declare function printFixedBig(units: bigint): string;
export declare function integerSqrt(value: bigint): bigint;
