import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig(({ mode }) => {
  /**
   * loadEnv(mode, process.cwd(), '') loads variables from the system environment.
   * This allows Vite to see the VITE_BASE_URL we export in the pipeline.
   */
  const env = loadEnv(mode, process.cwd(), '')
  
  /**
   * FIX: Check for VITE_BASE_URL first. 
   * Fallback to '/' instead of a hardcoded development path to prevent cross-branch leaks.
   */
  const base_path = env.VITE_BASE_URL || '/';

  return {
    // Apply the dynamic base path
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
