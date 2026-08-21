import { db } from '@/server/db/prisma';
import { Role } from '@/ai/tools/tool-registry';
import { DocumentAccessCheckResult } from './document-delivery.types';
import { DocumentAccessPolicy, DocumentAccessContext } from '@/server/services/document-access-policy';

export class DocumentAccessControl {
  public static async checkAccess(params: {
    userId: string;
    userRole: Role;
    organizationId: string;
    documentId: string;
    departmentId?: string | null;
    collegeId?: string | null;
  }): Promise<DocumentAccessCheckResult> {
    const { userId, userRole, organizationId, documentId, departmentId, collegeId } = params;

    // 1. Find the document, verify it belongs to the same organizationId
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        knowledgeBase: true,
        department: true,
        college: true,
      },
    });

    if (!document) {
      return {
        allowed: false,
        reason: 'Document not found.',
        accessLevel: 'RESTRICTED',
      };
    }

    if (document.organizationId !== organizationId) {
      return {
        allowed: false,
        reason: 'Tenant isolation violation: Document does not belong to your organization.',
        accessLevel: 'RESTRICTED',
      };
    }

    // 2. Check if deletedAt is set
    if (document.deletedAt) {
      return {
        allowed: false,
        reason: 'Document has been deleted.',
        accessLevel: 'RESTRICTED',
      };
    }

    // 3. DocumentAccessPolicy check for Department/College/Visibility RBAC
    const context: DocumentAccessContext = {
      organizationId,
      userId,
      userRole: userRole as any,
      departmentId,
      collegeId,
    };

    const hasAccess = DocumentAccessPolicy.canAccessDocument(context, document);
    if (!hasAccess && userRole !== 'OWNER' && userRole !== 'ADMIN' && userRole !== 'DEAN') {
      return {
        allowed: false,
        reason: `Access restricted: Document visibility is ${document.visibility} and restricted to department/college scope.`,
        accessLevel: 'RESTRICTED',
      };
    }

    // 4. Privileged access
    if (['OWNER', 'ADMIN', 'DEAN', 'FACULTY'].includes(userRole)) {
      return {
        allowed: true,
        reason: 'Privileged user access.',
        accessLevel: 'RESTRICTED',
      };
    }

    // 4. Advisor access
    if (userRole === 'ADVISOR') {
      return {
        allowed: true,
        reason: 'Advisor access.',
        accessLevel: 'RESTRICTED',
      };
    }

    // 5. STUDENT and MEMBER access
    if (userRole === 'STUDENT' || userRole === 'MEMBER') {
      // a. Standalone document
      if (!document.knowledgeBaseId || !document.knowledgeBase) {
        return {
          allowed: true,
          reason: 'Standalone document access.',
          accessLevel: 'PUBLIC',
        };
      }

      const kbName = document.knowledgeBase.name.toLowerCase();
      const kbDesc = (document.knowledgeBase.description || '').toLowerCase();

      // b. Public KB check
      const publicKeywords = ['public', 'handbook', 'general', 'campus'];
      const isPublic = publicKeywords.some(
        (keyword) => kbName.includes(keyword) || kbDesc.includes(keyword)
      );

      if (isPublic) {
        return {
          allowed: true,
          reason: 'Public knowledge base document.',
          accessLevel: 'PUBLIC',
        };
      }

      // c. Course enrollment check
      const courseCodeMatch = kbName.match(/[a-z]{2,4}\d{3}/i);
      
      if (courseCodeMatch) {
        const courseCode = courseCodeMatch[0].toUpperCase();

        const student = await db.student.findFirst({
          where: {
            userId: userId,
            organizationId: organizationId,
          },
        });

        if (student) {
          const enrollment = await db.enrolment.findFirst({
            where: {
              studentId: student.id,
              courseSection: {
                course: {
                  code: courseCode,
                },
              },
            },
          });

          if (enrollment) {
            // Assuming if the enrollment exists, it's active.
            // If there's an explicit status, it could be checked here (e.g. enrollment.status === 'ACTIVE').
            return {
              allowed: true,
              reason: 'Enrolled in related course.',
              accessLevel: 'ENROLLED_COURSE',
            };
          }
        }
      }

      // d. Deny access
      return {
        allowed: false,
        reason: 'Access restricted: You must be enrolled in the related course or have higher privileges.',
        accessLevel: 'RESTRICTED',
      };
    }

    return {
      allowed: false,
      reason: 'Role not recognized.',
      accessLevel: 'RESTRICTED',
    };
  }
}
