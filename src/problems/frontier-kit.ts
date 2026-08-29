import { SCALE, integerSqrt, parseFixed, printFixed, refuse, asArray } from "../problem-kit";

// Shared machinery for the frontier series (P59–P65): problems whose search
// space is a high-dimensional point set, a family of lines or subspaces, or a
// quadrature design, and whose authoritative score is still a finite exact
// computation — dot products, determinants, max and min, cleared to one
// bigint. Nothing here touches floats on the scoring path.

export const big = BigInt;
export const S = big(SCALE);

// ---- exact rounding helpers -------------------------------------------------
// Every conversion from an exact rational to a fixed-scale integer rounds in
// the direction that cannot flatter the submitter: up for a minimized score,
// down for a maximized one. Getting this backwards credits a record nobody
// achieved (see NEW-PROBLEM.md §2).

export function ceilDiv(p: bigint, q: bigint): bigint {
  if (q <= 0n) throw new Error("ceilDiv wants a positive denominator");
  return p >= 0n ? (p + q - 1n) / q : -((-p) / q);
}

export function floorDiv(p: bigint, q: bigint): bigint {
  if (q <= 0n) throw new Error("floorDiv wants a positive denominator");
  return p >= 0n ? p / q : -ceilDiv(-p, q);
}

// The least integer whose square is >= value: sqrt rounded up.
export function integerSqrtCeil(value: bigint): bigint {
  const root = integerSqrt(value);
  return root * root === value ? root : root + 1n;
}

// A non-negative integer count of 10^-places, printed as a plain decimal.
export function printScaled(units: bigint, places: number): string {
  const scale = 10n ** big(places);
  const whole = units / scale;
  const fraction = (units % scale).toString().padStart(places, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

// ---- certificate readers ----------------------------------------------------

// n rows of d decimal strings, each within [low, high] grid units. Returns
// plain scaled integers; the caller lifts to bigint where products may
// overflow a double.
export function readMatrix(
  value: unknown, name: string, rows: number, columns: number,
  low: number, high: number,
): number[][] {
  const raw = asArray(value, name);
  if (raw.length !== rows) refuse(`${name} 需要恰好 ${rows} 行`, `${name} needs exactly ${rows} rows`);
  return raw.map((entry, i) => {
    const row = asArray(entry, `${name}[${i}]`);
    if (row.length !== columns) refuse(`${name}[${i}] 需要恰好 ${columns} 个数`, `${name}[${i}] needs exactly ${columns} numbers`);
    return row.map((cell, j) => {
      const units = parseFixed(cell, `${name}[${i}][${j}]`);
      if (units < low || units > high)
        refuse(`${name}[${i}][${j}] 超出允许范围`, `${name}[${i}][${j}] is outside the allowed range`);
      return units;
    });
  });
}

// ---- exact fractions, only as far as the problems need ----------------------
// A non-negative fraction with a positive denominator, compared by cross
// multiplication. No reduction: the numbers stay small enough that gcd work
// would cost more than it saves at these sizes.
export type Ratio = { p: bigint; q: bigint };
export const ratioLess = (a: Ratio, b: Ratio) => a.p * b.q < b.p * a.q;

// ---- deterministic pseudo-randomness for baselines and exhibits -------------
// A 63-bit linear congruential generator, fully deterministic across
// platforms because it runs on bigints. Used ONLY to build reference and
// exhibition answers; never on a scoring path.
export function lcg(seed: number): () => number {
  let state = big(seed) * 2654435761n + 1013904223n;
  const modulus = 1n << 63n;
  return () => {
    state = (state * 6364136223846793005n + 1442695040888963407n) % modulus;
    // The top bits are the well-mixed ones.
    return Number(state >> 30n) % SCALE;
  };
}

// A decimal string in [-1, 1] with nine decimals, from the generator.
export function signedUnit(next: () => number): string {
  const magnitude = next() % (SCALE + 1);
  const sign = next() % 2 === 0 ? 1 : -1;
  return printFixed(sign * magnitude);
}

// A decimal string in [0, 1) with nine decimals.
export function unitCoordinate(next: () => number): string {
  return printFixed(next() % SCALE);
}

// The i-th Halton coordinate in the given prime base, rounded to the grid.
// Deterministic and classical; good enough to beat a deliberately poor
// baseline, which is all an exhibition answer has to do.
export function halton(index: number, base: number): string {
  let fraction = 0, scale = 1 / base, i = index;
  while (i > 0) { fraction += (i % base) * scale; i = Math.floor(i / base); scale /= base; }
  return printFixed(Math.min(SCALE - 1, Math.round(fraction * SCALE)));
}
