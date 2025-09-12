/**
 * Flingoos Shared Types (Inferred from Schemas)
 * 
 * All types are inferred from Zod schemas - schemas are the source of truth.
 * These types match the extracted payloads from COMPLETE_PAYLOAD_EXTRACTION.md
 */

import { z } from 'zod';
import * as schemas from './schemas.js';

// ============================================================================
// Constants (re-exported for convenience)
// ============================================================================

export { STAGES, STAGE_NAMES, TOTAL_STAGES } from './constants.js';
export type { Stage, SessionStatus, ProcessingStatus, StageExecutionStatus } from './constants.js';

// ============================================================================
// Bridge Command API Types
// ============================================================================

export type BridgeCommandRequest = z.infer<typeof schemas.BridgeCommandRequestSchema>;
export type BridgeCommandResponse = z.infer<typeof schemas.BridgeCommandResponseSchema>;

// ============================================================================
// Session Manager API Types
// ============================================================================

export type SessionManagerHealth = z.infer<typeof schemas.SessionManagerHealthSchema>;
export type SessionStartResponse = z.infer<typeof schemas.SessionStartResponseSchema>;
export type SessionStopResponse = z.infer<typeof schemas.SessionStopResponseSchema>;
export type SessionStatusResponse = z.infer<typeof schemas.SessionStatusResponseSchema>;

// ============================================================================
// Session State Types
// ============================================================================

export type SessionInternalState = z.infer<typeof schemas.SessionInternalStateSchema>;

// For backward compatibility, export as Session (matches current usage)
export type Session = SessionInternalState;

// ============================================================================
// Forge Pipeline Types
// ============================================================================

export type ForgeArtifact = z.infer<typeof schemas.ForgeArtifactSchema>;
export type ForgeCounters = z.infer<typeof schemas.ForgeCountersSchema>;
export type StageExecution = z.infer<typeof schemas.StageExecutionSchema>;
export type ForgeManifest = z.infer<typeof schemas.ForgeManifestSchema>;
export type ForgeJobResponse = z.infer<typeof schemas.ForgeJobResponseSchema>;

// Import types needed for ForgeJob
import type { Stage, ProcessingStatus } from './constants.js';

// Derived ForgeJob type (for convenience)
export type ForgeJob = {
  processing_id: string;
  session_id?: string;
  trigger_hash?: string;
  status: ProcessingStatus;
  progress_percent: number;
  current_stage: Stage;
  created_at: string;
  completed_at?: string;
  processing_time_seconds?: number;
  firestore_path?: string;
  artifacts?: ForgeArtifact[];
  counters?: ForgeCounters;
  stage_executions?: StageExecution[];
  idempotent_reuse: boolean;
};

// ============================================================================
// Trigger Generation Types
// ============================================================================

export type TriggerSession = z.infer<typeof schemas.TriggerSessionSchema>;
export type TriggerOptions = z.infer<typeof schemas.TriggerOptionsSchema>;
export type ForgeTrigger = z.infer<typeof schemas.ForgeTriggerSchema>;

// ============================================================================
// Progress Calculation Types
// ============================================================================

export type JobProgress = z.infer<typeof schemas.JobProgressSchema>;

// ============================================================================
// Error Handling Types
// ============================================================================

export type StandardErrorResponse = z.infer<typeof schemas.StandardErrorResponseSchema>;
// NOTE: ErrorEnvelope moved to Phase 14 section below

// ============================================================================
// Idempotency Types
// ============================================================================

export type IdempotencyHeader = z.infer<typeof schemas.IdempotencyHeaderSchema>;
export type IdempotentResponse = z.infer<typeof schemas.IdempotentResponseSchema>;

// ============================================================================
// WebSocket Event Types
// ============================================================================

export type SessionEvent = z.infer<typeof schemas.SessionEventSchema>;

// ============================================================================
// Firestore Document Types
// ============================================================================

export type WorkflowData = z.infer<typeof schemas.WorkflowDataSchema>;
export type FirestoreWorkflow = z.infer<typeof schemas.FirestoreWorkflowSchema>;

// For backward compatibility
export type Workflow = WorkflowData;

// ============================================================================
// Device Authentication Types (Phase 1.5)
// ============================================================================

export type DeviceProofRequest = z.infer<typeof schemas.DeviceProofRequestSchema>;
export type DeviceProofResponse = z.infer<typeof schemas.DeviceProofResponseSchema>;
export type DeviceProofPayload = z.infer<typeof schemas.DeviceProofPayloadSchema>;

// ============================================================================
// JWT Authentication Types (Phase 2)
// ============================================================================

export type AuthTokenResponse = z.infer<typeof schemas.AuthTokenResponseSchema>;
export type AuthClaims = z.infer<typeof schemas.AuthClaimsSchema>;

// ============================================================================
// Phase 14: Magic-Link Pairing + Presence Types
// ============================================================================

export type PairIntentResponse = z.infer<typeof schemas.PairIntentResponseSchema>;
export type PairCompleteRequest = z.infer<typeof schemas.PairCompleteRequestSchema>;
export type DeviceRecord = z.infer<typeof schemas.DeviceRecordSchema>;
export type UserDeviceLink = z.infer<typeof schemas.UserDeviceLinkSchema>;
export type UserDevicesResponse = z.infer<typeof schemas.UserDevicesResponseSchema>;
export type PresenceIntentResponse = z.infer<typeof schemas.PresenceIntentResponseSchema>;
export type PresenceCompleteRequest = z.infer<typeof schemas.PresenceCompleteRequestSchema>;
export type PresenceStatusResponse = z.infer<typeof schemas.PresenceStatusResponseSchema>;
export type SessionStartRequest = z.infer<typeof schemas.SessionStartRequestSchema>;

// Updated canonical error envelope (replaces StandardErrorResponse)
export type ErrorEnvelope = z.infer<typeof schemas.ErrorEnvelopeSchema>;
