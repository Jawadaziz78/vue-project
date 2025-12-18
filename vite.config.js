import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

// Convert to a function to enable dynamic logic
export default defineConfig(({ mode }) => {
  // Determine base path based on environment variable or default to development
  const base_path = process.env.BASE_URL || '/vue/development/';

  return {
    // Dynamic base path applied here
    base: base_path, 
    
    plugins: [
      vue(),
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
        '@': resolve(__dirname, 'src'),
        '~bootstrap': 'bootstrap',
      },
    },
    
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/scss/variables" as *;`,
          // Silence deprecations for cleaner build logs
          silenceDeprecations: ['color-functions', 'global-builtin', 'import'],
        },
      },
    },
    
    test: {
      globals: true,
      globalSetup: './tests/vitest.global-setup.js',
      setupFiles: ['./tests/vitest.globals.js'],
      environment: 'jsdom',
      reporters: ['default'],
      coverage: {
        reporter: ['text', 'json'],
      },
    },
  }
})
