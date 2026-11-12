import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.mjs'],
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    coverage: {
      provider: 'v8',
      include: ['server/**/*.js'],
      exclude: ['server/data/**', 'server/node_modules/**'],
      all: true,
      reportsDirectory: 'coverage/unit',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
    },
  },
})
