#!/usr/bin/env python3
"""The plugin.json description's component counts must match the tree (forge-pm, after DIRECTIVE-NXTG-20261007-18).

Counted the way a user would verify them:
  agents   = agents/*.md            commands = commands/*.md        skills = skills/*/SKILL.md
  hooks    = hook registrations in hooks/hooks.json (one script can be registered for several events/matchers)
  guards   = registrations of PreToolUse security-* scripts, counted per distinct script (the blocking guards)
Each count the description states is checked; a count it does not state is not required.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / "plugins" / "nxtg-forge"
desc = json.loads((P / ".claude-plugin" / "plugin.json").read_text())["description"]
hooks = json.loads((P / "hooks" / "hooks.json").read_text())["hooks"]
regs = [(ev, h["command"]) for ev, groups in hooks.items() for g in groups for h in g.get("hooks", [])]
script = lambda cmd: (re.search(r"scripts/([\w-]+)\.sh", cmd) or [None, cmd])[1]
actual = {
    "agents": len(list((P / "agents").glob("*.md"))),
    "commands": len(list((P / "commands").glob("*.md"))),
    "skills": len(list((P / "skills").glob("*/SKILL.md"))),
    "hooks": len(regs),
    "blocking security guards": len({script(c) for ev, c in regs if ev == "PreToolUse" and script(c).startswith("security-")}),
}
red, checked = [], 0
for label, n in actual.items():
    m = re.search(rf"(\d+) {re.escape(label)}\b", desc)
    if m:
        checked += 1
        if int(m.group(1)) != n:
            red.append(f"description says {m.group(1)} {label}, the tree has {n}")
for stale in re.findall(r"\d+ security hooks\b", desc):
    red.append(f"description says '{stale}': state hooks and blocking security guards separately")
for r in red:
    print(f"  RED  {r}")
print(f"description-counts: {len(red)} red over {checked} counts checked {actual}")
sys.exit(1 if red else 0)
