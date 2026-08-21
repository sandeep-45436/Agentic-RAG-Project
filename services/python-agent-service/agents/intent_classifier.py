import re
from typing import Dict, Any


class PythonIntentClassifier:
    @classmethod
    def classify(cls, query_text: str) -> Dict[str, Any]:
        text = query_text.strip().lower()
        entities = {}

        # Entity extraction
        dept_match = re.search(r"\b(cs|computer science|math|ee|electrical|physics|bio|chemistry)\b", text)
        if dept_match:
            entities["departmentCode"] = dept_match.group(1).upper()

        gpa_match = re.search(r"\b(gpa|grade point)\s*(below|<|under|=|>)?\s*(\d\.\d)\b", text)
        if gpa_match:
            entities["gpaThreshold"] = float(gpa_match.group(3))

        # Intent classification
        is_greeting = bool(re.match(r"^(hi|hello|hey|greetings|thanks|thank you)\b", text))
        if is_greeting and len(text.split()) <= 4:
            return {
                "category": "GREETING_CONVERSATIONAL",
                "isFastPath": True,
                "entities": entities,
                "confidence": 0.98
            }

        has_workflow = bool(re.search(r"\b(email|alert|notify|send|generate pdf|transcript|export)\b", text))
        has_data = bool(re.search(r"\b(gpa|probation|tuition|balance|unpaid|faculty|professor|courses|student|roster)\b", text))
        has_knowledge = bool(re.search(r"\b(policy|rules|handbook|syllabus|regulation|drop date|deadline)\b", text))

        if has_workflow and (has_data or has_knowledge):
            category = "MULTI_STEP_COGNITIVE_GOAL"
            fast_path = False
        elif has_workflow:
            category = "WORKFLOW_ACTION_TRIGGER"
            fast_path = False
        elif has_data and not has_knowledge:
            category = "STRUCTURED_DATA_QUERY"
            fast_path = True
        elif has_knowledge and not has_data:
            category = "INFORMATION_RETRIEVAL"
            fast_path = True
        else:
            category = "MULTI_STEP_COGNITIVE_GOAL"
            fast_path = False

        return {
            "category": category,
            "isFastPath": fast_path,
            "entities": entities,
            "confidence": 0.90
        }
