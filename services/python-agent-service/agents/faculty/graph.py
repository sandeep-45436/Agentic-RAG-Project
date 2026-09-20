from langgraph.graph import StateGraph, START, END
from agents.faculty.state import FacultyState
from agents.faculty.nodes import (
    classify_faculty_intent,
    retrieve_syllabus_context,
    synthesize_exam_paper,
    evaluate_student_risks,
    formulate_remedial_plan
)

def route_faculty_workflow(state: FacultyState) -> str:
    intent = state.get("intent", "EXAM_SYNTHESIS")
    if intent == "STUDENT_INTERVENTION":
        return "evaluate_student_risks"
    return "retrieve_syllabus_context"

# Build Faculty Graph
builder = StateGraph(FacultyState)

builder.add_node("classify_faculty_intent", classify_faculty_intent)
builder.add_node("retrieve_syllabus_context", retrieve_syllabus_context)
builder.add_node("synthesize_exam_paper", synthesize_exam_paper)
builder.add_node("evaluate_student_risks", evaluate_student_risks)
builder.add_node("formulate_remedial_plan", formulate_remedial_plan)

builder.add_edge(START, "classify_faculty_intent")
builder.add_conditional_edges(
    "classify_faculty_intent",
    route_faculty_workflow,
    {
        "retrieve_syllabus_context": "retrieve_syllabus_context",
        "evaluate_student_risks": "evaluate_student_risks"
    }
)
builder.add_edge("retrieve_syllabus_context", "synthesize_exam_paper")
builder.add_edge("synthesize_exam_paper", END)

builder.add_edge("evaluate_student_risks", "formulate_remedial_plan")
builder.add_edge("formulate_remedial_plan", END)

faculty_graph = builder.compile()
