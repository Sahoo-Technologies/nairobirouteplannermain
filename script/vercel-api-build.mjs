/**
 * Bundles api/index.ts into api/index.mjs for Vercel serverless deployment.
 *
 * This resolves the ERR_MODULE_NOT_FOUND error caused by:
 *  - Node ESM requiring explicit file extensions for relative imports
 *  - tsconfig path aliases (@shared/*) not being resolved at runtime
 *
 * All local source files are bundled; npm packages stay external
 * (they're available in node_modules on Vercel).
 */
import { build } from "esbuild";
import { readFile } from "fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf-8"));
const allDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

await build({
  entryPoints: ["api/index.ts"],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: "api/index.mjs",
  external: allDeps,
  alias: {
    "@shared": "./shared",
    "@": "./client/src",
  },
  target: "node20",
  sourcemap: false,
  minify: false,
  logLevel: "info",
});

console.log("✓ API function bundled → api/index.mjs");
