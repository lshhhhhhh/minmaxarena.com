import type { ProblemTag } from "./problem-kit";

// What kind of thing each problem is, in one or two words on the card.
//
// The table lives apart from the problems for the same reason known-best.ts
// does: nineteen of them are generated from a parameter table in grid.ts and
// have no literal of their own to hang a field on.
//
// `classic` and `original` are about provenance, and the distinction is the
// point. Roughly two fifths of this catalogue is one question put into another
// container — "the smallest triangle, but in a plus sign" — and while those are
// perfectly good optimisation targets, nobody outside this site has ever
// studied them, so there is no literature to compare a record against and no
// reason the container was chosen beyond its being available. A reader deserves
// to know which they are looking at. Where a problem is borderline it is tagged
// `original`, because overstating our own provenance is the worse error.
//
// `easyBaseline` says the shipped answer is weak enough to beat without much
// work. It is only given where there is a number behind it, quoted in the
// comment on the row, rather than as an impression.
export const problemTags: Record<string, readonly ProblemTag[]> = {
  // --- studied elsewhere, under their own names -----------------------------
  P01: ["classic"],                          // circle packing in a square
  P02: ["classic", "easyBaseline"],          // circle packing in a circle; ceilings beat the loose-ring baseline by up to 3.1x
  P03: ["classic"],                          // Heilbronn's triangle problem
  P05: ["classic"],                          // tilted squares in a circle
  P06: ["classic"],                          // circles of radius 1…n in a circle
  P07: ["classic"],                          // spreading points in a disc
  P09: ["classic"],                          // circles in a semicircle
  P11: ["classic"],                          // circles in a right triangle
  P12: ["classic"],                          // circles in a 2:1 rectangle
  P13: ["classic"],                          // circles of radius 1…n in a square
  P15: ["classic"],                          // spreading points in a square
  P18: ["classic", "easyBaseline"],          // tilted squares in a square; a grid beats the single-row baseline 25x at n = 20
  P22: ["classic"],                          // Heilbronn in a disc
  P29: ["classic"],                          // Heilbronn in a triangle
  P58: ["classic"],                          // Heilbronn in an equilateral triangle
  P59: ["classic", "applied"],               // L2-star discrepancy: QMC / rendering sampling, Warnock's formula
  P60: ["classic", "applied"],               // real projective line packing, Sloane's tables
  P61: ["classic", "applied"],               // complex projective packing, Game of Sloanes
  P62: ["original", "applied"],              // worst 2D-projection uniformity, formed here on P59's kernel
  P63: ["original", "applied"],              // torus quadrature with the site's fixed lambda = 6 kernel
  P64: ["classic", "applied"],               // Grassmannian subspace packing, chordal distance
  P65: ["original", "applied"],              // maximin-volume erasure-robust frames
  P33: ["classic", "easyBaseline"],          // Riesz energy in a square; corners-plus-centre beats the baseline 77x at n = 5
  P34: ["classic"],                          // Riesz energy in a disc; every row now ships a best-known in-house certificate
  P51: ["classic"],                          // Friedman, lighting a square
  P57: ["classic", "easyBaseline"],          // sum of radii in a square; growing the shrunken grid back beats the seed by 25%
  P52: ["classic"],                          // Friedman, ratio of largest to smallest distance
  P53: ["classic", "applied", "easyBaseline"],          // biggest little polygon; the ring at its legal radius beats the shipped one 1.5625x
  P54: ["classic", "applied", "easyBaseline"],          // star discrepancy; unsquashing the shipped Hammersley set beats it
  P55: ["classic", "applied", "easyBaseline"],
  P56: ["original", "applied", "easyBaseline"],        // uniform mesh; restoring the dragged grid point beats the baseline ~1.4x          // optimal quantization; unsquashing the shipped grid beats it 1.6x at n=6, 3.2x at n=30

  // --- formed here, by putting a question into a container ------------------
  P08: ["original"],                         // circles in an L
  P10: ["original"],                         // circles in a plus sign
  P16: ["original"],                         // spreading points in a right triangle
  P17: ["original"],                         // spreading points in a rectangle
  P19: ["original"],                         // spreading points in an L
  P20: ["original"],                         // spreading points in a semicircle
  P21: ["original"],                         // spreading points in a plus sign
  P24: ["original"],                         // the smallest triangle in an L
  P25: ["original"],                         // the smallest triangle in a plus sign
  P26: ["original"],                         // the smallest triangle in a semicircle
  P27: ["original"],                         // spreading points in an annulus
  P28: ["original"],                         // the smallest triangle in an annulus
  P30: ["classic"],                          // circles in a quadrant; Specht ccq table records the family
  P31: ["original"],                         // spreading points in a quadrant
  P32: ["original"],                         // the smallest triangle in a quadrant
};
