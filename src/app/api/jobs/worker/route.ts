import { NextResponse } from "next/server";
import { QueueService } from "@/server/services/queue.service";
import { EmbeddingService } from "@/server/services/embedding.service";
import { GraphExtractionService } from "@/server/services/graph-extraction.service";
import { FailoverLLM } from "@/ai/llm/failover";
import { CacheService } from "@/server/services/cache.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Enforce Server-to-Server Security Token Check
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await QueueService.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Guard: Prevent double-running the same job
    if (job.status === "completed" || job.status === "processing") {
      return NextResponse.json({ success: true, message: "Job already handled" });
    }

    // Set status to processing
    await QueueService.updateJob(jobId, {
      status: "processing",
      attempts: job.attempts + 1,
    });

    try {
      console.log(`[Worker] Starting job ${jobId} of type: ${job.type}`);
      
      switch (job.type) {
        case "EMBEDDING": {
          const { texts } = job.payload as { texts: string[] };
          if (!texts || !Array.isArray(texts)) throw new Error("Invalid payload: texts is required");
          
          // Generate embeddings via EmbeddingService (which handles its own retry logic)
          const embeddings = await EmbeddingService.embedBatch(texts);
          
          // Cache each generated vector by hashing the original text chunk
          for (let i = 0; i < texts.length; i++) {
            const hash = CacheService.hashKey(texts[i]);
            await CacheService.set(`embedding:${hash}`, embeddings[i], 86400 * 30); // 30 days TTL
          }
          break;
        }

        case "GRAPH_EXTRACTION": {
          const { text, organizationId, documentId } = job.payload as { text: string; organizationId: string; documentId: string };
          if (!text || !organizationId || !documentId) {
            throw new Error("Invalid payload: text, organizationId, and documentId are required");
          }
          // Extract graph nodes and ingest into Neo4j
          await GraphExtractionService.extractAndIngest(text, organizationId, documentId);
          break;
        }

        case "SUMMARIZATION": {
          const { messages, conversationId } = job.payload as { messages: any[]; conversationId: string };
          if (!messages || !conversationId) throw new Error("Invalid payload: messages and conversationId are required");
          
          const prompt = [
            { role: "system", content: "Provide a brief 3-5 word summary title for this conversation based on the messages." },
            { role: "user", content: JSON.stringify(messages) },
          ];

          // Use the FailoverLLM service to query OpenRouter model
          const result = await FailoverLLM.invoke(prompt, { temperature: 0.2 });
          const summary = result?.content?.toString() || "Chat Session";

          // Cache the summary for quick retrieval
          await CacheService.set(`summary:${conversationId}`, summary, 86400 * 7); // 7 days TTL
          break;
        }

        case "ANALYTICS_AGGREGATION": {
          const { organizationId } = job.payload as { organizationId: string };
          if (!organizationId) throw new Error("Invalid payload: organizationId is required");
          
          // Recalculates aggregates cache in Upstash/Local memory
          console.log(`[Worker] Simulating aggregation jobs for organization: ${organizationId}`);
          await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate task
          break;
        }

        default:
          throw new Error(`Unsupported job type: ${job.type}`);
      }

      // Success
      await QueueService.updateJob(jobId, { status: "completed" });
      console.log(`[Worker] Job ${jobId} completed successfully.`);
      return NextResponse.json({ success: true, jobId });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Worker] Job ${jobId} failed:`, errorMessage);
      
      const errorText = errorMessage;
      const maxRetries = 3;
      const willRetry = job.attempts + 1 < maxRetries;
      
      await QueueService.updateJob(jobId, {
        status: willRetry ? "pending" : "failed",
        error: errorText,
      });

      // If retry is possible, schedule a retry worker call
      if (willRetry) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        setTimeout(() => {
          fetch(`${appUrl}/api/jobs/worker`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cronSecret}`,
            },
            body: JSON.stringify({ jobId }),
          }).catch((e: unknown) => {
            const msg = e instanceof Error ? e.message : "Unknown error";
            console.error("[Worker] Retry trigger failed:", msg);
          });
        }, 3000 * (job.attempts + 1)); // backoff delay
      }

      return NextResponse.json({ error: errorText, jobId }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("[Worker] Main handler error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
