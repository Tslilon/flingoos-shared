# How to Add New Usage Log Events

**For AI Agents and Developers**

This guide explains how to add new usage logging events to any Flingoos service using the centralized `@flingoos/shared/usage-logging` library.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Step-by-Step Guide](#step-by-step-guide)
3. [Code Examples by Service](#code-examples-by-service)
4. [Firestore Paths](#firestore-paths)
5. [Verification Checklist](#verification-checklist)
6. [Common Patterns](#common-patterns)

---

## Quick Reference

### Where to Import From

```typescript
// Types and constants
import { UsageAction, ADMIN_PANEL_ACTIONS } from '@flingoos/shared/usage-logging';

// Server-side functions
import { getCounterUpdates, getDailyPeriodId, generateEventId } from '@flingoos/shared/usage-logging';
```

### Firestore Paths for Verification

After logging an event, check these Firestore collections:

| Purpose | Path | What to Look For |
|---------|------|------------------|
| Individual events | `/usage/events/data/{auto-id}` | New document with your action |
| All-time counters | `/usage/counters/global/totals` | Counter field incremented |
| Daily counters | `/usage/counters/daily/{YYYY-MM-DD}` | Counter field incremented |
| Org counters | `/usage/counters/daily/{YYYY-MM-DD}/orgs/{org_id}` | Counter field incremented |

---

## Step-by-Step Guide

### Step 1: Add the Action Type

**File**: `flingoos-shared/src/usage-logging/types.ts`

Add your new action to the appropriate union type:

```typescript
// For admin-panel actions:
export type AdminPanelAction = 
  | 'session'
  | 'workflow_edit'
  // ... existing actions ...
  | 'my_new_action';  // ← ADD HERE

// For MCP actions:
export type McpAction = 
  | 'mcp_context_list'
  // ... existing actions ...
  | 'mcp_my_new_tool';  // ← ADD HERE (prefix with mcp_)
```

### Step 2: Add to Action Array

**File**: `flingoos-shared/src/usage-logging/constants.ts`

Add to the appropriate array:

```typescript
// For admin-panel actions:
export const ADMIN_PANEL_ACTIONS: readonly AdminPanelAction[] = [
  'session',
  // ... existing actions ...
  'my_new_action',  // ← ADD HERE
] as const;

// For MCP actions:
export const MCP_ACTIONS: readonly McpAction[] = [
  'mcp_context_list',
  // ... existing actions ...
  'mcp_my_new_tool',  // ← ADD HERE
] as const;
```

### Step 3: Add Counter Logic

**File**: `flingoos-shared/src/usage-logging/server.ts`

Add a case to `getCounterUpdates()`:

```typescript
export function getCounterUpdates(
  action: UsageAction,
  properties: Record<string, unknown> | undefined | null,
  increment: IncrementFn
): CounterUpdates {
  const updates: CounterUpdates = {};
  
  switch (action) {
    // ... existing cases ...
    
    // ← ADD YOUR NEW CASE HERE
    case 'my_new_action':
      updates.my_new_counter = increment(1);
      // If you have additional counters based on properties:
      if (properties?.some_property === 'value') {
        updates.my_new_counter_specific = increment(1);
      }
      break;
      
    // For MCP actions, also increment mcp_total:
    case 'mcp_my_new_tool':
      updates.mcp_my_new_tool = increment(1);
      updates.mcp_total = increment(1);
      break;
  }
  
  return updates;
}
```

### Step 4: Add Counter Field to List

**File**: `flingoos-shared/src/usage-logging/constants.ts`

Add your counter field(s) to `ALL_COUNTER_FIELDS`:

```typescript
export const ALL_COUNTER_FIELDS = [
  // ... existing fields ...
  'my_new_counter',      // ← ADD HERE
  'mcp_my_new_tool',     // ← ADD HERE (for MCP)
] as const;
```

### Step 5: Rebuild the Shared Library

```bash
cd flingoos-shared
npm run build
```

### Step 6: Add Logging in Consumer Service

See [Code Examples by Service](#code-examples-by-service) below.

---

## Code Examples by Service

### Admin Panel (React Hook)

The admin-panel uses a React hook for client-side logging:

**Location**: `frontend/src/hooks/useUsageLogger.ts`

```typescript
// Add a new convenience method to the hook:

const logMyNewAction = useCallback((options?: LogOptions) => 
  logWithDailyUser('my_new_action', options), [logWithDailyUser]);

// Export it:
return { 
  logMyNewAction,  // ← ADD HERE
  // ... other methods ...
};
```

**Usage in a component**:

```typescript
import { useUsageLogger } from '@/hooks/useUsageLogger';

function MyComponent() {
  const { logMyNewAction } = useUsageLogger();
  
  const handleClick = () => {
    logMyNewAction({
      component: 'MyComponent',
      properties: { 
        some_property: 'value',
        extra_data: 123,
      },
    });
    // ... rest of handler
  };
}
```

### Admin Panel (API Route)

For server-side logging in Next.js API routes:

```typescript
import { 
  getCounterUpdates, 
  getDailyPeriodId, 
  generateEventId 
} from '@flingoos/shared/usage-logging';
import { FieldValue } from 'firebase-admin/firestore';

// In your API handler:
const action = 'my_new_action';
const eventId = generateEventId();
const periodId = getDailyPeriodId(new Date());

// Get counter updates
const counterUpdates = getCounterUpdates(
  action,
  request.body.properties,
  (n) => FieldValue.increment(n)
);

// Write event
await db.collection('usage').doc('events').collection('data').add({
  action,
  event_id: eventId,
  period_id: periodId,
  // ... other fields
});

// Update counters
await db.doc('usage/counters/global/totals').set(counterUpdates, { merge: true });
```

### MCP Server

For MCP tool logging:

**Option 1: Use existing wrapper** (`src/utils/usage-logger.ts`):

```typescript
// Add a new convenience function:
export function logMyNewTool(
  userId: string,
  orgId: string,
  customProperty: string,
  userEmail?: string
): void {
  logMcpUsage({
    action: 'mcp_my_new_tool',
    userId,
    userEmail,
    orgId,
    component: 'my-new-tool',
    properties: {
      custom_property: customProperty,
    },
  }, getFirestoreOps()).catch(() => {}); // Fire and forget
}
```

**Option 2: Use shared factory functions**:

```typescript
import { createLogContextList } from '@flingoos/shared/usage-logging';

// In your tool file:
const firestoreOps = getFirestoreOps();
const logMyNewTool = createLogMyNewTool(firestoreOps);

// Usage:
logMyNewTool(userId, orgId, customProperty, userEmail);
```

### Any Other Service

For a completely new service:

```typescript
import { 
  logUsageEvent, 
  type FirestoreOperations 
} from '@flingoos/shared/usage-logging';
import { FieldValue } from 'firebase-admin/firestore';

// Create Firestore operations adapter
const firestoreOps: FirestoreOperations = {
  addDocument: async (path, data) => {
    const [collection, docId, subCollection] = path.split('/');
    return await db.collection(collection).doc(docId).collection(subCollection).add(data);
  },
  setDocumentMerge: async (path, data) => {
    // Parse path and set with merge
    await db.doc(path).set(data, { merge: true });
  },
  increment: (n) => FieldValue.increment(n),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

// Log events
await logUsageEvent({
  action: 'my_new_action',
  userId: 'user123',
  userEmail: 'user@example.com',
  orgId: 'org123',
  service: 'my-new-service',
  component: 'MyComponent',
  properties: { key: 'value' },
}, firestoreOps);
```

---

## Firestore Paths

### Event Document Structure

Path: `/usage/events/data/{auto-id}`

```json
{
  "action": "my_new_action",
  "component": "MyComponent",
  "event_id": "evt_abc123-def456-...",
  "org_id": "diligent4",
  "period_id": "2026-01-13",
  "properties": {
    "custom_key": "custom_value"
  },
  "service": "admin-panel",
  "timestamp": "<Firestore Timestamp>",
  "user_email": "user@example.com",
  "user_id": "firebase-uid-123"
}
```

### Counter Document Structure

Path: `/usage/counters/daily/2026-01-13`

```json
{
  "period_id": "2026-01-13",
  "sessions_started": 10,
  "publishes": 5,
  "my_new_counter": 3,
  "mcp_total": 25,
  "last_updated": "<Firestore Timestamp>"
}
```

---

## Verification Checklist

After adding a new event type, verify:

- [ ] **Types**: Action added to `types.ts` union type
- [ ] **Constants**: Action added to array in `constants.ts`
- [ ] **Counter Logic**: Case added to `getCounterUpdates()` in `server.ts`
- [ ] **Counter Field**: Field added to `ALL_COUNTER_FIELDS`
- [ ] **Build**: `npm run build` succeeds in flingoos-shared
- [ ] **Tests**: New test cases added to `usage-logging.test.ts`
- [ ] **Consumer Updated**: Service code calls the new logging function
- [ ] **Firestore**: Events appear in `/usage/events/data/`
- [ ] **Firestore**: Counters increment in `/usage/counters/daily/{date}`

### How to Verify in Firestore Console

1. Go to: https://console.firebase.google.com/project/flingoos-staging/firestore
2. Navigate to: `usage` → `events` → `data`
3. Find recent documents with `action: "your_new_action"`
4. Check counters at: `usage` → `counters` → `daily` → `{today's date}`

---

## Common Patterns

### Pattern 1: Simple Counter

For actions that just need to count occurrences:

```typescript
case 'my_simple_action':
  updates.my_simple_counter = increment(1);
  break;
```

### Pattern 2: Counter with Property Breakdown

For actions where you want to track sub-categories:

```typescript
case 'my_action_with_type':
  updates.my_action_total = increment(1);
  const actionType = properties?.action_type as string;
  if (actionType === 'typeA') {
    updates.my_action_type_a = increment(1);
  } else if (actionType === 'typeB') {
    updates.my_action_type_b = increment(1);
  }
  break;
```

### Pattern 3: Counter with Numeric Value

For actions that track amounts (like duration):

```typescript
case 'my_action_with_value':
  updates.my_action_count = increment(1);
  const value = properties?.value as number;
  if (typeof value === 'number' && value > 0) {
    updates.my_action_total_value = increment(value);
  }
  break;
```

### Pattern 4: MCP Tool with mcp_total

All MCP actions should increment `mcp_total`:

```typescript
case 'mcp_my_tool':
  updates.mcp_my_tool = increment(1);
  updates.mcp_total = increment(1);  // Always include for MCP
  break;
```

---

## Chart Integration (Optional)

To display your new metric in the admin-panel chart:

**File**: `flingoos-shared/src/usage-logging/constants.ts`

Add to appropriate metrics config:

```typescript
// For main metrics (shown as multi-line chart):
export const MAIN_METRICS = {
  // ... existing ...
  my_new_counter: { label: 'My New Metric', color: CHART_COLORS.purple },
};

// For secondary metrics (dropdown selector):
export const SECONDARY_METRICS = {
  // ... existing ...
  my_new_counter: { label: 'My New Metric', color: CHART_COLORS.green },
};
```

Then update the admin-panel's `UsageChart.tsx` if needed.

---

## Questions?

Check these resources:
- `README.md` - Quick reference
- `dev_diary.md` - Implementation history and decisions
- `EVENT_FORMAT.md` (in admin-panel) - Full event specification

---

*Last updated: January 2026*
