import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite' // Added loadEnv here
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig(({ mode }) => {
  /**
   * loadEnv(mode, process.cwd(), '') loads variables from the system environment.
   * This allows Vite to see the BASE_URL we export in the pipeline.
   */
  const env = loadEnv(mode, process.cwd(), '')
  
  // Use the environment variable if it exists, otherwise default to development
  const base_path = env.BASE_URL || '/vue/development/';

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
