---
name: asset-sources
description: Use when a task needs a component, icon, font, or photo asset. Lists pre-approved, safely licensed sources.
---

# Asset Source Network Allow-List

Only the domains listed below are approved for asset retrieval. Any unlisted domain must be flagged to the user — never fetched.

## Approved Domains

### Components
| Domain | Purpose | Notes |
|---|---|---|
| `ui.shadcn.com` | shadcn/ui React components | Copy-paste components, not a package dependency |
| `radix-ui.com` | Radix Primitives (accessible headless UI) | The foundation shadcn/ui builds on; prefer Radix for complex interactive patterns |
| `magicui.design` | Magic UI animated components | Verify license per component before use |
| `ui.aceternity.com` | Aceternity UI components | Check each component's individual license |

### Icons
| Domain | Purpose | Notes |
|---|---|---|
| `lucide.dev` | Lucide icons | Default icon set for AM; prefer Lucide over all others |
| `heroicons.com` | Heroicons | Only for outline/solid variants not available in Lucide |

### Fonts
| Domain | Purpose | Notes |
|---|---|---|
| `fonts.google.com` | Google Fonts (Inter, JetBrains Mono, etc.) | Use woff2 format; subset to latin; never load full variable-weight fonts |

### Illustrations / Photos
| Domain | Purpose | Notes |
|---|---|---|
| `undraw.co` | unDraw MIT-licensed illustrations | Use SVG; recolor to match brand palette |
| `api.unsplash.com` | Unsplash stock photography | Must credit photographer per Unsplash license guidelines |

### Design References
| Domain | Purpose | Notes |
|---|---|---|
| `raw.githubusercontent.com` | DESIGN.md files from `awesome-design-md` | Only for reference/learning, not direct asset use |
| `getdesign.md` | Design markdown gallery | Reference only |

## Domain Categories for `fetch-asset` Routing

When requesting an asset via `fetch-asset`, the tool categorizes the URL domain:

- `component` → shadcn/ui, Radix, Aceternity, Magic UI
- `icon` → Lucide, Heroicons
- `font` → Google Fonts
- `illustration` → unDraw, Unsplash
- `reference` → raw.githubusercontent.com, getdesign.md

This categorization is used for cache organization under `.am/asset-cache/`.

## Fallback Protocol

If a source domain is unreachable (`fetch` fails):

1. `fetch-asset` checks `.am/asset-cache/` for an exact SHA-256 cache hit.
2. If exact cache misses, it performs a **graceful local fallback query**: scans `.am/asset-cache/` for files whose metadata matches the same URL domain and category, returning the best guess match.
3. If no local match exists, the tool returns a structured error listing the cached files available (grouped by category) so the user can choose an alternative.
4. Never silently substitute a different asset without reporting what was served and why.

## Submission Process

To add a new domain to this allow-list:
1. Submit a PR with the domain, purpose, notes, and license verification.
2. Update the `APPROVED_DOMAINS` Set in `packages/opencode/src/tool/fetch-asset.ts`.
3. Update this table in `asset-sources/SKILL.md`.
