# Enterprise Production Hardening & Architecture Guide

This document outlines the architecture, setup guides, and hardening checklists to prepare the multi-tenant AI SaaS platform for enterprise production deployments.

---

## 🔒 1. Multi-Tenant Organization Isolation

To prevent data leaks between organizations (tenants), strict isolation rules must be enforced at database and search layers.

### SQL Layer (PostgreSQL / Prisma)
1. **Always Filter by `organizationId`**: Never run select, update, or delete commands without scoping the queries to `organizationId`.
   * *Example*:
     ```typescript
     const docs = await db.document.findMany({
       where: { organizationId, deletedAt: null }
     });
     ```
2. **Row Level Security (RLS)**: Enforce Postgres RLS on tenant tables using Supabase. A tenant policy can restrict select/write access to rows where `organization_id` matches the user's active membership ID.

### Vector Layer (Qdrant)
1. **Payload Filters**: Every similarity query must use a payload filter matching the organization.
   * *Example Qdrant Payload Filter*:
     ```json
     {
       "filter": {
         "must": [
           { "key": "organizationId", "match": { "value": "tenant-uuid-123" } }
         ]
       }
     }
     ```
2. **Scoping**: When chunks are indexed in Qdrant, the `organizationId` payload field must be appended to the vector metadata block.

---

## 🔑 2. Enterprise Single Sign-On (SSO) & advanced RBAC

Enterprise users expect to sign in via corporate Identity Providers (IdPs) like Okta, Azure AD, or Ping Identity.

### SSO SAML/OIDC Integration Guide (via Supabase)
1. **SSO Provider Activation**: Turn on SAML 2.0 in the Supabase Dashboard under Auth Settings.
2. **Metadata Exchange**: 
   * Obtain the SAML Metadata XML from the client's IdP (e.g. Okta).
   * Register the Metadata XML in Supabase to acquire the **Assertion Consumer Service (ACS) URL** and **Entity ID**.
   * Configure Okta using these Supabase endpoint details.
3. **Domain Mapping**: Map the corporate email domain (e.g., `@acme.com`) to trigger redirection to the SAML SSO flow automatically.

### Role-Based Access Control (RBAC) Matrix
Permissions are governed by the user's `Membership` role (`OWNER`, `ADMIN`, `MEMBER`):

| Resource / Action | Owner | Admin | Member |
| :--- | :---: | :---: | :---: |
| Edit Billing & Plans | ✅ | ❌ | ❌ |
| Invite Users / Change Roles | ✅ | ✅ | ❌ |
| Delete Knowledge Bases | ✅ | ✅ | ❌ |
| Index/Upload Documents | ✅ | ✅ | ✅ |
| Chat / Execute Agents | ✅ | ✅ | ✅ |

---

## 📋 3. Audit Logs System Architecture

To satisfy enterprise compliance checks (SOC2, HIPAA, ISO 27001), audit logs must record all system actions.

### Audit Log Schema (Prisma)
Create an `AuditLog` table to log actions:
```prisma
model AuditLog {
  id             String   @id @default(uuid())
  organizationId String
  userId         String?
  action         String   // e.g. 'DOCUMENT_UPLOAD', 'MEMBER_INVITED', 'API_KEY_CREATED'
  ipAddress      String?
  userAgent      String?
  metadata       Json?    // Context payload
  createdAt      DateTime @default(now())
}
```

### Event Tracking Utility
```typescript
export async function logAuditEvent(params: {
  orgId: string;
  userId: string;
  action: string;
  ip?: string;
  metadata?: any;
}) {
  await db.auditLog.create({
    data: {
      organizationId: params.orgId,
      userId: params.userId,
      action: params.action,
      ipAddress: params.ip,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  });
}
```

---

## 🔌 4. API Keys & Webhooks Access

Enterprise users can integrate the RAG workspace into their internal CI/CD pipelines via API Keys and Webhooks.

### Secure API Key Management
1. **Hashing in Storage**: Store API keys in the database as SHA-256 hashes. Never store keys in plaintext.
2. **Generation Flow**:
   * Generate key string with prefixes: `ai_live_` + 32-character random string.
   * Display the plaintext key to the user **once** during generation.
   * Store the SHA-256 hash in the `ApiKey` table.
3. **Access Authentication**: Verify API requests by hashing the incoming key header and querying the hashed database records.

### Outgoing Webhooks System
Notify external systems when documents are processed or files are updated:
1. **Event Trigger**: When a document index job finishes in the background, load configured URL endpoints.
2. **Payload Delivery**: Send a POST request containing the event type (`document.indexed`) and chunk summary payload.
3. **Webhook Signatures**: Include an `x-signature` HMAC-SHA256 header (computed with a shared secret) so webhook consumers can verify the authenticity of the incoming request.

---

## ⚡ 5. Final Production Hardening Checklist

Ensure all checkpoints are verified green before deploying the AI platform to production.

### Infrastructure & Operations
- [ ] **Qdrant Cloud Scale**: Production databases are configured with at least 2 replica nodes for failover redundancy.
- [ ] **LangSmith Observability**: Enforce `LANGCHAIN_TRACING_V2=true` in production environment variables to monitor prompt chains.
- [ ] **Supabase Pooling**: Verify pool connections use Supabase Transaction Bouncers (`pgbouncer`) on port `6543`.

### Observability & Recovery
- [ ] **Failover Model Latency**: Confirm timeout values in `FailoverLLM` are optimized to 15s to trigger failover routines quickly.
- [ ] **Cache TTL Adjustments**: Embeddings Cache configured with 30 days TTL, retrieval prompts set to 30 mins TTL.
- [ ] **Rate Limiting Checks**: Chat and upload APIs wrapped with multi-tenant rate limits.
