import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { routerAgent } from "../agents/router-agent";
import { retrievalAgent } from "../agents/retrieval-agent";
import { citationAgent } from "../agents/citation-agent";
import { responseAgent } from "../agents/response-agent";
import { memoryAgent } from "../agents/memory-agent";

// Define the router condition function
const routeDecision = (state: typeof GraphState.State) => {
  return state.routedPath === "RETRIEVAL" ? "retrievalNode" : "memoryNode";
};

// 1. Initialize Graph
const workflow = new StateGraph(GraphState)
  // 2. Add Nodes
  .addNode("routerNode", routerAgent)
  .addNode("retrievalNode", retrievalAgent)
  .addNode("citationNode", citationAgent)
  .addNode("responseNode", responseAgent)
  .addNode("memoryNode", memoryAgent)
  
  // 3. Define Edges
  .addEdge(START, "routerNode")
  
  // Conditional routing based on routerAgent's output
  .addConditionalEdges("routerNode", routeDecision, {
    retrievalNode: "retrievalNode",
    memoryNode: "memoryNode",
  })
  
  // Retrieval Path
  .addEdge("retrievalNode", "citationNode")
  .addEdge("citationNode", "responseNode")
  
  // Memory Path (skips retrieval)
  .addEdge("memoryNode", "responseNode")
  
  // End
  .addEdge("responseNode", END);

// Compile the executable graph
export const appGraph = workflow.compile();
