import type { ProblemDefinition, ProblemModule } from "../problem-kit";
import { type Ratio } from "./frontier-kit";
export declare function scatteredSubspaces(n: number, d: number, seed: number): {
    subspaces: string[][][];
};
export declare const definition: ProblemDefinition;
type Plane = {
    basis: bigint[][];
    gram: [bigint, bigint, bigint];
    det: bigint;
};
export declare function smallestChordal(planes: Plane[]): {
    ratio: Ratio;
    pair: [number, number];
};
export declare const problem: ProblemModule;
export {};
