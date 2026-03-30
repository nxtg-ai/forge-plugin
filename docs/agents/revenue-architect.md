# Revenue Architect

> The monetization brain that designs how products make money -- from Van Westendorp pricing discovery to Stripe webhook architecture, from freemium conversion funnels to enterprise contract structures.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Executive & Strategy |
| **Model** | Opus |

---

## What It Does

The Revenue Architect is the bridge between product vision and sustainable revenue. Every feature decision has a revenue implication -- this agent makes those implications explicit. It thinks in terms of value capture, not just value creation, and it designs pricing models that align price with value delivered rather than features gated.

It covers the full monetization surface: pricing model selection (seat-based, usage-based, hybrid, open-core), willingness-to-pay analysis (Van Westendorp Price Sensitivity Meter, conjoint analysis), Stripe integration architecture (subscriptions, metered billing, webhooks, customer portal), financial modeling (bottoms-up SaaS metrics, cohort analysis, unit economics), freemium-to-paid conversion funnel design, enterprise sales planning (contract structures, negotiation levers, procurement navigation), and revenue projection for investor communication.

The agent produces honest financial models -- not hockey sticks. It grounds every projection in unit economics: customer acquisition cost (CAC), lifetime value (LTV), monthly churn rate, expansion revenue, and payback period. If the LTV:CAC ratio is below 3:1, it says so and designs the pricing changes needed to fix it.

## When to Use It

- **Pricing model selection**: When deciding between usage-based, seat-based, or hybrid pricing for a new product and need a framework-driven recommendation.
- **Stripe billing integration**: When implementing subscriptions, metered billing, or usage-based pricing with Stripe and need the webhook architecture, subscription lifecycle, and edge case handling.
- **Open-core feature split**: When deciding what should be free (to drive adoption) versus paid (to generate revenue) in a developer tool.
- **Financial modeling**: When building bottoms-up revenue projections for fundraising, board reporting, or strategic planning.
- **Enterprise pricing design**: When designing enterprise tier pricing with volume discounts, contract structures, and negotiation parameters.

Do not use this agent for marketing distribution (Growth Engine) or product feature prioritization (Product Strategist). The Revenue Architect designs how money flows; other agents drive what gets built and how it reaches users.

## How It Works

1. **Product Analysis**: Evaluates the product type, user behavior patterns, competitive pricing landscape, and value metrics (what users measure value by).
2. **Pricing Framework Application**: Applies Van Westendorp for price discovery, conjoint analysis for feature-level willingness-to-pay, and competitive benchmarking for market positioning.
3. **Model Design**: Designs the pricing architecture -- tiers, value metrics, free tier limits, upgrade triggers, enterprise thresholds.
4. **Financial Modeling**: Builds bottoms-up SaaS financial models with monthly cohort projections, churn modeling, expansion revenue, and unit economics.
5. **Implementation Architecture**: Designs the technical billing infrastructure -- Stripe integration patterns, webhook handling, subscription state machines, and metering pipelines.

## Examples

### Example 1: Pricing Model Selection

```
User: "Should we use usage-based or seat-based pricing for
       our API product?"

Revenue Architect:
  - Product analysis: API product, variable usage per customer,
    value scales with API calls not team size
  - Assessment: Usage-based is natural fit -- price aligns with
    value consumed. But pure usage creates unpredictable bills.
  - Recommendation: Hybrid model
    Free tier: 10,000 API calls/month (hook)
    Pro: $29/mo includes 100K calls + $0.001 per additional
    Enterprise: Volume pricing, committed use discounts
  - Reasoning: Base subscription creates predictable revenue.
    Usage component captures value from heavy users. Free tier
    is generous enough for evaluation but not for production.
  - Financial projection: 5% free-to-paid conversion, $45 ARPU,
    projected $540K ARR at 1,000 customers
```

### Example 2: Stripe Integration Architecture

```
User: "Set up Stripe subscriptions with metered billing"

Revenue Architect:
  - Architecture:
    Stripe Products: 3 (Free, Pro, Enterprise)
    Stripe Prices: Fixed monthly + metered component
    Metering: Usage events sent to Stripe via meter API
    Webhooks: customer.subscription.created/updated/deleted,
      invoice.payment_succeeded/failed, checkout.session.completed
  - Subscription lifecycle state machine:
    trialing -> active -> past_due -> canceled
    active -> paused (if feature enabled)
  - Webhook handler pattern: idempotent processing, signature
    verification, event deduplication, failure retry queue
  - Edge cases: proration on mid-cycle upgrades, grace period
    for failed payments, tax calculation via Stripe Tax
  - Result: Complete Stripe integration spec with webhook
    handlers, state machine, and edge case coverage.
```

### Example 3: Open-Core Feature Split

```
User: "What should be free vs paid in our developer tool?"

Revenue Architect:
  - Framework: The "free is the funnel" model
  - Free (drives adoption):
    - Core CLI functionality (table stakes)
    - Single-user workflows (hooks developers)
    - Community support (scales without cost)
    - Public project governance (social proof)
  - Paid (captures value):
    - Team collaboration features (value scales with team)
    - Advanced analytics and reporting (power user signal)
    - Priority support and SLA (enterprise need)
    - SSO/SAML authentication (procurement requirement)
    - Audit logs and compliance (enterprise unlock)
  - Rule: Never gate a feature that blocks the "aha moment."
    The free tier must deliver enough value that users
    evangelize before they ever see a paywall.
  - Result: Feature split with rationale per item and
    projected conversion funnel.
```

## Power Use Cases

**Van Westendorp Price Sensitivity Analysis**: Before launching, the Revenue Architect designs a 4-question survey (too cheap, bargain, expensive, too expensive) for target users. It plots the intersections to find the optimal price point (OPP), indifference price point (IDP), and acceptable range. This replaces guesswork with data-driven pricing.

**SaaS Financial Model for Fundraising**: Builds a bottoms-up model with monthly cohort projections showing: new MRR, expansion MRR, churn MRR, net new MRR, cumulative ARR, LTV:CAC ratio, CAC payback months, and runway. Every number traces to an assumption that can be tested. Investors see a model grounded in unit economics, not aspirational projections.

**Upgrade Trigger Design**: Maps the moments in the product experience where users naturally hit the limits of the free tier and are most receptive to upgrading. Designs the upgrade prompt to appear at the moment of maximum value perception -- when the user just accomplished something and wants to do more, not when they are blocked and frustrated.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Product Strategist** | Strategist defines the product and pricing model; Revenue Architect implements the billing |
| **Growth Engine** | Growth Engine drives adoption; Revenue Architect converts adoption into revenue |
| **Scout** | Scout provides competitor pricing data; Revenue Architect uses it for positioning |
| **CEO Loop** | Revenue projections inform CEO Loop's resource allocation decisions |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Pricing model design, Stripe architecture, open-core strategy, financial modeling, enterprise pricing |
| **L2 Pro Builder** | + `forge_capture_knowledge` records pricing decisions and financial models for portfolio reference |
| **L3 Ship Lord** | + Dashboard panel showing MRR tracking, conversion funnel metrics, and pricing experiment results |

## Tips & Gotchas

- **Do**: Price on value delivered, not features included. Usage-based pricing naturally aligns price with value.
- **Do**: Make the free tier generous enough that users can evaluate and evangelize before seeing a paywall.
- **Don't**: Set prices by copying a single competitor. Use Van Westendorp or conjoint analysis to find your market's willingness-to-pay.
- **Don't**: Implement billing without handling edge cases: failed payments, prorated upgrades, tax calculation, and subscription state transitions.

---

*See also: [product-strategist](product-strategist.md), [growth-engine](growth-engine.md)*
