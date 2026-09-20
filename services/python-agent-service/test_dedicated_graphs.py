import sys
import os

# Add services/python-agent-service to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from agents.faculty.engines.risk_engine import StudentRiskEngine
from agents.hod.engines.copo_engine import COPOAttainmentEngine
from agents.hod.engines.workload_engine import WorkloadBalancerEngine
from agents.principal.security.scope import InstitutionalScopeEnforcer
from agents.principal.engines.benchmark_engine import CrossDepartmentBenchmarkEngine
from agents.placement.engines.eligibility_engine import PlacementEligibilityEngine
from agents.placement.engines.ranking_engine import CandidateRankingEngine

from agents.faculty.graph import faculty_graph
from agents.hod.graph import hod_graph
from agents.principal.graph import principal_graph
from agents.placement.graph import placement_graph

def run_tests():
    print("\n========================================================")
    print(" [TEST] RUNNING NEXUSIQ DEDICATED LANGGRAPH DETERMINISM TESTS")
    print("========================================================\n")

    # 1. Faculty Risk Engine
    cohort = [
        {"id": "S1", "name": "Low Att", "attendancePct": 70.0, "internalMarksPct": 80.0},
        {"id": "S2", "name": "Good", "attendancePct": 90.0, "internalMarksPct": 85.0}
    ]
    res_risk = StudentRiskEngine.evaluate_cohort(cohort)
    assert res_risk["atRiskCount"] == 1, f"Expected 1 at-risk student, got {res_risk['atRiskCount']}"
    print("[PASS] 1. StudentRiskEngine passed deterministic attendance check.")

    # 2. HOD CO-PO Matrix Engine
    co_scores = {"CO1": 2.5, "CO2": 2.0}
    matrix = {"CO1": {"PO1": 3}, "CO2": {"PO1": 3}}
    copo = COPOAttainmentEngine.calculate_attainment(co_scores, matrix)
    assert copo["poAttainments"]["PO1"] == 2.25, f"Expected 2.25, got {copo['poAttainments']['PO1']}"
    print("[PASS] 2. COPOAttainmentEngine passed deterministic mathematical matrix dot product.")

    # 3. Principal Scope Enforcer
    try:
        InstitutionalScopeEnforcer.validate_and_scope("STUDENT", "org-1")
        assert False, "Should have raised PermissionError for STUDENT role"
    except PermissionError:
        print("[PASS] 3. InstitutionalScopeEnforcer blocked unauthorized access.")

    # 4. Placement Eligibility & Ranking
    candidates = [
        {"studentId": "C1", "name": "Alice", "cgpa": 8.5, "activeBacklogs": 0, "department": "CSE", "skills": ["Python", "AWS", "SQL"]},
        {"studentId": "C2", "name": "Bob", "cgpa": 7.2, "activeBacklogs": 0, "department": "CSE", "skills": ["Python"]}, # Low CGPA
        {"studentId": "C3", "name": "Charlie", "cgpa": 9.0, "activeBacklogs": 1, "department": "CSE", "skills": ["Python", "AWS"]} # Backlog
    ]
    criteria = {"minimum_cgpa": 7.5, "maximum_backlogs": 0, "allowed_departments": ["CSE"]}
    elig = PlacementEligibilityEngine.filter_eligible(candidates, criteria)
    assert elig["eligibleCount"] == 1, f"Expected exactly 1 eligible candidate, got {elig['eligibleCount']}"
    assert elig["eligibleCandidates"][0]["studentId"] == "C1"
    print("[PASS] 4. PlacementEligibilityEngine deterministically disqualified low CGPA & backlogged candidates.")

    ranked = CandidateRankingEngine.rank_candidates(elig["eligibleCandidates"], ["Python", "AWS", "SQL"])
    assert ranked[0]["rank"] == 1 and ranked[0]["skillMatchPct"] == 100.0
    print("[PASS] 5. CandidateRankingEngine deterministically computed 100% skill match score.")

    # 5. LangGraph End-to-End Invocations
    print("\n--- Testing LangGraph Workflows ---")

    # Faculty Graph Test
    f_res = faculty_graph.invoke({
        "organization_id": "test-org",
        "user_id": "prof-1",
        "user_role": "FACULTY",
        "request": "Generate a mid-term question paper for CSE204",
        "execution_trace": []
    })
    assert len(f_res.get("artifacts", [])) > 0
    print(f"[PASS] Faculty Graph completed. Trace steps: {len(f_res['execution_trace'])}")

    # Placement Graph Test
    p_res = placement_graph.invoke({
        "organization_id": "test-org",
        "user_id": "place-officer-1",
        "user_role": "PLACEMENT",
        "raw_job_description": "We are hiring for Google SDE! Minimum CGPA 7.5, zero backlogs, must know Python and AWS.",
        "execution_trace": []
    })
    assert len(p_res.get("artifacts", [])) > 0
    print(f"[PASS] Placement Graph completed. Trace steps: {len(p_res['execution_trace'])}")

    print("\n========================================================")
    print(" [SUCCESS] ALL 7 NEXUSIQ DEDICATED AGENT TESTS PASSED!")
    print("========================================================\n")

if __name__ == "__main__":
    run_tests()
