from langgraph.graph import StateGraph, START, END
from agents.placement.state import PlacementState
from agents.placement.nodes import (
    parse_job_description,
    filter_eligible_candidates,
    rank_eligible_shortlist,
    generate_interview_preparation
)

builder = StateGraph(PlacementState)

builder.add_node("parse_job_description", parse_job_description)
builder.add_node("filter_eligible_candidates", filter_eligible_candidates)
builder.add_node("rank_eligible_shortlist", rank_eligible_shortlist)
builder.add_node("generate_interview_preparation", generate_interview_preparation)

builder.add_edge(START, "parse_job_description")
builder.add_edge("parse_job_description", "filter_eligible_candidates")
builder.add_edge("filter_eligible_candidates", "rank_eligible_shortlist")
builder.add_edge("rank_eligible_shortlist", "generate_interview_preparation")
builder.add_edge("generate_interview_preparation", END)

placement_graph = builder.compile()
