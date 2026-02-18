/**
 * Session edit history (version control) types.
 * History is stored in subcollection: organizations/{orgId}/sessions/{sessionId}/edit_history
 * One document per version; cap 20. Used for "View edit history" and "Restore to version".
 */

export type EditHistorySource = 'mcp' | 'admin_ui' | 'rename' | 'enrich' | 'restore' | 'initial';

/** One version doc in edit_history subcollection. */
export interface EditHistoryVersion {
  timestamp: string;
  modified_by?: string;
  modified_by_email?: string;
  source: EditHistorySource;
  source_label?: string;
  action: 'modify' | 'add' | 'delete' | 'restore';
  target_type?: 'step' | 'phase' | 'knowledge_item' | 'metadata';
  target_number?: number;
  target_id?: string;
  change_prompt?: string;
  change_summary: string[];
  /** Full session content after this edit (for one-click restore). */
  content_snapshot: Record<string, unknown>;
}

export const EDIT_HISTORY_CAP = 20;
