import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // 👇 cambiá <TU_REPO> por el nombre exacto del repo en GitHub
  base: '/gestor-gastos/',
})
