import type { Page, Locator, BrowserContext } from 'playwright-core';

// ─── Types ───────────────────────────────────────────────────────────
export type AXNode = {
  role: string;
  name: string;
  value?: string;
  description?: string;
  checked?: boolean | 'mixed';
  disabled?: boolean;
  expanded?: boolean;
  focused?: boolean;
  selected?: boolean;
  required?: boolean;
  pressed?: boolean | 'mixed';
  level?: number;
  valuemin?: number;
  valuemax?: number;
  autocomplete?: string;
  haspopup?: string;
  invalid?: string;
  orientation?: string;
  children?: AXNode[];
};

type RefEntry = {
  ref: string;
  role: string;
  name: string;
  locator: Locator;
  nth: number;
  axNode: AXNode;
};

type SnapshotOpts = {
  interactive?: boolean;
  selector?: string;
};

// ─── State ───────────────────────────────────────────────────────────

// Ref map: e1 → RefEntry
let refMap = new Map<string, RefEntry>();
let refCounter = 0;
let snapshotCounter = 0;

// Stable ID map: "role:name:nthGlobal" → last assigned ref string
// Survives across snapshots so the same element keeps the same ref
const stableIdMap = new Map<string, string>();

// ─── Interactive roles (for filtering) ───────────────────────────────
const INTERACTIVE_ROLES = new Set([
  'link', 'button', 'textbox', 'checkbox', 'radio',
  'combobox', 'listbox', 'menuitem', 'tab',
  'switch', 'slider', 'spinbutton', 'searchbox',
  'menuitemcheckbox', 'menuitemradio', 'treeitem',
  'option', 'progressbar', 'scrollbar',
]);

// Roles that are structural/contextual — shown in tree but not interactive
const STRUCTURAL_ROLES = new Set([
  'heading', 'img', 'banner', 'navigation', 'main', 'complementary',
  'contentinfo', 'region', 'article', 'list', 'listitem',
  'table', 'row', 'cell', 'columnheader', 'rowheader',
  'dialog', 'alertdialog', 'alert', 'status', 'log',
  'form', 'group', 'toolbar', 'separator', 'figure',
  'definition', 'term', 'note', 'math', 'tree', 'treegrid',
  'grid', 'gridcell', 'menu', 'menubar', 'tablist', 'tabpanel',
  'landmark',
]);

// Roles to skip entirely — noise
const SKIP_ROLES = new Set([
  'none', 'presentation', 'generic', 'LineBreak',
  'InlineTextBox', 'StaticText',
]);

// ─── Excluded attributes (internal, not useful for agents) ───────────
const EXCLUDED_ATTRS = new Set([
  'children', 'role', 'name',
]);

// ─── Boolean property display names ─────────────────────────────────
const BOOLEAN_DISPLAY: Record<string, string> = {
  disabled: 'disabled',
  expanded: 'expanded',
  focused: 'focused',
  selected: 'selected',
  required: 'required',
  pressed: 'pressed',
  checked: 'checked',
};

// ─── Public API ──────────────────────────────────────────────────────

export function clearRefs() {
  refMap.clear();
  refCounter = 0;
  // Do NOT clear stableIdMap — it persists across snapshots
}

export function clearAllRefs() {
  refMap.clear();
  refCounter = 0;
  stableIdMap.clear();
  snapshotCounter = 0;
}

export function resolveRef(ref: string): Locator | null {
  const key = ref.startsWith('e') ? ref : `e${ref}`;
  const entry = refMap.get(key);
  return entry?.locator ?? null;
}

export function getRefEntry(ref: string): RefEntry | null {
  const key = ref.startsWith('e') ? ref : `e${ref}`;
  return refMap.get(key) ?? null;
}

export function getRefCount(): number {
  return refMap.size;
}

// ─── Snapshot generation ─────────────────────────────────────────────

export async function generateSnapshot(page: Page, opts: SnapshotOpts = {}): Promise<string> {
  clearRefs();
  snapshotCounter++;

  // Use Playwright's built-in accessibility tree
  const tree = await page.accessibility.snapshot({
    interestingOnly: opts.interactive !== false,
  });

  if (!tree) {
    return '(empty accessibility tree)';
  }

  // If scoping to a selector, we still use the full a11y tree
  // but could filter by finding the subtree — for now, use full tree
  const lines: string[] = [];
  const roleCounts = new Map<string, number>();

  flattenAndAssignRefs(tree as AXNode, page, opts, lines, roleCounts, 0);

  if (lines.length === 0) {
    return '(no elements found)';
  }

  return lines.join('\n');
}

// ─── Tree walking & ref assignment ───────────────────────────────────

function flattenAndAssignRefs(
  node: AXNode,
  page: Page,
  opts: SnapshotOpts,
  lines: string[],
  roleCounts: Map<string, number>,
  depth: number,
): void {
  const role = node.role || '';
  const name = node.name || '';

  // Skip noise roles
  if (SKIP_ROLES.has(role)) {
    // Still walk children — they might be interesting
    for (const child of node.children || []) {
      flattenAndAssignRefs(child, page, opts, lines, roleCounts, depth);
    }
    return;
  }

  const isInteractive = INTERACTIVE_ROLES.has(role);
  const isStructural = STRUCTURAL_ROLES.has(role);
  const hasContent = !!name || isInteractive;

  // Skip empty structural nodes with no name (except containers with children)
  if (!isInteractive && !isStructural && !hasContent && !(node.children?.length)) {
    return;
  }

  // Build the role:name key for deduplication
  const roleKey = `${role}:${name}`;
  const count = roleCounts.get(roleKey) || 0;
  roleCounts.set(roleKey, count + 1);

  // Assign a ref only to interactive elements
  let ref: string | null = null;
  if (isInteractive) {
    // Try to reuse a stable ID
    const stableKey = `${role}:${name}:${count}`;
    const existingRef = stableIdMap.get(stableKey);

    if (existingRef) {
      ref = existingRef;
    } else {
      refCounter++;
      ref = `e${refCounter}`;
      stableIdMap.set(stableKey, ref);
    }

    // Build a Playwright locator for this element
    const scope = opts.selector ? page.locator(opts.selector) : page;
    let locator: Locator;

    if (name) {
      locator = scope.getByRole(role as any, { name, exact: true });
    } else {
      locator = scope.getByRole(role as any);
    }

    if (count > 0) {
      locator = locator.nth(count);
    }

    const entry: RefEntry = {
      ref,
      role,
      name,
      locator,
      nth: count,
      axNode: node,
    };
    refMap.set(ref, entry);
  }

  // Format the line
  const indent = '  '.repeat(depth);
  const parts: string[] = [];

  // Ref label (only for interactive)
  if (ref) {
    parts.push(`ref=${ref}`);
  }

  // Role
  parts.push(role);

  // Name in quotes
  if (name) {
    parts.push(`"${name}"`);
  }

  // Value
  if (node.value !== undefined && node.value !== '') {
    parts.push(`value="${node.value}"`);
  }

  // Boolean attributes
  for (const [attr, label] of Object.entries(BOOLEAN_DISPLAY)) {
    const val = (node as any)[attr];
    if (val === true) {
      parts.push(label);
    } else if (val === 'mixed') {
      parts.push(`${label}=mixed`);
    }
  }

  // Level (for headings)
  if (node.level !== undefined) {
    parts.push(`level=${node.level}`);
  }

  // Other useful attributes
  if (node.autocomplete) parts.push(`autocomplete="${node.autocomplete}"`);
  if (node.haspopup) parts.push(`haspopup="${node.haspopup}"`);
  if (node.invalid && node.invalid !== 'false') parts.push(`invalid="${node.invalid}"`);
  if (node.orientation) parts.push(`orientation="${node.orientation}"`);
  if (node.valuemin !== undefined) parts.push(`valuemin=${node.valuemin}`);
  if (node.valuemax !== undefined) parts.push(`valuemax=${node.valuemax}`);

  lines.push(`${indent}${parts.join(' ')}`);

  // Recurse into children
  for (const child of node.children || []) {
    flattenAndAssignRefs(child, page, opts, lines, roleCounts, depth + 1);
  }
}
