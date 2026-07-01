import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface QueueJob {
  id: string;
  type: string;
  payload: unknown;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  error?: string;
  createdAt: number;
}

export class QueueService {
  private static redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  private static redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  private static localQueuePath = path.join(process.cwd(), "scratch", "queue.json");

  /**
   * Helper to load jobs from local file queue
   */
  private static readLocalQueue(): Record<string, QueueJob> {
    try {
      const dir = path.dirname(this.localQueuePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.localQueuePath)) {
        fs.writeFileSync(this.localQueuePath, JSON.stringify({}));
      }
      const data = fs.readFileSync(this.localQueuePath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("[QueueService] Failed to read local queue", e);
      return {};
    }
  }

  /**
   * Helper to write jobs to local file queue
   */
  private static writeLocalQueue(queue: Record<string, QueueJob>): void {
    try {
      fs.writeFileSync(this.localQueuePath, JSON.stringify(queue, null, 2));
    } catch (e) {
      console.error("[QueueService] Failed to write local queue", e);
    }
  }

  /**
   * Enqueues a task for background processing
   */
  static async enqueue(type: string, payload: unknown): Promise<string> {
    const jobId = uuidv4();
    const job: QueueJob = {
      id: jobId,
      type,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
    };

    // Upstash Redis Enqueue
    if (this.redisUrl && this.redisToken) {
      try {
        await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["HSET", `queue:job:${jobId}`, "data", JSON.stringify(job)]),
        });
        
        // Push ID to queue list
        await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["LPUSH", "queue:jobs", jobId]),
        });

        this.triggerWorker(jobId);
        return jobId;
      } catch (err) {
        console.warn("[QueueService] Redis enqueue failed, fallback to local queue", err);
      }
    }

    // Local Disk Fallback
    const queue = this.readLocalQueue();
    queue[jobId] = job;
    this.writeLocalQueue(queue);

    this.triggerWorker(jobId);
    return jobId;
  }

  /**
   * Dequeues / Gets a job from the queue
   */
  static async getJob(jobId: string): Promise<QueueJob | null> {
    if (this.redisUrl && this.redisToken) {
      try {
        const res = await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["HGET", `queue:job:${jobId}`, "data"]),
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.result) {
            return JSON.parse(json.result) as QueueJob;
          }
        }
      } catch (err) {
        console.warn("[QueueService] Redis getJob failed", err);
      }
    }

    const queue = this.readLocalQueue();
    return queue[jobId] || null;
  }

  /**
   * Updates a job's status
   */
  static async updateJob(jobId: string, updates: Partial<QueueJob>): Promise<void> {
    if (this.redisUrl && this.redisToken) {
      try {
        const job = await this.getJob(jobId);
        if (job) {
          const updatedJob = { ...job, ...updates };
          await fetch(`${this.redisUrl}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.redisToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(["HSET", `queue:job:${jobId}`, "data", JSON.stringify(updatedJob)]),
          });
        }
        return;
      } catch (err) {
        console.warn("[QueueService] Redis updateJob failed", err);
      }
    }

    const queue = this.readLocalQueue();
    if (queue[jobId]) {
      queue[jobId] = { ...queue[jobId], ...updates };
      this.writeLocalQueue(queue);
    }
  }

  /**
   * Fires an HTTP POST request to the worker endpoint asynchronously
   */
  private static triggerWorker(jobId: string): void {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret";
    
    // Detached fetch execution using setTimeout to prevent blocking the request thread
    setTimeout(() => {
      fetch(`${appUrl}/api/jobs/worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ jobId }),
      }).catch((err) => {
        console.error("[QueueService] Background worker trigger failed:", err.message);
      });
    }, 50);
  }
}
