/**
 * Video Artifact Schemas
 * 
 * Zod schemas for video-forge output artifacts:
 * - Flowchart (workflow visualization)
 * - WorkflowGuideContent (step-by-step workflow guides)
 * - KnowledgeBaseContent (teaching session knowledge bases)
 * 
 * These are the single source of truth for artifact shapes.
 * Video-forge aims to produce this shape; frontend validates against it.
 */

import { z } from 'zod';

// ============================================================================
// Shared Enums
// ============================================================================

export const ConfidenceLevelSchema = z.enum(['High', 'Medium', 'Low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const NodeTypeSchema = z.enum(['step', 'decision']);
export type NodeType = z.infer<typeof NodeTypeSchema>;

// @deprecated - no longer used in new workflows
export const ComplexitySchema = z.enum(['Simple', 'Moderate', 'Complex']);
export type Complexity = z.infer<typeof ComplexitySchema>;

export const KnowledgeLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type KnowledgeLevel = z.infer<typeof KnowledgeLevelSchema>;

export const SessionTypeSchema = z.enum(['conceptual_explanation', 'procedural_demo', 'troubleshooting', 'overview']);
export type SessionType = z.infer<typeof SessionTypeSchema>;

// New 6-type system (v2): fact, procedure, rule, pointer, example, identity
// - 'fact' replaces 'concept' (more user-friendly terminology)
// - 'rule' merges old 'constraint' + 'condition' (structural + correctness rules)
// - 'pointer' merges old 'best_practice' + 'pointer' (advisory knowledge)
// Old types kept for backward compatibility with existing data
export const KnowledgeItemTypeSchema = z.enum([
  // New types (v2)
  'fact', 'procedure', 'rule', 'pointer', 'example', 'identity',
  // Legacy types for backward compatibility
  'concept',  // replaced by 'fact'
  'best_practice', 'constraint', 'condition'
]);
export type KnowledgeItemType = z.infer<typeof KnowledgeItemTypeSchema>;

// New binary importance: critical or standard
// Kept old values for backward compatibility with existing data
export const ImportanceSchema = z.enum(['critical', 'standard', 'high', 'medium', 'low']);
export type Importance = z.infer<typeof ImportanceSchema>;

export const RelationshipTypeSchema = z.enum(['requires', 'related', 'contrasts', 'extends', 'example_of']);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

// Step types for workflow steps
export const StepTypeSchema = z.enum(['do', 'check', 'hitl']);
export type StepType = z.infer<typeof StepTypeSchema>;

// ============================================================================
// Flowchart Schema
// ============================================================================

export const FlowchartMetadataSchema = z.object({
  id: z.string(),
  source_processing_id: z.string(),
  generated_at: z.string(), // ISO-8601
  llm_model: z.string(),
  llm_generated: z.boolean().default(true),
  prompt_version: z.string().default('1.0')
});

export const FlowchartPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  confidence: ConfidenceLevelSchema.nullish(),
  segments: z.array(z.number()).nullish(),
  reasoning: z.string().nullish(),
  color: z.string().default('blue')
});

export const FlowchartNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  title: z.string(),
  label: z.string().nullish(),  // allows null, undefined, or string
  instructions: z.union([z.string(), z.array(z.string())]).nullish(),
  question: z.string().nullish(),
  phase_id: z.string().nullish(),
  expected_result: z.string().nullish(),
  prerequisites: z.array(z.string()).nullish(),
  tools: z.array(z.string()).nullish(),
  notes: z.string().nullish(),
  confidence: ConfidenceLevelSchema.nullish(),
  data: z.record(z.string(), z.unknown()).nullish()
});

export const FlowchartEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  condition: z.string().optional()
});

export const FlowchartLayoutSchema = z.object({
  persisted: z.boolean().default(false),
  positions: z.record(z.string(), z.object({ x: z.number(), y: z.number() })).default({}),
  hints: z.record(z.string(), z.unknown()).optional()
});

export const EntityPathMappingSchema = z.object({
  entity_id: z.string(),
  path: z.string()
});

export const FlowchartProvenanceSchema = z.object({
  entity_path_map: z.array(EntityPathMappingSchema).optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional()
});

export const FlowchartSchema = z.object({
  schema_version: z.string().default('1.0'),
  title: z.string(),
  metadata: FlowchartMetadataSchema.optional(),
  phases: z.array(FlowchartPhaseSchema).optional(),
  nodes: z.array(FlowchartNodeSchema),
  edges: z.array(FlowchartEdgeSchema),
  layout: FlowchartLayoutSchema.optional(),
  provenance: FlowchartProvenanceSchema.optional()
});

export type FlowchartMetadata = z.infer<typeof FlowchartMetadataSchema>;
export type FlowchartPhase = z.infer<typeof FlowchartPhaseSchema>;
export type FlowchartNode = z.infer<typeof FlowchartNodeSchema>;
export type FlowchartEdge = z.infer<typeof FlowchartEdgeSchema>;
export type FlowchartLayout = z.infer<typeof FlowchartLayoutSchema>;
export type FlowchartProvenance = z.infer<typeof FlowchartProvenanceSchema>;
export type Flowchart = z.infer<typeof FlowchartSchema>;

// ============================================================================
// Video Workflow Guide Content Schema (video_workflow_guide_content.json)
// This is for VIDEO-FORGE outputs, not bridge workflows
// ============================================================================

export const VideoTaskSummarySchema = z.object({
  name: z.string(),
  goal: z.string(),
  // New field: applications (replaces tools_used)
  applications: z.array(z.string()).optional(),
  // @deprecated - kept for backward compatibility with old data
  tools_used: z.array(z.string()).optional(),
  // @deprecated - no longer generated
  complexity: ComplexitySchema.optional(),
  estimated_duration_minutes: z.number().optional(),
  // New field: abstract paragraph
  abstract: z.string().optional()
});

export const VideoTemporalPhaseSchema = z.object({
  phase_number: z.number(),
  timestamp_range: z.object({
    start: z.number(),
    end: z.number()
  }),
  name: z.string(),
  purpose: z.string(),
  key_actions: z.array(z.string()),
  // @deprecated - kept optional for backward compatibility
  confidence: ConfidenceLevelSchema.optional(),
  audio_summary: z.string().optional(),
  // New field: phase-level success criteria (only if explicitly mentioned)
  success_criteria: z.array(z.string()).optional()
});

export const VideoWorkflowStepSchema = z.object({
  step_number: z.number(),
  timestamp: z.number(),
  title: z.string(),
  action: z.string(),
  visual_cues: z.string().optional(),
  audio_context: z.string().optional(),
  expected_result: z.string(),
  // @deprecated - kept optional for backward compatibility
  confidence: ConfidenceLevelSchema.optional(),
  // New field: step type (do/check/hitl)
  step_type: StepTypeSchema.optional()
});

// New schema replacing quick_reference
export const VideoWorkflowNotesSchema = z.object({
  success_criteria: z.array(z.string()),
  constraints: z.array(z.string()),
  pointers: z.array(z.string())
});

// @deprecated - kept for backward compatibility with old data
export const VideoQuickReferenceSchema = z.object({
  prerequisites: z.array(z.string()),
  key_commands: z.array(z.string()),
  common_issues: z.array(z.string()),
  verification_steps: z.array(z.string())
});

// Schema version enum for workflow guide
export const WorkflowSchemaVersionSchema = z.enum(['1.0', '2.0']);
export type WorkflowSchemaVersion = z.infer<typeof WorkflowSchemaVersionSchema>;

export const VideoWorkflowGuideContentSchema = z.object({
  // Schema version for migration - defaults to "1.0" for old data
  schema_version: WorkflowSchemaVersionSchema.optional().default('1.0'),
  task_summary: VideoTaskSummarySchema,
  temporal_phases: z.array(VideoTemporalPhaseSchema),
  step_by_step_guide: z.array(VideoWorkflowStepSchema),
  // New field: workflow_notes (replaces quick_reference)
  workflow_notes: VideoWorkflowNotesSchema.optional(),
  // @deprecated - kept optional for backward compatibility with old data
  quick_reference: VideoQuickReferenceSchema.optional(),
  // @deprecated - no longer generated
  guide_markdown: z.string().optional()
});

export type VideoTaskSummary = z.infer<typeof VideoTaskSummarySchema>;
export type VideoTemporalPhase = z.infer<typeof VideoTemporalPhaseSchema>;
export type VideoWorkflowStep = z.infer<typeof VideoWorkflowStepSchema>;
export type VideoWorkflowNotes = z.infer<typeof VideoWorkflowNotesSchema>;
export type VideoQuickReference = z.infer<typeof VideoQuickReferenceSchema>;
export type VideoWorkflowGuideContent = z.infer<typeof VideoWorkflowGuideContentSchema>;

// Alias for backward compatibility
export const WorkflowGuideContentSchema = VideoWorkflowGuideContentSchema;
export type WorkflowGuideContent = VideoWorkflowGuideContent;

// ============================================================================
// Knowledge Base Content Schema (video_knowledge_base_content.json)
// ============================================================================

// Binary importance: critical or standard (new)
// Kept old values (High, Medium, Low, high, medium, low) for backward compatibility with existing data
export const KnowledgeImportanceSchema = z.enum(['critical', 'standard', 'High', 'Medium', 'Low', 'high', 'medium', 'low']);
export type KnowledgeImportance = z.infer<typeof KnowledgeImportanceSchema>;

export const SessionSummarySchema = z.object({
  topic: z.string(),
  subtopics: z.array(z.string()),
  // knowledge_level is deprecated and optional for backward compatibility
  knowledge_level: KnowledgeLevelSchema.optional(),
  session_type: SessionTypeSchema,
  estimated_duration_minutes: z.number().optional()
});

export const KnowledgeItemSchema = z.object({
  item_id: z.string(),
  type: KnowledgeItemTypeSchema,
  timestamp: z.number(),
  title: z.string(),
  content: z.string(),
  importance: KnowledgeImportanceSchema,
  related_items: z.array(z.string()).optional(),
  visual_aids: z.string().optional(),
  audio_emphasis: z.string().optional(),
  code_snippet: z.string().optional()
});

export const ConceptRelationshipSchema = z.object({
  // Primary fields - item_id references
  from: z.string(),
  to: z.string(),
  relationship: RelationshipTypeSchema,
  description: z.string()
});

export const KnowledgeBaseContentSchema = z.object({
  session_summary: SessionSummarySchema,
  knowledge_items: z.array(KnowledgeItemSchema),
  concept_relationships: z.array(ConceptRelationshipSchema).optional(),
  // abstract replaces key_takeaways - a single paragraph for executives
  abstract: z.string().optional(),
  // key_takeaways is deprecated but kept optional for backward compatibility with old data
  key_takeaways: z.array(z.string()).optional()
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;
export type ConceptRelationship = z.infer<typeof ConceptRelationshipSchema>;
export type KnowledgeBaseContent = z.infer<typeof KnowledgeBaseContentSchema>;

// ============================================================================
// Stage V Metadata (video input metadata)
// ============================================================================

export const StageVMetadataSchema = z.object({
  duration_seconds: z.number(),
  video_url: z.string(),
  video_path: z.string().optional(),
  estimated_cost_usd: z.number().optional(),
  file_size_bytes: z.number().optional(),
  validated_at: z.string().optional()
});

export type StageVMetadata = z.infer<typeof StageVMetadataSchema>;

// ============================================================================
// Video Artifact Metadata (wrapper for Firestore documents)
// ============================================================================

export const VideoArtifactMetadataSchema = z.object({
  processing_timestamp: z.string(),
  stage: z.string(),
  input_type: z.string(),
  output_format: z.string(),
  source_type: z.string().optional(),
  video_duration_seconds: z.number().optional(),
  estimated_cost_usd: z.number().optional(),
  vlm_usage: z.object({
    provider: z.string(),
    model: z.string(),
    total_tokens: z.number(),
    total_cost_usd: z.number()
  }).optional()
});

export type VideoArtifactMetadata = z.infer<typeof VideoArtifactMetadataSchema>;

// ============================================================================
// Firestore Document Wrappers
// ============================================================================

export const FirestoreVideoDocumentSchema = z.object({
  filename: z.string(),
  org_id: z.string(),
  session_id: z.string(),
  user_id: z.string(),
  processing_id: z.string(),
  processing_type: z.literal('video_vlm'),
  output_type: z.string(),
  status: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  source: z.string(),
  visibility: z.enum(['private', 'public']),
  metadata: z.object({
    file_size_bytes: z.number(),
    sha256: z.string(),
    manifest_sha256: z.string(),
    upload_timestamp: z.string()
  })
});

export type FirestoreVideoDocument = z.infer<typeof FirestoreVideoDocumentSchema>;

// Specific document types with typed content
export const WorkflowGuideDocumentSchema = FirestoreVideoDocumentSchema.extend({
  content: z.object({
    metadata: VideoArtifactMetadataSchema,
    content: VideoWorkflowGuideContentSchema
  })
});

export const KnowledgeBaseDocumentSchema = FirestoreVideoDocumentSchema.extend({
  content: z.object({
    metadata: VideoArtifactMetadataSchema,
    content: KnowledgeBaseContentSchema
  })
});

export const FlowchartDocumentSchema = FirestoreVideoDocumentSchema.extend({
  content: FlowchartSchema
});

export type WorkflowGuideDocument = z.infer<typeof WorkflowGuideDocumentSchema>;
export type KnowledgeBaseDocument = z.infer<typeof KnowledgeBaseDocumentSchema>;
export type FlowchartDocument = z.infer<typeof FlowchartDocumentSchema>;
