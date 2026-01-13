/**
 * Video Artifact Schemas
 * 
 * Zod schemas for video-forge output artifacts:
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

// @deprecated - no longer used in new workflows
export const ComplexitySchema = z.enum(['Simple', 'Moderate', 'Complex']);
export type Complexity = z.infer<typeof ComplexitySchema>;

export const KnowledgeLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type KnowledgeLevel = z.infer<typeof KnowledgeLevelSchema>;

export const SessionTypeSchema = z.enum(['conceptual_explanation', 'procedural_demo', 'troubleshooting', 'overview']);
export type SessionType = z.infer<typeof SessionTypeSchema>;

// New 7-type system (v2): fact, procedure, rule, pointer, example, identity, gap
// - 'fact' replaces 'concept' (more user-friendly terminology)
// - 'rule' merges old 'constraint' + 'condition' (structural + correctness rules)
// - 'pointer' merges old 'best_practice' + 'pointer' (advisory knowledge)
// - 'gap' represents explicitly acknowledged unknowns requiring investigation or clarification
// Old types kept for backward compatibility with existing data
export const KnowledgeItemTypeSchema = z.enum([
  // New types (v2)
  'fact', 'procedure', 'rule', 'pointer', 'example', 'identity', 'gap',
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
export const StepTypeSchema = z.enum(['do', 'check', 'hitl', 'conditional', 'gap']);
export type StepType = z.infer<typeof StepTypeSchema>;

// ============================================================================
// Conditional Step Details (v3.0 - structured branching)
// ============================================================================

/**
 * Expression language version for future-proofing condition parsing.
 * - simple_expr_v1: Basic expression syntax with AND/OR/NOT, comparisons, string ops
 */
export const ConditionLanguageSchema = z.enum(['simple_expr_v1']);
export type ConditionLanguage = z.infer<typeof ConditionLanguageSchema>;

/**
 * Target step navigation for branching conditionals.
 * At least one of if_true or if_false must be present when this object exists.
 */
export const ConditionalTargetStepsSchema = z.object({
  if_true: z.number().optional(),   // Go to step N if condition is true
  if_false: z.number().optional(),  // Go to step N if condition is false
}).refine(
  (data) => data.if_true !== undefined || data.if_false !== undefined,
  { message: 'target_steps must include at least one of if_true or if_false' }
);
export type ConditionalTargetSteps = z.infer<typeof ConditionalTargetStepsSchema>;

/**
 * Structured conditional details for branching steps.
 * 
 * Only populated when step_type is 'conditional'.
 * Provides structured information for export to automation platforms.
 * 
 * Expression syntax (simple_expr_v1):
 * - Operators: >, <, =, >=, <=, !=, CONTAINS, STARTS_WITH, ENDS_WITH, IS_EMPTY, IS_NOT_EMPTY
 * - Logic: AND, OR, NOT (uppercase)
 * - Variables: value, text, row_count, etc.
 * - Strings: single quotes ('blue')
 * - Parentheses for grouping: (value > 5 AND value < 20) OR value = 0
 * 
 * Example conditions:
 * - value > 5 AND value < 20
 * - text CONTAINS 'blue'
 * - NOT IS_EMPTY(value)
 * - status = 'pending' OR status = 'draft'
 */
export const ConditionalDetailsSchema = z.object({
  // The condition to evaluate (normalized expression format)
  // Trim first, then validate min length to reject whitespace-only strings
  condition: z.string().transform(s => s.trim()).pipe(z.string().min(1, 'Condition cannot be empty')),
  
  // Action to perform if condition is TRUE (required)
  // Trim first, then validate min length to reject whitespace-only strings
  true_action: z.string().transform(s => s.trim()).pipe(z.string().min(1, 'True action cannot be empty')),
  
  // Action to perform if condition is FALSE (optional - not all conditionals have else)
  // If provided, must have content after trimming (consistent with required fields)
  false_action: z.string().transform(s => s.trim()).pipe(z.string().min(1, 'False action cannot be empty if provided')).optional(),
  
  // Optional step navigation for complex branching workflows
  target_steps: ConditionalTargetStepsSchema.optional(),
  
  // Expression language version (default: simple_expr_v1)
  condition_language: ConditionLanguageSchema.optional().default('simple_expr_v1'),
});
export type ConditionalDetails = z.infer<typeof ConditionalDetailsSchema>;

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
  // Step type (do/check/hitl/conditional)
  step_type: StepTypeSchema.optional(),
  
  // Conditional details (v3.0) - only populated when step_type is 'conditional'
  // Shared schema is permissive (optional). Forge output validator enforces:
  // - conditional step_type REQUIRES condition_details
  // - non-conditional step_type FORBIDS condition_details
  condition_details: ConditionalDetailsSchema.optional(),
  
  // Provenance fields (v1 augmentation)
  item_id: z.string().optional(),                      // UUIDv7, minted at creation (optional for backward compat)
  source_session_id: z.string().optional(),            // Session that introduced this step
  added_at: z.string().optional(),                     // ISO timestamp when added
  augmentation_of_session_id: z.string().optional(),   // Target session if from augmentation
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
// - 1.0: Original schema
// - 2.0: Added step_type, workflow_notes, applications
// - 3.0: Added condition_details for structured conditionals
export const WorkflowSchemaVersionSchema = z.enum(['1.0', '2.0', '3.0']);
export type WorkflowSchemaVersion = z.infer<typeof WorkflowSchemaVersionSchema>;

// ============================================================================
// Output Language (v3: language output support)
// ============================================================================

/**
 * Output language options for video processing.
 * 
 * STABILITY NOTICE: Enum values (the string codes) must remain stable forever.
 * These values are stored in Firestore and used across services.
 * If you need to update display names, modify LANGUAGE_DISPLAY_NAMES only.
 * NEVER rename or remove enum values once deployed.
 */
export const OutputLanguageSchema = z.enum([
  'auto',  // Default: detect from input and match
  'en',    // English
  'es',    // Spanish
  'fr',    // French
  'de',    // German
  'pt',    // Portuguese
  'zh',    // Chinese (Simplified)
  'ja',    // Japanese
  'ko',    // Korean
  'ar',    // Arabic
  'he',    // Hebrew
  'ru',    // Russian
  'it',    // Italian
  'nl',    // Dutch
  'pl',    // Polish
  'tr',    // Turkish
  'vi',    // Vietnamese
  'th',    // Thai
  'id',    // Indonesian
  'hi'     // Hindi
]);
export type OutputLanguage = z.infer<typeof OutputLanguageSchema>;

/**
 * Language display names for UI.
 * These can be updated freely without breaking stored data.
 */
export const LANGUAGE_DISPLAY_NAMES: Record<OutputLanguage, string> = {
  auto: 'Auto-detect',
  en: 'English',
  es: 'Spanish (Espanol)',
  fr: 'French (Francais)',
  de: 'German (Deutsch)',
  pt: 'Portuguese (Portugues)',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  he: 'Hebrew',
  ru: 'Russian',
  it: 'Italian (Italiano)',
  nl: 'Dutch (Nederlands)',
  pl: 'Polish (Polski)',
  tr: 'Turkish (Turkce)',
  vi: 'Vietnamese (Tieng Viet)',
  th: 'Thai',
  id: 'Indonesian (Bahasa Indonesia)',
  hi: 'Hindi'
};

/**
 * RTL (right-to-left) languages.
 * Used to determine text direction for UI rendering.
 */
export const RTL_LANGUAGES = new Set(['ar', 'he']);

/**
 * Determine text direction based on language code.
 * 
 * @param language - ISO 639-1 language code (e.g., 'he', 'ar', 'en')
 * @returns 'rtl' for RTL languages, 'auto' for unknown (let browser detect), 'ltr' otherwise
 */
export function getTextDirection(language: string | undefined | null): 'rtl' | 'ltr' | 'auto' {
  // Unknown language - let browser auto-detect from content
  if (!language || language === 'auto') return 'auto';
  // RTL languages
  if (RTL_LANGUAGES.has(language)) return 'rtl';
  // Everything else is LTR
  return 'ltr';
}

/**
 * Get the effective language from metadata.
 * Uses detected_language for auto mode, otherwise output_language.
 * 
 * @param metadata - Video artifact metadata object
 * @returns The effective language code or undefined
 */
export function getEffectiveLanguage(metadata: { 
  output_language?: string; 
  detected_language?: string 
} | undefined | null): string | undefined {
  if (!metadata) return undefined;
  
  // If output_language is 'auto', use detected_language
  if (metadata.output_language === 'auto') {
    return metadata.detected_language;
  }
  
  return metadata.output_language;
}

// ============================================================================
// Augmentation History (v1 augmentation)
// ============================================================================

export const AugmentationHistoryEntrySchema = z.object({
  session_id: z.string(),              // The augmentation session
  timestamp: z.string(),               // ISO timestamp when augmentation was processed
  items_added: z.number(),             // Count of items added
  cross_type: z.boolean().optional(),  // True if augmenting different type (workflow -> teaching or vice versa)
});

export type AugmentationHistoryEntry = z.infer<typeof AugmentationHistoryEntrySchema>;

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
  guide_markdown: z.string().optional(),
  
  // Augmentation tracking (v1 augmentation)
  augmentation_history: z.array(AugmentationHistoryEntrySchema).optional(),
  // knowledge_items for cross-type augmentation (teaching -> workflow)
  knowledge_items: z.array(z.lazy(() => KnowledgeItemSchema)).optional(),
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
  item_id: z.string().optional(),  // Optional for backward compat - merge system mints IDs
  type: KnowledgeItemTypeSchema,
  timestamp: z.number(),
  title: z.string(),
  content: z.string(),
  importance: KnowledgeImportanceSchema,
  related_items: z.array(z.string()).optional(),
  visual_aids: z.string().optional(),
  audio_emphasis: z.string().optional(),
  code_snippet: z.string().optional(),
  
  // Provenance fields (v1 augmentation)
  source_session_id: z.string().optional(),            // Session that introduced this item
  added_at: z.string().optional(),                     // ISO timestamp when added
  augmentation_of_session_id: z.string().optional(),   // Target session if from augmentation
  
  // Cross-type routing (v1 augmentation)
  subtype: z.string().optional(),                      // For normalized foreign content: "procedure", "example", etc.
  
  // Duplicate detection (v1 augmentation)
  possible_duplicate_of: z.string().optional(),        // item_id if flagged as potential duplicate
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
  key_takeaways: z.array(z.string()).optional(),
  
  // Augmentation tracking (v1 augmentation)
  augmentation_history: z.array(AugmentationHistoryEntrySchema).optional(),
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
  }),
  // Usage tracking (optional, defaults to 0 for backward compatibility)
  usage_count: z.number().optional().default(0)
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

export type WorkflowGuideDocument = z.infer<typeof WorkflowGuideDocumentSchema>;
export type KnowledgeBaseDocument = z.infer<typeof KnowledgeBaseDocumentSchema>;

// ============================================================================
// User Favorites
// ============================================================================

/**
 * User favorite schema for storing starred workflows per user.
 * Stored at: /users/{user_id}/favorites/{session_id}
 */
export const UserFavoriteSchema = z.object({
  session_id: z.string(),
  org_id: z.string(),
  starred_at: z.string() // ISO timestamp
});

export type UserFavorite = z.infer<typeof UserFavoriteSchema>;
