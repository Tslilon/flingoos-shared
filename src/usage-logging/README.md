# Usage Logging Module

Centralized usage event logging for all Flingoos services.

## Overview

This module provides a unified system for tracking user activities across the Flingoos ecosystem:
- **Admin Panel**: Web application user actions (sessions, publishes, exports, etc.)
- **MCP Server**: Tool invocations (context-list, context-get, context-search, context-modify)

All events are written to the same Firestore database, enabling unified analytics across all services.

## Installation

The module is included in `@flingoos/shared`. Import it as:

```typescript
// Import types
import type { UsageAction, UsageLogOptions } from '@flingoos/shared/usage-logging';

// Import constants
import { MAIN_METRICS, MCP_METRICS, ALL_ACTIONS } from '@flingoos/shared/usage-logging';

// Import server-side functions
import { getCounterUpdates, getDailyPeriodId } from '@flingoos/shared/usage-logging';
```

## Usage

### Server-Side Logging (MCP or API Routes)

The module provides a `FirestoreOperations` interface that bridges the shared library with your specific Firestore client:

```typescript
import { logUsageEvent, type FirestoreOperations } from '@flingoos/shared/usage-logging';
import { FieldValue } from 'firebase-admin/firestore';

// Create the Firestore operations adapter
const firestoreOps: FirestoreOperations = {
  addDocument: async (path, data) => {
    // Your Firestore add logic
  },
  setDocumentMerge: async (path, data) => {
    // Your Firestore set with merge logic
  },
  increment: (n) => FieldValue.increment(n),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

// Log an event
await logUsageEvent({
  action: 'session',
  userId: 'user123',
  userEmail: 'user@example.com',
  orgId: 'org123',
  service: 'admin-panel',
  component: 'SessionPage',
  properties: {
    recording_source: 'screen',
    output_type: 'workflow',
  },
}, firestoreOps);
```

### MCP-Specific Helpers

For MCP tools, use the pre-built convenience functions:

```typescript
import { createLogContextList, createLogContextGet } from '@flingoos/shared/usage-logging';

// Create the logging functions once
const firestoreOps = createFirestoreOperations(); // Your adapter
const logContextList = createLogContextList(firestoreOps);
const logContextGet = createLogContextGet(firestoreOps);

// Use in tool handlers
logContextList(userId, orgId, scope, resultsCount, userEmail);
```

### Counter Updates

Get counter field updates without logging an event:

```typescript
import { getCounterUpdates } from '@flingoos/shared/usage-logging';
import { FieldValue } from 'firebase-admin/firestore';

const updates = getCounterUpdates(
  'session',
  { recording_source: 'screen', output_type: 'workflow' },
  (n) => FieldValue.increment(n)
);

// updates = {
//   sessions_started: FieldValue.increment(1),
//   sessions_screen: FieldValue.increment(1),
//   sessions_workflow: FieldValue.increment(1),
// }
```

## Supported Actions

### Admin Panel Actions

| Action | Description | Counter Fields |
|--------|-------------|----------------|
| `session` | Recording session started | `sessions_started`, `sessions_screen`/`camera`, `sessions_workflow`/`teach_ai` |
| `session_complete` | Recording completed | `sessions_completed`, `total_session_duration_ms` |
| `workflow_edit` | Workflow saved/edited | `workflow_edits` |
| `publish` | Workflow published | `publishes` |
| `export` | Workflow exported | `exports` |
| `chatbot_message` | Chat message sent | `chatbot_messages` |
| `enrich_click` | Enrich button clicked | `enrich_clicks` |
| `daily_active_user` | First activity of day | `unique_users` |

### MCP Actions

| Action | Description | Counter Fields |
|--------|-------------|----------------|
| `mcp_context_list` | List contexts | `mcp_context_list`, `mcp_total` |
| `mcp_context_get` | Get context | `mcp_context_get`, `mcp_total` |
| `mcp_context_search` | Search contexts | `mcp_context_search`, `mcp_total` |
| `mcp_context_modify` | Modify context | `mcp_context_modify`, `mcp_total` |

## Firestore Paths

Events and counters are stored at:

```
/usage/events/data/{auto-id}           # Individual events
/usage/counters/global/totals          # All-time counters
/usage/counters/daily/{YYYY-MM-DD}     # Daily global counters
/usage/counters/daily/{YYYY-MM-DD}/orgs/{org_id}  # Daily per-org counters
/usage/daily_users/records/{date}_{uid}  # DAU deduplication
```

## Adding New Actions

1. **Add the action type** in `types.ts`:
   ```typescript
   export type AdminPanelAction = 
     | 'session'
     | 'my_new_action'  // Add here
     | ...;
   ```

2. **Add to constants** in `constants.ts`:
   ```typescript
   export const ADMIN_PANEL_ACTIONS: readonly AdminPanelAction[] = [
     ...
     'my_new_action',  // Add here
   ] as const;
   ```

3. **Add counter logic** in `server.ts`:
   ```typescript
   case 'my_new_action':
     updates.my_new_counter = increment(1);
     break;
   ```

4. **Add counter field** to `ALL_COUNTER_FIELDS` in `constants.ts`

5. **Update chart metrics** if needed (in admin-panel)

## Module Exports

### Types (`./types.ts`)
- `UsageAction`, `AdminPanelAction`, `McpAction`
- `RecordingSource`, `OutputType`, `ExportType`
- `UsageEvent`, `UsageLogOptions`, `McpLogOptions`
- `UsageTimeseriesDataPoint`, `CounterUpdates`

### Constants (`./constants.ts`)
- `ADMIN_PANEL_ACTIONS`, `MCP_ACTIONS`, `ALL_ACTIONS`
- `USAGE_PATHS`, `getDailyCounterPath`, `getOrgCounterPath`
- `MAIN_METRICS`, `SECONDARY_METRICS`, `MCP_METRICS`
- `ALL_COUNTER_FIELDS`, `CHART_COLORS`

### Server Functions (`./server.ts`)
- `logUsageEvent()` - Core logging function
- `logMcpUsage()` - MCP convenience wrapper
- `getCounterUpdates()` - Get counter field updates
- `getDailyPeriodId()` - Get period ID string
- `generateEventId()` - Generate event ID
- `createLogContext*()` - MCP tool-specific loggers
