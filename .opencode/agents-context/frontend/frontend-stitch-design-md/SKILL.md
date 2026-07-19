---
name: frontend-stitch-design-md
description: "Analyze Stitch projects and generate semantic DESIGN.md files from screen metadata, HTML/CSS, and assets. Produces atmosphere, color roles, typography, compo"
---
# Stitch DESIGN.md · Design Systems Agent Skill | AI UX Playground

**Reference URL:** https://aiuxplayground.com/skills/stitch-design-md/

## Top Headings
- Stitch DESIGN.md

- How to install
- Skill finder
- SKILL.md
- Actions
- Skill finder
- Related Skills

## Summary
HomeSkillsDesign SystemsStitch DESIGN.mdSkill·Design Systems·Updated April 8, 2026Stitch DESIGN.mdgoogle-labs-code·4kAnalyze Stitch projects and generate semantic DESIGN.md files from screen metadata, HTML/CSS, and assets. Produces atmosphere, color roles, typography, component styling, and layout principles.SKILL.mdInstallShareHow to installCursorClaudeCodexOthersnpx skills add github.com/google-labs-code/stitch-skills/blob/main/skills/design-md/SKILL.md --skill stitch-design-mdCopyInstalls to .cursor/skills/Manual installCopy SKILL.md below.cursor/skills/stitch-design-md/SKILL.mdCursor docsCopy skillDownloadSkill finderNewNot sure this is the right skill? Compare matches by role and goal.Open skill finderSKILL.mdDownloadCopy---
name: design-md
description: Analyze Stitch projects and synthesize a semantic design system into DESIGN.md files
allowed-tools:
  - "stitch*:*"
  - "Read"
  - "Write"
  - "web_fetch"
---

# Stitch DESIGN.md Skill

You are an expert Design Systems Lead. Your goal is to analyze the provided technical assets and synthesize a "Semantic Design System" into a file named `DESIGN.md`.

## Overview

This skill helps you create `DESIGN.md` files that serve as the "source of truth" for prompting Stitch to generate new screens that align perfectly with existing design language. Stitch interprets design through "Visual Descriptions" supported by specific color values.

## Prerequisites

- Access to the Stitch MCP Server
- A Stitch project with at least one designed screen
- Access to the Stitch Effective Prompting Guide: https://stitch.withgoogle.com/docs/learn/prompting/

## The Goal

The `DESIGN.md` file will serve as the "source of truth" for prompting Stitch to generate new screens that align perfectly with the existing design language. Stitch interprets design through "Visual Descriptions" supported by specific color values.

## Retrieval and Networking

To analyze a Stitch project, you must retrieve screen metadata and design assets using the Sti

*(This skill was automatically fetched to build the default library for the AM fork.)*
