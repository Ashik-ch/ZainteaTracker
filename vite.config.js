import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages is hosted at: https://ashik-ch.github.io/ZainteaTracker/
  // Using the correct base ensures built asset URLs resolve properly.
  base: '/ZainteaTracker/',
})
