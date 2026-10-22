import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // PDF export runs the renderer under docs/pdf-concepts/claude in a child process and, on
  // Vercel, the bundled serverless Chromium. Neither is imported statically, so ship them explicitly.
  serverExternalPackages: ["@sparticuz/chromium"],
  // Keys are route globs, so "[id]" would be read as a character class.
  outputFileTracingIncludes: {
    "/api/portfolio/*/pdf": [
      "./docs/pdf-concepts/claude/tools/*.mjs",
      "./docs/pdf-concepts/claude/template/**/*",
      "./docs/pdf-concepts/claude/assets/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
  // The renderer directory is traced as a whole; drop art sources, generated output and fixtures.
  outputFileTracingExcludes: {
    "/api/portfolio/*/pdf": [
      "./docs/pdf-concepts/claude/{art,out,compare,data,schema}/**/*",
      "./docs/pdf-concepts/claude/tools/*.{py,json}",
      "./docs/pdf-concepts/claude/*.md",
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
