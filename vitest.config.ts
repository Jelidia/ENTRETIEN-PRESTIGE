import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["node_modules/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      all: false,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      exclude: [
        "**/*.d.ts",
        "**/node_modules/**",
        "**/.next/**",
        "app/api/**",
        "app/(app)/dashboard/**",
        "invoicePdfRoute.test.ts",
        "lib/**",
        "tests/**",
        "vitest.config.ts",
        "vitest.setup.ts",
      ],
    },
  },
});
