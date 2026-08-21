import time
from typing import Dict, Any


class HealthMonitor:
    @staticmethod
    def check_health(tools_map: Dict[str, Any]) -> Dict[str, Any]:
        tool_statuses = {}
        healthy_count = 0
        total_count = len(tools_map)

        for tool_id, tool_instance in tools_map.items():
            meta = tool_instance.metadata
            is_active = meta.status == "ACTIVE"
            if is_active:
                healthy_count += 1
            tool_statuses[tool_id] = {
                "name": meta.name,
                "version": meta.version,
                "category": meta.category,
                "status": meta.status,
                "healthy": is_active,
            }

        overall_status = "HEALTHY" if healthy_count == total_count else "DEGRADED" if healthy_count > 0 else "UNHEALTHY"

        return {
            "status": overall_status,
            "timestamp": time.time(),
            "activeTools": healthy_count,
            "totalTools": total_count,
            "tools": tool_statuses,
        }
