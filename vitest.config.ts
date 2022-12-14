// vitest.config.ts

import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      vigne: path.resolve(__dirname, 'src'),
    },
  },
})
