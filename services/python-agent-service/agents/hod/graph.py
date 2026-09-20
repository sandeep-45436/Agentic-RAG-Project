from langgraph.graph import StateGraph, START, END
from agents.hod.state import HODState
from agents.hod.nodes import (
    classify_hod_intent,
    execute_copo_calculation,
    execute_workload_balance
)

def route_hod_workflow(state: HODState) -> str:
    intent = state.get("intent", "COPO_AUDIT")
    if intent == "WORKLOAD_AUDIT":
        return "execute_workload_balance"
    return "execute_copo_calculation"

builder = StateGraph(HODState)

builder.add_node("classify_hod_intent", classify_hod_intent)
builder.add_node("execute_copo_calculation", execute_copo_calculation)
builder.add_node("execute_workload_balance", execute_workload_balance)

builder.add_edge(START, "classify_hod_intent")
builder.add_conditional_edges(
    "classify_hod_intent",
    route_hod_workflow,
    {
        "execute_copo_calculation": "execute_copo_calculation",
        "execute_workload_balance": "execute_workload_balance"
    }
)
builder.add_edge("execute_copo_calculation", END)
builder.add_edge("execute_workload_balance", END)

hod_graph = builder.compile()
