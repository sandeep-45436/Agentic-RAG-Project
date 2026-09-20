from typing import List, Dict, Any

class PlacementEligibilityEngine:
    """
    Deterministic Placement Eligibility Engine.
    Filters candidate pools based strictly on institutional cutoff rules:
    - Minimum CGPA (e.g., >= 7.5)
    - Maximum active backlogs (e.g., 0)
    - Eligible academic branches / departments
    Gemini NEVER makes eligibility accept/reject decisions.
    """

    @classmethod
    def filter_eligible(
        cls,
        candidates: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        min_cgpa = float(criteria.get("minimum_cgpa", 7.0))
        max_backlogs = int(criteria.get("maximum_backlogs", 0))
        allowed_depts = [d.upper() for d in criteria.get("allowed_departments", [])]

        eligible = []
        ineligible = []

        for c in candidates:
            cgpa = float(c.get("cgpa", 0.0))
            backlogs = int(c.get("activeBacklogs", 0))
            dept = c.get("department", "").upper()

            rejection_reasons = []
            if cgpa < min_cgpa:
                rejection_reasons.append(f"CGPA below cutoff ({cgpa} < {min_cgpa})")
            if backlogs > max_backlogs:
                rejection_reasons.append(f"Active backlogs ({backlogs} > {max_backlogs})")
            if allowed_depts and not any(allowed in dept for allowed in allowed_depts):
                rejection_reasons.append(f"Department '{dept}' not eligible for drive")

            entry = {**c, "cgpa": cgpa, "activeBacklogs": backlogs}
            if rejection_reasons:
                entry["disqualificationReasons"] = rejection_reasons
                ineligible.append(entry)
            else:
                eligible.append(entry)

        return {
            "criteriaApplied": {
                "minCGPA": min_cgpa,
                "maxBacklogs": max_backlogs,
                "allowedDepartments": allowed_depts
            },
            "totalCandidates": len(candidates),
            "eligibleCount": len(eligible),
            "ineligibleCount": len(ineligible),
            "eligibleCandidates": eligible,
            "ineligibleCandidates": ineligible
        }
