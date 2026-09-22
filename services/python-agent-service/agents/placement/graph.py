from langgraph.graph import StateGraph, START, END
from agents.placement.state import PlacementState
from agents.placement.nodes import (
    classify_intent,
    retrieve_context,
    parse_job_description,
    filter_eligible_candidates,
    rank_eligible_shortlist,
    verify_deterministic_invariants,
    synthesize_placement_briefing,
)

builder = StateGraph(PlacementState)

builder.add_node("classify_intent", classify_intent)
builder.add_node("retrieve_context", retrieve_context)
builder.add_node("parse_job_description", parse_job_description)
builder.add_node("filter_eligible_candidates", filter_eligible_candidates)
builder.add_node("rank_eligible_shortlist", rank_eligible_shortlist)
builder.add_node("verify_deterministic_invariants", verify_deterministic_invariants)
builder.add_node("synthesize_placement_briefing", synthesize_placement_briefing)

builder.add_edge(START, "classify_intent")
builder.add_edge("classify_intent", "retrieve_context")
builder.add_edge("retrieve_context", "parse_job_description")
builder.add_edge("parse_job_description", "filter_eligible_candidates")
builder.add_edge("filter_eligible_candidates", "rank_eligible_shortlist")
builder.add_edge("rank_eligible_shortlist", "verify_deterministic_invariants")
builder.add_edge("verify_deterministic_invariants", "synthesize_placement_briefing")
builder.add_edge("synthesize_placement_briefing", END)

placement_graph = builder.compile()
