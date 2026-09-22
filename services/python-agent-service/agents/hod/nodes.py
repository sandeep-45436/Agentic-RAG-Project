from typing import Dict, Any, List
from llm.gemini import GeminiProvider
from runtime.execution.executor import EnterpriseToolRuntime
from agents.hod.state import HODState
from agents.hod.engines.copo_engine import COPOAttainmentEngine
from agents.hod.engines.workload_engine import WorkloadBalancerEngine

def classify_hod_intent(state: HODState) -> Dict[str, Any]:
    """Determines HOD operational request: CO-PO audit, workload balance, or pacing check."""
    trace = list(state.get("execution_trace", []))
    req = state.get("request", "").lower()

    if any(w in req for w in ["copo", "co-po", "nba", "attainment", "outcome", "accreditation"]):
        intent = "COPO_AUDIT"
    elif any(w in req for w in ["workload", "faculty hours", "allocation", "teaching load", "credits"]):
        intent = "WORKLOAD_AUDIT"
    else:
        intent = "DEPARTMENT_OVERVIEW"

    trace.append(f"✓ Intent classified: {intent}")
    return {"intent": intent, "execution_trace": trace}

def execute_copo_calculation(state: HODState) -> Dict[str, Any]:
    """DETERMINISTIC: Evaluates CO-PO attainment values strictly using mathematical matrices."""
    trace = list(state.get("execution_trace", []))
    dept = state.get("department_id") or "CSE"

    # Seed data representing departmental assessment results
    co_scores = {
        "CO1": 2.85,  # Fundamentals & Algorithms
        "CO2": 2.40,  # Design & Architecture
        "CO3": 2.65,  # Systems & Concurrency
        "CO4": 1.85,  # Modern Tool Usage (Below target)
        "CO5": 2.30   # Real-world Project Application
    }
    mapping_matrix = {
        "CO1": {"PO1_EngineeringKnowledge": 3, "PO2_ProblemAnalysis": 2},
        "CO2": {"PO2_ProblemAnalysis": 3, "PO3_DesignDevelopment": 3},
        "CO3": {"PO1_EngineeringKnowledge": 2, "PO3_DesignDevelopment": 2, "PO4_Investigations": 3},
        "CO4": {"PO5_ModernToolUsage": 3, "PO9_Teamwork": 1},
        "CO5": {"PO3_DesignDevelopment": 2, "PO10_Communication": 2, "PO12_LifelongLearning": 2}
    }

    # RUN DETERMINISTIC CALCULATION
    result = COPOAttainmentEngine.calculate_attainment(co_scores, mapping_matrix)
    trace.append(f"✓ Deterministic CO-PO Attainment calculated ({result['overallCompliancePct']}% NBA compliance)")

    # Synthesize explanation via Gemini 2.5 Flash
    sys_prompt = "You are the NexusIQ NBA Accreditation Advisor. Synthesize an executive report based strictly on the deterministic CO-PO numbers provided."
    user_prompt = f"Department: {dept}\nCalculation Results:\n{result}"
    explanation = GeminiProvider.invoke(sys_prompt, user_prompt)
    trace.append("✓ Accreditation narrative and remedial actions synthesized via Gemini 2.5 Flash")

    provenance = {
        "source": "ALITS Departmental SIS & AICTE Audit Database",
        "datasetId": "hod-operations-v1",
        "mode": "Departmental Governance Sandbox",
        "isDemo": True,
    }

    artifacts = list(state.get("artifacts", []))
    artifacts.append({
        "type": "COPO_AUDIT_REPORT",
        "title": f"NBA Tier-1 Attainment Audit ({dept})",
        "data": {**result, "provenance": provenance},
        "narrative": explanation
    })

    return {
        "copo_result": result,
        "executive_narrative": explanation,
        "artifacts": artifacts,
        "execution_trace": trace
    }

def execute_workload_balance(state: HODState) -> Dict[str, Any]:
    """DETERMINISTIC: Validates faculty teaching hours against AICTE/UGC quotas."""
    trace = list(state.get("execution_trace", []))
    dept = state.get("department_id") or "CSE"

    roster = [
        {"id": "FAC01", "name": "Dr. K. Ramanathan", "designation": "PROFESSOR", "weeklyHours": 16.0}, # Over by 4 hrs
        {"id": "FAC02", "name": "Dr. S. Ananya", "designation": "ASSOCIATE_PROFESSOR", "weeklyHours": 13.5}, # Balanced
        {"id": "FAC03", "name": "Prof. V. Rajesh", "designation": "ASSISTANT_PROFESSOR", "weeklyHours": 18.0}, # Over by 2 hrs
        {"id": "FAC04", "name": "Prof. M. Sneha", "designation": "ASSISTANT_PROFESSOR", "weeklyHours": 10.0}, # Underloaded
        {"id": "FAC05", "name": "Dr. B. Harish", "designation": "ASSOCIATE_PROFESSOR", "weeklyHours": 14.0} # Balanced
    ]

    # RUN DETERMINISTIC WORKLOAD ENGINE
    workload_res = WorkloadBalancerEngine.evaluate_workload(roster)
    trace.append(f"✓ Deterministic faculty workload evaluated ({workload_res['overloadedCount']} overloaded)")

    # Gemini synthesizes reallocation plan
    sys_prompt = "You are the NexusIQ Department Operations Advisor. Synthesize a practical workload reallocation schedule based on the deterministic variance report."
    user_prompt = f"Department: {dept}\nWorkload Metrics:\n{workload_res}"
    narrative = GeminiProvider.invoke(sys_prompt, user_prompt)
    trace.append("✓ Workload redistribution recommendations synthesized via Gemini 2.5 Flash")

    provenance = {
        "source": "ALITS Departmental SIS & AICTE Audit Database",
        "datasetId": "hod-operations-v1",
        "mode": "Departmental Governance Sandbox",
        "isDemo": True,
    }

    artifacts = list(state.get("artifacts", []))
    artifacts.append({
        "type": "WORKLOAD_AUDIT_REPORT",
        "title": f"Faculty Teaching Load Balancing ({dept})",
        "data": {**workload_res, "provenance": provenance},
        "narrative": narrative
    })

    return {
        "faculty_roster": roster,
        "workload_result": workload_res,
        "executive_narrative": narrative,
        "artifacts": artifacts,
        "execution_trace": trace
    }
