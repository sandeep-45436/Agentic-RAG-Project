import { GraphState } from '../graph/state';
import { DocumentDeliveryTool } from '@/ai/tools/document-delivery.tool';
import { StageTimer } from '@/ai/instrumentation/stage-timer';
import { getMessageText } from '@/lib/utils';
import { Role } from '@/ai/tools/tool-registry';
import { DocumentDeliveryResult } from '@/ai/documents/document-delivery.types';

export async function documentDeliveryAgent(
  state: typeof GraphState.State
): Promise<{
  documentDelivery: DocumentDeliveryResult | null;
  timings: Record<string, number>;
}> {
  const startTs = StageTimer.start('documentDeliveryNode');

  try {
    const lastMessage = state.messages.length > 0
      ? state.messages[state.messages.length - 1]
      : null;
    const query = lastMessage ? getMessageText(lastMessage) : '';

    const courseCode = state.queryAnalysis?.entities?.courseCode;

    // Check if the plan has a DOCUMENT_DELIVERY sub-task with a specific query
    const docDeliveryTask = state.plan?.subTasks?.find(
      (t: any) => t.type === 'DOCUMENT_DELIVERY'
    );
    const taskQuery = docDeliveryTask ? docDeliveryTask.query : query;

    // Determine operation from query content
    let pagesArray: number[] | undefined;
    let operation: 'GET_FULL_DOCUMENT' | 'GET_PAGES' | 'GET_SECTION' | 'SEARCH_AND_EXTRACT' = 'SEARCH_AND_EXTRACT';

    // Parse page numbers or ranges (e.g. "extract 1-4 pages", "pages 1-4", "1 to 4 pages")
    const matchA = taskQuery.match(/pages?\s*(\d+(?:[\s,\-to]+\d+)*)/i);
    const matchB = taskQuery.match(/(\d+)\s*(?:-|to|\s+to\s+)\s*(\d+)\s*(?:pages?|pps?|slides?)?/i);

    if (matchA && matchA[1]) {
      const nums = matchA[1].match(/\d+/g);
      if (nums && nums.length > 0) {
        if (nums.length === 2 && (matchA[1].includes('-') || matchA[1].toLowerCase().includes('to'))) {
          const start = parseInt(nums[0], 10);
          const end = parseInt(nums[1], 10);
          pagesArray = [];
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) pagesArray.push(i);
        } else {
          pagesArray = nums.map((n: string) => parseInt(n, 10));
        }
        operation = 'GET_PAGES';
      }
    } else if (matchB && matchB[1] && matchB[2]) {
      const start = parseInt(matchB[1], 10);
      const end = parseInt(matchB[2], 10);
      pagesArray = [];
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) pagesArray.push(i);
      operation = 'GET_PAGES';
    }

    const isFullDocQuery = /\b(give me|download|get|send|provide|fetch)\b.*\b(pdf|document|course material|full document|file|syllabus|ppt|powerpoint|presentation)\b/i.test(taskQuery.toLowerCase())
      && !pagesArray;

    if (!pagesArray && isFullDocQuery) {
      operation = 'GET_FULL_DOCUMENT';
    } else if (!pagesArray && /\b(section|chapter)\b/i.test(taskQuery)) {
      operation = 'GET_SECTION';
    }

    // Resolve documentId from retrieved chunks if available
    let documentId: string | undefined;
    const knowledgeChunks = state.knowledgeContext?.chunks || state.retrievedChunks || [];
    if (knowledgeChunks.length > 0) {
      documentId = knowledgeChunks[0]?.documentId;
    }

    const toolResult = await DocumentDeliveryTool.execute({
      operation,
      query: taskQuery,
      courseCode,
      documentId,
      pages: pagesArray,
      section: operation === 'GET_SECTION' ? taskQuery : undefined,
      organizationId: state.organizationId,
      userId: state.userId,
      userRole: (state.userRole as Role) || 'MEMBER',
      departmentId: state.departmentId,
      collegeId: state.collegeId,
    });

    const docResult = toolResult.result || null;

    console.log(JSON.stringify({
      event: 'DOCUMENT_DELIVERY_EXECUTED',
      operation,
      documentId: docResult?.documentId,
      pages: docResult?.pages,
      confidence: docResult?.confidence,
      organizationId: state.organizationId,
      userId: state.userId,
      timestamp: new Date().toISOString(),
    }));

    const timerResult = StageTimer.end('documentDeliveryNode', startTs, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit: false,
    });

    return {
      documentDelivery: docResult,
      timings: { documentDeliveryNode: timerResult.durationMs },
    };
  } catch (error) {
    console.error('[documentDeliveryAgent] Error:', error);
    const timerResult = StageTimer.end(
      'documentDeliveryNode',
      startTs,
      {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit: false,
      },
      true
    );

    return {
      documentDelivery: null,
      timings: { documentDeliveryNode: timerResult.durationMs },
    };
  }
}
