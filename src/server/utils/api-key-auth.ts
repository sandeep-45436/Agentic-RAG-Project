import { db } from "@/server/db/prisma";
import { createHash } from "crypto";

/**
 * Hash a plaintext API key using SHA-256.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an incoming HTTP request using API Key headers.
 * Looks for 'x-api-key' or 'Authorization: Bearer <key>'.
 * If valid, returns the associated organization ID and updates lastUsedAt.
 */
export async function validateApiKeyRequest(req: Request): Promise<{ organizationId: string } | null> {
  try {
    let keyToValidate: string | null = null;

    // 1. Check for x-api-key header
    const xApiKey = req.headers.get("x-api-key");
    if (xApiKey) {
      keyToValidate = xApiKey.trim();
    } else {
      // 2. Check for Authorization: Bearer <key>
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        keyToValidate = authHeader.substring(7).trim();
      }
    }

    if (!keyToValidate) {
      return null;
    }

    // Hash the incoming key
    const hashedKey = hashApiKey(keyToValidate);

    // Query database for matching active API key
    const apiKeyRecord = await db.apiKey.findFirst({
      where: {
        key: hashedKey,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!apiKeyRecord) {
      return null;
    }

    // Update lastUsedAt in the background (non-blocking)
    db.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch((err) => {
      console.warn(`[ApiKeyAuth] Failed to update lastUsedAt for key ${apiKeyRecord.id}:`, err);
    });

    return { organizationId: apiKeyRecord.organizationId };
  } catch (error) {
    console.error("[ApiKeyAuth] Error during API key validation:", error);
    return null;
  }
}
