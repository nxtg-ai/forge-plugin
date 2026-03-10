# AI Brain Configuration

Forge uses a pluggable AI brain for task planning. The brain reads your project spec and decomposes it into dependency-aware tasks with assignments, file locks, and acceptance criteria. Two backends are available: **OpenAI** (API-powered) and **rule-based** (free, offline).

The brain is only used for planning and drift detection. It does not power the agents themselves — Claude, Codex, and Gemini do the actual work.

## Quick Setup

```bash
# Free — no API key, keyword heuristics
forge config brain rule-based

# Powered — uses OpenAI API for intelligent planning
forge config brain openai
```

Check your current config at any time with `forge config` (no arguments).

## Rule-Based Brain

The default brain. No API key, no network calls, no cost.

**How it works:** Scans your SPEC.md for `##` headers and creates one task per section. Classifies each task by keyword analysis — words like "design" or "architect" produce design tasks, "test" or "coverage" produce test tasks, and so on. Agent assignment follows the same pattern: architecture tasks go to Claude, implementation to Codex, testing and documentation to Gemini.

**When to use it:**
- Prototyping and quick experiments
- Cost-sensitive or air-gapped environments
- Simple specs with clear section headers

**Limitations:**
- Task decomposition is structural (one task per `##` header), not semantic
- Cannot infer implicit tasks or cross-cutting concerns
- Drift detection returns a neutral score (semantic comparison requires an LLM)

## OpenAI Brain

Sends your spec to the OpenAI API and receives a structured task plan back.

**How it works:** Your SPEC.md is sent to the configured model with a system prompt that instructs it to produce a JSON array of tasks. Each task includes a title, description, agent assignment, task type, dependency list, acceptance criteria, and locked files. The brain also powers drift detection by comparing completed work against your project vision.

**When to use it:**
- Production projects with complex specs
- When you need intelligent dependency ordering
- When task quality matters more than cost

### Model Configuration

```bash
# Set the model (default: gpt-4.1)
forge config brain.model gpt-4.1

# Other supported models
forge config brain.model gpt-4o
forge config brain.model o3
forge config brain.model o4-mini
```

### API Key Setup

The brain needs `OPENAI_API_KEY` in one of these locations:

1. Shell environment: `export OPENAI_API_KEY=sk-...`
2. Project `.env` file (in your project root)
3. Global `~/.forge/.env` file

If the key is missing, the OpenAI brain falls back to rule-based automatically.

## What the Brain Does

When you run `forge plan --generate`, the brain:

1. **Reads your SPEC.md** (or the file passed via `--spec`)
2. **Decomposes it into tasks** with unique IDs (T-001, T-002, ...)
3. **Assigns task types**: design, implement, review, test, document
4. **Sets dependencies** so tasks execute in the right order
5. **Suggests file assignments** for exclusive locking during execution
6. **Generates acceptance criteria** for each task

If a codebase inventory is present, the brain skips features that already exist and creates review tasks for existing code that may need updates.

## Switching Brains

You can switch between brains at any time. Switching does not affect existing tasks — it only changes how future plans are generated.

```bash
forge config brain openai        # Switch to OpenAI
forge config brain rule-based    # Switch back to free

# Re-generate the plan with the new brain
forge plan --generate
```

## Drift Detection

The brain also powers the `forge_check_drift` MCP tool, which compares completed work against your project vision (SPEC.md). The OpenAI brain returns a drift score from 0.0 (perfect alignment) to 1.0 (total drift) with an explanation. The rule-based brain returns a neutral score since semantic comparison requires an LLM.

## Extensibility

The brain is defined by the `ForgeBrain` trait in Rust with four methods: `decompose_plan`, `assign_task`, `evaluate_drift`, and `route_knowledge`. Additional backends (Claude, Gemini, local models) can be added without changing existing code.

## Next Steps

- [Your First Governed Project](C-05-first-governed-project.md) — End-to-end walkthrough using the brain
- [Multi-Agent Orchestration](C-06-multi-agent-orchestration.md) — How agents execute brain-generated plans
- [CLI Commands Reference](C-10-cli-commands.md) — All `forge config` options
