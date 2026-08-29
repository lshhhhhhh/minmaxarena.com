import type { ProblemDefinition, ProblemModule } from "../problem-kit";
import { type Ratio } from "./frontier-kit";
export declare function scatteredComplex(n: number, d: number, seed: number): {
    vectors: string[][][];
};
export declare const definition: ProblemDefinition;
type ComplexVector = {
    re: number[];
    im: number[];
};
export declare function worstHermitianAlignment(vectors: ComplexVector[]): {
    ratio: Ratio;
    pair: [number, number];
};
export declare const problem: ProblemModule;
export {};
