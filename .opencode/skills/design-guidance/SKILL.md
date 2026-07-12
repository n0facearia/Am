---
name: design-guidance
description: Use when generating, editing, or reviewing UI or frontend code. Keeps output from looking like default AI-generated UI.
---

# Non-Negotiable Frontend Parameters

These rules are absolute. If a generated component violates any of them, it must be rejected and regenerated.

## 1. Typography — Strict Type Scale

- **Only use these pixel sizes**: `12`, `14`, `16`, `20`, `24`, `32`, `48`, `64`
- No sizes outside this scale. No `13px`, `15px`, `18px`, `22px`, `28px`, `36px`, `40px`, `72px`, etc.
- **Line height**: `1.0` for display sizes (48/64), `1.15` for headings (24/32), `1.5` for body text (14/16), `1.6` for small/caption (12). Never use generic `line-height: 1.6` for everything.
- **Font weight**: Regular `400` for body, Medium `500` for strong body or small headings, Semibold `600` for headings, Bold `700` only for display. Never use `900` or `800` weights.
- **Letter spacing**: `-0.02em` for display/heading sizes (32/48/64), `-0.01em` for subheadings (20/24), `normal` for body (14/16), `+0.01em` for small (12). No other values.
- **Font family**: Must use the family declared in `brand.config.json` or the project's theme. If neither exists, use `Inter` or `system-ui` stack. Never use `Arial`, `Helvetica`, `Times New Roman`, or `Georgia` as defaults.
- **Mono**: Code/numbers in UI must use a monospace face (`JetBrains Mono`, `SF Mono`, `Cascadia Code`, or `ui-monospace`). Never use a proportional font for code.

## 2. Spacing & Padding — Custom Element Layout

- **Spacing scale**: Only `4`, `8`, `12`, `16`, `20`, `24`, `32`, `48`, `64` pixels.
- No values outside this scale. No `6px`, `10px`, `14px`, `18px`, `28px`, `40px`.
- **Card/container padding**: Always `24px` (desktop), `16px` (mobile/compact). Never use the framework default (`16px` everywhere or `32px` everywhere).
- **Element gap in flex/grid layouts**: Use `8px` (tight), `12px` (default), `16px` (comfortable), `24px` (loose). Never use the framework default gap (`4px` or `8px` for everything).
- **Section spacing**: `64px` between major sections on desktop, `32px` on mobile. Never use `40px` or `80px`.
- **Inset padding for buttons/inputs**: Horizontal `12px` (small), `16px` (default), `20px` (large). Vertical `8px` (small), `10px` (default), `12px` (large). Never rely on the component library's default padding.
- **List/item padding**: `8px` vertical, `12px` horizontal minimum. Never `4px` or `0px`.

## 3. Banned Framework Placeholder Defaults

**Do not ship these untouched from any framework (shadcn/ui, Radix, Tailwind, Bootstrap, Chakra, MUI, etc.):**

| Category | Banned Default | Required Override |
|--- |--- |--- |
| Border radius | `rounded-lg` / `8px` everywhere | `6px` for cards, `8px` for buttons, `4px` for inputs, `0` on sidebar/nav |
| Box shadow | `shadow-sm` / default card shadow | Custom shadow using brand's elevation system or one of: `0 1px 3px rgba(0,0,0,0.08)` (low), `0 4px 12px rgba(0,0,0,0.1)` (mid), `0 8px 24px rgba(0,0,0,0.12)` (high) |
| Outline / focus ring | `ring-2 ring-offset-2 ring-primary` | `outline: 2px solid <accent>; outline-offset: 2px` with brand accent color |
| Color palette | `slate-50` through `slate-900` or `zinc-*` | Brand palette from `brand.config.json` or project theme; primary color must be the accent from brand config |
| Transitions | `transition-all duration-300` or no transition at all | `transition-{property} duration-150` for microinteractions, `duration-250` for panel/overlay; only the specific property being animated |
| Background | `bg-white` / `bg-background` without considering dark mode | Must use theme-aware tokens: `bg-canvas`, `bg-surface`, or similar from brand theme |
| Typography scale | Framework defaults (`text-lg`, `text-xl`, etc.) | Explicit pixel values from the type scale above |
| Spacing scale | Framework defaults (`p-4`, `m-2`, `gap-4`, etc.) | Explicit pixel values from the spacing scale above |
| Lorem ipsum | `Lorem ipsum dolor sit amet...` in any placeholder | Real, specific copy relevant to the product feature being built. If the real copy is unknown, use `[Descriptive placeholder label]` — never generic filler text. |
| Icon defaults | Generic `info`, `close`, `chevron-down` from any library | Use the specific brand-appropriate icon from the project's icon set. Choose purpose-built icons over generic ones. |
| Empty states | Bare "No results" or empty container | Always include: (1) a relevant illustration/icon, (2) a human-readable message explaining why it's empty, (3) a clear action CTA if applicable |

## 4. Color Rules

- **Primary / accent**: Must come from `brand.config.json` (`primaryColor` field). If the file doesn't exist, fall back to theme's accent. Never use Tailwind blue-500 or similar as a default.
- **Semantic colors**: Error = `#dc2626`, success = `#16a34a`, warning = `#f59e0b`, info = `#3b82f6`. Never deviate from these for their respective meanings unless brand explicitly overrides.
- **Text contrast**: Body text must be `foreground` at minimum 87% opacity (or `#1a1a1a` on light, `#e5e5e5` on dark). Never use `#000` or `#fff` for text. Disabled text = 38% opacity minimum.
- **Surface hierarchy**: Canvas (furthest back) → surface (card/container) → elevated (dropdown/modal) → overlay (tooltip/popover). Each step increases elevation by one shadow level. Never use raw white/gray for cards without proper stacking.

## 5. Motion Rules

- **Microinteractions** (hover, focus, button press): `150ms` ease
- **Panel/overlay enter/exit**: `250ms` ease-out (enter), `200ms` ease-in (exit)
- **Page/section transitions**: `300ms` ease-in-out maximum
- **No animation on initial render** — only animate on interaction or state change
- **Prefer CSS transitions** over JS animation libraries for simple property animations
- **Reduced motion**: Respect `prefers-reduced-motion` — reduce to `0ms` or `50ms` opacity-only

## 6. Layout Rules

- **Single clear primary action per view** — no competing CTAs
- **Whitespace is deliberate**: prefer fewer, well-spaced elements over dense information-dense layouts
- **Responsive breakpoints**: `640` (mobile), `768` (tablet), `1024` (desktop), `1280` (wide). Never use arbitrary breakpoints.
- **Max content width**: `1200px` for main content, `1600px` for dashboard/full-width layouts. Never let text span the entire viewport.
- **Grid**: Use CSS Grid for 2D layouts, flexbox for 1D. Never use float-based layouts.
