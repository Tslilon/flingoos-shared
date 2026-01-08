/**
 * @flingoos/shared - Entry Point
 * 
 * Shared types, schemas, and validation for Flingoos services.
 * Reality-aligned contracts based on extracted payloads.
 */

// Re-export everything for convenient imports
export * from './constants.js';
export * from './types.js';
export * from './schemas.js';
export * from './validation.js';
export * from './stage-messages.js';
export * from './video-artifacts.js';
export * from './project.js';

// Named exports for specific use cases
export {
  // Constants
  STAGES,
  TOTAL_STAGES,
  SESSION_STATUSES,
  PROCESSING_STATUSES
} from './constants.js';

export type {
  // Core types
  Session,
  SessionInternalState,
  ForgeJob,
  ForgeJobResponse,
  JobProgress,
  StageExecution,
  
  // API response types  
  SessionStartResponse,
  SessionStopResponse,
  BridgeCommandRequest,
  BridgeCommandResponse,
  
  // Device authentication types
  DeviceProofRequest,
  DeviceProofResponse,
  DeviceProofPayload,
  
  // JWT authentication types
  AuthTokenResponse,
  AuthClaims,
  
  // Utility types
  Stage,
  SessionStatus,
  ProcessingStatus
} from './types.js';

export type {
  ValidationResult
} from './validation.js';

export {
  // Validation functions
  safeParse,
  validateSessionStartResponse,
  validateForgeJobResponse,
  validateBridgeCommandRequest,
  validateSessionInternalState,

  // Utility functions
  calculateProgress,
  isProcessingComplete,
  getFailedStages,
  runSmokeTests
} from './validation.js';

export {
  // Stage message utilities
  getStageMessage,
  getAllStageMessages,
  isValidStageCode,
  getStageLabel,
  getStageNumber,
  getAllStageCodes,
  STAGE_MESSAGES,
  STAGE_LABELS
} from './stage-messages.js';

export type {
  StageCode,
  StageMessageMap
} from './stage-messages.js';

export {
  // Key schemas for runtime validation
  SessionStartResponseSchema,
  SessionInternalStateSchema,
  ForgeJobResponseSchema,
  BridgeCommandRequestSchema,
  StageExecutionSchema,
  JobProgressSchema,
  
  // Device authentication schemas (Phase 1.5)
  DeviceProofRequestSchema,
  DeviceProofResponseSchema,
  DeviceProofPayloadSchema,
  
  // JWT authentication schemas (Phase 2)
  AuthTokenResponseSchema,
  AuthClaimsSchema,
  
  // Presence schemas (Phase 14)
  PresenceIntentResponseSchema,
  PresenceStatusResponseSchema
} from './schemas.js';

// Video artifact types for favorites and usage tracking
export type {
  UserFavorite,
  FirestoreVideoDocument,
  VideoWorkflowGuideContent,
  KnowledgeBaseContent,
  StageVMetadata
} from './video-artifacts.js';

export {
  UserFavoriteSchema,
  FirestoreVideoDocumentSchema,
  VideoWorkflowGuideContentSchema,
  KnowledgeBaseContentSchema,
  StageVMetadataSchema
} from './video-artifacts.js';

// Project types for domain grouping
export type {
  Project,
  ProjectWithId,
  ProjectWithStats,
  ProjectVisibility,
  CreateProject,
  UpdateProject,
  SessionProjectField,
  UpdateSessionProject,
  ListProjectsResponse,
  GetProjectResponse,
  // MCP types (Phase 2.5)
  ProjectSessionSummary,
  ProjectSessionWithContent,
  MCPProjectResponse,
  KnowledgeMatch,
  // Context-first API types (Phase 3)
  ContextKind,
  SessionType,
  ContextBase,
  SessionContext,
  ProjectContext,
  Context,
  ContextSearchResult,
  ContextListOutput
} from './project.js';

export {
  ProjectSchema,
  ProjectWithIdSchema,
  ProjectWithStatsSchema,
  ProjectVisibilitySchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  SessionProjectFieldSchema,
  UpdateSessionProjectSchema,
  ListProjectsResponseSchema,
  GetProjectResponseSchema,
  // MCP schemas (Phase 2.5)
  ProjectSessionSummarySchema,
  ProjectSessionWithContentSchema,
  MCPProjectResponseSchema,
  KnowledgeMatchSchema,
  // Context-first API schemas (Phase 3)
  ContextKindSchema,
  SessionTypeSchema,
  ContextBaseSchema,
  SessionContextSchema,
  ProjectContextSchema,
  ContextSchema,
  ContextSearchResultSchema,
  ContextListOutputSchema
} from './project.js';
