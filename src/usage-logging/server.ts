/**
 * Server-Side Usage Logging
 * 
 * Core logging functions for writing usage events to Firestore.
 * Used by both admin-panel API routes and MCP server.
 * 
 * IMPORTANT: This module requires a Firestore client and FieldValue to be passed in.
 * This allows it to work with different Firebase configurations across services.
 */

import type { 
  UsageAction, 
  UsageService, 
  UsageLogOptions,
  McpLogOptions,
  RecordingSource,
  OutputType,
  CounterUpdates 
} from './types.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== Period ID Helpers ====================

/**
 * Get the daily period ID for a given date.
 * Uses UTC to ensure consistent period IDs regardless of server timezone.
 * @returns Format: "YYYY-MM-DD"
 */
export function getDailyPeriodId(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return `evt_${uuidv4()}`;
}

// ==================== Counter Update Logic ====================

/**
 * Factory function to create a FieldValue.increment-like updater
 * This is service-agnostic - the caller provides the increment function
 */
export type IncrementFn = (n: number) => unknown;

/**
 * Get counter updates based on action type and properties.
 * 
 * Session events track TWO independent dimensions:
 * 1. Recording Source: screen | camera (HOW was it recorded?)
 * 2. Output Type: workflow | teach_ai (WHAT is the purpose?)
 * 
 * Both should sum to sessions_started:
 *   sessions_screen + sessions_camera = sessions_started
 *   sessions_workflow + sessions_teach_ai = sessions_started
 * 
 * @param action - The action type
 * @param properties - Optional event properties
 * @param increment - A function that creates an increment value (e.g., FieldValue.increment)
 * @returns Object with counter field updates
 */
export function getCounterUpdates(
  action: UsageAction,
  properties: Record<string, unknown> | undefined | null,
  increment: IncrementFn
): CounterUpdates {
  const updates: CounterUpdates = {};
  
  switch (action) {
    // ==================== Admin Panel Actions ====================
    case 'session':
      // Always increment sessions_started
      updates.sessions_started = increment(1);
      
      // Track recording source (HOW was it recorded?)
      const recordingSource = properties?.recording_source as RecordingSource | undefined;
      if (recordingSource === 'screen') {
        updates.sessions_screen = increment(1);
      } else if (recordingSource === 'camera') {
        updates.sessions_camera = increment(1);
      }
      
      // Track output type (WHAT is the purpose?)
      const outputType = properties?.output_type as OutputType | undefined;
      if (outputType === 'workflow') {
        updates.sessions_workflow = increment(1);
      } else if (outputType === 'teach_ai') {
        updates.sessions_teach_ai = increment(1);
      }
      
      // Legacy fallback: if only session_type is provided (old clients)
      if (!recordingSource && !outputType) {
        const legacySessionType = properties?.session_type as string | undefined;
        if (legacySessionType === 'screen') {
          updates.sessions_screen = increment(1);
          updates.sessions_workflow = increment(1);
        } else if (legacySessionType === 'camera') {
          updates.sessions_camera = increment(1);
          updates.sessions_workflow = increment(1);
        } else if (legacySessionType === 'teach_ai') {
          updates.sessions_screen = increment(1);
          updates.sessions_teach_ai = increment(1);
        }
      }
      
      // Defensive defaults for missing dimensions
      if (recordingSource && !outputType) {
        updates.sessions_workflow = increment(1);
      } else if (!recordingSource && outputType) {
        updates.sessions_screen = increment(1);
      }
      break;
      
    case 'session_complete':
      updates.sessions_completed = increment(1);
      const durationMs = properties?.session_duration_ms as number | undefined;
      if (typeof durationMs === 'number' && durationMs > 0) {
        updates.total_session_duration_ms = increment(durationMs);
      }
      break;
      
    case 'workflow_edit':
      updates.workflow_edits = increment(1);
      break;
      
    case 'publish':
      updates.publishes = increment(1);
      break;
      
    case 'export':
      updates.exports = increment(1);
      break;
      
    case 'chatbot_message':
      updates.chatbot_messages = increment(1);
      break;
      
    case 'enrich_click':
      updates.enrich_clicks = increment(1);
      break;
      
    case 'daily_active_user':
      updates.unique_users = increment(1);
      break;
    
    // ==================== MCP Actions ====================
    case 'mcp_context_list':
      updates.mcp_context_list = increment(1);
      updates.mcp_total = increment(1);
      break;
      
    case 'mcp_context_get':
      updates.mcp_context_get = increment(1);
      updates.mcp_total = increment(1);
      break;
      
    case 'mcp_context_search':
      updates.mcp_context_search = increment(1);
      updates.mcp_total = increment(1);
      break;
      
    case 'mcp_context_modify':
      updates.mcp_context_modify = increment(1);
      updates.mcp_total = increment(1);
      break;
    
    // ==================== Video Forge Actions ====================
    // Note: Video Forge logs from Python with actual token/cost values.
    // These cases handle logging via the shared library if needed.
    case 'video_forge_analysis':
    case 'video_forge_augmentation':
      // Extract token counts and cost from properties
      const inputTokens = properties?.input_tokens as number | undefined;
      const outputTokens = properties?.output_tokens as number | undefined;
      const costUsd = properties?.cost_usd as number | undefined;
      
      if (typeof inputTokens === 'number' && inputTokens > 0) {
        updates.video_forge_input_tokens = increment(inputTokens);
      }
      if (typeof outputTokens === 'number' && outputTokens > 0) {
        updates.video_forge_output_tokens = increment(outputTokens);
      }
      if (typeof costUsd === 'number' && costUsd > 0) {
        updates.video_forge_cost_usd = increment(costUsd);
      }
      break;
  }
  
  return updates;
}

// ==================== Firestore Interface ====================

/**
 * Interface for Firestore operations (works with both firebase-admin and firebase)
 */
export interface FirestoreOperations {
  /** Write a document to a collection */
  addDocument: (collectionPath: string, data: Record<string, unknown>) => Promise<unknown>;
  
  /** Set a document with merge */
  setDocumentMerge: (documentPath: string, data: Record<string, unknown>) => Promise<void>;
  
  /** Try to create a document (fails if exists) */
  createDocument?: (documentPath: string, data: Record<string, unknown>) => Promise<void>;
  
  /** FieldValue.increment equivalent */
  increment: IncrementFn;
  
  /** FieldValue.serverTimestamp equivalent */
  serverTimestamp: () => unknown;
}

// ==================== Core Logging Function ====================

/**
 * Log a usage event to Firestore.
 * 
 * This is the core logging function used by all services.
 * 
 * Writes to:
 * 1. /usage/events/data/{auto-id} - Individual event document
 * 2. /usage/counters/global/totals - Global all-time counter
 * 3. /usage/counters/daily/{periodId} - Daily global counter
 * 4. /usage/counters/daily/{periodId}/orgs/{orgId} - Daily per-org counter
 * 
 * @param options - The logging options
 * @param firestore - Firestore operations interface
 */
export async function logUsageEvent(
  options: UsageLogOptions,
  firestore: FirestoreOperations
): Promise<{ success: boolean; event_id: string; period_id: string }> {
  const periodId = getDailyPeriodId();
  const eventId = generateEventId();
  const timestamp = firestore.serverTimestamp();
  
  // Clean properties (remove undefined values - Firestore doesn't accept them)
  const cleanProperties = options.properties
    ? Object.fromEntries(
        Object.entries(options.properties).filter(([, v]) => v !== undefined)
      )
    : null;
  
  // 1. Write event document
  const eventData: Record<string, unknown> = {
    action: options.action,
    timestamp,
    user_email: options.userEmail || options.userId,
    org_id: options.orgId,
    service: options.service,
    event_id: eventId,
    user_id: options.userId,
    component: options.component || null,
    properties: Object.keys(cleanProperties || {}).length > 0 ? cleanProperties : null,
    period_id: periodId,
  };
  
  await firestore.addDocument('usage/events/data', eventData);
  
  // Get counter updates
  const counterUpdates = getCounterUpdates(options.action, options.properties, firestore.increment);
  
  // 2. Increment global all-time counter
  await firestore.setDocumentMerge('usage/counters/global/totals', {
    ...counterUpdates,
    last_updated: timestamp,
  });
  
  // 3. Increment daily global counter
  await firestore.setDocumentMerge(`usage/counters/daily/${periodId}`, {
    period_id: periodId,
    ...counterUpdates,
    last_updated: timestamp,
  });
  
  // 4. Increment org-specific counter
  await firestore.setDocumentMerge(`usage/counters/daily/${periodId}/orgs/${options.orgId}`, {
    period_id: periodId,
    org_id: options.orgId,
    ...counterUpdates,
    last_updated: timestamp,
  });
  
  return { success: true, event_id: eventId, period_id: periodId };
}

// ==================== MCP Convenience Functions ====================

/**
 * Log an MCP usage event.
 * 
 * Convenience wrapper for MCP-specific logging.
 * Fire-and-forget - catches and logs errors, never throws.
 * 
 * @param options - MCP logging options
 * @param firestore - Firestore operations interface
 */
export async function logMcpUsage(
  options: McpLogOptions,
  firestore: FirestoreOperations
): Promise<void> {
  try {
    const result = await logUsageEvent(
      {
        ...options,
        service: 'flingoos-mcp',
      },
      firestore
    );
    
    console.error(`📊 [UsageLog] ${options.action} logged for ${options.userEmail || options.userId} (org: ${options.orgId})`);
    return;
  } catch (error) {
    // Silent failure - usage logging should never break tool execution
    console.error(`📊 [UsageLog] Failed to log ${options.action}:`, error);
  }
}

// ==================== MCP Action-Specific Functions ====================

/**
 * Log context-list MCP tool usage
 */
export function createLogContextList(firestore: FirestoreOperations) {
  return function logContextList(
    userId: string,
    orgId: string,
    scope: string,
    resultsCount: number,
    userEmail?: string
  ): void {
    logMcpUsage({
      action: 'mcp_context_list',
      userId,
      userEmail,
      orgId,
      component: 'context-list',
      properties: {
        scope,
        results_count: resultsCount,
      },
    }, firestore).catch(() => {}); // Fire and forget
  };
}

/**
 * Log context-get MCP tool usage
 */
export function createLogContextGet(firestore: FirestoreOperations) {
  return function logContextGet(
    userId: string,
    orgId: string,
    contextId: string,
    contextKind: 'project' | 'session',
    sessionType?: string,
    userEmail?: string
  ): void {
    logMcpUsage({
      action: 'mcp_context_get',
      userId,
      userEmail,
      orgId,
      component: 'context-get',
      properties: {
        context_id: contextId,
        context_kind: contextKind,
        session_type: sessionType,
      },
    }, firestore).catch(() => {}); // Fire and forget
  };
}

/**
 * Log context-search MCP tool usage
 */
export function createLogContextSearch(firestore: FirestoreOperations) {
  return function logContextSearch(
    userId: string,
    orgId: string,
    resultsCount: number,
    status: string,
    userEmail?: string
  ): void {
    logMcpUsage({
      action: 'mcp_context_search',
      userId,
      userEmail,
      orgId,
      component: 'context-search',
      properties: {
        results_count: resultsCount,
        search_status: status,
      },
    }, firestore).catch(() => {}); // Fire and forget
  };
}

/**
 * Log context-modify MCP tool usage
 */
export function createLogContextModify(firestore: FirestoreOperations) {
  return function logContextModify(
    userId: string,
    orgId: string,
    contextId: string,
    targetType: string,
    autoConfirm: boolean,
    wasSuccessful: boolean,
    userEmail?: string
  ): void {
    logMcpUsage({
      action: 'mcp_context_modify',
      userId,
      userEmail,
      orgId,
      component: 'context-modify',
      properties: {
        context_id: contextId,
        target_type: targetType,
        auto_confirm: autoConfirm,
        modification_success: wasSuccessful,
      },
    }, firestore).catch(() => {}); // Fire and forget
  };
}
