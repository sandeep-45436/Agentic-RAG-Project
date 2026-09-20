from typing import List, Dict, Any

class CrossDepartmentBenchmarkEngine:
    """
    Deterministic Cross-Department Performance Benchmarking Engine.
    Aggregates pass percentages, placement rates, and research publications deterministically.
    """

    @classmethod
    def compute_benchmarks(cls, departments_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        ranked_by_placement = sorted(
            departments_data,
            key=lambda x: float(x.get("placementRate", 0.0)),
            reverse=True
        )

        total_students = sum(int(d.get("studentCount", 0)) for d in departments_data)
        avg_placement = (
            sum(float(d.get("placementRate", 0.0)) * int(d.get("studentCount", 0)) for d in departments_data) / max(total_students, 1)
        )
        avg_pass = (
            sum(float(d.get("passRate", 0.0)) * int(d.get("studentCount", 0)) for d in departments_data) / max(total_students, 1)
        )
        total_pubs = sum(int(d.get("publicationsCount", 0)) for d in departments_data)

        return {
            "totalDepartments": len(departments_data),
            "totalStudents": total_students,
            "institutionalAvgPlacementPct": round(avg_placement, 2),
            "institutionalAvgPassPct": round(avg_pass, 2),
            "totalResearchPublications": total_pubs,
            "departmentalRankings": ranked_by_placement
        }
