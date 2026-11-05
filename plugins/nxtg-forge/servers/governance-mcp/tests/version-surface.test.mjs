// Version-surface contract (DIRECTIVE-NXTG-20260718-10 item 3). All version surfaces + the MCP
// handshake must agree (the drift class fixed in v3.10.2 G-10). Uses the same checkVersionsAgree()
// the L1 harness uses; includes a seeded-mismatch negative control.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { serverVersion } from "../index.mjs";
import { checkVersionsAgree } from "./lib/checks.mjs";

const REPO = join(import.meta.dirname, "../../../../../"); // -> forge-plugin/
const rd = (p) => JSON.parse(readFileSync(p, "utf8"));

describe("version-surface agreement", () => {
  it("all version surfaces (both plugin manifests) + lockfile + MCP handshake agree", () => {
    const surfaces = {
      "root .claude-plugin/plugin.json": rd(join(REPO, ".claude-plugin/plugin.json")).version,
      "plugin manifest": rd(join(REPO, "plugins/nxtg-forge/.claude-plugin/plugin.json")).version,
      "companion manifest": rd(join(REPO, "plugins/nxtg-forge-orchestrator/.claude-plugin/plugin.json")).version,
      "governance-mcp/package.json": rd(join(import.meta.dirname, "../package.json")).version,
      "package-lock.json": rd(join(import.meta.dirname, "../package-lock.json")).version,
      "mcp handshake (serverVersion)": serverVersion,
    };
    const r = checkVersionsAgree(surfaces);
    expect(r.ok, r.problems.join("; ")).toBe(true);
  });

  // Since #87 a marketplace entry is pinned (git-subdir ref+sha), and Claude Code caches a plugin under its
  // version string and keeps that cache until the string changes. So an entry's version must name what its
  // pin serves: the release PR leaves marketplace.json alone, and the pin PR moves version, ref and sha
  // together. A version bumped ahead of its pin would cache the old release under the new number for good.
  it("every marketplace entry's version is the release its ref pins", () => {
    for (const p of rd(join(REPO, ".claude-plugin/marketplace.json")).plugins) {
      expect(p.source.ref, p.name).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(`v${p.version}`, p.name).toBe(p.source.ref);
    }
  });

  // The marketplace entries are checked here, not in the agreement above: the release PR bumps the manifests
  // but cannot move the pin (its tag and squash do not exist yet), so between the release PR and the pin PR the
  // entries still serve the previous release. They may lag the manifests by that window, never lead them. After
  // the pin PR they are equal again. (Before 3.14.1 the agreement above required equality, which no release PR
  // could pass.)
  it("the marketplace entries are the manifest version, or an older release while its pin PR is pending", () => {
    const manifest = rd(join(REPO, "plugins/nxtg-forge/.claude-plugin/plugin.json")).version;
    const num = (v) => v.split(".").map(Number);
    const notAfter = (a, b) => { const x = num(a), y = num(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return true; };
    for (const p of rd(join(REPO, ".claude-plugin/marketplace.json")).plugins) {
      expect(p.version, p.name).toMatch(/^\d+\.\d+\.\d+$/);
      expect(notAfter(p.version, manifest), `${p.name} ${p.version} is ahead of the manifests (${manifest})`).toBe(true);
    }
  });

  // The lag ends when the release is tagged: from then on the pin must serve it, or a marketplace install keeps
  // getting the previous release while the advisory and CHANGELOG say it is patched (forge-pm seat N1, v3.14.1).
  // CI's Quality Gate checks out with fetch-depth 0, so tags are present; with no git or no tags this cannot be
  // known and the check is skipped.
  it("once the manifests' release is tagged, both marketplace entries pin it", () => {
    const manifest = rd(join(REPO, "plugins/nxtg-forge/.claude-plugin/plugin.json")).version;
    const tagged = spawnSync("git", ["rev-parse", "-q", "--verify", `refs/tags/v${manifest}`], { cwd: REPO }).status === 0;
    if (!tagged) return;
    for (const p of rd(join(REPO, ".claude-plugin/marketplace.json")).plugins) {
      expect(p.version, `${p.name}: v${manifest} is tagged, so the pin PR must move this entry`).toBe(manifest);
      expect(p.source.ref, p.name).toBe(`v${manifest}`);
    }
  });

  // The two plugins never pin different releases: one tag, one commit, the same repo.
  it("marketplace.json lists nxtg-forge-orchestrator, pinned to the same ref and sha as nxtg-forge", () => {
    const plugins = rd(join(REPO, ".claude-plugin/marketplace.json")).plugins;
    const forge = plugins.find((p) => p.name === "nxtg-forge");
    const comp = plugins.find((p) => p.name === "nxtg-forge-orchestrator");
    expect(comp, "companion entry").toBeDefined();
    expect(comp.source).toEqual({ ...forge.source, path: "plugins/nxtg-forge-orchestrator" });
    expect(forge.source.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it("negative control: checkVersionsAgree fails on a seeded mismatch", () => {
    const r = checkVersionsAgree({ a: "3.10.3", b: "3.10.3", c: "3.10.2" });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.includes("c=3.10.2"))).toBe(true);
  });
});
