import { Client } from 'langsmith';

// Check if LangSmith is enabled via environment variables
export const isLangSmithEnabled = () => {
  return process.env.LANGCHAIN_TRACING_V2 === 'true' && !!process.env.LANGCHAIN_API_KEY;
};

// Initialize LangSmith client for custom analytics/fetching traces if needed
// For most automatic tracing, just having LANGCHAIN_TRACING_V2=true is enough.
export const langsmithClient = new Client({
  apiUrl: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
  apiKey: process.env.LANGCHAIN_API_KEY,
});

/**
 * Utility to wrap an arbitrary function with a LangSmith trace if needed outside
 * standard LangChain LCEL chains.
 */
export async function withTrace<T>(
  name: string,
  runType: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  // If not enabled or no client, just run the function
  if (!isLangSmithEnabled()) {
    return await fn();
  }
  
  // NOTE: For LangChain 0.1+, `RunTree` can be used to manually construct traces.
  // We're keeping this simple as most tracing is automatic via LLM and Chain calls.
  return await fn();
}
