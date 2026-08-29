export declare const big: BigIntConstructor;
export declare const S: bigint;
export declare function ceilDiv(p: bigint, q: bigint): bigint;
export declare function floorDiv(p: bigint, q: bigint): bigint;
export declare function integerSqrtCeil(value: bigint): bigint;
export declare function printScaled(units: bigint, places: number): string;
export declare function readMatrix(value: unknown, name: string, rows: number, columns: number, low: number, high: number): number[][];
export type Ratio = {
    p: bigint;
    q: bigint;
};
export declare const ratioLess: (a: Ratio, b: Ratio) => boolean;
export declare function lcg(seed: number): () => number;
export declare function signedUnit(next: () => number): string;
export declare function unitCoordinate(next: () => number): string;
export declare function halton(index: number, base: number): string;
