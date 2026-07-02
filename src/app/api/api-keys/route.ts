import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { randomBytes } from "crypto";
import { AuditService } from "@/server/services/audit";
import { hashApiKey } from "@/server/utils/api-key-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const keys = await db.apiKey.findMany({
      where: { organizationId: membership.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        preview: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    // Only expose a preview
    const sanitized = keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPreview: k.preview || "ai_live_xxxx...xxxx",
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));

    return NextResponse.json({ apiKeys: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // Generate a secure random key with 'ai_live_' prefix
    const rawKey = "ai_live_" + randomBytes(24).toString("hex");
    const preview = rawKey.slice(0, 12) + "..." + rawKey.slice(-4);
    const hashedKey = hashApiKey(rawKey);

    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        key: hashedKey,
        preview: preview,
        organizationId: membership.organizationId,
      },
    });

    // Log the API key creation event
    const userAgent = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

    await AuditService.logEvent({
      orgId: membership.organizationId,
      userId: user.id,
      action: "API_KEY_CREATED",
      ip,
      userAgent,
      metadata: {
        keyId: apiKey.id,
        name: apiKey.name,
      },
    });

    // Return the full key ONCE on creation, then only preview
    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // shown once
        keyPreview: preview,
        createdAt: apiKey.createdAt,
        lastUsedAt: null,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
