/**
 * Usage Logging Types
 * 
 * Centralized type definitions for all Flingoos usage event logging.
 * Used by admin-panel, flingoos-mcp, and any other Flingoos services.
 * 
 * FIELD ORDER (alphabetical in Firestore):
 * 1. action (event type - appears first!)
 * 2. component
 * 3. event_id
 * 4. org_id
 * 5. period_id
 * 6. properties
 * 7. service
 * 8. timestamp
 * 9. user_email
 * 10. user_id
 */

// ==================== Services ====================

/**
 * Valid service identifiers that can log usage events.
 */
export type UsageService = 
  | 'admin-panel'           // Flingoos Admin Panel (web)
  | 'flingoos-mcp'          // MCP Server
  | 'flingoos-mcp-tools'    // MCP Tools
  | 'flingoos-ambient'      // Ambient Service
  | 'video-forge';          // Video Forge Service

// ==================== Admin Panel Actions ====================

/**
 * Admin panel action types
 */
export type AdminPanelAction = 
  | 'session'             // Recording session started
  | 'session_complete'    // Recording session completed (with duration)
  | 'workflow_edit'       // Edit/save a workflow
  | 'publish'             // Publish workflow
  | 'export'              // Export workflow
  | 'chatbot_message'     // Send message to chatbot
  | 'enrich_click'        // Click enrich button
  | 'daily_active_user';  // First activity of the day per user

// ==================== MCP Actions ====================

/**
 * MCP action types
 */
export type McpAction = 
  | 'mcp_context_list'    // Lists available contexts (projects/sessions)
  | 'mcp_context_get'     // Gets a specific context by ID
  | 'mcp_context_search'  // Semantic search across contexts
  | 'mcp_context_modify'; // Modifies workflow steps/phases

// ==================== Video Forge Actions ====================

/**
 * Video Forge action types
 */
export type VideoForgeAction = 
  | 'video_forge_analysis'      // Video analysis (standard mode)
  | 'video_forge_augmentation'; // Video augmentation (additive mode)

// ==================== Combined Actions ====================

/**
 * All supported action types across all services
 */
export type UsageAction = AdminPanelAction | McpAction | VideoForgeAction;

// ==================== Property Types ====================

/**
 * Recording source - HOW was the session captured?
 */
export type RecordingSource = 'screen' | 'camera';

/**
 * Output type - WHAT is the purpose of the session?
 */
export type OutputType = 'workflow' | 'teach_ai';

/**
 * Legacy session type (deprecated, use RecordingSource + OutputType)
 */
export type LegacySessionType = RecordingSource | 'teach_ai';

/**
 * Export types
 */
export type ExportType = 'uipath' | 'power_automate' | 'json' | 'pdf' | 'markdown';

// ==================== Event Structures ====================

/**
 * Base properties that can be included in any event
 */
export interface BaseEventProperties {
  [key: string]: unknown;
}

/**
 * Properties for session events
 */
export interface SessionEventProperties extends BaseEventProperties {
  recording_source?: RecordingSource;
  output_type?: OutputType;
  session_type?: LegacySessionType;  // Legacy, deprecated
}

/**
 * Properties for session_complete events
 */
export interface SessionCompleteProperties extends BaseEventProperties {
  session_duration_ms?: number;
}

/**
 * Properties for export events
 */
export interface ExportEventProperties extends BaseEventProperties {
  export_type?: ExportType;
}

/**
 * Properties for chatbot_message events
 */
export interface ChatbotMessageProperties extends BaseEventProperties {
  message_length?: number;
  message_text?: string;
}

/**
 * Properties for MCP context-list events
 */
export interface McpContextListProperties extends BaseEventProperties {
  scope?: string;
  results_count?: number;
}

/**
 * Properties for MCP context-get events
 */
export interface McpContextGetProperties extends BaseEventProperties {
  context_id?: string;
  context_kind?: 'project' | 'session';
  session_type?: string;
}

/**
 * Properties for MCP context-search events
 */
export interface McpContextSearchProperties extends BaseEventProperties {
  results_count?: number;
  search_status?: string;
}

/**
 * Properties for MCP context-modify events
 */
export interface McpContextModifyProperties extends BaseEventProperties {
  context_id?: string;
  target_type?: string;
  auto_confirm?: boolean;
  modification_success?: boolean;
}

/**
 * Properties for Video Forge events
 */
export interface VideoForgeProperties extends BaseEventProperties {
  session_id?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
  video_duration_seconds?: number;
  video_mode?: string;  // "inline" or "files_api"
  video_fps?: number;
  input_type?: string;  // "workflow_recording" or "teaching_session"
  is_augmentation?: boolean;
}

/**
 * Standard Usage Event Structure
 * All events stored in Firestore conform to this format.
 */
export interface UsageEvent {
  action: UsageAction;
  component?: string | null;
  event_id: string;
  org_id: string;
  period_id: string;
  properties?: Record<string, unknown> | null;
  service: UsageService;
  timestamp: unknown;  // FieldValue.serverTimestamp() or string
  user_email: string;
  user_id: string;
}

// ==================== Request/Response Types ====================

/**
 * Request payload for logging a usage event (admin-panel API)
 */
export interface UsageEventRequest {
  action: UsageAction;
  component?: string;
  properties?: Record<string, unknown>;
}

/**
 * Response from usage event API
 */
export interface UsageEventResponse {
  success: boolean;
  event_id?: string | null;
  period_id?: string;
  skipped?: boolean;
  error?: string;
}

// ==================== Logger Options ====================

/**
 * Options for logging a usage event (server-side)
 */
export interface UsageLogOptions {
  action: UsageAction;
  userId: string;
  userEmail?: string;
  orgId: string;
  service: UsageService;
  component?: string;
  properties?: Record<string, unknown>;
}

/**
 * Options specific to MCP logging
 */
export interface McpLogOptions {
  action: McpAction;
  userId: string;
  userEmail?: string;
  orgId: string;
  component: string;
  properties?: Record<string, unknown>;
}

// ==================== Timeseries/Counter Types ====================

/**
 * Timeseries data point with all metrics
 * Used for chart visualization
 */
export interface UsageTimeseriesDataPoint {
  period_id: string;
  
  // Session lifecycle
  sessions_started: number;
  sessions_completed: number;
  
  // Recording source breakdown
  sessions_screen: number;
  sessions_camera: number;
  
  // Output type breakdown
  sessions_workflow: number;
  sessions_teach_ai: number;
  
  // Outputs
  publishes: number;
  exports: number;
  
  // Secondary metrics
  workflow_edits: number;
  chatbot_messages: number;
  enrich_clicks: number;
  total_session_duration_ms: number;
  unique_users: number;
  
  // MCP metrics
  mcp_context_list: number;
  mcp_context_get: number;
  mcp_context_search: number;
  mcp_context_modify: number;
  mcp_total: number;
}

/**
 * Counter update type (for atomic increments)
 */
export type CounterUpdates = Record<string, unknown>;
