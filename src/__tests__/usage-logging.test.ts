/**
 * Usage Logging Module Tests
 * 
 * Tests for types, constants, and server-side logging logic.
 */

import { describe, it, expect } from '@jest/globals';
import {
  // Types validation (compile-time, but we can test the exports exist)
  type UsageAction,
  type AdminPanelAction,
  type McpAction,
  type VideoForgeAction,
  type UsageService,
  type RecordingSource,
  type OutputType,
  type UsageLogOptions,
  type McpLogOptions,
  type UsageTimeseriesDataPoint,
  
  // Constants
  ADMIN_PANEL_ACTIONS,
  MCP_ACTIONS,
  VIDEO_FORGE_ACTIONS,
  ALL_ACTIONS,
  USAGE_SERVICES,
  isValidAction,
  isAdminPanelAction,
  isMcpAction,
  isVideoForgeAction,
  
  // Metric configs
  MAIN_METRICS,
  SECONDARY_METRICS,
  MCP_METRICS,
  ALL_COUNTER_FIELDS,
  CHART_COLORS,
  
  // Path helpers
  USAGE_PATHS,
  getDailyCounterPath,
  getOrgCounterPath,
  getDailyUserDocId,
  
  // Server functions
  getDailyPeriodId,
  generateEventId,
  getCounterUpdates,
} from '../usage-logging/index.js';

describe('Usage Logging Module', () => {
  
  describe('Action Constants', () => {
    it('should have all admin panel actions', () => {
      expect(ADMIN_PANEL_ACTIONS).toContain('session');
      expect(ADMIN_PANEL_ACTIONS).toContain('session_complete');
      expect(ADMIN_PANEL_ACTIONS).toContain('workflow_edit');
      expect(ADMIN_PANEL_ACTIONS).toContain('publish');
      expect(ADMIN_PANEL_ACTIONS).toContain('export');
      expect(ADMIN_PANEL_ACTIONS).toContain('chatbot_message');
      expect(ADMIN_PANEL_ACTIONS).toContain('enrich_click');
      expect(ADMIN_PANEL_ACTIONS).toContain('daily_active_user');
      expect(ADMIN_PANEL_ACTIONS.length).toBe(8);
    });
    
    it('should have all MCP actions', () => {
      expect(MCP_ACTIONS).toContain('mcp_context_list');
      expect(MCP_ACTIONS).toContain('mcp_context_get');
      expect(MCP_ACTIONS).toContain('mcp_context_search');
      expect(MCP_ACTIONS).toContain('mcp_context_modify');
      expect(MCP_ACTIONS.length).toBe(4);
    });
    
    it('should have all Video Forge actions', () => {
      expect(VIDEO_FORGE_ACTIONS).toContain('video_forge_analysis');
      expect(VIDEO_FORGE_ACTIONS).toContain('video_forge_augmentation');
      expect(VIDEO_FORGE_ACTIONS.length).toBe(2);
    });
    
    it('should combine all actions correctly', () => {
      expect(ALL_ACTIONS.length).toBe(
        ADMIN_PANEL_ACTIONS.length + MCP_ACTIONS.length + VIDEO_FORGE_ACTIONS.length
      );
      ADMIN_PANEL_ACTIONS.forEach(action => {
        expect(ALL_ACTIONS).toContain(action);
      });
      MCP_ACTIONS.forEach(action => {
        expect(ALL_ACTIONS).toContain(action);
      });
      VIDEO_FORGE_ACTIONS.forEach(action => {
        expect(ALL_ACTIONS).toContain(action);
      });
    });
    
    it('should validate Video Forge actions correctly', () => {
      expect(isVideoForgeAction('video_forge_analysis')).toBe(true);
      expect(isVideoForgeAction('video_forge_augmentation')).toBe(true);
      expect(isVideoForgeAction('session')).toBe(false);
      expect(isVideoForgeAction('mcp_context_list')).toBe(false);
    });
  });
  
  describe('Action Validation Functions', () => {
    it('isValidAction should return true for valid actions', () => {
      expect(isValidAction('session')).toBe(true);
      expect(isValidAction('mcp_context_list')).toBe(true);
    });
    
    it('isValidAction should return false for invalid actions', () => {
      expect(isValidAction('invalid_action')).toBe(false);
      expect(isValidAction('')).toBe(false);
    });
    
    it('isAdminPanelAction should correctly identify admin actions', () => {
      expect(isAdminPanelAction('session')).toBe(true);
      expect(isAdminPanelAction('publish')).toBe(true);
      expect(isAdminPanelAction('mcp_context_list')).toBe(false);
    });
    
    it('isMcpAction should correctly identify MCP actions', () => {
      expect(isMcpAction('mcp_context_list')).toBe(true);
      expect(isMcpAction('mcp_context_modify')).toBe(true);
      expect(isMcpAction('session')).toBe(false);
    });
  });
  
  describe('Metric Configurations', () => {
    it('should have all main metrics with labels and colors', () => {
      expect(MAIN_METRICS.sessions_started).toBeDefined();
      expect(MAIN_METRICS.sessions_started.label).toBe('Sessions Started');
      expect(MAIN_METRICS.sessions_started.color).toMatch(/^#[0-9A-F]{6}$/i);
    });
    
    it('should have all secondary metrics', () => {
      expect(SECONDARY_METRICS.chatbot_messages).toBeDefined();
      expect(SECONDARY_METRICS.unique_users).toBeDefined();
    });
    
    it('should have all MCP metrics', () => {
      expect(MCP_METRICS.mcp_context_list).toBeDefined();
      expect(MCP_METRICS.mcp_total).toBeDefined();
    });
    
    it('ALL_COUNTER_FIELDS should contain all counter field names', () => {
      expect(ALL_COUNTER_FIELDS).toContain('sessions_started');
      expect(ALL_COUNTER_FIELDS).toContain('publishes');
      expect(ALL_COUNTER_FIELDS).toContain('mcp_total');
      expect(ALL_COUNTER_FIELDS.length).toBeGreaterThan(15);
    });
  });
  
  describe('Firestore Path Helpers', () => {
    it('USAGE_PATHS should have correct paths', () => {
      expect(USAGE_PATHS.BASE).toBe('usage');
      expect(USAGE_PATHS.EVENTS.DATA).toBe('usage/events/data');
      expect(USAGE_PATHS.COUNTERS.GLOBAL_TOTALS).toBe('usage/counters/global/totals');
    });
    
    it('getDailyCounterPath should generate correct path', () => {
      expect(getDailyCounterPath('2026-01-13')).toBe('usage/counters/daily/2026-01-13');
    });
    
    it('getOrgCounterPath should generate correct path', () => {
      expect(getOrgCounterPath('2026-01-13', 'test-org')).toBe('usage/counters/daily/2026-01-13/orgs/test-org');
    });
    
    it('getDailyUserDocId should generate correct ID', () => {
      expect(getDailyUserDocId('2026-01-13', 'user123')).toBe('2026-01-13_user123');
    });
  });
  
  describe('Server Functions', () => {
    describe('getDailyPeriodId', () => {
      it('should return YYYY-MM-DD format', () => {
        const date = new Date('2026-01-13T12:00:00Z');
        const result = getDailyPeriodId(date);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
      
      it('should pad single digit months and days', () => {
        const date = new Date('2026-01-05T12:00:00Z');
        const result = getDailyPeriodId(date);
        expect(result).toBe('2026-01-05');
      });
    });
    
    describe('generateEventId', () => {
      it('should return evt_ prefixed ID', () => {
        const id = generateEventId();
        expect(id).toMatch(/^evt_[a-f0-9-]{36}$/);
      });
      
      it('should generate unique IDs', () => {
        const id1 = generateEventId();
        const id2 = generateEventId();
        expect(id1).not.toBe(id2);
      });
    });
    
    describe('getCounterUpdates', () => {
      // Mock increment function
      const mockIncrement = (n: number) => ({ _increment: n });
      
      it('should return sessions_started for session action', () => {
        const updates = getCounterUpdates('session', {}, mockIncrement);
        expect(updates.sessions_started).toEqual({ _increment: 1 });
      });
      
      it('should track recording_source for session action', () => {
        const updates = getCounterUpdates('session', { recording_source: 'screen' }, mockIncrement);
        expect(updates.sessions_screen).toEqual({ _increment: 1 });
      });
      
      it('should track output_type for session action', () => {
        const updates = getCounterUpdates('session', { output_type: 'workflow' }, mockIncrement);
        expect(updates.sessions_workflow).toEqual({ _increment: 1 });
      });
      
      it('should track both dimensions for session action', () => {
        const updates = getCounterUpdates('session', { 
          recording_source: 'camera', 
          output_type: 'teach_ai' 
        }, mockIncrement);
        expect(updates.sessions_started).toEqual({ _increment: 1 });
        expect(updates.sessions_camera).toEqual({ _increment: 1 });
        expect(updates.sessions_teach_ai).toEqual({ _increment: 1 });
      });
      
      it('should handle legacy session_type', () => {
        const updates = getCounterUpdates('session', { session_type: 'screen' }, mockIncrement);
        expect(updates.sessions_screen).toEqual({ _increment: 1 });
        expect(updates.sessions_workflow).toEqual({ _increment: 1 });
      });
      
      it('should return sessions_completed for session_complete action', () => {
        const updates = getCounterUpdates('session_complete', {}, mockIncrement);
        expect(updates.sessions_completed).toEqual({ _increment: 1 });
      });
      
      it('should track duration for session_complete', () => {
        const updates = getCounterUpdates('session_complete', { session_duration_ms: 5000 }, mockIncrement);
        expect(updates.total_session_duration_ms).toEqual({ _increment: 5000 });
      });
      
      it('should return correct counter for publish action', () => {
        const updates = getCounterUpdates('publish', {}, mockIncrement);
        expect(updates.publishes).toEqual({ _increment: 1 });
      });
      
      it('should return correct counter for export action', () => {
        const updates = getCounterUpdates('export', {}, mockIncrement);
        expect(updates.exports).toEqual({ _increment: 1 });
      });
      
      it('should return correct counters for MCP actions', () => {
        const listUpdates = getCounterUpdates('mcp_context_list', {}, mockIncrement);
        expect(listUpdates.mcp_context_list).toEqual({ _increment: 1 });
        expect(listUpdates.mcp_total).toEqual({ _increment: 1 });
        
        const getUpdates = getCounterUpdates('mcp_context_get', {}, mockIncrement);
        expect(getUpdates.mcp_context_get).toEqual({ _increment: 1 });
        expect(getUpdates.mcp_total).toEqual({ _increment: 1 });
      });
      
      it('should return unique_users for daily_active_user action', () => {
        const updates = getCounterUpdates('daily_active_user', {}, mockIncrement);
        expect(updates.unique_users).toEqual({ _increment: 1 });
      });
    });
  });
  
  describe('Service Constants', () => {
    it('should have all valid services', () => {
      expect(USAGE_SERVICES).toContain('admin-panel');
      expect(USAGE_SERVICES).toContain('flingoos-mcp');
      expect(USAGE_SERVICES).toContain('flingoos-mcp-tools');
      expect(USAGE_SERVICES).toContain('flingoos-ambient');
    });
  });
  
  describe('Chart Colors', () => {
    it('should have valid hex colors', () => {
      Object.values(CHART_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
