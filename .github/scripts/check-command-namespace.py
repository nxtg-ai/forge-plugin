#!/usr/bin/env python3
"""Every slash command the shipped docs teach must be one a user can type (DIRECTIVE-NXTG-20261007-18).

Claude Code namespaces plugin commands by the plugin `name`, so a Forge command is `/<name>:<command>`.
RED when a shipped surface:
  - names a real Forge command or skill under any other namespace (e.g. the pre-2026-03-26 `forge`);
  - uses the plugin's own namespace with a command or skill that does not exist;
  - disagrees about the plugin name across plugin.json / root plugin.json / marketplace.json.
References to other plugins' commands (`/other-plugin:cmd`) are not Forge's and are ignored,
except under a FORMER Forge name, which never resolves.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PLUGIN = ROOT / "plugins" / "nxtg-forge"
FORMER_NAMES = {"forge"}  # 5d316c1 renamed nxtg-forge -> forge; a1a0cb0 renamed it back.
SHIPPED = [ROOT / "README.md", ROOT / "UAT-GUIDE.md", ROOT / "CLAUDE.md", ROOT / "docs", PLUGIN]
TEXT_EXT = {".md", ".sh", ".mjs", ".js", ".json", ".txt", ".yml", ".yaml"}
# A slash command: "/" not preceded by a word char, "/", ":" or "." (that excludes URLs and paths).
CMD = re.compile(r"(?<![\w/:.])/([a-z0-9][a-z0-9-]*):([a-z0-9][a-z0-9-]*)(\*)?")

red, checked = [], 0
def bad(msg): red.append(msg)

names = {
    "plugins/nxtg-forge/.claude-plugin/plugin.json": json.loads((PLUGIN / ".claude-plugin" / "plugin.json").read_text())["name"],
    ".claude-plugin/plugin.json": json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text())["name"],
    ".claude-plugin/marketplace.json plugins[0]": json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text())["plugins"][0]["name"],
}
name = names["plugins/nxtg-forge/.claude-plugin/plugin.json"]
if len(set(names.values())) != 1:
    bad(f"plugin name disagrees across manifests: {names}")

def user_invocable(skill_md):
    """A skill is a slash command unless its frontmatter says `user-invocable: false`."""
    text = skill_md.read_text(encoding="utf-8", errors="replace")
    fm = text.split("---", 2)[1] if text.startswith("---") else ""
    return not re.search(r"^user-invocable:\s*false\s*$", fm, re.M)

# The same set Claude Code registers (verified against a v3.10.5 install's init slash_commands: 47 = 47).
known = {p.stem for p in (PLUGIN / "commands").glob("*.md")} | {
    p.parent.name for p in (PLUGIN / "skills").glob("*/SKILL.md") if user_invocable(p)}

def files():
    for base in SHIPPED:
        if base.is_file():
            yield base
        elif base.is_dir():
            for p in sorted(base.rglob("*")):
                if p.is_file() and p.suffix in TEXT_EXT and "node_modules" not in p.parts:
                    yield p

for path in files():
    rel = path.relative_to(ROOT)
    for lineno, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        for m in CMD.finditer(line):
            ns, cmd, glob = m.group(1), m.group(2), m.group(3)
            exists = any(k.startswith(cmd) for k in known) if glob else cmd in known
            where = f"{rel}:{lineno}: {m.group(0)}"
            if ns == name:
                checked += 1
                if not exists:
                    bad(f"{where}: no command or skill '{cmd}' in this plugin")
            elif ns in FORMER_NAMES or exists:
                checked += 1
                bad(f"{where}: namespace '{ns}' does not resolve; the plugin is named '{name}' (use /{name}:{cmd}{glob or ''})")

for r in red:
    print(f"  RED  {r}")
print(f"command-namespace: {len(red)} red over {checked} command references checked (plugin name '{name}', {len(known)} commands+skills)")
sys.exit(1 if red else 0)
