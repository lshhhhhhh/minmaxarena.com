import type { IntuitionCard, ProblemModule } from "./problem-kit";
import type { Container } from "./containers";
type Family = {
    code: string;
    id: string;
    slug: string;
    container: Container;
    instanceIds: (n: number) => string;
    range: [number, number];
    primary: number;
    baseline: (n: number, container: Container) => unknown;
};
export declare function equalCircles(family: Family, copy: {
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    frontier?: IntuitionCard;
}): ProblemModule;
export declare function spreadPoints(family: Family, copy: {
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    frontier?: IntuitionCard;
}): ProblemModule;
export declare function heilbronn(family: Family, copy: {
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    frontier?: IntuitionCard;
}): ProblemModule;
/** The largest grid of equal circles this container holds n of. */
export declare function largestGridCircles(n: number, container: Container): {
    radius: number;
    centers: number[][];
};
export declare function gridCircles(n: number, container: Container): unknown;
/** The widest lattice spacing at which this container still holds n points. */
export declare function largestGridPoints(n: number, container: Container, from?: number): {
    denominator: number;
    spacing: number;
    points: number[][];
};
export declare function gridPoints(n: number, container: Container): unknown;
export declare function ringPoints(n: number, container: Container): unknown;
export declare function rieszEnergy(family: Family, copy: {
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    frontier?: IntuitionCard;
}): ProblemModule;
export declare function huddledPoints(n: number, container: Container): unknown;
export {};
