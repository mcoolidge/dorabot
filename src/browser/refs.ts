import type { Page, Locator } from 'playwright-core';

// ─── Types ───────────────────────────────────────────────────────────

type RefEntry = {
  ref: string;
  role: string;
  locator: Locator;
};

type SnapshotOpts = {
  interactive?: boolean;
  selector?: string;
};

// ─── State ───────────────────────────────────────────────────────────

// Page used for the last snapshot (needed for aria-ref resolution)
let lastPage: Page | null = null;

// Last full snapshot text (for ref role lookups)
let lastSnapshot = '';

// ─── Public API ──────────────────────────────────────────────────────

export function clearRefs() {
  // With _snapshotForAI, Playwright manages refs internally.
  // We just clear our cached snapshot text.
  lastSnapshot = '';
}

export function clearAllRefs() {
  lastSnapshot = '';
  lastPage = null;
}

/**
 * Resolve a ref string (e.g. "e5") to a Playwright Locator
 * using the native aria-ref selector engine.
 */
export function resolveRef(ref: string): Locator | null {
  if (!lastPage) return null;
  const key = ref.startsWith('e') || ref.startsWith('f') ? ref : `e${ref}`;
  return lastPage.locator(`aria-ref=${key}`);
}

/**
 * Get the role for a ref by parsing the snapshot YAML.
 * Returns a lightweight entry for backward compat (combobox detection etc.)
 */
export function getRefEntry(ref: string): RefEntry | null {
  if (!lastPage) return null;
  const key = ref.startsWith('e') || ref.startsWith('f') ? ref : `e${ref}`;

  // Parse the role from the snapshot YAML line:  "- role "name" [ref=eN]"
  const refPattern = new RegExp(`^\\s*- (\\S+)\\s.*\\[ref=${key}\\]`, 'm');
  const match = lastSnapshot.match(refPattern);
  if (!match) return null;

  return {
    ref: key,
    role: match[1],
    locator: lastPage.locator(`aria-ref=${key}`),
  };
}

export function getRefCount(): number {
  // Count refs in the snapshot
  const matches = lastSnapshot.match(/\[ref=e\d+\]/g);
  return matches?.length ?? 0;
}

// ─── Snapshot generation ─────────────────────────────────────────────

/**
 * Generate an accessibility snapshot using Playwright's native _snapshotForAI().
 * Returns a YAML-like accessibility tree with [ref=eN] markers.
 *
 * Playwright handles:
 *  - Element ref assignment
 *  - Cross-iframe refs (f1e2 etc.)
 *  - Incremental diffs (only changed subtrees)
 *  - Stable ref IDs across snapshots
 */
export async function generateSnapshot(page: Page, _opts: SnapshotOpts = {}): Promise<string> {
  lastPage = page;

  try {
    const result = await (page as any)._snapshotForAI();
    const snapshot = result.full || '';

    if (!snapshot || snapshot.trim() === '') {
      lastSnapshot = '';
      return '(empty page)';
    }

    lastSnapshot = snapshot;
    return snapshot;
  } catch (e: any) {
    lastSnapshot = '';
    return `(snapshot error: ${e.message})`;
  }
}
