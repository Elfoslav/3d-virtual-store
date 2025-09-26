import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'), // <-- your library entry file
      name: 'VirtualEshop', // global variable name for UMD build
      fileName: (format) => `virtual-eshop.${format}.js`
    },
    rollupOptions: {
      // Externalize dependencies you don’t want bundled
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
