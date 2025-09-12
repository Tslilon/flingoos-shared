/**
 * Phase 14: Example payloads for testing and documentation
 */

import type {
  PairIntentResponse,
  PairCompleteRequest,
  DeviceRecord,
  UserDeviceLink,
  PresenceIntentResponse,
  PresenceCompleteRequest,
  PresenceStatusResponse,
  SessionStartRequest,
  ErrorEnvelope
} from './types.js';

// Valid examples for testing
export const VALID_EXAMPLES = {
  pairIntentResponse: {
    pairing_token: "pair_abcd1234567890ef",
    deep_link: "flingoos-bridge://pair?t=pair_abcd1234567890ef",
    expires_at: "2024-01-15T10:30:00.000Z"
  } as PairIntentResponse,

  pairCompleteRequest: {
    pairing_token: "pair_abcd1234567890ef",
    device_proof: "ed25519_signature_hex_encoded_64_chars_here_1234567890abcdef"
  } as PairCompleteRequest,

  deviceRecord: {
    fingerprint: "fp_device_abc123456789",
    device_id: "dev_org123_device456",
    org_id: "org_diligent4",
    label: "MacBook Pro",
    paired_by: "user_alice_123",
    paired_at: "2024-01-15T09:00:00.000Z",
    last_heartbeat_at: "2024-01-15T10:29:45.000Z",
    expires_at: "2024-01-16T09:00:00.000Z",
    available: true,
    stale: false
  } as DeviceRecord,

  userDeviceLink: {
    user_id: "user_alice_123",
    org_id: "org_diligent4", 
    fingerprint: "fp_device_abc123456789",
    last_used_at: "2024-01-15T10:15:00.000Z",
    expires_at: "2024-01-16T10:15:00.000Z"
  } as UserDeviceLink,

  presenceIntentResponse: {
    presence_nonce: "pres_xyz789012345abcd",
    deep_link: "flingoos-bridge://approve?t=pres_xyz789012345abcd",
    short_code: "1234",
    expires_at: "2024-01-15T10:32:00.000Z"
  } as PresenceIntentResponse,

  presenceCompleteRequest: {
    presence_nonce: "pres_xyz789012345abcd",
    device_proof: "ed25519_signature_for_presence_proof_here_64_chars_1234abcd"
  } as PresenceCompleteRequest,

  presenceStatusNotReady: {
    ready: false,
    poll_after_ms: 800,
    now: "2024-01-15T10:31:30.000Z"
  } as PresenceStatusResponse,

  presenceStatusReady: {
    ready: true,
    presence_ticket: "ticket_ready_abc123456789",
    expires_at: "2024-01-15T10:33:00.000Z",
    poll_after_ms: 1000,
    now: "2024-01-15T10:31:45.000Z"
  } as PresenceStatusResponse,

  sessionStartRequest: {
    presence_ticket: "ticket_ready_abc123456789",
    session_options: {
      stages: ["A", "B", "C"],
      media_processing: true
    }
  } as SessionStartRequest,

  errorEnvelope: {
    code: "ticket_expired",
    http: 400,
    message: "Presence ticket has expired",
    details: {
      expired_at: "2024-01-15T10:30:00.000Z",
      current_time: "2024-01-15T10:32:15.000Z"
    }
  } as ErrorEnvelope
} as const;

// Invalid examples that should fail validation
export const INVALID_EXAMPLES = {
  // Tokens that don't match opaque format
  invalidToken: "short",
  
  // Non-ISO8601 timestamps
  invalidTimestamp: "2024-01-15 10:30:00",
  
  // Wrong short code format
  invalidShortCode: "12345", // Too long
  
  // Wrong deep link format
  invalidDeepLink: "https://example.com/pair",
  
  // Should not contain sensitive data in logs
  presenceTicketInLogs: "ticket_should_not_appear_in_logs_123456789"
} as const;