import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    env: {
      PIN_SECRET: "segredo-de-teste-do-pin",
      CRON_SECRET: "segredo-de-teste-do-cron",
      IOT_DEVICE_SECRET: "segredo-de-teste-iot",
      PIX_WEBHOOK_SECRET: "segredo-de-teste-pix",
    },
    coverage: {
      provider: "v8",
      include: ["src/server/**", "src/app/api/**", "src/lib/**", "src/utils/**"],
      exclude: ["src/lib/apiClient.ts"],
      reporter: ["text-summary", "text"],
      thresholds: {
        "src/server/**": { lines: 80 },
        "src/app/api/**": { lines: 80 },
      },
    },
  },
})
