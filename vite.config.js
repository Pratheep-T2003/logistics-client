import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: process.env.GITHUB_PAGES === 'true' ? '/BlacksLogisticsPro/' : '/', // Use subdirectory for GitHub Pages
    build: {
        outDir: 'dist',
    },
    server: {
        host: '0.0.0.0', // Allow access from network
        port: 3000,
        strictPort: false,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
});
