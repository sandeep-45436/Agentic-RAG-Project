from typing import Dict, Any, List
from runtime.base_tool import ToolMetadata


class ValidationEngine:
    @staticmethod
    def validate_input(metadata: ToolMetadata, payload: Dict[str, Any]) -> tuple[bool, List[str]]:
        errors = []
        schema = metadata.input_schema
        if not schema:
            return True, []

        required_fields = schema.get("required", [])
        for field in required_fields:
            if field not in payload or payload[field] is None:
                errors.append(f"Missing required input field: '{field}'")

        # Type checks
        properties = schema.get("properties", {})
        for prop_name, prop_spec in properties.items():
            if prop_name in payload and payload[prop_name] is not None:
                expected_type = prop_spec.get("type")
                val = payload[prop_name]
                if expected_type == "string" and not isinstance(val, str):
                    errors.append(f"Field '{prop_name}' must be a string, got {type(val).__name__}")
                elif expected_type == "integer" and not isinstance(val, int):
                    errors.append(f"Field '{prop_name}' must be an integer, got {type(val).__name__}")
                elif expected_type == "number" and not isinstance(val, (int, float)):
                    errors.append(f"Field '{prop_name}' must be a number, got {type(val).__name__}")
                elif expected_type == "boolean" and not isinstance(val, bool):
                    errors.append(f"Field '{prop_name}' must be a boolean, got {type(val).__name__}")

        if errors:
            return False, errors
        return True, []

    @staticmethod
    def validate_output(metadata: ToolMetadata, output: Dict[str, Any]) -> tuple[bool, List[str]]:
        # Output structure validation
        if not isinstance(output, dict):
            return False, [f"Tool output must be a dictionary, got {type(output).__name__}"]
        return True, []
