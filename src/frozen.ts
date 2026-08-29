// Generated from the site's own frozen table. A frozen problem is off the
// catalogue but not deleted: its records stand and its verifier still runs.
export const frozen: Record<string, { since: string; why: string }> = {
  "P27": {
    "since": "2026-08-27",
    "why": "Suspected of the same degeneracy that once evicted equal circles from the annulus: a band this narrow may make evenly spaced rings provably optimal over a whole range of n. Delisted while that audit runs."
  },
  "P07": {
    "since": "2026-08-28",
    "why": "The same problem as P02, equal circles in a disc: a packing of radius r and a spread of smallest distance d are related by the strictly monotone bijection d = 2r/(1 − r), so a solution to either is a solution to both. The catalogue keeps the packing side, which is the one the literature cites."
  },
  "P15": {
    "since": "2026-08-28",
    "why": "The same problem as P01, equal circles in the unit square, under d = 2r/(1 − 2r). Specht's table prints the two quantities as two columns of one table, which says it plainly enough. The catalogue keeps the packing side."
  }
};

export const isFrozen = (code: string): boolean => code in frozen;
