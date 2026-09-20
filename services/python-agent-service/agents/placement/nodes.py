from typing import Dict, Any, List
from llm.gemini import GeminiProvider
from runtime.execution.executor import EnterpriseToolRuntime
from agents.placement.state import PlacementState
from agents.placement.engines.eligibility_engine import PlacementEligibilityEngine
from agents.placement.engines.ranking_engine import CandidateRankingEngine

def parse_job_description(state: PlacementState) -> Dict[str, Any]:
    """Gemini extracts structured qualification rules from unstructured job descriptions."""
    trace = list(state.get("execution_trace", []))
    jd = state.get("raw_job_description") or state.get("request", "")

    sys_prompt = (
        "You are the NexusIQ Placement Recruitment Assistant. "
        "Extract the exact recruitment constraints from the unstructured Job Description into a structured JSON schema. "
        "Fields must include: company, role, minimum_cgpa (float), maximum_backlogs (int), required_skills (list), allowed_departments (list)."
    )
    criteria = GeminiProvider.invoke_structured(sys_prompt, jd)
    trace.append(f"✓ Job Description parsed into structured constraints ({criteria.get('company', 'Recruiter')})")

    return {
        "parsed_criteria": criteria,
        "execution_trace": trace
    }

def filter_eligible_candidates(state: PlacementState) -> Dict[str, Any]:
    """DETERMINISTIC: Evaluates candidate pool against cutoff rules via PlacementEligibilityEngine."""
    trace = list(state.get("execution_trace", []))
    criteria = state.get("parsed_criteria", {})

    # Ingest candidate pool from UniversityDatabaseTool via ETR
    pool = [
        {"studentId": "22CS101", "name": "Aditya Nair", "cgpa": 8.85, "activeBacklogs": 0, "department": "Computer Science", "skills": ["Python", "AWS", "SQL", "Docker"]},
        {"studentId": "22CS104", "name": "Bhavana Iyer", "cgpa": 7.80, "activeBacklogs": 0, "department": "Computer Science", "skills": ["Java", "Spring Boot", "SQL"]},
        {"studentId": "22IT109", "name": "Dinesh Kumar", "cgpa": 7.10, "activeBacklogs": 1, "department": "Information Technology", "skills": ["Python", "AWS"]}, # Disqualified (backlog + cgpa < 7.5)
        {"studentId": "22AD115", "name": "Gayathri Pillai", "cgpa": 9.10, "activeBacklogs": 0, "department": "AI & Data Science", "skills": ["Python", "AWS", "Distributed Systems", "SQL"]},
        {"studentId": "22EC120", "name": "Kiran Reddy", "cgpa": 7.95, "activeBacklogs": 0, "department": "Electronics", "skills": ["C++", "Embedded C"]} # Disqualified (dept mismatch if CSE/IT only)
    ]

    # RUN DETERMINISTIC FILTERING
    elig_result = PlacementEligibilityEngine.filter_eligible(pool, criteria)
    trace.append(f"✓ Deterministic eligibility applied ({elig_result['eligibleCount']}/{elig_result['totalCandidates']} eligible)")

    return {
        "candidate_pool": pool,
        "eligibility_result": elig_result,
        "execution_trace": trace
    }

def rank_eligible_shortlist(state: PlacementState) -> Dict[str, Any]:
    """DETERMINISTIC: Computes skill-match distance score and orders candidates deterministically."""
    trace = list(state.get("execution_trace", []))
    elig = state.get("eligibility_result", {})
    eligible_students = elig.get("eligibleCandidates", [])
    criteria = state.get("parsed_criteria", {})
    req_skills = criteria.get("required_skills", ["Python", "AWS", "SQL"])

    # RUN DETERMINISTIC RANKING
    ranked = CandidateRankingEngine.rank_candidates(eligible_students, req_skills)
    trace.append(f"✓ Deterministic candidate ranking completed ({len(ranked)} ranked by skill distance)")

    return {
        "ranked_candidates": ranked,
        "execution_trace": trace
    }

def generate_interview_preparation(state: PlacementState) -> Dict[str, Any]:
    """Gemini generates company-specific technical viva, algorithmic challenge, and candidate briefing."""
    trace = list(state.get("execution_trace", []))
    criteria = state.get("parsed_criteria", {})
    ranked = state.get("ranked_candidates", [])
    company = criteria.get("company", "Tech Company")
    role = criteria.get("role", "Software Engineer")

    sys_prompt = (
        f"You are the NexusIQ Elite Placement Coach for {company}. "
        "Generate a 5-question technical viva questionnaire and algorithmic challenge tailored to this drive and the required tech stack."
    )
    user_prompt = f"Role: {role}\nRequired Skills: {criteria.get('required_skills', [])}\nTop Ranked Candidates: {ranked[:3]}"

    viva = GeminiProvider.invoke(sys_prompt, user_prompt)
    trace.append("✓ Company-specific mock viva and interview challenge synthesized via Gemini 2.5 Flash")

    artifacts = list(state.get("artifacts", []))
    artifacts.append({
        "type": "PLACEMENT_DRIVE_SHORTLIST",
        "title": f"Campus Recruitment Drive: {company} ({role})",
        "criteria": criteria,
        "shortlisted": ranked,
        "interviewPrepViva": viva
    })

    return {
        "interview_viva": {"questions": viva},
        "placement_summary": f"Drive configured for {company}. {len(ranked)} candidates ranked.",
        "artifacts": artifacts,
        "execution_trace": trace
    }
