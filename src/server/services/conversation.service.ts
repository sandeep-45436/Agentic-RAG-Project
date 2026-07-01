import { db } from "@/server/db/prisma";
import { MessageRole } from "@prisma/client";

export class ConversationService {
  /**
   * Fetches all conversations for a user within an organization.
   */
  static async getConversations(userId: string, organizationId: string) {
    return db.conversation.findMany({
      where: {
        userId,
        organizationId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Gets a specific conversation with its messages.
   */
  static async getConversation(id: string, organizationId: string) {
    return db.conversation.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  /**
   * Creates a new conversation.
   */
  static async createConversation(userId: string, organizationId: string, title?: string) {
    return db.conversation.create({
      data: {
        userId,
        organizationId,
        title: title || "New Chat",
      },
    });
  }

  /**
   * Adds a message to a conversation.
   */
  static async addMessage(
    conversationId: string,
    organizationId: string,
    role: MessageRole,
    content: string,
    citations?: any,
    metadata?: any
  ) {
    // 1. Verify conversation belongs to the organization
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });

    if (!conversation) {
      throw new Error("Conversation not found or access denied.");
    }

    // 2. Add the message
    const message = await db.message.create({
      data: {
        conversationId,
        organizationId,
        role,
        content,
        citations: citations ? JSON.stringify(citations) : undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    // 3. Update conversation's updatedAt timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 4. Auto-generate title if it's the first user message and title is "New Chat"
    if (role === "USER" && conversation.title === "New Chat") {
      const newTitle = content.substring(0, 30) + (content.length > 30 ? "..." : "");
      await db.conversation.update({
        where: { id: conversationId },
        data: { title: newTitle },
      });
    }

    return message;
  }
  
  /**
   * Soft deletes a conversation.
   */
  static async deleteConversation(id: string, organizationId: string) {
    return db.conversation.updateMany({
      where: {
        id,
        organizationId,
      },
      data: {
        deletedAt: new Date(),
      }
    });
  }
}
