import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost:3000/" } },
    setupFiles: ["./vitest.setup.ts"],
    // Tests cover the signed-in features; one test turns sign-in off.
    // Medicine pages read the small real sample, not a fetched data/medicines.json.
    env: { NEXT_PUBLIC_SIGN_IN: "on", MEDICINES_FILE: "e2e/fixtures/medicines.json" },
    include: ["src/**/*.test.{ts,tsx}", "functions/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "functions/**/*.ts"],
      exclude: ["**/*.test.{ts,tsx}", "src/test/**", "src/api/schema.d.ts", "src/app/layout.tsx"],
      thresholds: { lines: 80, statements: 80, branches: 80, functions: 80 },
    },
  },
});
