import type { ProblemDefinition, ProblemModule } from "../problem-kit";
export declare function haltonExhibit(n: number, d: number): {
    points: string[][];
};
export declare const definition: ProblemDefinition;
export declare function l2StarNumerator(points: number[][], n: number, d: number): bigint;
export declare function l2StarDenominator(n: number, d: number): bigint;
export declare function l2StarDisplay(score: bigint, denominator: bigint): string;
export declare const problem: ProblemModule;
