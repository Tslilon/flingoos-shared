#!/usr/bin/env node
/**
 * Phase 14 Schema Validation Test
 * Quick validation without Jest dependency
 */

import * as schemas from '../dist/schemas.js';

const VALID_EXAMPLES = {
  pairIntentResponse: {
    pairing_token: "pair_abcd1234567890ef",
    deep_link: "flingoos-bridge://pair?t=pair_abcd1234567890ef", 
    expires_at: "2024-01-15T10:30:00.000Z"
  },
  presenceIntentResponse: {
    presence_nonce: "pres_xyz789012345abcd",
    deep_link: "flingoos-bridge://approve?t=pres_xyz789012345abcd",
    short_code: "1234",
    expires_at: "2024-01-15T10:32:00.000Z"
  },
  presenceStatusReady: {
    ready: true,
    presence_ticket: "ticket_ready_abc123456789",
    expires_at: "2024-01-15T10:33:00.000Z", 
    poll_after_ms: 1000,
    now: "2024-01-15T10:31:45.000Z"
  },
  errorEnvelope: {
    code: "ticket_expired",
    http: 400,
    message: "Presence ticket has expired"
  }
};

const INVALID_EXAMPLES = {
  shortToken: "short",
  invalidTimestamp: "2024-01-15 10:30:00", 
  invalidShortCode: "12345",
  invalidDeepLink: "https://example.com/pair",
  wrongHttpStatus: 200
};

console.log('🧪 Testing Phase 14 Schemas...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Valid cases
test('PairIntentResponse - valid', () => {
  const result = schemas.PairIntentResponseSchema.parse(VALID_EXAMPLES.pairIntentResponse);
  if (!result.pairing_token) throw new Error('Missing pairing_token');
});

test('PresenceIntentResponse - valid', () => {
  const result = schemas.PresenceIntentResponseSchema.parse(VALID_EXAMPLES.presenceIntentResponse);
  if (!result.short_code.match(/^\d{4}$/)) throw new Error('Invalid short_code format');
});

test('PresenceStatusResponse - ready with ticket', () => {
  const result = schemas.PresenceStatusResponseSchema.parse(VALID_EXAMPLES.presenceStatusReady);
  if (!result.presence_ticket) throw new Error('Missing presence_ticket when ready=true');
});

test('ErrorEnvelope - valid error', () => {
  const result = schemas.ErrorEnvelopeSchema.parse(VALID_EXAMPLES.errorEnvelope);
  if (result.http < 400 || result.http > 599) throw new Error('Invalid HTTP status range');
});

// Invalid cases (should fail)
test('PairIntentResponse - invalid token', () => {
  try {
    schemas.PairIntentResponseSchema.parse({
      ...VALID_EXAMPLES.pairIntentResponse,
      pairing_token: INVALID_EXAMPLES.shortToken
    });
    throw new Error('Should have failed validation');
  } catch (error) {
    if (!error.message.includes('Invalid opaque token format')) {
      throw new Error('Wrong validation error');
    }
  }
});

test('PresenceIntentResponse - invalid timestamp', () => {
  try {
    schemas.PresenceIntentResponseSchema.parse({
      ...VALID_EXAMPLES.presenceIntentResponse,
      expires_at: INVALID_EXAMPLES.invalidTimestamp
    });
    throw new Error('Should have failed validation');
  } catch (error) {
    if (!error.message.includes('Invalid ISO-8601 timestamp')) {
      throw new Error('Wrong validation error');
    }
  }
});

test('PresenceIntentResponse - invalid short code', () => {
  try {
    schemas.PresenceIntentResponseSchema.parse({
      ...VALID_EXAMPLES.presenceIntentResponse, 
      short_code: INVALID_EXAMPLES.invalidShortCode
    });
    throw new Error('Should have failed validation');
  } catch (error) {
    if (!error.message.includes('Must be 4-digit code')) {
      throw new Error('Wrong validation error');
    }
  }
});

test('ErrorEnvelope - invalid HTTP status', () => {
  try {
    schemas.ErrorEnvelopeSchema.parse({
      ...VALID_EXAMPLES.errorEnvelope,
      http: INVALID_EXAMPLES.wrongHttpStatus
    });
    throw new Error('Should have failed validation');
  } catch (error) {
    if (!error.message.includes('Number must be greater than or equal to 400')) {
      throw new Error('Wrong validation error');
    }
  }
});

// Round-trip test
test('Round-trip validation', () => {
  const original = VALID_EXAMPLES.presenceIntentResponse;
  const parsed = schemas.PresenceIntentResponseSchema.parse(original);
  const json = JSON.stringify(parsed);
  const deserialized = JSON.parse(json);
  const revalidated = schemas.PresenceIntentResponseSchema.parse(deserialized);
  
  if (JSON.stringify(revalidated) !== JSON.stringify(original)) {
    throw new Error('Round-trip validation failed');
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('❌ Some tests failed');
  process.exit(1);
} else {
  console.log('🎉 All Phase 14 schema tests passed!');
}