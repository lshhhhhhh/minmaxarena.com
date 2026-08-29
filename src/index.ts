import { problemModules } from "./problems";
import { fail, isObject, Refusal } from "./problem-kit";
import type { Obj, ProblemDefinition, ProblemInstanceDefinition, VerificationResult } from "./problem-kit";

export type { VerificationResult, ProblemDefinition, ProblemInstanceDefinition };
export { problemModules };

/** Every sub-problem, keyed by the id the site uses (for example "p01-n30-v1"). */
export function instances(): Map<string, { definition: ProblemDefinition; instance: ProblemInstanceDefinition }> {
  const found = new Map<string, { definition: ProblemDefinition; instance: ProblemInstanceDefinition }>();
  for (const module of problemModules) {
    const definition = module.definition;
    const list = definition.instances ?? [{
      instanceId: definition.instanceId, instanceName: definition.instanceName,
      instanceNameEn: definition.instanceNameEn ?? definition.instanceName,
      parameters: definition.parameters, baselineAnswer: definition.baselineAnswer,
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
  const found = instances().get(instanceId);
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
