/**
 * Flingoos Shared Schemas (Source of Truth)
 * 
 * All schemas based on extracted payloads from COMPLETE_PAYLOAD_EXTRACTION.md
 * These are the canonical data structures - types are inferred from these schemas.
 */

import { z } from 'zod';
import { STAGES, SESSION_STATUSES, PROCESSING_STATUSES, STAGE_EXECUTION_STATUSES } from './constants.js';

// ============================================================================
// Bridge Command API Schemas
// ============================================================================

export const BridgeCommandRequestSchema = z.object({
  command: z.enum(['ping', 'status', 'audio_start', 'audio_stop']),
  timestamp: z.number()
});

export const BridgeCommandResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.number().optional(),
  session_id: z.string().optional(),
  collectors: z.array(z.string()).optional(),
  timeout_seconds: z.number().optional(),
  data: z.record(z.any()).optional(),
  error: z.string().optional()
});

// ============================================================================
// Session Manager API Schemas  
// ============================================================================

export const SessionManagerHealthSchema = z.object({
  status: z.literal('healthy'),
  bridge_connected: z.boolean(),
  active_sessions: z.number(),
  timestamp: z.string()
});

export const SessionStartResponseSchema = z.object({
  success: z.boolean(),
  session_id: z.string().optional(),
  status: z.enum(SESSION_STATUSES).optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

export const SessionStopResponseSchema = z.object({
  success: z.boolean(),
  session_id: z.string().optional(), 
  status: z.enum(SESSION_STATUSES).optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

export const SessionStatusResponseSchema = z.object({
  success: z.boolean(),
  bridge_connected: z.boolean().optional(),
  active_sessions: z.number().optional(),
  sessions: z.array(z.string()).optional(),
  workflow_results: z.number().optional()
});

// ============================================================================
// Session Internal State Schema
// ============================================================================

export const SessionInternalStateSchema = z.object({
  session_id: z.string(),
  start_time: z.string().optional(),
  stop_time: z.string().optional(),
  status: z.enum(SESSION_STATUSES),
  bridge_response: z.record(z.any()).optional(),
  bridge_stop_response: z.record(z.any()).optional(), 
  workflow_ready: z.boolean().optional(),
  processing_id: z.string().optional(),
  firestore_path: z.string().optional(),
  workflow_id: z.string().optional(),
  processing_time_seconds: z.number().optional(),
  error_message: z.string().optional()
});

// ============================================================================
// Forge Pipeline Schemas
// ============================================================================

export const ForgeArtifactSchema = z.object({
  name: z.string(),
  type: z.enum(['workflow', 'flowchart', 'analysis']),
  stage: z.string(),
  local_path: z.string().optional(),
  gcs_uri: z.string(),
  sha256: z.string(),
  size_bytes: z.number(),
  mime: z.string(),
  created_at: z.string()
});

export const ForgeCountersSchema = z.object({
  events_processed: z.number(),
  media_files_processed: z.number(),
  timeline_entries: z.number(), 
  llm_tokens_used: z.number(),
  processing_time_seconds: z.number()
});

export const StageExecutionSchema = z.object({
  stage: z.enum(STAGES),
  status: z.enum(STAGE_EXECUTION_STATUSES),
  started_at: z.string(),
  completed_at: z.string().optional(),
  error_message: z.string().nullable().optional(),
  artifacts_produced: z.array(z.string())
});

export const ForgeManifestSchema = z.object({
  version: z.string(),
  processing_id: z.string(),
  trigger_hash: z.string(),
  session: z.record(z.any()),
  options: z.record(z.any()),
  status: z.enum(PROCESSING_STATUSES),
  created_at: z.string(),
  completed_at: z.string().optional(),
  artifacts: z.array(ForgeArtifactSchema),
  counters: ForgeCountersSchema,
  stage_executions: z.array(StageExecutionSchema),
  content_sha256: z.string(),
  error_message: z.string().nullable().optional(),
  errors: z.array(z.any())
});

export const ForgeJobResponseSchema = z.object({
  status: z.enum(['completed', 'failed', 'timeout', 'connection_error']),
  session_id: z.string(),
  processing_time_seconds: z.number(),
  firestore_path: z.string().optional(),
  workflow_id: z.string().optional(),
  message: z.string(),
  timestamp: z.string(),
  error: z.string().optional(),
  forge_response: z.object({
    manifest: ForgeManifestSchema,
    processing_id: z.string(),
    status: z.enum(PROCESSING_STATUSES),
    processing_time_ms: z.number(),
    idempotent_reuse: z.boolean()
  }).optional()
});

// ============================================================================
// Trigger Generation Schema
// ============================================================================

export const TriggerSessionSchema = z.object({
  org_id: z.string(),
  device_id: z.string(),
  time_range: z.object({
    start: z.string(),
    end: z.string()
  }),
  timezone: z.string()
});

export const TriggerOptionsSchema = z.object({
  stages: z.array(z.enum(STAGES)),
  media_processing: z.boolean(),
  llm_enabled: z.boolean(),
  include_flowchart: z.boolean()
});

export const ForgeTriggerSchema = z.object({
  pipeline_version: z.string(),
  config_path: z.string(),
  session: TriggerSessionSchema,
  options: TriggerOptionsSchema,
  visibility: z.enum(['private', 'public'])
});

// ============================================================================
// Progress Calculation Schema
// ============================================================================

export const JobProgressSchema = z.object({
  processing_id: z.string(),
  progress_percent: z.number().min(0).max(100),
  current_stage: z.enum(STAGES),
  stage_name: z.string(),
  stages_completed: z.array(z.enum(STAGES)),
  stages_total: z.number(),
  estimated_completion: z.string().optional(),
  elapsed_seconds: z.number(),
  stage_durations: z.record(z.string(), z.number())
});

// ============================================================================
// Error Handling Schemas  
// ============================================================================

export const StandardErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string()
});

// Future: Standardized error envelope (pending confirmation)
export const ErrorEnvelopeSchema = z.object({
  error_code: z.enum(['BRIDGE_DOWN', 'FORGE_TIMEOUT', 'INVALID_SESSION', 'PROCESSING_FAILED']),
  error_message: z.string(),
  correlation_id: z.string(),
  timestamp: z.string(),
  retry_after: z.number().optional()
});

// ============================================================================
// Idempotency Schemas (confirmed from extracted headers)
// ============================================================================

export const IdempotencyHeaderSchema = z.object({
  'idempotency-key': z.string(), // Format: "session-{session_id}"
  'x-force-rerun': z.enum(['true', 'false']).optional()
});

export const IdempotentResponseSchema = z.object({
  idempotent_reuse: z.boolean()
});

// ============================================================================
// WebSocket Event Schemas
// ============================================================================

export const SessionEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('session_started'),
    session_id: z.string(),
    message: z.string()
  }),
  z.object({
    type: z.literal('session_stopped'), 
    session_id: z.string(),
    message: z.string()
  }),
  z.object({
    type: z.literal('session_error'),
    error: z.string()
  }),
  z.object({
    type: z.literal('upload_status'),
    current_step: z.string(),
    completed_steps: z.array(z.object({
      message: z.string(),
      status: z.string()
    })),
    total_steps: z.number()
  }),
  z.object({
    type: z.literal('workflow_ready'),
    workflow_id: z.string(),
    title: z.string(),
    summary: z.string(),
    steps: z.array(z.any()),
    guide_markdown: z.string()
  }),
  z.object({
    type: z.literal('upload_complete'),
    message: z.string(),
    has_workflow: z.boolean()
  })
]);

// ============================================================================
// Firestore Document Schema
// ============================================================================

export const WorkflowDataSchema = z.object({
  title: z.string(),
  summary: z.string(),
  duration_seconds: z.number(),
  steps: z.array(z.object({
    step: z.number(),
    action: z.string(),
    timestamp: z.string(),
    confidence: z.number(),
    context: z.string()
  })),
  insights: z.array(z.string()),
  categories: z.array(z.string()),
  productivity_score: z.number(),
  guide_markdown: z.string()
});

export const FirestoreWorkflowSchema = z.object({
  workflow_id: z.string(),
  session_id: z.string(),
  org_id: z.string(),
  processed_at: z.string(),
  status: z.string(),
  source: z.enum(['real_firestore', 'mock']),
  firestore_document_id: z.string(),
  firestore_url: z.string(),
  firestore_path: z.string(),
  workflow_data: WorkflowDataSchema,
  processing_metadata: z.object({
    random_selection: z.boolean(),
    selected_from_count: z.number(),
    retrieval_method: z.string()
  })
});

// ============================================================================
// Device Authentication Schemas (Phase 1.5)
// ============================================================================

export const DeviceProofRequestSchema = z.object({
  challenge: z.string(), // Base64 encoded challenge from Session Manager
  timestamp: z.string()  // ISO 8601 timestamp
});

export const DeviceProofResponseSchema = z.object({
  device_id: z.string(),
  nonce: z.string(),       // 32-byte random nonce (hex encoded)
  proof: z.string(),       // Ed25519 signature (hex encoded)
  timestamp: z.string(),   // ISO 8601 timestamp
  public_key: z.string(),  // Ed25519 public key (hex encoded)
  hostname: z.string(),
  bridge_version: z.string().optional()
});

export const DeviceProofPayloadSchema = z.object({
  device_id: z.string(),
  nonce: z.string(),
  timestamp: z.string(),
  bridge_version: z.string().optional(),
  hostname: z.string(),
  challenge: z.string().optional() // Original challenge if challenge-response
});

// ============================================================================
// JWT Authentication Schemas (Phase 2)
// ============================================================================

export const AuthTokenResponseSchema = z.object({
  authenticated: z.literal(true),
  token: z.string(),          // JWT token (HS256)
  expires_at: z.string(),     // ISO 8601 timestamp
  device_id: z.string(),
  fingerprint: z.string()
});

export const AuthClaimsSchema = z.object({
  sub: z.string(),           // Device fingerprint (subject)
  aud: z.string(),           // Device ID (audience)  
  iat: z.number(),           // Issued at (Unix timestamp)
  exp: z.number(),           // Expires at (Unix timestamp)
  jti: z.string(),           // JWT ID (for replay prevention)
  iss: z.literal('flingoos-session-manager'), // Issuer
  device_id: z.string(),     // Device ID (for convenience)
  fingerprint: z.string()    // Device fingerprint (for validation)
});
