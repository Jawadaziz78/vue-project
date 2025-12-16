import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  base: '/vue/stage/',
  plugins: [
    vue(),
    // 1. FIX HTML ERROR: Handles <%- title %> tags
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'ProjectName',
          description: 'A single page application created using Vue.js 3',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~bootstrap': 'bootstrap',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 2. FIX CSS ERROR: Globally injects variables so $gray-100 works everywhere
        additionalData: `@use "@/scss/variables.scss" as *;`,
        // Silences the annoying warnings
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
})
