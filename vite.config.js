import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // base: '/spark-sql-builder/', // REPLACE with your actual repository name
  plugins: [
    react(),
    tailwindcss(),
  ],
})