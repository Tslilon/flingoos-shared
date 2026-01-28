/**
 * Session translation cache and resolved content contract.
 *
 * Translations are a derived cache that can become stale. Canonical content
 * lives in session.content; only viewer and exporters use getResolvedContent().
 * All other features (search, indexing, analysis, diffs) must use
 * getCanonicalContent() only.
 */

import { z } from 'zod';
import { getTextDirection } from './video-artifacts.js';

// ============================================================================
// Translation cache (per-language)
// ============================================================================

export const TranslationStatusSchema = z.enum(['ready', 'stale', 'in_progress', 'failed']);
export type TranslationStatus = z.infer<typeof TranslationStatusSchema>;

export const TranslationEntrySchema = z.object({
  translatedContent: z.record(z.unknown()), // Same structure as canonical content
  translatedAt: z.string(),
  sourceRevision: z.number(),
  sourceFingerprint: z.string(),
  status: TranslationStatusSchema,
  model: z.string().optional(),
  error: z.string().optional(),
});
export type TranslationEntry = z.infer<typeof TranslationEntrySchema>;

export const SessionTranslationsSchema = z.record(z.string(), TranslationEntrySchema);
export type SessionTranslations = z.infer<typeof SessionTranslationsSchema>;

// ============================================================================
// Session document shape (fields used for translation/resolution)
// ============================================================================

/** Minimal session document shape for getCanonicalContent / getResolvedContent. */
export interface SessionContentDoc {
  content?: unknown;
  content_metadata?: {
    output_language?: string;
    detected_language?: string;
  };
  originalLanguage?: string;
  contentRevision?: number;
  contentFingerprint?: string;
  translations?: SessionTranslations;
  updated_at?: string;
}

// ============================================================================
// Resolved content result
// ============================================================================

export const FreshnessStatusSchema = z.enum(['canonical', 'ready', 'stale', 'missing']);
export type FreshnessStatus = z.infer<typeof FreshnessStatusSchema>;

export interface ResolvedContentResult {
  contentToUse: unknown;
  dir: 'rtl' | 'ltr' | 'auto';
  languageUsed: string;
  freshnessStatus: FreshnessStatus;
}

// ============================================================================
// Canonical content contract
// ============================================================================

/**
 * Returns the canonical (authoring) content only.
 * Use this for: search index, analytics, classification, extraction,
 * summarization, version history, diffs, collaboration anchoring.
 * Do NOT use for viewer or export display.
 */
export function getCanonicalContent(session: SessionContentDoc | null | undefined): unknown {
  if (!session) return undefined;
  return session.content;
}

// ============================================================================
// Resolved content (viewer + export only)
// ============================================================================

/**
 * Returns content to display and metadata for the selected language.
 * Use only in: viewer, PDF/DOCX/CSV export, share links.
 *
 * Rules:
 * - If selectedLang is originalLanguage (or effective original): return canonical, freshness canonical.
 * - Else if translation exists and status === 'ready': return translation, freshness ready.
 * - Else if translation exists and status === 'stale': return stale translation, freshness stale.
 * - Else: return canonical (fallback), freshness missing.
 */
export function getResolvedContent(
  session: SessionContentDoc | null | undefined,
  selectedLang: string | undefined | null
): ResolvedContentResult | undefined {
  if (!session?.content) return undefined;

  const canonical = session.content;
  const originalLang = session.originalLanguage ?? getEffectiveOriginalLanguage(session.content_metadata);

  const lang = selectedLang && selectedLang !== 'auto' ? selectedLang : originalLang;
  const dir = getTextDirection(lang ?? undefined);

  if (!lang || lang === originalLang) {
    return {
      contentToUse: canonical,
      dir,
      languageUsed: originalLang ?? lang ?? 'en',
      freshnessStatus: 'canonical',
    };
  }

  const translations = session.translations ?? {};
  const entry = translations[lang];

  if (!entry) {
    return {
      contentToUse: canonical,
      dir,
      languageUsed: originalLang ?? 'en',
      freshnessStatus: 'missing',
    };
  }

  if (entry.status === 'ready') {
    return {
      contentToUse: entry.translatedContent,
      dir,
      languageUsed: lang,
      freshnessStatus: 'ready',
    };
  }

  if (entry.status === 'stale') {
    return {
      contentToUse: entry.translatedContent,
      dir,
      languageUsed: lang,
      freshnessStatus: 'stale',
    };
  }

  // in_progress or failed: show canonical as fallback
  return {
    contentToUse: canonical,
    dir,
    languageUsed: originalLang ?? 'en',
    freshnessStatus: 'missing',
  };
}

function getEffectiveOriginalLanguage(metadata: SessionContentDoc['content_metadata']): string | undefined {
  if (!metadata) return undefined;
  if (metadata.output_language === 'auto') return metadata.detected_language;
  return metadata.output_language;
}
