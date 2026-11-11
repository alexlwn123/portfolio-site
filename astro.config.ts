import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

// Static output only. React components render to HTML at build time and
// nothing hydrates, so no page ships JavaScript unless a later phase opts in.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react()],
  devToolbar: { enabled: false },
})
