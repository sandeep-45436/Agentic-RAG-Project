import { db } from "../db/prisma";

export class BaseRepository {
  /**
   * Helper function to always enforce multi-tenancy and soft-delete filters 
   * in queries.
   */
  protected getBaseWhere(organizationId: string) {
    return {
      organizationId,
      deletedAt: null,
    };
  }

  /**
   * Generates the payload for a soft delete operation.
   */
  protected getSoftDeletePayload() {
    return {
      deletedAt: new Date(),
    };
  }

  // Example generic access to the DB client for child repositories
  protected get db() {
    return db;
  }
}
