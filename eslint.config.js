import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

export default tseslint.config(
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js", "manifest.json", "server/*.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
    plugins: {
      obsidianmd,
    },
    rules: {
      ...(obsidianmd.configs?.recommended?.rules || {}),
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "server/**",
      "esbuild.config.mjs",
      "eslint.config.js",
      "version-bump.mjs",
      "versions.json",
      "main.js",
    ],
  },
);
