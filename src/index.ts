import { problemModules } from "./problems";
import { frozen, isFrozen } from "./frozen";
import { fail, isObject, Refusal } from "./problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, VerificationResult } from "./problem-kit";

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
export function instances(options: { includeFrozen?: boolean } = {}): Map<string, { definition: ProblemDefinition; instance: ProblemInstanceDefinition }> {
  const found = new Map<string, { definition: ProblemDefinition; instance: ProblemInstanceDefinition }>();
  for (const module of problemModules) {
    const definition = module.definition;
    if (!options.includeFrozen && isFrozen(definition.code)) continue;
    const list = definition.instances ?? [{
      instanceId: definition.instanceId,
      instanceName: definition.instanceName,
      instanceNameEn: definition.instanceNameEn ?? definition.instanceName,
      parameters: definition.parameters,
      baselineAnswer: definition.baselineAnswer,
    } as ProblemInstanceDefinition];
    for (const instance of list) found.set(instance.instanceId, { definition, instance });
  }
  return found;
}

/**
 * Verify a certificate exactly, the same way minmaxarena.com does: integers
 * and bigints throughout, no tolerance, no floating point. A constraint holds
 * or the answer is rejected.
 */
export function verify(instanceId: string, answer: unknown): VerificationResult {
  // Frozen included: a record already taken has to stay recomputable.
  const found = instances({ includeFrozen: true }).get(instanceId);
  if (!found) return fail("UNKNOWN_INSTANCE", "找不到这道子题", "Instance not found");
  if (!isObject(answer)) return fail("BAD_SHAPE", "答案必须是一个 JSON 对象", "The answer must be a JSON object");
  const module = problemModules.find((candidate) => candidate.definition.code === found.definition.code)!;
  try {
    return module.verify((found.instance.parameters ?? found.definition.parameters) as Obj, answer as Obj);
  } catch (error) {
    // A Refusal says itself in both languages; anything else reaching here is
    // a fault rather than a refusal. Same handling as the site's validators.ts.
    if (error instanceof Refusal) return fail("BAD_ANSWER", error.message, error.messageEn);
    const reason = error instanceof Error ? error.message : null;
    return fail("BAD_ANSWER", reason ?? "答案格式错误", reason ?? "The answer is malformed");
  }
}
