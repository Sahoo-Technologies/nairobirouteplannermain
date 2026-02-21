/**
 * E2E SMOKE TESTS: Vercel deployment readiness  
 * Validates build configuration, file structure, and deployment config
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

describe("E2E: Project structure validation", () => {
  it("should have package.json", () => {
    expect(fs.existsSync(path.join(ROOT, "package.json"))).toBe(true);
  });

  it("should have vercel.json", () => {
    expect(fs.existsSync(path.join(ROOT, "vercel.json"))).toBe(true);
  });

  it("should have server/vercel-entry.ts (API entry point)", () => {
    expect(fs.existsSync(path.join(ROOT, "server", "vercel-entry.ts"))).toBe(true);
  });

  it("should have api/index.mjs (bundled serverless function)", () => {
    expect(fs.existsSync(path.join(ROOT, "api", "index.mjs"))).toBe(true);
  });

  it("should have client entry point", () => {
    expect(fs.existsSync(path.join(ROOT, "client", "index.html"))).toBe(true);
  });

  it("should have vite.config", () => {
    const hasTsx = fs.existsSync(path.join(ROOT, "vite.config.tsx"));
    const hasTs = fs.existsSync(path.join(ROOT, "vite.config.ts"));
    expect(hasTsx || hasTs).toBe(true);
  });

  it("should have tsconfig.json", () => {
    expect(fs.existsSync(path.join(ROOT, "tsconfig.json"))).toBe(true);
  });

  it("should have .gitignore", () => {
    expect(fs.existsSync(path.join(ROOT, ".gitignore"))).toBe(true);
  });

  it("should have .vercelignore", () => {
    expect(fs.existsSync(path.join(ROOT, ".vercelignore"))).toBe(true);
  });

  it("should have shared schema", () => {
    expect(fs.existsSync(path.join(ROOT, "shared", "schema.ts"))).toBe(true);
  });

  it("should have server entry point", () => {
    expect(fs.existsSync(path.join(ROOT, "server", "index.ts"))).toBe(true);
  });
});

describe("E2E: Vercel configuration validation", () => {
  let vercelConfig: any;

  it("should parse vercel.json as valid JSON", () => {
    const content = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    vercelConfig = JSON.parse(content);
    expect(vercelConfig).toBeDefined();
  });

  it("should have correct build command", () => {
    const content = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    vercelConfig = JSON.parse(content);
    expect(vercelConfig.buildCommand).toBe("npm run vercel-build");
  });

  it("should have correct output directory", () => {
    const content = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    vercelConfig = JSON.parse(content);
    expect(vercelConfig.outputDirectory).toBe("dist/public");
  });

  it("should have API rewrites configured", () => {
    const content = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    vercelConfig = JSON.parse(content);
    expect(vercelConfig.rewrites).toBeDefined();
    expect(Array.isArray(vercelConfig.rewrites)).toBe(true);
    const apiRewrite = vercelConfig.rewrites.find((r: any) => r.source.includes("/api"));
    expect(apiRewrite).toBeDefined();
    expect(apiRewrite.destination).toBe("/api");
  });

  it("should have serverless function config", () => {
    const content = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    vercelConfig = JSON.parse(content);
    expect(vercelConfig.functions).toBeDefined();
    expect(vercelConfig.functions["api/index.mjs"]).toBeDefined();
  });

  it("should have cron configured", () => {
    const content = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    vercelConfig = JSON.parse(content);
    expect(vercelConfig.crons).toBeDefined();
    expect(Array.isArray(vercelConfig.crons)).toBe(true);
    const backupCron = vercelConfig.crons.find((c: any) => c.path.includes("backup"));
    expect(backupCron).toBeDefined();
  });
});

describe("E2E: Package.json validation", () => {
  let pkg: any;

  it("should have vercel-build script", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    expect(pkg.scripts["vercel-build"]).toBeDefined();
    expect(pkg.scripts["vercel-build"]).toContain("vite build");
  });

  it("should have build script", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    expect(pkg.scripts.build).toBeDefined();
  });

  it("should have dev script", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    expect(pkg.scripts.dev).toBeDefined();
  });

  it("should specify Node.js engine", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines.node).toBeDefined();
  });

  it("should have ESM type", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    expect(pkg.type).toBe("module");
  });

  it("should have required dependencies", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    const requiredDeps = ["express", "react", "react-dom", "drizzle-orm", "pg", "zod"];
    for (const dep of requiredDeps) {
      expect(pkg.dependencies[dep]).toBeDefined();
    }
  });

  it("should have required dev dependencies", () => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    const requiredDevDeps = ["typescript", "vite", "vitest"];
    for (const dep of requiredDevDeps) {
      expect(pkg.devDependencies[dep]).toBeDefined();
    }
  });
});

describe("E2E: TypeScript configuration validation", () => {
  let tsconfig: any;

  it("should have valid tsconfig.json", () => {
    // tsconfig might have comments, so we strip them
    const content = fs.readFileSync(path.join(ROOT, "tsconfig.json"), "utf-8");
    tsconfig = JSON.parse(content);
    expect(tsconfig).toBeDefined();
  });

  it("should include client, server, shared, and api directories", () => {
    const content = fs.readFileSync(path.join(ROOT, "tsconfig.json"), "utf-8");
    tsconfig = JSON.parse(content);
    expect(tsconfig.include).toBeDefined();
    const include = tsconfig.include.join(" ");
    expect(include).toContain("client");
    expect(include).toContain("server");
    expect(include).toContain("shared");
    expect(include).toContain("api");
  });

  it("should have path aliases configured", () => {
    const content = fs.readFileSync(path.join(ROOT, "tsconfig.json"), "utf-8");
    tsconfig = JSON.parse(content);
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths["@/*"]).toBeDefined();
    expect(tsconfig.compilerOptions.paths["@shared/*"]).toBeDefined();
  });
});

describe("E2E: API serverless function validation", () => {
  it("server/vercel-entry.ts should export a default handler", () => {
    const content = fs.readFileSync(path.join(ROOT, "server", "vercel-entry.ts"), "utf-8");
    expect(content).toContain("export default");
    expect(content).toContain("async function handler");
  });

  it("server/vercel-entry.ts should import from server routes", () => {
    const content = fs.readFileSync(path.join(ROOT, "server", "vercel-entry.ts"), "utf-8");
    expect(content).toContain("./routes");
  });

  it("server/vercel-entry.ts should initialize Express app", () => {
    const content = fs.readFileSync(path.join(ROOT, "server", "vercel-entry.ts"), "utf-8");
    expect(content).toContain("express()");
    expect(content).toContain("express.json");
  });

  it("api/index.mjs bundle should contain handler export", () => {
    const content = fs.readFileSync(path.join(ROOT, "api", "index.mjs"), "utf-8");
    expect(content).toContain("handler");
  });
});

describe("E2E: Vite config validation", () => {
  it("vite config should set client as root", () => {
    const content = fs.readFileSync(path.join(ROOT, "vite.config.ts"), "utf-8");
    expect(content).toContain("client");
    expect(content).toContain("root:");
  });

  it("vite config should set dist/public as output", () => {
    const content = fs.readFileSync(path.join(ROOT, "vite.config.ts"), "utf-8");
    expect(content).toContain("dist/public");
  });

  it("vite config should not hard-import Replit plugins", () => {
    const content = fs.readFileSync(path.join(ROOT, "vite.config.ts"), "utf-8");
    // Should use dynamic import with try/catch, not top-level import
    expect(content).not.toMatch(/^import.*@replit/m);
  });

  it("vite config should have path aliases", () => {
    const content = fs.readFileSync(path.join(ROOT, "vite.config.ts"), "utf-8");
    expect(content).toContain("@");
    expect(content).toContain("@shared");
  });
});
