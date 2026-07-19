// Version-surface contract (DIRECTIVE-NXTG-20260718-10 item 3). All version surfaces + the MCP
// handshake must agree (the drift class fixed in v3.10.2 G-10). Uses the same checkVersionsAgree()
// the L1 harness uses; includes a seeded-mismatch negative control.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serverVersion } from "../index.mjs";
import { checkVersionsAgree } from "./lib/checks.mjs";

const REPO = join(import.meta.dirname, "../../../../../"); // -> forge-plugin/
const rd = (p) => JSON.parse(readFileSync(p, "utf8"));

describe("version-surface agreement", () => {
  it("all 4 version surfaces + lockfile + MCP handshake agree", () => {
    const surfaces = {
      "root .claude-plugin/plugin.json": rd(join(REPO, ".claude-plugin/plugin.json")).version,
      "plugin manifest": rd(join(REPO, "plugins/nxtg-forge/.claude-plugin/plugin.json")).version,
      "marketplace.json": rd(join(REPO, ".claude-plugin/marketplace.json")).plugins[0].version,
      "governance-mcp/package.json": rd(join(import.meta.dirname, "../package.json")).version,
      "package-lock.json": rd(join(import.meta.dirname, "../package-lock.json")).version,
      "mcp handshake (serverVersion)": serverVersion,
    };
    const r = checkVersionsAgree(surfaces);
    expect(r.ok, r.problems.join("; ")).toBe(true);
  });

  it("negative control: checkVersionsAgree fails on a seeded mismatch", () => {
    const r = checkVersionsAgree({ a: "3.10.3", b: "3.10.3", c: "3.10.2" });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.includes("c=3.10.2"))).toBe(true);
  });
});
