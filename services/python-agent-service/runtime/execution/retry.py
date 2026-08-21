import time
import logging
from typing import Callable, Any, Dict, List

logger = logging.getLogger("ETR.RetryManager")


class RetryManager:
    NON_RETRYABLE_EXCEPTIONS = (
        PermissionError,
        ValueError,
        TypeError,
        KeyError,
    )

    @classmethod
    def execute_with_retry(
        cls,
        func: Callable[[], Any],
        max_retries: int = 3,
        initial_delay: float = 0.2,
    ) -> tuple[Any, int, List[str]]:
        attempts = 0
        warnings = []
        delay = initial_delay

        while attempts <= max_retries:
            try:
                attempts += 1
                result = func()
                return result, attempts - 1, warnings
            except Exception as e:
                # Do NOT retry non-retryable exceptions (permissions, validation, business rules)
                if isinstance(e, cls.NON_RETRYABLE_EXCEPTIONS) or "Permission" in str(type(e)):
                    raise e

                if attempts > max_retries:
                    logger.error(f"[RetryManager] Execution failed after {attempts} attempt(s): {e}")
                    raise e

                warn_msg = f"Transient failure on attempt {attempts}/{max_retries + 1}: {e}. Retrying in {delay}s..."
                warnings.append(warn_msg)
                logger.warning(f"[RetryManager] {warn_msg}")
                time.sleep(delay)
                delay *= 2.0
