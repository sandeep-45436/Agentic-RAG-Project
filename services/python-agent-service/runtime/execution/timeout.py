import concurrent.futures
from typing import Callable, Any, Dict


class TimeoutManager:
    @staticmethod
    def execute_with_timeout(func: Callable[[Dict[str, Any], Any], Any], payload: Dict[str, Any], context: Any, timeout_seconds: int) -> Any:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(func, payload, context)
            try:
                return future.result(timeout=timeout_seconds)
            except concurrent.futures.TimeoutError:
                raise TimeoutError(f"Tool execution exceeded timeout of {timeout_seconds} seconds.")
