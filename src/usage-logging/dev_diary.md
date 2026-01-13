# Usage Logging Module - Development Diary

**Project**: Flingoos Shared Library  
**Module**: `@flingoos/shared/usage-logging`  
**Started**: January 2026  
**Status**: Active Development

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Implementation Timeline](#implementation-timeline)
5. [Technical Decisions](#technical-decisions)
6. [Integration Guide](#integration-guide)
7. [Testing](#testing)
8. [Known Issues](#known-issues)
9. [Future Improvements](#future-improvements)
10. [Changelog](#changelog)

---

## Overview

This module provides a centralized usage event logging system for all Flingoos services. It ensures consistent event tracking, counter aggregation, and analytics across:

- **Admin Panel** (web application)
- **MCP Server** (AI tool invocations)
- **Future services** (Ambient, etc.)

### Key Features

| Feature | Description |
|---------|-------------|
| Unified Types | Single source of truth for all event types |
| Counter Logic | Shared counter update calculations |
| Firestore Paths | Consistent path constants |
| Metric Configs | Chart colors and labels |
| Injectable Firestore | Works with any Firebase setup |

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONSUMER SERVICES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐      ┌─────────────────┐                       │
│  │  Admin Panel    │      │   MCP Server    │                       │
│  │  (Next.js)      │      │   (Node.js)     │                       │
│  │                 │      │                 │                       │
│  │  useUsageLogger │      │  usage-logger   │                       │
│  │  (React hook)   │      │  (wrapper)      │                       │
│  └────────┬────────┘      └────────┬────────┘                       │
│           │                        │                                 │
│           └──────────┬─────────────┘                                │
│                      │                                               │
│                      ▼                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              @flingoos/shared/usage-logging                  │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │ types.ts │  │ constants.ts │  │     server.ts        │   │   │
│  │  │          │  │              │  │                      │   │   │
│  │  │ Actions  │  │ MAIN_METRICS │  │ getCounterUpdates()  │   │   │
│  │  │ Events   │  │ ALL_ACTIONS  │  │ logUsageEvent()      │   │   │
│  │  │ Options  │  │ USAGE_PATHS  │  │ getDailyPeriodId()   │   │   │
│  │  └──────────┘  └──────────────┘  └──────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                      │                                               │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                                    │
├─────────────────────────────────────────────────────────────────────┤
│  /usage/events/data/{auto-id}            ← Individual events        │
│  /usage/counters/global/totals           ← All-time counters        │
│  /usage/counters/daily/{date}            ← Daily global counters    │
│  /usage/counters/daily/{date}/orgs/{org} ← Daily per-org counters   │
│  /usage/daily_users/records/{date}_{uid} ← DAU deduplication        │
└─────────────────────────────────────────────────────────────────────┘
```

### Counter Update Flow

```
Action received (e.g., 'session')
        │
        ▼
getCounterUpdates(action, properties, incrementFn)
        │
        ├─► sessions_started: increment(1)
        ├─► sessions_screen: increment(1)  (if recording_source='screen')
        └─► sessions_workflow: increment(1) (if output_type='workflow')
        │
        ▼
Write to all counter paths atomically
```

---

## File Structure

```
flingoos-shared/src/usage-logging/
├── index.ts                    # Module entry point, re-exports
├── types.ts                    # All TypeScript types & interfaces
├── constants.ts                # Action lists, metric configs, paths
├── server.ts                   # Server-side logging logic
├── README.md                   # Quick reference documentation
├── dev_diary.md               # This file - implementation history
└── create_new_ticket_instructor.md  # Guide for adding new events
```

### types.ts

Defines:
- `UsageAction`, `AdminPanelAction`, `McpAction` - Action type unions
- `RecordingSource`, `OutputType`, `ExportType` - Property enums
- `UsageEvent`, `UsageLogOptions`, `McpLogOptions` - Event structures
- `UsageTimeseriesDataPoint` - Chart data structure
- `FirestoreOperations` - Firestore adapter interface

### constants.ts

Exports:
- `ADMIN_PANEL_ACTIONS`, `MCP_ACTIONS`, `ALL_ACTIONS` - Action arrays
- `isValidAction()`, `isAdminPanelAction()`, `isMcpAction()` - Validators
- `MAIN_METRICS`, `SECONDARY_METRICS`, `MCP_METRICS` - Chart configs
- `ALL_COUNTER_FIELDS` - List of all counter field names
- `USAGE_PATHS` - Firestore collection/document paths
- `CHART_COLORS` - Consistent color palette

### server.ts

Provides:
- `getDailyPeriodId()` - Returns YYYY-MM-DD format
- `generateEventId()` - Returns evt_{uuid} format
- `getCounterUpdates()` - Calculates counter increments for any action
- `logUsageEvent()` - Core logging function (requires Firestore adapter)
- `logMcpUsage()` - MCP-specific wrapper with error handling
- `createLogContext*()` - Factory functions for MCP tool loggers

---

## Implementation Timeline

### Phase 1: Initial Creation (January 13, 2026)

- Created module structure in flingoos-shared
- Extracted types from admin-panel `types.ts`
- Extracted constants and metric configs
- Implemented `getCounterUpdates()` with all action logic
- Added MCP action support

### Phase 2: Integration

- Updated admin-panel to use shared types
- Updated admin-panel API route to use `getCounterUpdates()`
- Updated flingoos-mcp `usage-logger.ts` to wrap shared library
- Maintained backward compatibility for all imports

### Phase 3: Documentation & Testing (Current)

- Created comprehensive test suite
- Added dev_diary.md (this file)
- Added create_new_ticket_instructor.md
- Local deployment testing

---

## Technical Decisions

### Why a Shared Library?

**Problem**: Admin-panel and MCP had duplicate implementations of:
- Type definitions
- Counter update logic
- Firestore paths

**Solution**: Centralize in `@flingoos/shared` which both repos already depend on.

**Benefits**:
1. Single source of truth
2. Consistent behavior across services
3. Easier to add new event types
4. Type safety prevents drift

### Why Injectable Firestore?

**Problem**: Different services use different Firebase configurations:
- Admin-panel: firebase-admin in API routes
- MCP: firebase-admin with service account

**Solution**: `FirestoreOperations` interface that accepts any Firestore implementation:

```typescript
interface FirestoreOperations {
  addDocument: (path: string, data: object) => Promise<unknown>;
  setDocumentMerge: (path: string, data: object) => Promise<void>;
  increment: (n: number) => unknown;
  serverTimestamp: () => unknown;
}
```

### Why Fire-and-Forget?

Usage logging should **never** block user actions:

```typescript
logMcpUsage({ ... }).catch(() => {});  // Never awaited, never throws
```

- Tool execution continues immediately
- Silent failure is acceptable for analytics
- Better user experience

### Why Session Dimensions?

Each session tracks TWO independent dimensions:

1. **Recording Source** (HOW): `screen` | `camera`
2. **Output Type** (WHAT FOR): `workflow` | `teach_ai`

This allows:
- `sessions_screen + sessions_camera = sessions_started`
- `sessions_workflow + sessions_teach_ai = sessions_started`

---

## Integration Guide

### Admin Panel

Types file re-exports from shared:
```typescript
// frontend/src/lib/usage-logging/types.ts
export { UsageAction, MAIN_METRICS } from '@flingoos/shared/usage-logging';
```

API route uses shared functions:
```typescript
import { getCounterUpdates, getDailyPeriodId } from '@flingoos/shared/usage-logging';
```

### MCP Server

Wrapper creates Firestore adapter:
```typescript
// src/utils/usage-logger.ts
import { logMcpUsage, createLogContextList } from '@flingoos/shared/usage-logging';

const firestoreOps = createFirestoreOperations();
export const logContextList = createLogContextList(firestoreOps);
```

---

## Testing

### Unit Tests

Located at: `src/__tests__/usage-logging.test.ts`

Tests cover:
- Action constants and validation functions
- Metric configurations
- Firestore path helpers
- `getDailyPeriodId()` formatting
- `generateEventId()` uniqueness
- `getCounterUpdates()` for all action types

### Integration Testing

Manual verification:
1. Start admin-panel locally
2. Start MCP server locally
3. Perform actions (record session, use MCP tools)
4. Check Firestore console for events and counters

---

## Known Issues

### None Currently

---

## Future Improvements

- [ ] Add batch logging support for high-volume scenarios
- [ ] Add rate limiting utilities
- [ ] Add event replay/backfill tools
- [ ] Add Firestore security rules generator
- [ ] Add BigQuery export schema

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 0.1.0 | Initial implementation |
| 2026-01-13 | 0.1.1 | Added README documentation |
| 2026-01-13 | 0.1.2 | Added tests, dev_diary, instructor guide |

---

*Last updated: January 2026*
