// eslint.config.mjs
import tsparser from "@typescript-eslint/parser";
import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

export default [
  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "main.js",
      "dist/**",
      "*.config.js",
      "*.config.mjs",
      "version-bump.mjs",
      "server/**", // Exclude server folder (not part of plugin)
    ],
  },
  
  // TypeScript configuration with Obsidian rules
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      obsidianmd: obsidianmd,
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: { 
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Obsidian-specific rules - prevent common issues
      "obsidianmd/no-sample-code": "error",
      "obsidianmd/sample-names": "error",
      "obsidianmd/prefer-file-manager-trash-file": "warn",
      "obsidianmd/no-forbidden-elements": "error",
      "obsidianmd/hardcoded-config-path": "error",
      "obsidianmd/platform": "error",
      "obsidianmd/no-plugin-as-component": "error",
      "obsidianmd/detach-leaves": "error",
      "obsidianmd/no-tfile-tfolder-cast": "error",
      "obsidianmd/no-view-references-in-plugin": "error",
      "obsidianmd/no-static-styles-assignment": "error",
      "obsidianmd/object-assign": "error",
      "obsidianmd/regex-lookbehind": "error",
      "obsidianmd/prefer-abstract-input-suggest": "error",
      "obsidianmd/ui/sentence-case": "off", // Manually enforced
      "obsidianmd/validate-manifest": "error",
      "obsidianmd/validate-license": "error",
      
      // Command-related rules
      "obsidianmd/commands/no-command-in-command-id": "error",
      "obsidianmd/commands/no-command-in-command-name": "error",
      "obsidianmd/commands/no-default-hotkeys": "error",
      "obsidianmd/commands/no-plugin-id-in-command-id": "error",
      "obsidianmd/commands/no-plugin-name-in-command-name": "error",
      
      // Settings tab rules
      "obsidianmd/settings-tab/no-manual-html-headings": "error",
      "obsidianmd/settings-tab/no-problematic-settings-headings": "error",
      
      // Vault rules
      "obsidianmd/vault/iterate": "error",
      
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": ["warn", { fixToUnknown: false }],
      "@typescript-eslint/no-unused-vars": ["warn", { 
        args: "none",
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      
      // General JavaScript/TypeScript rules
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
      "prefer-const": "warn",
      "no-self-compare": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-implicit-globals": "error",
      "no-alert": "error",
      "no-undef": "error",
      "no-unused-vars": "off", // Using @typescript-eslint/no-unused-vars instead
      
      // Obsidian-specific restrictions
      "no-restricted-globals": [
        "error",
        {
          name: "app",
          message: "Avoid using the global app object. Instead use the reference provided by your plugin instance.",
        },
        {
          name: "fetch",
          message: "Use the built-in `requestUrl` function instead of `fetch` for network requests in Obsidian.",
        },
        {
          name: "localStorage",
          message: "Prefer `App#saveLocalStorage` / `App#loadLocalStorage` functions to write / read localStorage data that's unique to a vault."
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          name: "axios",
          message: "Use the built-in `requestUrl` function instead of `axios`.",
        },
        {
          name: "moment",
          message: "The 'moment' package is bundled with Obsidian. Please import it from 'obsidian' instead.",
        },
      ],
    },
  },
  
  // JavaScript files configuration
  {
    files: ["**/*.js", "**/*.mjs"],
    plugins: {
      obsidianmd: obsidianmd,
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
      "prefer-const": "warn",
    },
  },
];
