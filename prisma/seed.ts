import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // 1. Create a demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme AI Solutions',
    },
  })
  console.log(`Created Organization: ${org.name} (${org.id})`)

  // 2. Create a demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@acme-ai.com',
      name: 'Demo Admin',
    },
  })
  console.log(`Created User: ${user.name} (${user.id})`)

  // 3. Link user to organization via membership
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'ADMIN',
    },
  })
  console.log('Linked user to organization')

  // 4. Create a Knowledge Base
  const kb = await prisma.knowledgeBase.create({
    data: {
      name: 'Company Handbook',
      description: 'Internal documentation and policies',
      organizationId: org.id,
    }
  })
  console.log(`Created Knowledge Base: ${kb.name}`)

  // 5. Add a document
  const doc = await prisma.document.create({
    data: {
      organizationId: org.id,
      knowledgeBaseId: kb.id,
      fileName: 'Company Policies 2024.pdf',
      fileType: 'application/pdf',
      fileSize: 1048576,
      storagePath: 'org1/policies.pdf',
      processingStatus: 'COMPLETED',
      uploadedBy: user.id,
      content: 'This document contains the company policies for 2024.',
    }
  })
  console.log(`Created Document: ${doc.fileName}`)

  // 6. Add some chunks
  await prisma.chunk.create({
    data: {
      documentId: doc.id,
      organizationId: org.id,
      content: 'Section 1: General Conduct. All employees are expected to behave professionally.',
      chunkIndex: 0,
      tokenCount: 15,
    }
  })

  // 7. Generate a Usage Event
  await prisma.usageEvent.create({
    data: {
      type: 'CHAT',
      organizationId: org.id,
      tokensInput: 150,
      tokensOutput: 50,
      estimatedCost: 0.0003
    }
  })

  console.log("Seeding finished successfully.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
