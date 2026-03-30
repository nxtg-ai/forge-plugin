# Wordsmith

> The copywriter who makes developers install, click, and trust -- writing text that earns its place sentence by sentence, with a kill list for every hollow adjective and AI-detectable word.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Executive & Strategy |
| **Model** | Sonnet |

---

## What It Does

The Wordsmith writes text that makes people do things: install, click, buy, read further, trust. Every sentence earns its place or gets cut. It writes like a senior engineer explaining something to a peer over coffee -- direct, opinionated, concrete, human, and honest.

It covers every user-facing text surface: landing page copy (headlines, value props, CTAs using PAS, AIDA, and 4U formulas), technical blog posts (teaching through storytelling, code blocks every 2-3 paragraphs), README files (install command above the fold, three-command quickstart), product descriptions, email sequences (onboarding drips, activation campaigns), social media posts (platform-native voice for Twitter, LinkedIn, Reddit), documentation, error messages (what happened, why, how to fix it), CLI help text (examples mandatory, zero prose), and changelog entries (user impact, not internal diffs).

The agent maintains a strict kill list of AI-detectable words (delve, tapestry, robust, holistic, seamless) and hollow adjectives (powerful, flexible, easy-to-use, blazing fast). Every instance is replaced with specific evidence. "Powerful" becomes "handles 10K concurrent connections." "Blazing fast" becomes "47ms p99 latency." "Easy to use" becomes a three-line code example. If an adjective survives without evidence, the Wordsmith failed.

## When to Use It

- **Landing page copy**: When you need headlines that stop scrolling, value propositions that resonate, and CTAs that convert.
- **README rewrite**: When your README reads like a spec sheet and nobody is installing. The Wordsmith makes the install command the first thing visible and the value proposition undeniable.
- **Error message redesign**: When your error messages say "Something went wrong" and users do not know what to do next.
- **Technical blog post**: When you need a blog post that teaches through story, balances depth with readability, and includes working code examples.
- **Changelog writing**: When you need to turn a commit log into a changelog that tells users what changed for them, not what changed in the code.

Do not use this agent for design decisions (Design Vanguard), content strategy/calendar (Growth Engine), or documentation architecture (DX Engineer).

## How It Works

1. **Audience Analysis**: Before writing, answers: Who reads this? What do they already know? What should they do after reading? Where will they read it?
2. **First Draft**: Gets words on the page without editing. Ugly first drafts are faster to fix than blank pages.
3. **Cut 30%**: Every sentence that does not move the reader toward the goal gets deleted. A 1,000-word piece becomes 700.
4. **Read Aloud Test**: If a sentence causes stumbling when spoken, it gets rewritten. If a paragraph sounds like a brochure, it gets rewritten.
5. **Kill List Check**: Runs through the AI-detectable words blacklist and hollow adjectives list. Every violation is replaced with specifics or deleted.

## Examples

### Example 1: README Rewrite for Conversion

```
User: "Our README is boring and nobody is installing"

Wordsmith:
  - Audits: Install command at line 47 (below the fold),
    no screenshot or GIF, 800 words before first code block,
    6 uses of "powerful" with zero specifics
  - Rewrites:
    Line 1: One-sentence value prop
    Line 3: Badge row (3 badges max)
    Line 5: npm install command
    Line 7: 3-line quickstart that does something real
    Line 12: "Why this?" with problem statement + benchmark
  - Cuts: 800 words to 340. Install above the fold.
  - Replaces: "powerful governance" with "catches scope creep
    before your PR grows from 3 files to 30"
  - Result: README that sells the project in 10 seconds with
    a copy-pasteable install in the first screenful.
```

### Example 2: Error Message Redesign

```
User: "Our error messages just say 'Something went wrong'"

Wordsmith:
  - Audits 22 error paths
  - Rewrites with what/why/how structure:
    Before: "Error: Invalid configuration"
    After:  "Config file missing required field 'database.host'.
             Add it to config.yml:
               database:
                 host: localhost"
    Before: "Error 403"
    After:  "You don't have permission to delete this project.
             Only the project owner can do this.
             Ask @username, or request owner access in
             Settings > Team."
  - Result: 22 error messages rewritten. Each tells the user
    what broke and exactly how to fix it.
```

### Example 3: Landing Page Copy with PAS Formula

```
User: "Write landing page copy for our CLI tool"

Wordsmith:
  - Uses PAS (Problem, Agitate, Solve):
    Problem: "Your CI takes 47 minutes."
    Agitate: "Every push is a coin flip. Devs alt-tab to Slack
             and forget what they were building."
    Solve:   "Forge runs your full suite in 90 seconds."
  - Hero section: Benefit headline, not feature headline
  - Feature blocks: Each leads with the benefit, not the feature
    Feature: "Hot module replacement"
    Benefit: "See changes the moment you save -- no refresh,
             no lost state"
  - CTA: "npm install forge" (not "Learn more" or "Get started")
  - Result: Landing page copy that names the pain, amplifies it,
    and presents the product as the relief.
```

## Power Use Cases

**Feature-to-Benefit Conversion**: The Wordsmith applies the "So what?" test to every feature claim. Write the feature, ask "so what?", answer it, ask "so what?" again -- that second answer is usually the benefit. "256-bit AES encryption" becomes "Your data stays private, even if someone steals the database." This conversion is the single most impactful improvement for any product page.

**Platform-Native Content Adaptation**: The same announcement written for Twitter, LinkedIn, Reddit, and a blog post will read completely differently. Twitter: hook in first tweet, one idea per tweet, ends with a link. LinkedIn: hook in first line, short paragraphs, personal angle. Reddit: one paragraph, no formatting, casual voice, lead with the problem. Blog: title is a promise, first paragraph states what the reader will learn. The Wordsmith adapts voice, format, and structure to each platform's norms.

**Email Drip Sequence Design**: Designs 5-email onboarding sequences with specific timing and purpose: Day 0 (welcome + one action), Day 1 (get them to first value in under 5 minutes), Day 3 (one feature they missed), Day 5 (social proof via real projects), Day 7 (check-in, no upsell). Each email has one CTA, preview text optimized, and plain text format (outperforms HTML for developer audiences).

## Combines With

| Feature | Synergy |
|---------|---------|
| **Growth Engine** | Growth Engine plans the content calendar; Wordsmith writes the actual posts |
| **DX Engineer** | DX Engineer identifies text that needs improvement; Wordsmith rewrites it |
| **Design Vanguard** | Design Vanguard handles visual communication; Wordsmith handles verbal communication |
| **Release Sentinel** | Sentinel identifies docs that need updating; Wordsmith writes the updates |
| **/forge:docs-update** | Triggers documentation updates that the Wordsmith can execute |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Landing pages, READMEs, error messages, blog posts, email sequences, changelogs, CLI help text, social posts |
| **L2 Pro Builder** | + `forge_capture_knowledge` records voice guidelines and successful copy patterns for reuse |
| **L3 Ship Lord** | + Dashboard integration for viewing and editing user-facing text with A/B test tracking |

## Tips & Gotchas

- **Do**: Cut 30% of your first draft. If a piece is 1,000 words, get it to 700. Shorter is almost always better.
- **Do**: Replace every hollow adjective with a specific number, example, or benchmark. Evidence beats assertion.
- **Don't**: Use any word on the AI-detectable blacklist (delve, tapestry, robust, holistic, seamless, leverage, harness). They flag content as machine-written and damage credibility with developers.
- **Don't**: Cross-post identical content to multiple platforms. Each platform has its own voice, format, and norms.

---

*See also: [growth-engine](growth-engine.md), [dx-engineer](dx-engineer.md)*
