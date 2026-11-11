import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

import { lidPlacement } from './src/features/lid/placement/integration'

// Static output only. React components render to HTML at build time and
// nothing hydrates, so no page ships JavaScript unless a later phase opts in.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), lidPlacement()],
  devToolbar: { enabled: false },
  // Every asset is a file with an address of its own. Vite would otherwise
  // inline the small ones as data: URIs, which a strict Content-Security-Policy
  // has to make an exception for.
  vite: { build: { assetsInlineLimit: 0 } },
})
