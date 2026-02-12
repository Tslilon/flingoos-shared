/**
 * Project Schemas
 * 
 * Zod schemas for Project/Domain Grouping feature.
 * Projects are organizational containers for sessions (workflows and teaching sessions).
 * 
 * Path: /organizations/{org_id}/projects/{project_id}
 */

import { z } from 'zod';

// ============================================================================
// Project Schema
// ============================================================================

/**
 * Project visibility - controls access within organization.
 * - 'private': Only owner can see
 * - 'org:view': All org members can view
 * - 'org:edit': All org members can view and edit
 * Sessions inherit visibility from their project.
 */
export const ProjectVisibilitySchema = z.enum(['private', 'org:view', 'org:edit']);
export type ProjectVisibility = z.infer<typeof ProjectVisibilitySchema>;

/**
 * Project schema for creating new projects.
 * Used when POSTing to /api/projects.
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  visibility: ProjectVisibilitySchema.default('private'),
  editors: z.array(z.string()).optional(),
  viewers: z.array(z.string()).optional(),
});
export type CreateProject = z.infer<typeof CreateProjectSchema>;

/**
 * Project schema for updating existing projects.
 * All fields optional - only provided fields are updated.
 */
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  visibility: ProjectVisibilitySchema.optional(),
  editors: z.array(z.string()).optional(),
  viewers: z.array(z.string()).optional(),
});
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

/**
 * Full project document schema as stored in Firestore.
 * Path: /organizations/{org_id}/projects/{project_id}
 */
export const ProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  owner_id: z.string(), // User ID who created the project
  visibility: ProjectVisibilitySchema,
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
  
  // Explicit access (private projects): user IDs with edit or view access
  editors: z.array(z.string()).optional(),
  viewers: z.array(z.string()).optional(),
  
  // Embedding fields for semantic search (Phase 2.5)
  // Embedding content = name + description + aggregated session goals
  embedding: z.array(z.number()).optional(), // 1536-dim vector for ada-002
  embedding_model: z.string().optional(), // e.g., "text-embedding-ada-002"
  embedding_updated_at: z.string().optional(), // ISO timestamp
  
  // Access control for search (same pattern as sessions)
  searchPartitions: z.array(z.string()).optional(), // ["org:{org_id}:public"] or ["user:{org_id}:{user_id}"]
  
  // Denormalized search fields for non-vector filtering
  search_name: z.string().optional(), // Copy of name for text search
  search_description: z.string().optional(), // Copy of description for text search
});
export type Project = z.infer<typeof ProjectSchema>;

/**
 * Project with ID - used in API responses.
 */
export const ProjectWithIdSchema = ProjectSchema.extend({
  id: z.string(),
});
export type ProjectWithId = z.infer<typeof ProjectWithIdSchema>;

/**
 * Project with computed stats - used in list responses.
 */
export const ProjectWithStatsSchema = ProjectWithIdSchema.extend({
  session_count: z.number().default(0),
  workflow_count: z.number().default(0),
  teaching_count: z.number().default(0),
});
export type ProjectWithStats = z.infer<typeof ProjectWithStatsSchema>;

// ============================================================================
// Session Project Association
// ============================================================================

/**
 * Schema for adding project_id field to session documents.
 * Added to stage_g_* documents in both video_workflows and workflows collections.
 * 
 * null = unassigned (session has no project)
 */
export const SessionProjectFieldSchema = z.object({
  project_id: z.string().nullable().optional(),
});
export type SessionProjectField = z.infer<typeof SessionProjectFieldSchema>;

/**
 * Request schema for assigning/unassigning a session to a project.
 * Used by PATCH /api/sessions/[id]/project
 */
export const UpdateSessionProjectSchema = z.object({
  project_id: z.string().nullable(), // null to unassign
});
export type UpdateSessionProject = z.infer<typeof UpdateSessionProjectSchema>;

// ============================================================================
// API Response Schemas
// ============================================================================

/**
 * Response for GET /api/projects (list)
 */
export const ListProjectsResponseSchema = z.object({
  projects: z.array(ProjectWithStatsSchema),
  total: z.number(),
});
export type ListProjectsResponse = z.infer<typeof ListProjectsResponseSchema>;

/**
 * Session summary for project listings (minimal fields)
 */
export const ProjectSessionSummarySchema = z.object({
  session_id: z.string(),
  name: z.string(),
  goal: z.string().optional(), // For workflows: task_summary.goal, for teaching: abstract
  recording_type: z.enum(['workflow_recording', 'teaching_session']),
  created_at: z.string().optional(),
  visibility: ProjectVisibilitySchema.optional(),
});
export type ProjectSessionSummary = z.infer<typeof ProjectSessionSummarySchema>;

/**
 * Response for GET /api/projects/[id] (single project with sessions)
 */
export const GetProjectResponseSchema = ProjectWithStatsSchema.extend({
  sessions: z.array(ProjectSessionSummarySchema).optional(),
});
export type GetProjectResponse = z.infer<typeof GetProjectResponseSchema>;

// ============================================================================
// MCP Types - For unified knowledge search and get-project
// ============================================================================

/**
 * Session with full content for MCP responses.
 * Used by get-project when include_content=true.
 */
export const ProjectSessionWithContentSchema = ProjectSessionSummarySchema.extend({
  content: z.unknown(), // Full WorkflowGuideContent or KnowledgeBaseContent
});
export type ProjectSessionWithContent = z.infer<typeof ProjectSessionWithContentSchema>;

/**
 * Full project for MCP with session content.
 * Returned by get-project tool when fetching project context.
 */
export const MCPProjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  visibility: ProjectVisibilitySchema,
  owner_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  session_count: z.number(),
  workflow_count: z.number(),
  teaching_count: z.number(),
  sessions: z.array(ProjectSessionWithContentSchema),
  editors: z.array(z.string()).optional(),
  viewers: z.array(z.string()).optional(),
});
export type MCPProjectResponse = z.infer<typeof MCPProjectResponseSchema>;

/**
 * Unified search result type - can be project or session.
 * Used by search-workflow unified search.
 * @deprecated Use ContextSearchResultSchema instead
 */
export const KnowledgeMatchSchema = z.object({
  type: z.enum(['project', 'session']),
  id: z.string(), // project_id or session_id
  name: z.string(),
  description: z.string().optional(), // For projects
  goal: z.string().optional(), // For sessions
  score: z.number(),
  visibility: ProjectVisibilitySchema,
  recording_type: z.enum(['workflow_recording', 'teaching_session']).optional(), // Only for sessions
  // For projects - included to avoid second round-trip
  contained_sessions: z.array(ProjectSessionSummarySchema).optional(),
});
export type KnowledgeMatch = z.infer<typeof KnowledgeMatchSchema>;

// ============================================================================
// Context-First API Types (MCP Phase 3)
// ============================================================================

/**
 * Context kind - distinguishes containers from units
 */
export const ContextKindSchema = z.enum(['project', 'session']);
export type ContextKind = z.infer<typeof ContextKindSchema>;

/**
 * Session type - the internal artifact type for sessions
 */
export const SessionTypeSchema = z.enum(['workflow_recording', 'teaching_session']);
export type SessionType = z.infer<typeof SessionTypeSchema>;

/**
 * Base context metadata (shared by all context types)
 */
export const ContextBaseSchema = z.object({
  id: z.string(),
  kind: ContextKindSchema,
  name: z.string(),
  visibility: ProjectVisibilitySchema,
});
export type ContextBase = z.infer<typeof ContextBaseSchema>;

/**
 * Session context metadata (for list operations)
 */
export const SessionContextSchema = ContextBaseSchema.extend({
  kind: z.literal('session'),
  session_type: SessionTypeSchema,
  goal: z.string().optional(),
  project_id: z.string().nullable(),
  project_name: z.string().nullable(),
  step_count: z.number().optional(),
  item_count: z.number().optional(),
  created_at: z.string().optional(),
});
export type SessionContext = z.infer<typeof SessionContextSchema>;

/**
 * Project context metadata (for list operations)
 */
export const ProjectContextSchema = ContextBaseSchema.extend({
  kind: z.literal('project'),
  description: z.string().nullable(),
  session_count: z.number(),
  workflow_count: z.number(),
  teaching_count: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type ProjectContext = z.infer<typeof ProjectContextSchema>;

/**
 * Union of all context types for list operations
 */
export const ContextSchema = z.discriminatedUnion('kind', [
  SessionContextSchema,
  ProjectContextSchema,
]);
export type Context = z.infer<typeof ContextSchema>;

/**
 * Context search result
 */
export const ContextSearchResultSchema = z.object({
  id: z.string(),
  kind: ContextKindSchema,
  session_type: SessionTypeSchema.optional(),
  name: z.string(),
  goal: z.string().optional(),
  description: z.string().optional(),
  project_id: z.string().optional(),
  project_name: z.string().optional(),
  score: z.number(),
  rank: z.number(),
  contained_sessions: z.array(ProjectSessionSummarySchema).optional(),
});
export type ContextSearchResult = z.infer<typeof ContextSearchResultSchema>;

/**
 * Context list output
 */
export const ContextListOutputSchema = z.object({
  contexts: z.array(ContextSchema),
  total_count: z.number(),
  project_count: z.number(),
  session_count: z.number(),
});
export type ContextListOutput = z.infer<typeof ContextListOutputSchema>;

