---
name: design-guidance
description: Use when generating, editing, or reviewing UI or frontend code. Keeps output from looking like default AI-generated UI.
---
Rules: never ship framework defaults untouched (adjust type scale, spacing, one accent color); use a real type scale (12/14/16/20/24/32/48px); one primary accent color plus at most one secondary; whitespace is deliberate, prefer fewer well-spaced elements over dense grids; avoid "everything centered/rounded/shadowed" unless the brand calls for it; real specific copy, never lorem ipsum; motion 150-250ms, purposeful, consistent; prefer a few well-chosen details over broad shallow coverage. Before marking done, check: does this look like one of a hundred generated pages or this specific product; did it use brand.config.json colors or fall back to framework defaults; is there one clear primary action per screen.
