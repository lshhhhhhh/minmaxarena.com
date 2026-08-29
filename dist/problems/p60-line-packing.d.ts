import type { ProblemDefinition, ProblemModule } from "../problem-kit";
import { type Ratio } from "./frontier-kit";
export declare function scatteredLines(n: number, d: number, seed: number): {
    vectors: string[][];
};
export declare const definition: ProblemDefinition;
export declare function worstAlignment(vectors: number[][]): {
    ratio: Ratio;
    pair: [number, number];
};
export declare function coherenceScore(ratio: Ratio): bigint;
export declare function coherenceDisplay(score: bigint): string;
export declare const problem: ProblemModule;
