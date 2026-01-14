import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/spark-sql-builder/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
