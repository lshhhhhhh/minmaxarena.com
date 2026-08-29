import { problemModules } from "./problems";
import { frozen, isFrozen } from "./frozen";
import type { ProblemDefinition, ProblemInstanceDefinition, VerificationResult } from "./problem-kit";
export type { VerificationResult, ProblemDefinition, ProblemInstanceDefinition };
export { problemModules, frozen, isFrozen };
/**
 * Every sub-problem the catalogue offers, keyed by the id the site uses (for
 * example "p01-n30-v1").
 *
 * Pass { includeFrozen: true } for the ones taken off the catalogue as well.
 * Freezing a problem is not deleting it — the records people took still stand
 * and still have to be recomputable — but they are not something to work on,
 * so they are out of the way by default.
 */
export declare function instances(options?: {
    includeFrozen?: boolean;
}): Map<string, {
    definition: ProblemDefinition;
    instance: ProblemInstanceDefinition;
}>;
/**
 * Verify a certificate exactly, the same way minmaxarena.com does: integers
 * and bigints throughout, no tolerance, no floating point. A constraint holds
 * or the answer is rejected.
 */
export declare function verify(instanceId: string, answer: unknown): VerificationResult;
