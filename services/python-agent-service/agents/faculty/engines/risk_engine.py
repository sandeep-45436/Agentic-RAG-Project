from typing import List, Dict, Any

class StudentRiskEngine:
    """
    Deterministic Student Academic Risk Engine.
    Attendance < 75% or Assessment Score < 50% triggers at-risk flags deterministically.
    Never relies on LLM heuristics for threshold-based academic probation flags.
    """

    ATTENDANCE_THRESHOLD_PCT = 75.0
    ASSESSMENT_THRESHOLD_PCT = 50.0

    @classmethod
    def evaluate_cohort(cls, students: List[Dict[str, Any]]) -> Dict[str, Any]:
        at_risk_students = []
        safe_students = []

        for student in students:
            attendance = float(student.get("attendancePct", 100.0))
            internal_marks = float(student.get("internalMarksPct", 100.0))
            student_id = student.get("id") or student.get("studentNumber", "UNKNOWN")
            student_name = student.get("name", "Unnamed Student")

            risk_reasons = []
            if attendance < cls.ATTENDANCE_THRESHOLD_PCT:
                risk_reasons.append(f"Low attendance ({attendance}% < {cls.ATTENDANCE_THRESHOLD_PCT}%)")
            if internal_marks < cls.ASSESSMENT_THRESHOLD_PCT:
                risk_reasons.append(f"Failing internal marks ({internal_marks}% < {cls.ASSESSMENT_THRESHOLD_PCT}%)")

            if risk_reasons:
                at_risk_students.append({
                    "studentId": student_id,
                    "name": student_name,
                    "attendancePct": attendance,
                    "internalMarksPct": internal_marks,
                    "riskReasons": risk_reasons,
                    "severity": "CRITICAL" if len(risk_reasons) > 1 else "WARNING"
                })
            else:
                safe_students.append({
                    "studentId": student_id,
                    "name": student_name,
                    "attendancePct": attendance,
                    "internalMarksPct": internal_marks
                })

        return {
            "totalEvaluated": len(students),
            "atRiskCount": len(at_risk_students),
            "atRiskRatio": round(len(at_risk_students) / max(len(students), 1), 3),
            "atRiskStudents": at_risk_students,
            "safeCount": len(safe_students)
        }
