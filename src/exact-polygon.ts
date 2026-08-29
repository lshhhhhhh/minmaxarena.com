// Exact plane geometry over the rationals, for problems whose score is an
// integral rather than a distance.
//
// The one problem this exists for is optimal quantization: the region a point
// serves is the set of places closer to it than to any rival, and
//
//   |x − p|² ≤ |x − q|²   ⟺   2(q − p)·x ≤ |q|² − |p|²
//
// is linear in x. So a cell is the square cut by one half-plane per rival: a
// convex polygon whose corners are rational, being intersections of lines with
// integer coefficients. Integrating a quadratic over such a polygon is a closed
// form in its corners, so the whole integral is an exact rational and the
// verifier never touches a float.
//
// The cost is that the corners' denominators compound: each clip multiplies
// them, and two nearly parallel bisectors produce a corner whose denominator is
// the product of everything that built it. Every vertex is therefore reduced on
// creation, which is the difference between a denominator that settles and one
// that doubles on every edge.

// A corner, as (nx/d, ny/d) with d > 0 and the three sharing no common factor.
export type RationalPoint = readonly [bigint, bigint, bigint];
export type Rational = { num: bigint; den: bigint };

const abs = (value: bigint) => (value < 0n ? -value : value);

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a); b = abs(b);
  while (b) { const rest = a % b; a = b; b = rest; }
  return a;
}

export function vertex(nx: bigint, ny: bigint, d: bigint): RationalPoint {
  if (d === 0n) throw new Error("a corner with no denominator");
  if (d < 0n) { nx = -nx; ny = -ny; d = -d; }
  const common = gcd(gcd(nx, ny), d);
  return common > 1n ? [nx / common, ny / common, d / common] : [nx, ny, d];
}

export const rational = (num: bigint, den: bigint): Rational => {
  if (den < 0n) { num = -num; den = -den; }
  const common = gcd(num, den);
  return common > 1n ? { num: num / common, den: den / common } : { num, den };
};

export const addRational = (a: Rational, b: Rational): Rational =>
  rational(a.num * b.den + b.num * a.den, a.den * b.den);

// Which side of a·x + b·y = c a corner falls on, in the sign of the result.
const side = ([nx, ny, d]: RationalPoint, a: bigint, b: bigint, c: bigint) => a * nx + b * ny - c * d;

// Sutherland–Hodgman against one half-plane, keeping a·x + b·y ≤ c.
//
// The boundary is kept, so two cells sharing an edge both contain it. That
// double-counts a set of zero area, which an integral does not notice and which
// is the reason ties between equidistant points need no rule here.
export function clipHalfPlane(poly: RationalPoint[], a: bigint, b: bigint, c: bigint): RationalPoint[] {
  if (a === 0n && b === 0n) return c >= 0n ? poly : [];
  const out: RationalPoint[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const from = poly[i], to = poly[(i + 1) % poly.length];
    const here = side(from, a, b, c), there = side(to, a, b, c);
    if (here <= 0n) out.push(from);
    if ((here < 0n && there > 0n) || (here > 0n && there < 0n)) {
      const [px, py, pd] = from, [qx, qy, qd] = to;
      // The crossing at parameter t = here/(here − there) along the edge,
      // cleared of denominators.
      const lead = here * qd, span = lead - there * pd;
      out.push(vertex(px * qd * span + lead * (qx * pd - px * qd),
                      py * qd * span + lead * (qy * pd - py * qd),
                      pd * qd * span));
    }
  }
  return out;
}

// Twice the signed area of a polygon given in integer coordinates.
export function twiceSignedArea(poly: readonly (readonly [bigint, bigint])[]): bigint {
  let total = 0n;
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    total += x1 * y2 - x2 * y1;
  }
  return total;
}

// Twelve times ∫∫ (x² + y²) dA over a polygon in integer coordinates.
//
// One term per edge, from the standard second-moment identity
//   12·∫∫x² dA = Σ cross·(x₁² + x₁x₂ + x₂²)
// and the same in y. Positive for a counter-clockwise polygon.
export function twelveTimesSecondMoment(poly: readonly (readonly [bigint, bigint])[]): bigint {
  let total = 0n;
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    total += (x1 * y2 - x2 * y1) * (x1 * x1 + x1 * x2 + x2 * x2 + y1 * y1 + y1 * y2 + y2 * y2);
  }
  return total;
}

// Put a rational polygon over one denominator, with `about` moved to the
// origin, so the identities above run in whole numbers. Returns the integer
// corners and the scale they were multiplied by.
export function overCommonDenominator(poly: RationalPoint[], about: readonly [bigint, bigint]) {
  let common = 1n;
  for (const [, , d] of poly) common = common / gcd(common, d) * d;
  const corners = poly.map(([nx, ny, d]) => {
    const lift = common / d;
    return [(nx - about[0] * d) * lift, (ny - about[1] * d) * lift] as const;
  });
  return { corners, common };
}

// ∫∫ |x − about|² dA over a rational polygon, exactly.
export function secondMomentAbout(poly: RationalPoint[], about: readonly [bigint, bigint]): Rational {
  if (poly.length < 3) return { num: 0n, den: 1n };
  const { corners, common } = overCommonDenominator(poly, about);
  // Scaling the corners by `common` scales this degree-four form by common⁴.
  return rational(abs(twelveTimesSecondMoment(corners)), 12n * common ** 4n);
}

// The polygon's area, exactly — used to prove the cells tile the container.
export function areaOf(poly: RationalPoint[]): Rational {
  if (poly.length < 3) return { num: 0n, den: 1n };
  const { corners, common } = overCommonDenominator(poly, [0n, 0n]);
  return rational(abs(twiceSignedArea(corners)), 2n * common ** 2n);
}

// The region of `box` closer to points[index] than to any other point, as a
// convex rational polygon. An empty result means the point serves nowhere.
export function cellOf(points: readonly (readonly [bigint, bigint])[], index: number, box: RationalPoint[]): RationalPoint[] {
  const [xi, yi] = points[index];
  let poly = box;
  for (let j = 0; j < points.length; j += 1) {
    if (j === index) continue;
    const [xj, yj] = points[j];
    // 2(pⱼ − pᵢ)·x ≤ |pⱼ|² − |pᵢ|². Ties are settled by index, so a point
    // repeated in the answer does not claim the same ground twice.
    const a = 2n * (xj - xi), b = 2n * (yj - yi), c = xj * xj + yj * yj - xi * xi - yi * yi;
    poly = a === 0n && b === 0n && c === 0n
      ? (j < index ? [] : poly)
      : clipHalfPlane(poly, a, b, c);
    if (poly.length < 3) return [];
  }
  return poly;
}

export const squareBox = (size: bigint): RationalPoint[] =>
  [vertex(0n, 0n, 1n), vertex(size, 0n, 1n), vertex(size, size, 1n), vertex(0n, size, 1n)];

// The polygon's centroid, exactly. Lloyd's algorithm walks each point to the
// centroid of the region it serves, and the page draws the line from the worst
// cell's centroid to the point serving it, so both want this.
export function centroidOf(poly: RationalPoint[]): { x: Rational; y: Rational } | null {
  if (poly.length < 3) return null;
  const { corners, common } = overCommonDenominator(poly, [0n, 0n]);
  const twiceArea = twiceSignedArea(corners);
  if (twiceArea === 0n) return null;
  let sumX = 0n, sumY = 0n;
  for (let i = 0; i < corners.length; i += 1) {
    const [x1, y1] = corners[i], [x2, y2] = corners[(i + 1) % corners.length];
    const cross = x1 * y2 - x2 * y1;
    sumX += cross * (x1 + x2);
    sumY += cross * (y1 + y2);
  }
  // Σcross(x₁+x₂) = 6·area·x̄, and the corners were lifted by `common`.
  return { x: rational(sumX, 3n * twiceArea * common), y: rational(sumY, 3n * twiceArea * common) };
}
