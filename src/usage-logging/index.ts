/**
 * Usage Logging Module
 * 
 * Centralized usage event logging for all Flingoos services.
 * 
 * Usage:
 * 
 * ```typescript
 * // Import types
 * import type { UsageAction, UsageLogOptions } from '@flingoos/shared/usage-logging';
 * 
 * // Import constants
 * import { MAIN_METRICS, MCP_METRICS, ALL_ACTIONS } from '@flingoos/shared/usage-logging';
 * 
 * // Import server-side logging (for MCP or API routes)
 * import { logUsageEvent, getCounterUpdates } from '@flingoos/shared/usage-logging';
 * ```
 */

// Re-export all types
export * from './types.js';

// Re-export all constants
export * from './constants.js';

// Re-export server-side logging functions
export * from './server.js';
