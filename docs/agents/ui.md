# UI

> Builds polished, accessible React 19 components with TypeScript, Tailwind CSS, and proper test hooks -- mobile-first, keyboard-navigable, and WCAG 2.1 AA compliant.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The UI agent is a frontend specialist that builds production-quality React components. It does not just generate JSX -- it creates components that are typed with interfaces, styled with Tailwind (never inline styles, never CSS modules), accessible with ARIA attributes and keyboard navigation, testable with data-testid attributes, and composable through className prop forwarding and sensible defaults.

What makes this agent valuable is the quality standards it encodes. Every component it creates follows a consistent pattern: TypeScript interface defined above the component, props destructured with defaults, Tailwind classes for all styling, data-testid for testing hooks, semantic HTML elements (button not div with onClick), ARIA labels on interactive elements, and keyboard navigation support. This is the component quality that code reviews enforce manually -- the UI agent makes it automatic.

The agent understands responsive design as a first-class concern, not an afterthought. It builds mobile-first: the default layout works on small screens, then breakpoints add complexity for larger viewports (sm: 640px, md: 768px, lg: 1024px, xl: 1280px). It knows when to use Framer Motion for animations (cautiously, with React 19 compatibility in mind), when CSS transitions suffice, and always respects `prefers-reduced-motion` for accessibility.

## When to Use It

- **Building a new component**: When you need a React component with proper TypeScript typing, Tailwind styling, accessibility, and test hooks -- not a bare JSX skeleton.
- **Making UI accessible**: When existing components need ARIA attributes, keyboard navigation, focus management, color contrast fixes, or screen reader support.
- **Fixing responsive layouts**: When a page or component breaks on mobile or tablet and needs responsive Tailwind breakpoints and layout adjustments.
- **Creating design system primitives**: When you need reusable base components (Button, Card, Modal, Input) that enforce consistent styling and behavior across the application.

Do not use the UI agent for API endpoints (use API), backend services (use Builder), or performance profiling (use Performance, though UI implements the optimizations Performance recommends).

## How It Works

The UI agent follows a component creation protocol:

1. **Interface Design** -- Defines a TypeScript interface for all props. Required props have no defaults; optional props have sensible defaults via destructuring. The interface is exported for reuse in parent components.

2. **Semantic HTML** -- Chooses the correct HTML element for the component's purpose: `button` for clickable actions (never `div` with onClick), `nav` for navigation, `main` for primary content, `aside` for sidebars. This is the foundation of accessibility.

3. **Tailwind Styling** -- Applies all styles through Tailwind utility classes. No inline styles, no CSS files, no styled-components. Accepts a `className` prop for parent-level customization. Uses the project's dark theme conventions (zinc-800 borders, zinc-900 backgrounds, white text).

4. **Accessibility** -- Adds ARIA labels to interactive elements, ensures keyboard navigation works (Tab to focus, Enter to activate, Escape to dismiss), manages focus for modals and dialogs, verifies color contrast meets 4.5:1 ratio, and ensures content order makes sense for screen readers.

5. **Test Hooks** -- Adds `data-testid` attributes to key elements so tests can query reliably without depending on text content or CSS classes that change during design iterations.

6. **Responsive Behavior** -- Builds the mobile layout first. Adds Tailwind breakpoint classes (sm:, md:, lg:) for larger screens. Tests that content is usable at every breakpoint.

## Examples

### Example 1: Building a Metrics Card Component

```
User: "Build a real-time metrics card component"

UI:
  - Designs interface: MetricsCardProps { title, value, trend?, previousValue?, className? }
  - Implements: Semantic HTML with role="status" for live-updating values
  - Styles: Dark theme card (zinc-900 bg, zinc-800 border, rounded-lg)
  - Adds: Trend indicator (green up arrow, red down arrow) with aria-label
  - Adds: data-testid="metrics-card" on container, data-testid="metrics-value" on value
  - Responsive: Stacks vertically on mobile, inline on md+
  - Result: Accessible, testable card component matching project design conventions
```

### Example 2: Adding Keyboard Navigation

```
User: "Make the navigation keyboard accessible"

UI:
  - Audits: Current nav uses divs with onClick, no focus management
  - Fixes:
    - Replaces div wrappers with <nav> and <button> elements
    - Adds tabIndex and aria-current="page" on active item
    - Implements arrow key navigation between items
    - Adds Escape key to close mobile menu
    - Ensures focus-visible ring is visible (outline-2 outline-offset-2)
  - Tests: Tab through all items, Enter activates, Escape closes
  - Result: Full keyboard navigation matching WAI-ARIA navigation pattern
```

### Example 3: Responsive Terminal Page

```
User: "The terminal page doesn't work on mobile"

UI:
  - Analyzes: Terminal panel uses fixed width (800px), overlaps sidebar on small screens
  - Fixes:
    - Mobile: Single column, terminal fills width, sidebar hidden behind hamburger
    - sm: Sidebar becomes collapsible drawer
    - md: Side-by-side layout with resizable panels
    - lg: Full layout with sidebar, terminal, and status bar
  - Adds: Touch-friendly controls (larger tap targets, swipe to toggle sidebar)
  - Result: Terminal usable from 320px mobile to 2560px desktop
```

## Power Use Cases

**Design System Foundation**: Use the UI agent to build a library of base components (Button, Card, Modal, Input, Badge, Tooltip) that enforce consistent styling. Every feature component built on top inherits the accessibility, theming, and test hooks from these primitives.

**Performance Agent Handoff**: When the Performance agent identifies render issues (missing React.memo, inline object creation, state too high in tree), the UI agent implements the optimized patterns. Performance diagnoses; UI fixes.

**Planner Domain Routing**: When the Planner detects a feature involves frontend components, it routes to the UI agent after Builder. The UI agent adds proper typing, accessibility, responsive behavior, and test hooks that Builder might not prioritize.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Performance** | Performance identifies render bottlenecks; UI implements React.memo, useMemo, useCallback, lazy loading, and virtual scrolling. |
| **Testing** | UI creates components with data-testid hooks; Testing generates React Testing Library tests that query those hooks. |
| **Planner** | Planner routes frontend features to the UI agent. UI adds accessibility and responsive behavior after core implementation. |
| **Compliance** | Compliance verifies WCAG 2.1 AA standards; UI implements the fixes (contrast, keyboard nav, ARIA labels). |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | React 19 component creation with TypeScript interfaces. Tailwind-only styling. WCAG 2.1 AA accessibility. Mobile-first responsive design. data-testid hooks. Framer Motion animation guidance. |
| **L2 Pro Builder** | Component decisions recorded via `forge_capture_knowledge`. Design patterns recalled via `forge_get_knowledge` for consistency across sessions. |
| **L3 Ship Lord** | Components render in the forge-ui dashboard at localhost:5050. The UI agent's work is directly visible in the L3 visual experience. |

## Tips & Gotchas

- **Do**: Always accept a `className` prop on components. This allows parent components to adjust spacing, sizing, and positioning without modifying the component itself.
- **Don't**: Use inline styles or CSS modules. The project convention is Tailwind-only. Every style should be a utility class.
- **Do**: Use semantic HTML elements first, then add ARIA attributes for cases where semantics alone are insufficient. A `<button>` does not need `role="button"`.
- **Don't**: Add animations without checking `prefers-reduced-motion`. Wrap motion in a media query or Framer Motion's `useReducedMotion` hook.
- **Do**: Build mobile layout first, then add breakpoint classes for larger screens. Mobile-first ensures content is always accessible.

---

*See also: [Performance](performance.md) | [Testing](testing.md) | [Compliance](compliance.md)*
