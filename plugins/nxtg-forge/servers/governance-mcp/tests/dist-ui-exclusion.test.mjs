// dist-ui exclusion control (DIRECTIVE-NXTG-20260719-19 item 3). `"dist-ui"` is in EXCLUDED_DIRS
// (tools.mjs:62) → BUILD_ARTIFACT_EXCLUDES → getCodeMetrics's `find`. This control fixture-proves the
// exclusion so it cannot silently regress: a fixture with source under dist-ui/ must NOT inflate the
// source-file count. DoD: "the dist-ui fixture control fails when the exclusion is removed" — removing
// "dist-ui" from EXCLUDED_DIRS makes `dist-ui/bundle.ts` count as source and this test goes red.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getCodeMetrics, BUILD_ARTIFACT_EXCLUDES } from "../tools.mjs";

let fixture;

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), "forge-distui-"));
  // appRoot resolves to where package.json lives, so seed it at the fixture root.
  writeFileSync(join(fixture, "package.json"), JSON.stringify({ name: "distui-fixture", version: "0.0.1" }, null, 2));
  // ONE real source file.
  mkdirSync(join(fixture, "src"));
  writeFileSync(join(fixture, "src", "index.ts"), "export const hello = () => 'hi';\n");
  // A build-artifact dir with .ts files that MUST NOT count as source.
  mkdirSync(join(fixture, "dist-ui", "assets"), { recursive: true });
  writeFileSync(join(fixture, "dist-ui", "bundle.ts"), "export const x = 1;\n");
  writeFileSync(join(fixture, "dist-ui", "assets", "chunk.ts"), "export const y = 2;\n");
});

afterAll(() => { if (fixture) rmSync(fixture, { recursive: true, force: true }); });

describe("dist-ui exclusion from source counts (regression guard)", () => {
  it("EXCLUDED_DIRS/BUILD_ARTIFACT_EXCLUDES still contains dist-ui", () => {
    expect(BUILD_ARTIFACT_EXCLUDES).toContain("dist-ui");
  });

  it("getCodeMetrics counts only the real src file, excluding dist-ui/*.ts", () => {
    const m = getCodeMetrics(fixture);
    // Exactly the one src/index.ts — the two dist-ui/*.ts artifacts are excluded.
    expect(m.sourceFiles).toBe(1);
    // If "dist-ui" were removed from EXCLUDED_DIRS, sourceFiles would be 3 and this fails (the regression).
    expect(m.sourceFiles).toBeLessThan(3);
  });
});
