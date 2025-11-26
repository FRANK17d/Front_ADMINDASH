import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' }), 
    tailwindcss(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "default",
      },
    }),
  ],
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: true
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  }
})
