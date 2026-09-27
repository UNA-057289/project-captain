import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置：使用 React 插件，开发服务器固定端口 5173
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
