---
name: frontend-extract-design-system
description: "Reverse-engineer design tokens from public websites into starter token files, colors, typography, spacing, radius, and shadows via Playwright extraction."
---
# Extract Design System · Design Systems Agent Skill | AI UX Playground

**Reference URL:** https://aiuxplayground.com/skills/extract-design-system/

## Top Headings
- Extract Design System

- How to install
- Skill finder
- SKILL.md
- Actions
- Skill finder
- Related Skills

## Summary
HomeSkillsDesign SystemsExtract Design SystemSkill·Design Systems·Updated June 17, 2026Extract Design Systemarvindrk·65Reverse-engineer design tokens from public websites into starter token files, colors, typography, spacing, radius, and shadows via Playwright extraction.SKILL.mdInstallShareHow to installCursorClaudeCodexOthersnpx skills add github.com/arvindrk/extract-design-system --skill extract-design-systemCopyInstalls to .cursor/skills/Manual installCopy SKILL.md below.cursor/skills/extract-design-system/SKILL.mdCursor docsCopy skillDownloadSkill finderNewNot sure this is the right skill? Compare matches by role and goal.Open skill finderSKILL.mdDownloadCopy---
name: extract-design-system
description: Extract design primitives from a public website and generate starter token files for your project.
---

# Extract Design System

Use this skill when the user wants to reverse-engineer a public website's design primitives into project-local starter token files.

## Before You Start

Ask for:

- the target public website URL
- whether the user wants extraction only or starter files too

Set expectations:

- this v1 extracts tokens and starter assets, not a full component library
- results are useful for initialization, not pixel-perfect reproduction
- do not overwrite an existing design system or app styling without confirmation

## Workflow

1. Confirm the target URL is public and reachable.
2. Run:

```bash
npx playwright install chromium
npx extract-design-system <url>
```

3. Review `.extract-design-system/normalized.json` and summarize:

- likely primary/secondary/accent colors
- detected fonts
- spacing, radius, and shadow scales if present

4. If the user wants extraction artifacts only, use:

```bash
npx extract-design-system <url> --extract-only
```

5. If the user already has `.extract-design-system/normalized.json` and only wants to regenerate starter token files, run:

```bash
npx extract-design-system init
```

6. Explain the generated outputs:

- `.ex

*(This skill was automatically fetched to build the default library for the AM fork.)*
