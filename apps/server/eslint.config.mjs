import tsEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";

// Module boundaries are the point of this config: without them the src/modules/ layout
// decays back into cross-module reach-ins within a few sessions. js.configs.recommended is
// deliberately NOT included — under a Bun runtime it reported 402 false `no-undef` errors for
// process/URL/Buffer/Response. General code-quality linting is a separate, unstarted task.
//
// Two eslint-plugin-boundaries 7.2 traps, both found by probe rather than assumed:
//   1. `file: { pathNot: ["index.ts"] }` (older docs) is silently ignored — file selectors
//      accept only `categories`. An inert policy prints a one-line warning and enforces nothing.
//   2. Without `import/resolver`, dependency targets classify as `unknown` because the bundled
//      resolver never tries a `.ts` extension, so no policy can ever match them.
// Barrel targeting is therefore done by file categories, with `noneOf: ["barrel"]` carving
// index.ts back out of module-internal (both patterns match an index.ts file).
export default [
  {
    ignores: ["node_modules/**", "dist/**", "drizzle/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsEslint, boundaries },
    settings: {
      "import/resolver": { node: { extensions: [".ts", ".tsx", ".js", ".json"] } },
      "boundaries/elements": [
        { type: "module", pattern: "src/modules/*" },
        { type: "shared", pattern: "src/lib/*" },
        { type: "db", pattern: "src/db" },
        { type: "graphql", pattern: "src/graphql" },
        { type: "entry", pattern: "src" },
      ],
      "boundaries/files": [
        { category: "barrel", pattern: "src/modules/*/index.ts" },
        { category: "module-internal", pattern: "src/modules/*/**" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        2,
        {
          default: "allow",
          policies: [
            {
              from: { element: { type: "module" } },
              disallow: {
                to: {
                  element: { type: "module" },
                  file: { categories: { anyOf: ["module-internal"], noneOf: ["barrel"] } },
                },
              },
              message:
                "Import another module through its index.ts barrel only — reaching into internals makes the module boundary meaningless.",
            },
          ],
        },
      ],
    },
  },
];
