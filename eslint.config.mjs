import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "data/**", "drizzle/**", "next-env.d.ts"] },
  {
    // Fonts are linked once in the App Router root layout, which loads them on every page.
    rules: { "@next/next/no-page-custom-font": "off" },
  },
];

export default eslintConfig;
