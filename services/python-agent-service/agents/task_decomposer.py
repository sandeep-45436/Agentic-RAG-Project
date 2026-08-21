import uuid
from typing import List, Dict, Any, Optional


class PythonTaskDecomposer:
    @classmethod
    def decompose_goal(
        cls,
        goal_text: str,
        raw_subtasks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        subtasks = []
        previous_id: Optional[str] = None

        for index, item in enumerate(raw_subtasks[:5]):
            current_id = str(uuid.uuid4())
            subtask = {
                "id": current_id,
                "order": index + 1,
                "type": item.get("type", "KNOWLEDGE_LOOKUP"),
                "query": item.get("query", goal_text).strip(),
                "dependsOnSubTaskId": previous_id,
                "status": "pending"
            }
            subtasks.append(subtask)
            previous_id = current_id

        print(f"[PythonTaskDecomposer] Decomposed goal '{goal_text}' into {len(subtasks)} ordered sub-tasks.")
        return subtasks
