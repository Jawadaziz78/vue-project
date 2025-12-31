import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base_path = env.VITE_BASE_URL || '/';

  return {
    base: base_path, 
    
    // --- ADDED BUILD CLEANUP LOGIC ---
    build: {
      emptyOutDir: true, // Automatically clears the dist folder before building
    },
    
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
