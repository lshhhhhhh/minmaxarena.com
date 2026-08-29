import type { ProblemDefinition, ProblemModule } from "../problem-kit";
import { type Ratio } from "./frontier-kit";
export declare function scatteredFrame(n: number, d: number, seed: number): {
    vectors: string[][];
};
export declare const definition: ProblemDefinition;
export declare function integerDeterminant(matrix: bigint[][]): bigint;
export declare function worstSubsetVolume(vectors: number[][], d: number): {
    ratio: Ratio;
    subset: number[];
};
export declare const problem: ProblemModule;
