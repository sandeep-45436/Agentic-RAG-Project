from typing import Dict, Any, Optional


class VersionManager:
    @staticmethod
    def resolve_tool_version(tool_id: str, requested_version: Optional[str], registered_tools: Dict[str, Any]) -> tuple[Any, str]:
        tool = registered_tools.get(tool_id)
        if not tool:
            raise ValueError(f"Tool '{tool_id}' is not registered in Enterprise Tool Runtime.")

        current_version = tool.metadata.version
        if requested_version and requested_version != current_version:
            print(f"[ETR.VersionManager] Requested version '{requested_version}' for '{tool_id}'. Resolving active version '{current_version}'.")

        return tool, current_version
