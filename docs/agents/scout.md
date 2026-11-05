# Scout

> The competitive intelligence specialist who turns raw market signals into strategic advantage -- every output ends with "so what should we do about it," not "here are some facts."

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Executive & Strategy |
| **Model** | Sonnet |

---

## What It Does

The Scout produces actionable intelligence that drives decisions, not slide decks that gather dust. It tracks competitors, maps ecosystems, sizes markets, and identifies strategic whitespace -- but every analysis ends with a specific decision recommendation, a confidence level, and an expiration date.

It follows a rigorous anti-bias protocol: steel-man competitors first (if you cannot explain why a customer would choose them, you do not understand them), separate observation from interpretation, name your unknowns explicitly, apply the reversal test (would your analysis survive if competitors were analyzing you?), triangulate every claim from at least two independent sources, actively track disconfirming evidence, and time-stamp everything (market intelligence decays -- anything older than 90 days is potentially stale).

The Scout operates across ten analytical playbooks: competitor feature matrices, pricing comparison analysis, market sizing (TAM/SAM/SOM with both top-down and bottom-up), technology trend monitoring, patent and IP landscape scanning, open source ecosystem mapping, acquisition and funding tracking, SWOT analysis, Porter's Five Forces, and Blue Ocean strategy identification. Each playbook produces structured output with findings, decisions required, blind spots acknowledged, and next collection targets.

## When to Use It

- **Competitive landscape mapping**: When you need a detailed feature matrix comparing your product against specific competitors, with honest strengths and weaknesses on both sides.
- **Market sizing**: When you need TAM/SAM/SOM estimates for a product launch or investor communication, validated with both top-down and bottom-up methods.
- **Competitor tracking**: When you need to know what a specific competitor has shipped recently, how their adoption is trending, and what their hiring patterns signal.
- **Strategic whitespace identification**: When you want to find the gaps in the market that no one is filling, validated by demand signals.
- **Open source ecosystem analysis**: When you need to understand which technologies in your space are rising, plateauing, or declining, and what that means for your positioning.

Do not use this agent for internal code analysis (Detective agent), product strategy decisions (Product Strategist), or content writing (Wordsmith). The Scout gathers and analyzes external intelligence; other agents act on it.

## How It Works

1. **Question Definition**: Before any research, writes down the specific decision the intelligence will inform. "Who are our competitors?" is too vague. "Should we build feature X before competitor Y ships it in Q3?" is actionable.
2. **Signal Collection**: Gathers primary signals using web search: official product pages, GitHub repos (stars, commits, contributors, issues), npm/PyPI downloads, Crunchbase for funding, patent databases, job boards for hiring signals, and community forums for sentiment.
3. **Validation**: Cross-references every data point from at least two sources. Checks Wayback Machine for historical changes. Verifies GitHub stats against npm downloads (vanity stars vs. real usage).
4. **Framework Analysis**: Applies the appropriate playbook (feature matrix, SWOT, Porter's, Blue Ocean) to transform raw data into structured analysis.
5. **Delivery**: Produces an intelligence brief with executive summary, structured findings, decisions required, blind spots, and next collection targets.

## Examples

### Example 1: Competitor Feature Matrix

```
User: "How do we compare to Cursor, Copilot, and Cody?"

Scout:
  - Builds feature matrix across 15 dimensions
  - Honest assessment:
    Where we win: Governance, autonomous operation, multi-agent
    Where they win: IDE integration (Cursor), scale (Copilot),
      open source (Cody)
    Table stakes: Code completion, chat, context awareness
    Whitespace: Nobody has governance + autonomous agents
  - Moat features: Our governance layer is hard to replicate --
    it requires domain expertise competitors haven't invested in
  - Decision: Double down on governance differentiation. Don't
    compete on code completion (commoditizing rapidly).
  - Confidence: MEDIUM (competitor roadmaps not public)
  - Shelf life: 60 days (fast-moving space)
```

### Example 2: Market Sizing with Dual Methods

```
User: "What's the TAM/SAM/SOM for AI developer tools?"

Scout:
  (All figures below are placeholders; the agent fills them
   from the sources it finds and cites.)
  - Top-down: $A global developer tools market.
    AI-assisted tools segment: $B.
    SAM (teams >5 devs, using AI): $C.
    SOM (realistic year 1 capture): $X.
  - Bottom-up: N professional developers globally.
    Target: N1 who use AI coding tools actively.
    Addressable: N2 who need governance/autonomy.
    At $P/yr avg: SOM = N2 x $P.
  - Divergence check: compares the two SOM estimates and
    investigates if they differ widely.
  - Growth vectors: Autonomous operation expanding TAM as
    it enables new use cases (overnight builds, CI-driven agents)
  - Risk factors: Large players (GitHub, Google) entering with
    free tiers could compress pricing
  - Decision: states whether the SOM supports the opportunity. Price above
    free-tier competition on governance value.
```

### Example 3: Ecosystem Momentum Analysis

```
User: "Which AI coding assistants are gaining traction?"

Scout:
  - GitHub signals analysis (90-day window; tool names and
    figures are placeholders, the agent uses what it measures):
    Rising: Tool A (+N stars, download growth)
    Rising: Tool B (+N stars, strong fork ratio)
    Plateau: Tool C (flat growth)
    Decline: Tool D (stars flat, downloads declining)
  - Key insight: names the pattern the signals show, e.g. a
    split between enterprise and open-source tools.
  - Signal: hiring or release activity that suggests a
    platform play, with what to watch for next.
  - Decision: Position in the governance/autonomous space
    before Cursor's platform play creates ecosystem lock-in.
    Window: 3-6 months.
```

## Power Use Cases

**Signal Decay Management**: Every data point the Scout produces carries a timestamp and a shelf life. Intelligence briefs include explicit decay dates: fresh (< 7 days), current (7-30 days), aging (30-90 days), stale (90-180 days), expired (> 180 days). This prevents teams from making decisions on outdated intelligence -- a common failure mode in fast-moving markets.

**Blue Ocean Strategy Identification**: Using the Four Actions Framework (Eliminate, Reduce, Raise, Create), the Scout identifies uncontested market space. It maps the "Red Ocean" factors everyone fights over, then identifies what can be eliminated (features the industry takes for granted but users don't value), reduced (over-engineered relative to needs), raised (above industry standard), or created (factors no one offers). The empty space is the Blue Ocean candidate -- validated by demand signals, not just whitespace.

**Moat Assessment**: For any competitive position, the Scout evaluates moat width (how hard to cross), depth (how much value it protects), and durability (strengthening or eroding). It maps eight moat types: network effects, switching costs, data advantage, scale economies, brand/trust, regulatory, technical, and ecosystem lock-in.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Product Strategist** | Scout provides market data; Strategist turns it into product decisions |
| **Growth Engine** | Scout identifies competitive positioning; Growth Engine communicates it to the market |
| **CEO Loop** | Scout's competitive urgency signals inform CEO Loop's prioritization decisions |
| **Revenue Architect** | Scout's pricing intelligence feeds Revenue Architect's pricing model design |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Feature matrices, market sizing, ecosystem mapping, SWOT, Porter's Five Forces, Blue Ocean analysis, signal tracking |
| **L2 Pro Builder** | + `forge_capture_knowledge` stores intelligence findings; `forge_get_knowledge` recalls past competitive data before re-researching |

## Tips & Gotchas

- **Do**: Define the specific decision the intelligence will inform before starting any research.
- **Do**: Steel-man competitors. If your analysis makes competitors look foolish, your analysis is wrong.
- **Don't**: Present raw data as intelligence. Every finding must connect to a decision. Every analysis must end with "so what."
- **Don't**: Cite data older than 90 days without re-verification. Market intelligence decays fast.

---

*See also: [product-strategist](product-strategist.md), [growth-engine](growth-engine.md)*
