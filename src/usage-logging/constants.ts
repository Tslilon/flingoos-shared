/**
 * Usage Logging Constants
 * 
 * Centralized constants for all Flingoos usage event logging.
 * Includes action lists, metric configurations, and Firestore paths.
 */

import type { 
  UsageAction, 
  AdminPanelAction, 
  McpAction,
  VideoForgeAction,
  UsageService 
} from './types.js';

// ==================== Action Constants ====================

/**
 * Valid admin panel actions
 */
export const ADMIN_PANEL_ACTIONS: readonly AdminPanelAction[] = [
  'session',
  'session_complete',
  'workflow_edit',
  'publish',
  'export',
  'chatbot_message',
  'enrich_click',
  'daily_active_user',
] as const;

/**
 * Valid MCP actions
 */
export const MCP_ACTIONS: readonly McpAction[] = [
  'mcp_context_list',
  'mcp_context_get',
  'mcp_context_search',
  'mcp_context_modify',
] as const;

/**
 * Valid Video Forge actions (logged by Python video-forge service)
 */
export const VIDEO_FORGE_ACTIONS: readonly VideoForgeAction[] = [
  'video_forge_analysis',
  'video_forge_augmentation',
] as const;

/**
 * All valid actions (combined)
 */
export const ALL_ACTIONS: readonly UsageAction[] = [
  ...ADMIN_PANEL_ACTIONS,
  ...MCP_ACTIONS,
  ...VIDEO_FORGE_ACTIONS,
] as const;

/**
 * Check if an action is valid
 */
export function isValidAction(action: string): action is UsageAction {
  return ALL_ACTIONS.includes(action as UsageAction);
}

/**
 * Check if an action is an admin panel action
 */
export function isAdminPanelAction(action: string): action is AdminPanelAction {
  return ADMIN_PANEL_ACTIONS.includes(action as AdminPanelAction);
}

/**
 * Check if an action is an MCP action
 */
export function isMcpAction(action: string): action is McpAction {
  return MCP_ACTIONS.includes(action as McpAction);
}

/**
 * Check if an action is a Video Forge action
 */
export function isVideoForgeAction(action: string): action is VideoForgeAction {
  return VIDEO_FORGE_ACTIONS.includes(action as VideoForgeAction);
}

// ==================== Service Constants ====================

/**
 * Valid service identifiers
 */
export const USAGE_SERVICES: readonly UsageService[] = [
  'admin-panel',
  'flingoos-mcp',
  'flingoos-mcp-tools',
  'flingoos-ambient',
  'video-forge',
] as const;

// ==================== Firestore Paths ====================

/**
 * Firestore collection/document paths for usage logging
 */
export const USAGE_PATHS = {
  /** Base collection for all usage data */
  BASE: 'usage',
  
  /** Individual events collection */
  EVENTS: {
    ROOT: 'usage/events',
    DATA: 'usage/events/data',
  },
  
  /** Counter collections */
  COUNTERS: {
    ROOT: 'usage/counters',
    /** Global all-time counters: /usage/counters/global/totals */
    GLOBAL_TOTALS: 'usage/counters/global/totals',
    /** Daily counters base: /usage/counters/daily/{periodId} */
    DAILY: 'usage/counters/daily',
    /** Org-specific counters: /usage/counters/daily/{periodId}/orgs/{orgId} */
    ORGS_SUBCOLLECTION: 'orgs',
  },
  
  /** Daily active user deduplication: /usage/daily_users/records/{periodId}_{userId} */
  DAILY_USERS: {
    ROOT: 'usage/daily_users',
    RECORDS: 'usage/daily_users/records',
  },
} as const;

/**
 * Build the daily counter document path
 */
export function getDailyCounterPath(periodId: string): string {
  return `${USAGE_PATHS.COUNTERS.DAILY}/${periodId}`;
}

/**
 * Build the org-specific counter document path
 */
export function getOrgCounterPath(periodId: string, orgId: string): string {
  return `${USAGE_PATHS.COUNTERS.DAILY}/${periodId}/${USAGE_PATHS.COUNTERS.ORGS_SUBCOLLECTION}/${orgId}`;
}

/**
 * Build the daily active user document ID
 */
export function getDailyUserDocId(periodId: string, userId: string): string {
  return `${periodId}_${userId}`;
}

// ==================== Metric Configurations ====================

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  blue: '#3B82F6',
  cyan: '#06B6D4',
  teal: '#14B8A6',
  green: '#10B981',
  yellow: '#F59E0B',
  orange: '#F97316',
  pink: '#EC4899',
  purple: '#8B5CF6',
  indigo: '#6366F1',
} as const;

/**
 * Main metrics configuration (shown together on one chart)
 */
export const MAIN_METRICS = {
  sessions_started: { label: 'Sessions Started', color: CHART_COLORS.blue },
  sessions_completed: { label: 'Sessions Completed', color: CHART_COLORS.teal },
  publishes: { label: 'Publishes', color: CHART_COLORS.green },
  exports: { label: 'Exports', color: CHART_COLORS.cyan },
  sessions_screen: { label: 'Screen Sessions', color: CHART_COLORS.purple },
  sessions_camera: { label: 'Camera Sessions', color: CHART_COLORS.yellow },
  sessions_workflow: { label: 'Workflow Sessions', color: CHART_COLORS.blue },
  sessions_teach_ai: { label: 'Teach AI Sessions', color: CHART_COLORS.pink },
} as const;

/**
 * Secondary metrics configuration (dropdown selector)
 */
export const SECONDARY_METRICS = {
  chatbot_messages: { label: 'Chatbot Messages', color: CHART_COLORS.purple },
  workflow_edits: { label: 'Workflow Edits', color: CHART_COLORS.green },
  enrich_clicks: { label: 'Enrich Clicks', color: CHART_COLORS.yellow },
  mean_session_length: { label: 'Mean Session Length (sec)', color: CHART_COLORS.indigo },
  unique_users: { label: 'Daily Unique Users', color: CHART_COLORS.teal },
} as const;

/**
 * MCP metrics configuration (multi-line like main metrics)
 */
export const MCP_METRICS = {
  mcp_context_list: { label: 'MCP List', color: CHART_COLORS.cyan },
  mcp_context_get: { label: 'MCP Get', color: CHART_COLORS.purple },
  mcp_context_search: { label: 'MCP Search', color: CHART_COLORS.green },
  mcp_context_modify: { label: 'MCP Modify', color: CHART_COLORS.yellow },
  mcp_total: { label: 'MCP Total', color: CHART_COLORS.blue },
} as const;

/**
 * Video Forge metrics configuration
 */
export const VIDEO_FORGE_METRICS = {
  video_forge_input_tokens: { label: 'Input Tokens', color: CHART_COLORS.yellow },
  video_forge_output_tokens: { label: 'Output Tokens', color: CHART_COLORS.green },
  video_forge_cost_usd: { label: 'Cost ($)', color: CHART_COLORS.orange },
} as const;

/**
 * All counter field names that can appear in timeseries documents
 */
export const ALL_COUNTER_FIELDS = [
  // Session lifecycle
  'sessions_started',
  'sessions_completed',
  
  // Recording source
  'sessions_screen',
  'sessions_camera',
  
  // Output type
  'sessions_workflow',
  'sessions_teach_ai',
  
  // Outputs
  'publishes',
  'exports',
  
  // Secondary
  'workflow_edits',
  'chatbot_messages',
  'enrich_clicks',
  'total_session_duration_ms',
  'unique_users',
  
  // MCP
  'mcp_context_list',
  'mcp_context_get',
  'mcp_context_search',
  'mcp_context_modify',
  'mcp_total',
  
  // Video Forge
  'video_forge_input_tokens',
  'video_forge_output_tokens',
  'video_forge_cost_usd',
] as const;

// ==================== Type Exports ====================

export type MainMetricKey = keyof typeof MAIN_METRICS;
export type SecondaryMetricKey = keyof typeof SECONDARY_METRICS;
export type McpMetricKey = keyof typeof MCP_METRICS;
export type VideoForgeMetricKey = keyof typeof VIDEO_FORGE_METRICS;
export type CounterFieldKey = typeof ALL_COUNTER_FIELDS[number];
