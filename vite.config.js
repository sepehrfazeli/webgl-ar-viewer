import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'three-examples': [
            'three/examples/jsm/loaders/GLTFLoader.js',
            'three/examples/jsm/loaders/STLLoader.js',
            'three/examples/jsm/loaders/DRACOLoader.js',
            'three/examples/jsm/controls/OrbitControls.js'
          ]
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
})
