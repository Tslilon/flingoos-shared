# Schema Change Guide

How to modify fields across the video-forge to admin-panel chain.

## Overview

Video artifact data flows through:

```
LLM Prompt (video-forge) 
    -> Schema Registry (video-forge) 
    -> Firestore Documents 
    -> Shared Types (flingoos-shared) 
    -> Frontend Validation (admin-panel) 
    -> UI Components (admin-panel)
```

## Files to Change

### 1. Video-Forge: LLM Prompt

**Location:** `flingoos-video-forge/prompts/`

| Artifact Type | Prompt File |
|--------------|-------------|
| Workflow Guide | `video_workflow_recording.md` |
| Knowledge Base (Teaching) | `video_teaching_session.md` |
| Flowchart | Generated from workflow guide |

**What to change:**
- Add/remove field from the prompt instructions
- Update the example JSON structure
- Modify validation rules described in prompt

### 2. Video-Forge: JSON Schema (Optional)

**Location:** `flingoos-video-forge/schemas/`

| Artifact Type | Schema File |
|--------------|-------------|
| Workflow Guide | `video_workflow_guide_content.json` |
| Knowledge Base | `video_knowledge_base_content.json` |
| Flowchart | `flowchart.json` |

**What to change:**
- Add/remove property from schema
- Update `required` array
- Modify property type or enum values

> Note: These JSON schemas are currently documentation-only. Video-forge aims to produce this shape but doesn't validate against it.

### 3. Video-Forge: Pydantic Models (if used)

**Location:** `flingoos-video-forge/src/flingoos_video_forge/flowchart/schema.py`

For flowcharts specifically, update:
- `FlowchartNode`, `FlowchartPhase`, etc.
- Add/remove fields
- Update validators

### 4. Shared Types: Zod Schemas (Source of Truth for Frontend)

**Location:** `flingoos-shared/src/video-artifacts.ts`

| Artifact Type | Schema Name |
|--------------|-------------|
| Workflow Guide | `VideoWorkflowGuideContentSchema` |
| Knowledge Base | `KnowledgeBaseContentSchema` |
| Flowchart | `FlowchartSchema` |

**What to change:**

```typescript
// Example: Make 'confidence' optional
export const FlowchartPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  // Changed from required to optional:
  confidence: ConfidenceLevelSchema.optional(),
  // ...
});
```

**After changes:**
```bash
cd flingoos-shared && npm run build
```

### 5. Admin-Panel: UI Components

**Location:** `flingoos-admin-panel/frontend/src/components/sessions/`

| Artifact Type | Component Files |
|--------------|-----------------|
| Workflow Guide | `VideoWorkflowView.tsx`, `WorkflowPhasesDisplay.tsx` |
| Knowledge Base | `VideoTeachingView.tsx`, `AddKnowledgeItemDialog.tsx` |
| Flowchart | `WorkflowFlowchart.tsx`, `flowchart/CustomNode.tsx` |

**What to change:**
- Remove/add field rendering
- Update optional chaining if field becomes optional
- Modify any field-specific logic

> **Important:** When changing knowledge item types (adding/removing/renaming), also update:
> - `AddKnowledgeItemDialog.tsx` - Update `KNOWLEDGE_TYPES` array with new types
> - `VideoTeachingView.tsx` - Update `TYPE_ICONS` and `TYPE_COLORS` mappings

### 6. Admin-Panel: Hooks (if needed)

**Location:** `flingoos-admin-panel/frontend/src/hooks/`

- `useVideoWorkflowResults.ts` - re-exports types, rarely needs changes
- Type assertions on fetched data

## Example: Removing `confidence` Field

### Step 1: Update Prompt (video-forge)

```markdown
<!-- In video_workflow_recording.md -->
<!-- Remove confidence from phase structure -->

Each phase should include:
- phase_number: Sequential number
- name: Phase name
- purpose: What this phase accomplishes
<!-- Removed: - confidence: High/Medium/Low -->
```

### Step 2: Update Shared Schema (flingoos-shared)

```typescript
// In video-artifacts.ts
export const VideoTemporalPhaseSchema = z.object({
  phase_number: z.number(),
  name: z.string(),
  purpose: z.string(),
  // Removed: confidence: ConfidenceLevelSchema,
  // ...
});
```

Then rebuild:
```bash
cd flingoos-shared && npm run build
```

### Step 3: Update Frontend Components (admin-panel)

```tsx
// In VideoWorkflowView.tsx
// Remove confidence badge rendering
<Badge>{phase.name}</Badge>
// Removed: <Badge variant="outline">{phase.confidence}</Badge>
```

### Step 4: Test with Artifact Preview

1. Run video-forge on a test video
2. Navigate to `/dev/artifact-preview` in admin-panel
3. Enter the session ID
4. Verify:
   - Validation passes (no `confidence` field errors)
   - UI renders correctly without confidence badges

## Backward Compatibility Strategy

When removing a field that existing data might have:

### Option A: Make Optional First (Recommended)

1. Update schema to make field optional: `.optional()`
2. Update UI to handle missing field with `?.` optional chaining
3. Deploy and wait for old data to age out
4. Then fully remove the field

### Option B: Allow Both Formats

```typescript
// Support both old and new format
export const ImportanceSchema = z.enum([
  'High', 'Medium', 'Low',  // Old format
  'high', 'medium', 'low'   // New format
]);
```

### Option C: Transform on Read

```typescript
// In validation or component
const normalizedConfidence = item.confidence?.toLowerCase() || 'medium';
```

## Validation Testing

Use the Artifact Preview page to validate changes:

1. **Before deploying video-forge changes:**
   - Test old artifacts still validate
   - UI renders gracefully with missing fields

2. **After deploying video-forge changes:**
   - Generate new artifact
   - Verify validation passes
   - Check UI renders new format correctly

## Checklist Template

When making a field change, copy this checklist:

```markdown
## Field Change: [field_name]
Change type: [ ] Add [ ] Remove [ ] Modify

### Video-Forge
- [ ] Update prompt: `prompts/video_*.md`
- [ ] Update JSON schema (optional): `schemas/*.json`
- [ ] Update Pydantic model (if applicable): `src/.../schema.py`

### Flingoos-Shared  
- [ ] Update Zod schema: `src/video-artifacts.ts`
- [ ] Rebuild: `npm run build`

### Admin-Panel
- [ ] Update UI components: `components/sessions/*.tsx`
- [ ] Update hooks (if needed): `hooks/*.ts`

### Testing
- [ ] Test with artifact-preview page
- [ ] Verify old artifacts still work (if applicable)
- [ ] Verify new artifacts validate
- [ ] UI renders correctly
```

## Quick Reference: File Locations

| What | Where |
|------|-------|
| LLM Prompts | `flingoos-video-forge/prompts/*.md` |
| JSON Schemas | `flingoos-video-forge/schemas/*.json` |
| Pydantic Models | `flingoos-video-forge/src/.../schema.py` |
| **Zod Schemas (SoT)** | `flingoos-shared/src/video-artifacts.ts` |
| Validation Helpers | `flingoos-admin-panel/frontend/src/lib/artifact-validation.ts` |
| Artifact Preview | `flingoos-admin-panel/frontend/src/app/dev/artifact-preview/page.tsx` |
| UI Components | `flingoos-admin-panel/frontend/src/components/sessions/*.tsx` |

