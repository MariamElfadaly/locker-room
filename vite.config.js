import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: this must match your GitHub repo name exactly.
// If you name your repo "locker-room", leave this as is.
// If you name it something else, change 'locker-room' below to match.
export default defineConfig({
  plugins: [react()],
  base: '/locker-room/',
})
