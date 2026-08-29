export type RationalPoint = readonly [bigint, bigint, bigint];
export type Rational = {
    num: bigint;
    den: bigint;
};
export declare function gcd(a: bigint, b: bigint): bigint;
export declare function vertex(nx: bigint, ny: bigint, d: bigint): RationalPoint;
export declare const rational: (num: bigint, den: bigint) => Rational;
export declare const addRational: (a: Rational, b: Rational) => Rational;
export declare function clipHalfPlane(poly: RationalPoint[], a: bigint, b: bigint, c: bigint): RationalPoint[];
export declare function twiceSignedArea(poly: readonly (readonly [bigint, bigint])[]): bigint;
export declare function twelveTimesSecondMoment(poly: readonly (readonly [bigint, bigint])[]): bigint;
export declare function overCommonDenominator(poly: RationalPoint[], about: readonly [bigint, bigint]): {
    corners: (readonly [bigint, bigint])[];
    common: bigint;
};
export declare function secondMomentAbout(poly: RationalPoint[], about: readonly [bigint, bigint]): Rational;
export declare function areaOf(poly: RationalPoint[]): Rational;
export declare function cellOf(points: readonly (readonly [bigint, bigint])[], index: number, box: RationalPoint[]): RationalPoint[];
export declare const squareBox: (size: bigint) => RationalPoint[];
export declare function centroidOf(poly: RationalPoint[]): {
    x: Rational;
    y: Rational;
} | null;
