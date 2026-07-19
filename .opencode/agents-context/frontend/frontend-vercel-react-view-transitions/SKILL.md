---
name: frontend-vercel-react-view-transitions
description: "Implement view transitions in React and Next.js: shared element transitions, page animations, and motion that feels native on the web."
---
# Vercel React View Transitions · Visual Design Agent Skill | AI UX Playground

**Reference URL:** https://aiuxplayground.com/skills/vercel-react-view-transitions/

## Top Headings
- Vercel React View Transitions

- How to install
- Skill finder
- SKILL.md
- Actions
- Skill finder
- Related Skills

## Summary
HomeSkillsVisual DesignVercel React View TransitionsSkill·Visual Design·Updated July 6, 2026Vercel React View TransitionsVercel·28kImplement view transitions in React and Next.js: shared element transitions, page animations, and motion that feels native on the web.SKILL.mdInstallShareHow to installCursorClaudeCodexOthersnpx skills add github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions --skill vercel-react-view-transitionsCopyInstalls to .cursor/skills/Manual installCopy SKILL.md below.cursor/skills/vercel-react-view-transitions/SKILL.mdCursor docsCopy skillDownloadSkill finderNewNot sure this is the right skill? Compare matches by role and goal.Open skill finderSKILL.mdDownloadCopy---
name: vercel-react-view-transitions
description: Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user wants to add page transitions, animate route changes, create shared element animations, animate enter/exit of components, animate list reorder, implement directional (forward/back) navigation animations, or integrate view transitions in Next.js. Also use when the user mentions view transitions, `startViewTransition`, `ViewTransition`, transition types, or asks about animating between UI states in React without third-party animation libraries.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# React View Transitions

Animate between UI states using the browser's native `document.startViewTransition`. Declare *what* with `<ViewTransition>`, trigger *when* with `startTransition` / `useDeferredValue` / `Suspense`, control *how* with CSS classes. Unsupported browsers skip animations gracefully.

## When to Animate

Every `<ViewTransition>` should communicate a spatial relationship or continuity. If you can't articulate what it communicates, don't add it.

Implement **all** applicable patte

*(This skill was automatically fetched to build the default library for the AM fork.)*
