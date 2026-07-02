import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { ConversationService } from "@/server/services/conversation.service";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { appGraph } from "@/ai/graph/workflow";
import { syncUserToDatabase } from "@/server/actions/auth";
import { getMessageText } from "@/lib/utils";
import { validateApiKeyRequest } from "@/server/utils/api-key-auth";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    let organizationId: string | null = null;
    let userId: string | null = null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
      let membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) {
        await syncUserToDatabase();
        membership = await db.membership.findFirst({ where: { userId: user.id } });
      }
      if (membership) {
        organizationId = membership.organizationId;
      }
    } else {
      // Fallback to API Key authentication
      const apiKeyAuth = await validateApiKeyRequest(req);
      if (apiKeyAuth) {
        organizationId = apiKeyAuth.organizationId;
      }
    }

    if (!organizationId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, conversationId } = await req.json();
    console.log("POST /api/chat messages:", JSON.stringify(messages, null, 2));

    const latestMessage = messages[messages.length - 1];
    const userQuery = getMessageText(latestMessage);

    // Persist user message
    if (conversationId) {
      await ConversationService.addMessage(conversationId, organizationId, "USER", userQuery);
    }

    // Run LangGraph pipeline
    const finalState = await appGraph.invoke({
      messages,
      organizationId,
      userId: userId || "api_key_auth",
    });

    const systemPrompt = finalState.finalPrompt;
    const retrievedChunks = finalState.retrievedChunks ?? [];

    const coreMessages: any[] = [];
    messages.slice(0, -1).forEach((m: any) =>
      coreMessages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: getMessageText(m),
      })
    );
    coreMessages.push({ role: "user", content: userQuery });

    const result = streamText({
      model: openrouter("openai/gpt-4o-mini"),
      system: systemPrompt || undefined,
      messages: coreMessages,
      temperature: 0.3,
      async onFinish({ text }) {
        if (conversationId) {
          await ConversationService.addMessage(
            conversationId,
            organizationId,
            "ASSISTANT",
            text,
            retrievedChunks.length > 0 ? retrievedChunks : undefined
          );
        }
      },
    });

    // Pass retrieved chunks as a response header so the client can render the Context panel
    const response = result.toTextStreamResponse();
    const chunks = JSON.stringify(
      retrievedChunks.slice(0, 5).map((c: any) => ({
        documentName: c.documentName ?? c.payload?.documentName ?? "Source",
        chunkText: (c.chunkText ?? c.payload?.chunkText ?? "").substring(0, 200),
        score: c.score ?? null,
        chunkIndex: c.chunkIndex ?? c.payload?.chunkIndex ?? 0,
      }))
    );

    // Return as a new Response preserving the stream but adding the header
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "X-Retrieved-Chunks": encodeURIComponent(chunks),
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
