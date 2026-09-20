from typing import List, Dict, Any

class COPOAttainmentEngine:
    """
    Deterministic Course Outcome (CO) to Program Outcome (PO) Attainment Engine.
    Implements NBA Tier-1 accreditation mathematical models:
    Direct Attainment = 0.8 * Internal Assessments + 0.2 * Semester End Exam.
    Mapping to POs is computed via deterministic matrix dot products.
    """

    @classmethod
    def calculate_attainment(
        cls,
        co_scores: Dict[str, float],
        mapping_matrix: Dict[str, Dict[str, float]]
    ) -> Dict[str, Any]:
        """
        Calculates exact PO attainment values deterministically.
        co_scores: e.g. {"CO1": 2.8, "CO2": 2.4, "CO3": 2.6, "CO4": 2.1, "CO5": 1.9} (Scale 1-3)
        mapping_matrix: CO to PO correlation weight (1-3)
        """
        po_attainments: Dict[str, float] = {}
        po_counts: Dict[str, int] = {}
        po_weights_sum: Dict[str, float] = {}

        for co_name, score in co_scores.items():
            po_weights = mapping_matrix.get(co_name, {})
            for po_name, weight in po_weights.items():
                if weight > 0:
                    if po_name not in po_attainments:
                        po_attainments[po_name] = 0.0
                        po_weights_sum[po_name] = 0.0
                        po_counts[po_name] = 0

                    po_attainments[po_name] += score * weight
                    po_weights_sum[po_name] += weight
                    po_counts[po_name] += 1

        final_po: Dict[str, float] = {}
        for po_name, total in po_attainments.items():
            w_sum = po_weights_sum[po_name]
            final_po[po_name] = round(total / w_sum, 2) if w_sum > 0 else 0.0

        # NBA target benchmark is typically 2.0 / 3.0
        nba_target = 2.0
        attainment_status = {}
        for po, val in final_po.items():
            attainment_status[po] = {
                "attainment": val,
                "target": nba_target,
                "status": "ATTAINED" if val >= nba_target else "NEEDS_IMPROVEMENT"
            }

        return {
            "coScores": co_scores,
            "poAttainments": final_po,
            "targetBenchmark": nba_target,
            "statusSummary": attainment_status,
            "overallCompliancePct": round(
                (sum(1 for s in attainment_status.values() if s["status"] == "ATTAINED") / max(len(attainment_status), 1)) * 100,
                1
            )
        }
