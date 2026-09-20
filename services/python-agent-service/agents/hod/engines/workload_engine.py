from typing import List, Dict, Any

class WorkloadBalancerEngine:
    """
    Deterministic Faculty Teaching & Lab Workload Balancer.
    Enforces AICTE/UGC credit limits (e.g., Assistant Professor: 16 hrs/week, Associate: 14 hrs, Professor: 12 hrs).
    """

    MAX_HOURS = {
        "ASSISTANT_PROFESSOR": 16,
        "ASSOCIATE_PROFESSOR": 14,
        "PROFESSOR": 12,
        "DEFAULT": 16
    }

    @classmethod
    def evaluate_workload(cls, faculty_roster: List[Dict[str, Any]]) -> Dict[str, Any]:
        overloaded = []
        underloaded = []
        balanced = []

        for member in faculty_roster:
            name = member.get("name", "Faculty Member")
            designation = member.get("designation", "ASSISTANT_PROFESSOR").upper()
            allocated_hours = float(member.get("weeklyHours", 14.0))
            max_allowed = cls.MAX_HOURS.get(designation, cls.MAX_HOURS["DEFAULT"])

            entry = {
                "id": member.get("id"),
                "name": name,
                "designation": designation,
                "weeklyHours": allocated_hours,
                "maxAllowedHours": max_allowed,
                "variance": round(allocated_hours - max_allowed, 1)
            }

            if allocated_hours > max_allowed:
                entry["status"] = "OVERLOADED"
                overloaded.append(entry)
            elif allocated_hours < (max_allowed - 4):
                entry["status"] = "UNDERLOADED"
                underloaded.append(entry)
            else:
                entry["status"] = "BALANCED"
                balanced.append(entry)

        return {
            "totalFaculty": len(faculty_roster),
            "overloadedCount": len(overloaded),
            "underloadedCount": len(underloaded),
            "balancedCount": len(balanced),
            "overloaded": overloaded,
            "underloaded": underloaded,
            "balanced": balanced
        }
