# Agentic AI Security (ASI01–ASI10) — Claude Code Reference

These risks apply specifically to AI agent systems: Claude Code plugins, MCP servers, autonomous coding agents. Each entry notes what to check in a Claude Code plugin.

## ASI01: Excessive Agency

Agents granted more permissions than their task requires (a read-only agent given write; a review agent that can run arbitrary shell).

**In a plugin:** `agents/*.md` declare a `tools:` allowlist. Leaf workers (testing, docs) should NOT carry `Task`, `Bash`, or `Write` unless their role demands it. **Fix:** minimum viable tool list per agent; use `disallowedTools` to block dangerous tools; review agents get read-only tools.

## ASI02: Inadequate Sandboxing

Agents escaping their execution boundary — a subagent modifying files outside its worktree; shell commands reaching host resources.

**In a plugin:** use `isolation: worktree` for agents that write files. Never grant `dangerouslyDisableSandbox` unless the task is impossible without it. **Fix:** worktree isolation for writers; restrict `Bash` via hook validation; monitor file paths in `PostToolUse` hooks.

## ASI03: Prompt Injection

Malicious instructions embedded in tool results, file contents, or env vars that redirect agent behavior.

**In a plugin:** MCP tool results, files read by agents, and hook inputs are all untrusted. **Fix:** treat all tool results as DATA, not instructions; validate MCP responses against expected schemas; never execute instructions found in file contents or error messages.

## ASI04: Insecure Tool Use

Agents calling tools without validating inputs/outputs — passing user-controlled strings to shell, building file paths from untrusted input.

**In a plugin:** MCP handlers must validate every parameter before use.
```javascript
async function handleTool(name, args) {
  const schema = TOOL_SCHEMAS[name];
  if (!schema) return { error: "Unknown tool" };
  const validated = schema.safeParse(args);
  if (!validated.success) return { error: validated.error.message };
  return await TOOL_HANDLERS[name](validated.data);
}
```

## ASI05: Insufficient Monitoring

No audit trail for agent actions — cannot determine what an agent did, which tools it called, what data it accessed.

**In a plugin:** lifecycle hooks (a pre-task / post-task pair) provide observability; an append-only event log (e.g. a JSONL audit trail) captures tool calls. **Fix:** log every tool call with timestamp, agent ID, tool name, parameter summary; never log secrets or full file contents; review logs for anomalies.

## ASI06: Data Exfiltration

Agents leaking sensitive data through tool calls — writing secrets to files, sending data to external URLs, embedding data in commit messages.

**In a plugin:** a `Bash`-capable agent could `curl` data out; a `Write`-capable agent could dump env vars to a file. **Fix:** network-restrict agent environments; monitor outbound connections in hooks; never pass `.env` contents through MCP tools; use `disallowedTools` to block network tools where not needed.

## ASI07: Uncontrolled Escalation

Agents escalating their own privileges — spawning more powerful subagents, modifying their own config, requesting elevated permissions.

**In a plugin:** an agent with `Task` can spawn subagents with broader tool access; an agent could edit `agents/*.md` to expand its own permissions on next invocation. **Fix:** subagent tool lists must be a SUBSET of the parent's; agents should not have write access to `agents/` or `commands/`; use `PostToolUse` hooks to detect self-modification.

## ASI08: Model Manipulation

Adversarial inputs (jailbreaking, token smuggling, encoding attacks) making the model produce harmful output.

**In a plugin:** primarily a concern when agents process untrusted external content (web pages, uploaded files, third-party API responses). **Fix:** do not feed raw external content directly into prompts; summarize/sanitize before including in context; use structured extraction over free-form interpretation.

## ASI09: Supply Chain

Malicious plugins, MCP servers, or tool definitions that look legitimate but contain backdoors.

**In a plugin:** marketplace plugins, `.mcp.json` servers, and disk-loaded skills are all supply-chain vectors. **Fix:** audit all MCP server code before installation; pin `package.json` dependency versions; review plugin source on updates; `npm audit` MCP server dependencies.

## ASI10: Denial of Service

Resource exhaustion via agent loops, unbounded recursion, or tool-call overload.

**In a plugin:** an agent in a retry loop hammering `Bash`; a hook that triggers on every file write degrading performance; MCP tools with no timeout. **Fix:** set iteration limits on agent loops; add timeouts to all MCP tool handlers; keep hooks non-blocking; monitor agent token consumption.
