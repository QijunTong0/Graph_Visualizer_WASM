import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Graph_Visualizer_WASM/',
  plugins: [react()],
})
