import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss'
import autoprefixer from 'autoprefixer'

const IN_PRODUCTION = process.env.NODE_ENV === 'production'

export default {
  plugins: [
    autoprefixer,
    IN_PRODUCTION &&
      // Reference https://github.com/Developmint/nuxt-purgecss/blob/main/src/config.ts
      purgeCSSPlugin({
        content: ['./**/*.html', './src/**/*.vue'],
        defaultExtractor(content) {
          // FIX: Changed .replace to .replaceAll to satisfy SonarQube
          const contentWithoutStyleBlocks = content.replaceAll(/<style[^]+?<\/style>/gi, '') // Remove inline vue styles

          return contentWithoutStyleBlocks.match(/[\w-.:/]+(?<!:)/g) || [] // Default extractor
        },
        safelist: [
          'body',
          'html',
          // FIX: Updated Regex to remove empty alternatives
          /-(leave|enter|appear)(-(to|from|active))?$/, // Normal transitions
          /^router-link(-exact)?-active$/, // Router link classes
          /^(?!(.*:)?cursor-move).+-move$/, // Move transitions
          /.*data-v-.*/, // Keep scoped styles
          /^active/,
          // Vue3 selectors
          /:slotted/,
          /:deep/,
          /:global/,
          /nuxt-devtools-.*/,
        ],
      }),
  ],
}
