---
version: alpha
name: Linear-design-analysis
description: "A near-black product-focused marketing canvas built around #010102 (the deepest dark surface of any tool in this collection), light gray text (#f7f8f8), and the signature Linear lavender-blue (#5e6ad2) used as the single chromatic accent. The system reads as software-craft documentation: dense, technical, and quietly luxurious. Display type is set in the Linear custom sans (SF Pro Display fallback) at 500–700 with measured negative tracking. Cards live as charcoal panels (#0f1011) with hairline borders. The accent lavender appears on the brand mark, focus rings, and a few intentional CTAs — never decoratively. Page rhythm leans on product UI screenshots framed in dark panels rather than atmospheric color."

colors:
  primary: "#5e6ad2"
  on-primary: "#ffffff"
  primary-hover: "#828fff"
  primary-focus: "#5e69d1"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  surface-4: "#191a1b"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  hairline-tertiary: "#3e3e44"
  inverse-canvas: "#ffffff"
  inverse-surface-1: "#f5f6f6"
  inverse-surface-2: "#f6f7f7"
  inverse-ink: "#000000"
  brand-secure: "#7a7fad"
  semantic-success: "#27a644"
  semantic-overlay: "#000000"

typography:
  display-xl:
    fontFamily: Linear Display
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -3.0px
  display-lg:
    fontFamily: Linear Display
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: -1.8px
  display-md:
    fontFamily: Linear Display
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1.0px
  headline:
    fontFamily: Linear Display
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: -0.6px
  card-title:
    fontFamily: Linear Display
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.4px
  subhead:
    fontFamily: Linear Display
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: -0.2px
  body-lg:
    fontFamily: Linear Text
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.1px
  body:
    fontFamily: Linear Text
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.05px
  body-sm:
    fontFamily: Linear Text
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  caption:
    fontFamily: Linear Text
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: 0
  button:
    fontFamily: Linear Text
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0
  eyebrow:
    fontFamily: Linear Text
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: 0.4px
  mono:
    fontFamily: Linear Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  pill: 9999px
  full: 9999px

---
# Design System Analysis: Linear

Project management. Ultra-minimal, precise, purple accent.

## Overview

Linear's marketing canvas is the deepest dark surface in this collection — canvas (#010102) is essentially pure black with a faint blue tint. On top sits a four-step surface ladder (surface-1 through surface-4) for cards, panels, and lifted tiles, with hairline borders. Light gray text (ink #f7f8f8) carries the body and headlines.

The single chromatic accent is **Linear lavender-blue** primary (#5e6ad2) — used on the brand mark, focus rings, and the primary CTA button. A lighter hover state (primary-hover #828fff) and a focus-tinted variant (primary-focus #5e69d1) extend the same hue.

**Key Characteristics:**
- Dark-canvas marketing system — canvas (#010102) is the deepest dark
- Lavender-blue brand accent (#5e6ad2) — used scarcely on brand mark, focus, and primary CTA
- Four-step surface ladder carries hierarchy without shadow
- Display tracking pulls aggressively negative (-3.0px at 80px)
- Cards use 12px corners with 1px hairline borders
- Product UI screenshots dominate the page; marketing chrome is a dark frame for the app
- No second chromatic color, no atmospheric gradients, no spotlight cards

## Colors

### Brand & Accent
- **Lavender-Blue** (#5e6ad2): The signature Linear accent — primary CTA, brand mark, link emphasis
- **Lavender Hover** (#828fff): Lighter lavender — hovered state of the primary CTA
- **Lavender Focus** (#5e69d1): Focus-ring tint — focused inputs, focused buttons

### Surface
- **Canvas** (#010102): Default page background — near-pure black with a faint blue tint
- **Surface 1** (#0f1011): One step above canvas — feature cards, pricing cards, product screenshot panels
- **Surface 2** (#141516): Two steps above — featured pricing card, hovered cards
- **Surface 3** (#18191a): Three steps above — line-tertiary backgrounds, sub-nav
- **Surface 4** (#191a1b): Four steps above — deepest lifted surface
- **Hairline** (#23252a): 1px borders on cards and dividers
- **Hairline Strong** (#34343a): Stronger 1px borders — input focus rings
- **Inverse Canvas** (#ffffff): Pure white — surface of the inverse pill CTA

### Text
- **Ink** (#f7f8f8): All headlines and emphasized body type
- **Ink Muted** (#d0d6e0): Secondary type — meta info on hero panels
- **Ink Subtle** (#8a8f98): Tertiary type — deselected pricing tabs, footer columns
- **Ink Tertiary** (#62666d): Quaternary — disabled, footnotes

### Semantic
- **Success Green** (#27a644): Status pills, success indicators. The only semantic color on marketing

## Typography

### Font Families
- **Linear Display** — Custom display sans; fallback SF Pro Display, -apple-system
- **Linear Text** — Custom text sans (different cut for body sizes)
- **Linear Mono** — Custom mono for code snippets in product screenshots

### Hierarchy
- Display XL: 80px / 600 / -3.0px tracking
- Display LG: 56px / 600 / -1.8px tracking
- Display MD: 40px / 600 / -1.0px tracking
- Headline: 28px / 600 / -0.6px tracking
- Card Title: 22px / 500 / -0.4px tracking
- Subhead: 20px / 400 / -0.2px tracking
- Body LG: 18px / 400 / -0.1px tracking
- Body: 16px / 400 / -0.05px tracking
- Body SM: 14px / 400 / 0 tracking
- Caption: 12px / 400
- Button: 14px / 500 / 0 tracking
- Eyebrow: 13px / 500 / +0.4px tracking

### Principles
- Aggressive negative tracking on display (-3.0px at 80px ≈ 4% of size)
- Single voice from display to body
- Eyebrow uses positive tracking (+0.4px) — contrast against negative-tracked display
- Mono only in code contexts

## Layout

### Spacing
- Base unit: 4px
- Card interior padding: 24px on feature/pricing cards; 32px on testimonial cards; 48px on CTA banners
- Max content width: ~1280px
- Card grids: 3-up at desktop, 2-up at tablet, 1-up at mobile
- Section gap: 96px

### Philosophy
- The dark canvas IS the whitespace
- Sections separate by lift onto surface-1 panels, not by gaps in white
- Product UI screenshots are the protagonist

## Elevation & Depth

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 (flat) | No shadow, no border | Body type, hero text, footer |
| 1 (charcoal lift) | surface-1 bg + 1px hairline | Default cards, product panels |
| 2 (surface-2 lift) | surface-2 bg + 1px hairline-strong | Featured pricing card, hovered |
| 3 (surface-3 lift) | surface-3 bg | Sub-nav, dropdown menus |
| 4 (focus ring) | 2px primary-focus outline | Focused input, focused button |

## Components

### Buttons
- **Primary**: Lavender bg (#5e6ad2), white text, 8px 14px padding, 8px rounded
- **Primary Hover**: #828fff bg
- **Primary Pressed**: #5e69d1 bg
- **Secondary**: surface-1 bg, ink text, 1px hairline border, 8px 14px padding, 8px rounded
- **Tertiary**: canvas bg, ink text, 8px 14px padding, 8px rounded
- **Inverse**: white bg, black text, 8px 14px padding, 8px rounded

### Cards
- **Pricing Card**: surface-1 bg, 24px padding, 12px rounded, 1px hairline
- **Featured Pricing**: surface-2 bg, same structure
- **Feature Card**: surface-1 bg, 24px padding, 12px rounded
- **Product Screenshot**: surface-1 bg, 24px padding, 16px rounded — the dominant card
- **Testimonial**: surface-1 bg, 32px padding, 12px rounded
- **CTA Banner**: surface-1 bg, 48px padding, 12px rounded

### Forms
- **Text Input**: surface-1 bg, ink text, 8px 12px padding, 8px rounded
- **Focus**: 2px primary-focus outline at 50% opacity

### Navigation
- **Top Nav**: canvas bg, 56px height, hamburger below 768px
- **Footer**: canvas bg, 64px 32px padding, caption type

## Do's and Don'ts

### Do
- Reserve canvas (#010102) as the system's anchor surface
- Use lavender ONLY for: brand mark, primary CTA, focus ring, link emphasis
- Use the four-step surface ladder for hierarchy; avoid skipping levels
- Pair display weight 600 with body weight 400
- Apply negative letter-spacing aggressively on display
- Use product UI screenshots as the protagonist of every section

### Don't
- Don't ship a light-mode marketing page
- Don't use lavender as a section background or card fill
- Don't introduce a second chromatic accent
- Don't add atmospheric gradients or spotlight cards
- Don't pill-round CTAs (use 8px)
- Don't use #000000 true black as the canvas
- Don't combine multiple bright accents in product screenshot mockups

## Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| Desktop (1440px) | Default layout |
| Tablet (1024px) | 3-up → 2-up |
| Mobile-Lg (768px) | Hamburger nav |
| Mobile (480px) | Single-column; display-xl → ~36px |

## Iteration Guide
1. Focus on ONE component at a time, reference by its token name
2. Decide first which surface lift a section lives on
3. Default body to 16px / 400
4. Treat lavender as scarce: brand mark, primary CTA, focus, link emphasis
5. Lead every section with a product UI screenshot

## Font Substitutes
Linear's custom typeface isn't publicly distributed. For cross-platform:
- **Inter** at weight 500/600/700 is the closest free substitute
- **Geist Sans** is also viable
- For mono: **JetBrains Mono** or **Geist Mono** at weight 400
