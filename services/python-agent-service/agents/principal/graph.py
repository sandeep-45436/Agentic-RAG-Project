from langgraph.graph import StateGraph, START, END
from agents.principal.state import PrincipalState
from agents.principal.nodes import (
    verify_institutional_scope,
    aggregate_university_benchmarks,
    synthesize_executive_briefing
)

builder = StateGraph(PrincipalState)

builder.add_node("verify_institutional_scope", verify_institutional_scope)
builder.add_node("aggregate_university_benchmarks", aggregate_university_benchmarks)
builder.add_node("synthesize_executive_briefing", synthesize_executive_briefing)

builder.add_edge(START, "verify_institutional_scope")
builder.add_edge("verify_institutional_scope", "aggregate_university_benchmarks")
builder.add_edge("aggregate_university_benchmarks", "synthesize_executive_briefing")
builder.add_edge("synthesize_executive_briefing", END)

principal_graph = builder.compile()
