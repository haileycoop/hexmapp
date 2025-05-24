import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/hexmapp/' : '/',
  plugins: [vue()],
  server: {
    host: true,          // ← allows access from other devices
    port: 5173,          // ← optional: you can change the port if needed
    strictPort: true     // ← ensures the port won’t auto-increment
  }
}))
