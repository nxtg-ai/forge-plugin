# Product Strategist

> The strategic mind that transforms raw ideas into validated product strategies -- applying RICE scoring, Jobs-to-be-Done, Wardley Mapping, and pricing models to produce plans that engineering, marketing, and leadership can act on immediately.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Executive & Strategy |
| **Model** | Opus |

---

## What It Does

The Product Strategist bridges vision and execution. It takes unvalidated product ideas and runs them through rigorous frameworks -- Jobs-to-be-Done analysis, RICE/MoSCoW prioritization, competitive positioning, Lean Canvas, Wardley Mapping, and pricing models -- to produce documents that teams can execute against without further interpretation.

Without this agent, product decisions get made on gut feeling. Features get built because someone asked for them, not because they serve the right job-to-be-done. Pricing gets set by looking at one competitor, not by analyzing willingness-to-pay across segments. Roadmaps get built without understanding which items are strategic bets versus quick wins. The Product Strategist replaces gut feeling with structured reasoning while still moving fast.

It is fluent in eight core disciplines: product discovery (problem validation, opportunity sizing), market analysis (TAM/SAM/SOM, competitive intelligence), user research synthesis (personas, journey maps, JTBD), prioritization (RICE, MoSCoW, Kano, Impact/Effort), strategy (Blue Ocean, Lean Canvas, Porter's, Wardley Mapping), go-to-market (launch planning, channel strategy, messaging), product metrics (North Star, AARRR pirate metrics, cohort analysis), and monetization (pricing models, willingness-to-pay, packaging).

## When to Use It

- **Raw idea validation**: When you have an unvalidated product idea and need to turn it into a strategy with market fit analysis, personas, and a go-to-market plan.
- **Feature prioritization**: When you have 15 feature requests, limited engineering time, and need a scored, ranked backlog with rationale.
- **Launch planning**: When you are preparing to launch a product and need pricing tiers, launch sequence, channel strategy, and success metrics.
- **Competitive positioning**: When competitors are converging on similar features and you need to find defensible differentiation.
- **Roadmap construction**: When leadership needs a multi-quarter roadmap that balances strategic bets with quick wins and debt paydown.

Do not use this agent for implementation details (Builder), competitive intelligence gathering (Scout), or copywriting (Wordsmith). The Product Strategist makes strategic decisions; other agents execute them.

## How It Works

1. **JTBD Analysis**: Identifies the jobs users are hiring the product to do, across functional, emotional, and social dimensions. Job statement formula: "When [situation], I want to [motivation], so I can [expected outcome]."
2. **Market Validation**: Sizes the opportunity with TAM/SAM/SOM using both top-down and bottom-up methods. If estimates diverge by more than 3x, investigates why.
3. **Prioritization Scoring**: Applies RICE (Reach x Impact x Confidence / Effort) or the appropriate framework to each candidate feature. Produces a ranked list with rationale.
4. **Strategy Synthesis**: Combines market data, user research, and competitive analysis into a cohesive strategy document with specific decisions, not options.
5. **GTM Planning**: Designs the go-to-market sequence: pricing tiers, launch channels, messaging per audience, milestones, and success metrics.

## Examples

### Example 1: Raw Idea to Product Strategy

```
User: "I have an idea for a tool that auto-generates API docs
       from code comments. How do I make this real?"

Product Strategist:
  - JTBD: "When I update my API, I want docs to stay in sync
    automatically, so I can stop doing manual doc maintenance."
  - Market sizing: $2.1B API tooling market, SAM of $180M
    (teams with 5+ API endpoints), SOM of $9M (year 1)
  - Competitive analysis: Swagger/OpenAPI dominates spec-first,
    but comment-first has no clear leader
  - Personas: Solo dev (speed), team lead (consistency), DevRel
    (external-facing quality)
  - Pricing: Freemium (unlimited for public repos, paid for
    private repos and team features)
  - GTM: Launch on HN with working demo, target TypeScript/Go
    communities first (strongest typing = best doc generation)
  - Result: 12-page strategy doc with JTBD, market sizing,
    personas, competitive map, pricing, and 90-day GTM plan.
```

### Example 2: Feature Prioritization with RICE

```
User: "15 feature requests, limited engineering time. What do
       we build in Q2?"

Product Strategist:
  - Scores each request on RICE:
    #1: Auto-retry on failure (R:90%, I:3, C:95%, E:1 week)
        Score: 256.5 -- Quick win, high impact, ship first
    #2: Team collaboration (R:40%, I:3, C:70%, E:6 weeks)
        Score: 14.0 -- Strategic bet, lower confidence
    #3: Dark mode (R:60%, I:1, C:99%, E:2 weeks)
        Score: 29.7 -- Nice-to-have, defer
  - Q2 recommendation: Ship #1 (week 1), investigate #2 with
    user interviews (weeks 2-3), build #2 if validated (weeks
    4-10), defer #3 to Q3
  - Result: Ranked backlog with scores, rationale, and a
    phased execution plan.
```

### Example 3: Competitive Positioning Under Pressure

```
User: "Three competitors launched similar features. How do we
       differentiate?"

Product Strategist:
  - Competitive matrix: features, pricing, positioning mapped
  - Finding: All three optimize for the same axis (speed).
    Nobody owns reliability or governance.
  - Blue Ocean opportunity: Position as "the one that ships
    with guardrails" -- governance, quality gates, audit trails
  - Messaging: "Move fast without breaking things" (not "move
    fast and break things")
  - Moat analysis: Governance IP compounds over time. Speed is
    commoditizing. Reliability is defensible.
  - Result: Positioning pivot with new messaging, feature
    priority adjustments, and a 6-month moat-building plan.
```

## Power Use Cases

**Wardley Mapping for Build vs. Buy**: When evaluating whether to build a component or use a third-party service, the Product Strategist maps the value chain using Wardley Mapping. Components in the "custom-built" zone deserve engineering investment. Components in the "commodity" zone should be purchased. This prevents teams from building infrastructure that adds no competitive advantage.

**Pricing Model Design**: For a new product launch, the Product Strategist applies the Van Westendorp Price Sensitivity Meter and conjoint analysis to find the optimal price point. It designs pricing tiers that align price with value delivered (not features gated) and projects revenue using bottoms-up SaaS metrics (MRR, churn, expansion revenue, LTV:CAC ratio).

**North Star Metric Selection**: Rather than tracking everything, the Product Strategist identifies the single metric that best captures the value the product delivers to users. For NXTG-Forge, this might be "tasks completed autonomously per week" -- a metric that captures both adoption (users are using it) and value (autonomous completion means it actually works).

## Combines With

| Feature | Synergy |
|---------|---------|
| **CEO Loop** | Strategist provides analysis; CEO Loop makes the final call on strategic direction |
| **Scout** | Scout gathers competitive intelligence; Strategist turns it into positioning strategy |
| **Growth Engine** | Strategist defines the GTM plan; Growth Engine executes distribution |
| **Revenue Architect** | Strategist designs the pricing model; Revenue Architect implements the billing infrastructure |
| **/forge:spec** | Strategy decisions become feature specifications |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | JTBD analysis, RICE/MoSCoW prioritization, competitive positioning, GTM planning, pricing frameworks, Lean Canvas |
| **L2 Pro Builder** | + `forge_get_plan` for plan-aware strategy; `forge_capture_knowledge` records strategic decisions; `forge_check_drift` verifies product direction |
| **L3 Ship Lord** | + Dashboard panel showing feature priority scores, roadmap visualization, and metric tracking |

## Tips & Gotchas

- **Do**: Start with Jobs-to-be-Done before jumping to features. The job defines the value; features are just implementation details.
- **Do**: Use both top-down and bottom-up for market sizing. If they diverge by more than 3x, your assumptions need investigation.
- **Don't**: Prioritize features by loudness of request. Apply RICE scoring -- the loudest requester often has the smallest reach.
- **Don't**: Ship a pricing model without testing willingness-to-pay. Guessing the price is leaving money on the table or leaving users at the door.

---

*See also: [ceo-loop](ceo-loop.md), [scout](scout.md), [revenue-architect](revenue-architect.md)*
