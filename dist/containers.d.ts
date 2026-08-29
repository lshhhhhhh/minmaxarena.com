export type Container = {
    id: string;
    /** Bounding box, in the same 10⁻⁹ units as every coordinate. */
    width: number;
    height: number;
    /** The board class the drawing uses. */
    board: string;
    /** Chinese and English names, for the problem statements built from these. */
    name: string;
    nameEn: string;
    /** One sentence saying where the origin is and how far the coordinates run. */
    frame: string;
    frameEn: string;
    /** Does a disc of this radius, centred here, lie entirely inside? */
    fitsDisc(x: number, y: number, radius: number): boolean;
    /** Is this point inside, boundary included? */
    holds(x: number, y: number): boolean;
    /** A disc that certainly fits. Baselines are built from it, and points spread
     *  around a circle are never three-collinear -- which is what the
     *  smallest-triangle problems need of a starting answer. */
    inscribed: {
        x: number;
        y: number;
        r: number;
    };
};
export declare const square: Container;
export declare const rectangle: Container;
export declare const disc: Container;
export declare const equilateral: Container;
export declare const triangle: Container;
export declare const ell: Container;
export declare const cross: Container;
export declare const semicircle: Container;
export declare const annulus: Container;
export declare const quadrant: Container;
export declare const containers: {
    square: Container;
    rectangle: Container;
    disc: Container;
    triangle: Container;
    equilateral: Container;
    ell: Container;
    cross: Container;
    semicircle: Container;
    annulus: Container;
    quadrant: Container;
};
