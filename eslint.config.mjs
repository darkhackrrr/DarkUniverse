import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Flat config (ESLint 9). `eslint-config-next` v16 ships native flat presets,
 * so no FlatCompat/eslintrc bridge is needed.
 */
const configs = [
  Array.isArray(nextCoreWebVitals) ? nextCoreWebVitals : [nextCoreWebVitals],
  Array.isArray(nextTypescript) ? nextTypescript : [nextTypescript],
].flat();

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "out/**", "build/**", "prisma/generated/**"] },
  js.configs.recommended,
  ...configs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "warn",
      // React-Compiler heuristics: this app intentionally fetches in effects
      // and derives values (e.g. account age) during render, so these stay
      // advisory instead of failing the lint gate.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
];

export default eslintConfig;
