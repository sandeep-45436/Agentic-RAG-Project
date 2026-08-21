/**
 * Latency budgets (in milliseconds) for each pipeline stage.
 *
 * Requirements: 8.1, 8.5
 *
 * Runtime overrides are applied at module load by reading environment variables
 * of the form:  LATENCY_BUDGET_<KEY_UPPERCASED>
 *
 * Examples:
 *   LATENCY_BUDGET_PLANNERNODDE            → plannerNode
 *   LATENCY_BUDGET_PLANNERNODE             → plannerNode
 *   LATENCY_BUDGET_PIPELINE_TOTAL          → pipeline_total
 *   LATENCY_BUDGET_QUERYCOMPLEXITYROUTER_RULEBASED → queryComplexityRouter_ruleBased
 *
 * Validation:
 *   - Per-stage values: integers 1–10000 ms (inclusive)
 *   - pipeline_total:   integers 1–30000 ms (inclusive)
 * Invalid values are ignored (warning logged) and the default is kept.
 */

/** Default latency budgets as required by Requirement 8.1 */
const defaults: Record<string, number> = {
  queryComplexityRouter_ruleBased: 10,
  queryComplexityRouter_modelAssisted: 150,
  analysisNode_fastPath: 50,
  analysisNode_llmRewrite: 300,
  plannerNode: 150,
  hybridRAGEngine: 500,
  reranker: 100,
  citationNode: 50,
  verificationNode: 200,
  responseNode_firstToken: 800,
  pipeline_total: 2000,
  pipeline_simple: 2000,      // Simple query: 1 LLM call, <2s target
  pipeline_complex: 8000,     // Complex cognitive path: multi-agent, <8s acceptable
};

/**
 * Build a mapping from the uppercased ENV-var suffix back to the canonical key.
 * e.g. "QUERYCOMPLEXITYROUTER_RULEBASED" → "queryComplexityRouter_ruleBased"
 */
function buildEnvKeyMap(keys: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of keys) {
    map.set(key.toUpperCase(), key);
  }
  return map;
}

/**
 * Validate a raw ENV-var value for a given canonical key.
 * Returns the parsed integer if valid, or null if invalid.
 */
function parseAndValidate(
  canonicalKey: string,
  rawValue: string,
  envVarName: string
): number | null {
  const parsed = Number(rawValue);

  // Must be a finite integer
  if (!Number.isInteger(parsed) || !Number.isFinite(parsed)) {
    console.warn(
      `[latencyBudgets] Invalid value for ${envVarName}: "${rawValue}" is not an integer. ` +
        `Keeping default (${defaults[canonicalKey]}ms).`
    );
    return null;
  }

  if (canonicalKey === "pipeline_total") {
    // pipeline_total: 1–30000 ms
    if (parsed < 1 || parsed > 30000) {
      console.warn(
        `[latencyBudgets] Out-of-range value for ${envVarName}: ${parsed}ms is outside 1–30000ms. ` +
          `Keeping default (${defaults[canonicalKey]}ms).`
      );
      return null;
    }
  } else {
    // Per-stage: 1–10000 ms
    if (parsed < 1 || parsed > 10000) {
      console.warn(
        `[latencyBudgets] Out-of-range value for ${envVarName}: ${parsed}ms is outside 1–10000ms. ` +
          `Keeping default (${defaults[canonicalKey]}ms).`
      );
      return null;
    }
  }

  return parsed;
}

/**
 * Apply ENV-var overrides to the defaults map.
 * Each key is checked against LATENCY_BUDGET_<KEY_UPPERCASED>.
 */
function applyEnvOverrides(
  base: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = { ...base };
  const envKeyMap = buildEnvKeyMap(Object.keys(base));

  for (const [upperKey, canonicalKey] of envKeyMap) {
    const envVarName = `LATENCY_BUDGET_${upperKey}`;
    const rawValue = process.env[envVarName];

    if (rawValue === undefined || rawValue === "") {
      // No override — keep default
      continue;
    }

    const validated = parseAndValidate(canonicalKey, rawValue.trim(), envVarName);
    if (validated !== null) {
      result[canonicalKey] = validated;
    }
  }

  return result;
}

/**
 * Exported latency budgets record (in milliseconds).
 * All 11 entries are present. ENV-var overrides are applied at module load.
 *
 * @example
 * import { latencyBudgets } from '@/ai/config/latency-budgets';
 * const budget = latencyBudgets['plannerNode']; // 150 (or overridden value)
 */
export const latencyBudgets: Record<string, number> = applyEnvOverrides(defaults);
