---
name: asset-sources
description: Use when a task needs a component, icon, font, or photo asset. Lists pre-approved, safely licensed sources.
---
Only fetch via the fetch-asset tool, from: components — shadcn/ui, Aceternity UI (check each component's license), Magic UI, Radix Primitives; icons — Lucide, Heroicons; fonts — Google Fonts; illustrations/photos — unDraw, Unsplash API. Fall back to .am/asset-cache/ if a source is unreachable. Never fetch an unlisted source — flag it to the user instead.
