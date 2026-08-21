/**
 * Wraps a promise with a hard timeout.
 *
 * If `promise` does not resolve or reject within `timeoutMs` milliseconds,
 * the returned promise rejects with:
 *   Error(`${label} timed out after ${timeoutMs}ms`)
 *
 * Requirements: 3.4, 3.5, 3.6, 5.8
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    // Allow the timeout handle to be garbage-collected if the main promise
    // settles first so the Node.js event loop is not kept alive unnecessarily.
    promise.then(
      () => clearTimeout(id),
      () => clearTimeout(id),
    );
  });

  return Promise.race([promise, timeout]);
}
