# Design Vanguard

> The opinionated design partner that replaces 90% of designer decisions -- bringing deep knowledge of design systems, accessibility, motion, typography, and color theory to every component and interface.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Engineering Leadership |
| **Model** | Opus |

---

## What It Does

The Design Vanguard is not a decorator. It is a design architect. It brings the rigor of Dieter Rams, the systematic thinking of Material Design 3, and the clarity of Apple's Human Interface Guidelines into a single agent that designs components, audits interfaces, and builds design systems from first principles.

Every visual decision it makes traces to a token. No magic numbers, no one-off values, no `p-[13px]`. It works in a three-layer token hierarchy: primitive tokens (raw values), semantic tokens (intent-based, what components consume), and component tokens (scoped overrides for specific components). This means any design decision can be swapped globally by changing a single token -- dark mode, brand refresh, or accessibility adjustments are configuration changes, not rewrites.

Beyond visual design, the Design Vanguard owns developer experience surfaces: CLI output formatting (success, error, progress, tables), error message design (what happened, why, how to fix it), and onboarding flow optimization. It applies the same systematic rigor to terminal output that it applies to UI components -- spacing, hierarchy, color coding, and progressive disclosure.

## When to Use It

- **Component development from scratch**: When you need a notification toast, data table, command palette, or any component designed with proper tokens, animations, accessibility, and a composable API.
- **Design audit**: When an interface feels cluttered, inconsistent, or hard to scan and you need a systematic diagnosis with before/after specs.
- **Design system creation**: When you need to establish a token hierarchy, spacing scale, typography system, or color palette for a project.
- **CLI UX improvement**: When terminal output needs visual hierarchy, error messages need structure, or progress indicators need design attention.
- **Accessibility audit**: When you need WCAG 2.1 AA compliance verification with specific violations and fixes.

Do not use this agent for backend logic, API design, or data modeling. It operates on visual and interaction surfaces exclusively.

## How It Works

1. **Philosophy Application**: Every decision is evaluated against the synthesis of Rams (restraint, honesty), Material Design (systematic tokenization, state coverage), and Apple HIG (clarity, deference to content).
2. **Token Architecture**: Designs within the three-layer token system -- primitives, semantics, and component-scoped. Tailwind CSS v4 integration via `@theme` mapping.
3. **Component Design**: Follows a strict pattern -- variant definitions, typed props interface, forwardRef component, sensible defaults, escape hatches via `className`.
4. **Accessibility First**: Every component includes proper ARIA attributes, keyboard navigation, focus management, reduced motion support, and color contrast verification.
5. **State Coverage**: Every interactive component defines all states: enabled, disabled, hovered, focused, pressed, dragged, loading, error.

## Examples

### Example 1: Designing a Notification Toast System

```
User: "Build a notification toast system for forge-ui"

Design Vanguard:
  - Designs token-based color system for toast types
    (success, warning, error, info)
  - Creates composable API: <Toast>, <Toast.Title>,
    <Toast.Description>, <Toast.Action>
  - Implements enter/exit animations with reduced-motion
    support (prefers-reduced-motion: reduce)
  - Adds auto-dismiss with configurable duration
  - Keyboard: Escape dismisses, Tab cycles through actions
  - Result: Fully accessible toast system with 4 variants,
    composable API, and design tokens.
```

### Example 2: Dashboard Visual Audit

```
User: "The dashboard feels cluttered and hard to scan"

Design Vanguard:
  - Audits visual hierarchy: 5 competing font sizes, no
    consistent spacing, 12 different grays
  - Identifies: missing elevation system, inconsistent
    card borders, no breathing room between sections
  - Prescribes: reduce to 3 font sizes, apply 4px grid
    spacing, standardize on semantic color tokens
  - Provides: before/after specs with exact token values
  - Result: Detailed audit with specific fixes that reduce
    visual noise by ~40%.
```

### Example 3: Error Message Redesign

```
User: "Our CLI errors are confusing"

Design Vanguard:
  - Audits current errors: raw system errors, no fix suggestions
  - Designs 3-tier error format:
    Tier 1 (excellent): what/why/how with doc links and error codes
    Tier 2 (acceptable): what/how with one-line fix suggestion
    Tier 3 (forbidden): raw error codes with no context
  - Creates error message template with color coding:
    red X for error, description, indented fix steps
  - Result: Error message style guide with templates for
    every error category in the CLI.
```

## Power Use Cases

**Design System Bootstrap**: For a new project, the Design Vanguard can generate a complete design system in a single session: color tokens (primitive + semantic layers), spacing scale (4px grid), typography scale (major-third ratio), border radius scale, elevation system, and component templates. This gives the project a consistent visual foundation from day one.

**Dark Mode Architecture**: The Design Vanguard designs dark mode through the token layer, not as a separate theme. By defining semantic tokens (`color-surface-primary`, `color-text-primary`) that map to different primitive tokens in light vs. dark mode, theme switching becomes a CSS variable swap with zero component changes.

**Responsive Component Audit**: The agent can audit a component library for responsive behavior, identifying components that break at specific breakpoints, violate touch target minimums (44x44px), or lose visual hierarchy on mobile screens.

## Combines With

| Feature | Synergy |
|---------|---------|
| **DX Engineer** | Design Vanguard designs the visual surface; DX Engineer designs the interaction model and developer ergonomics |
| **Builder agent** | Design Vanguard specifies; Builder implements. Design tokens and component specs hand off directly |
| **Wordsmith** | Design Vanguard handles visual communication; Wordsmith handles verbal communication |
| **UI agent** | UI agent builds components; Design Vanguard ensures they follow the design system |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Design system architecture, component design, accessibility audits, CLI UX design, error message templates |
| **L2 Pro Builder** | + `forge_capture_knowledge` records design decisions; `forge_get_knowledge` recalls past design patterns and audit findings |
| **L3 Ship Lord** | + Dashboard integration with live design token preview, component gallery, and accessibility score tracking |

## Tips & Gotchas

- **Do**: Let the Design Vanguard establish tokens before building components. Tokens first, components second.
- **Do**: Use semantic tokens in components (`bg-surface-primary`) instead of primitive Tailwind classes (`bg-zinc-900`).
- **Don't**: Mix arbitrary values (`p-[13px]`) into a tokenized system. Snap to the nearest grid value.
- **Don't**: Skip the state coverage checklist. A button without hover, focus, and disabled states is an incomplete button.

---

*See also: [dx-engineer](dx-engineer.md), [wordsmith](wordsmith.md)*
