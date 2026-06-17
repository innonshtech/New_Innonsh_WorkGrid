/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

if (process.env.NODE_ENV !== 'production') {
  console.log('\x1b[36m%s\x1b[0m', '=====================================================');
  console.log('\x1b[36m%s\x1b[0m', '🚀 Development Server Started');
  console.log('\x1b[36m%s\x1b[0m', '📚 API Docs available at: http://localhost:3000/api-docs');
  console.log('\x1b[36m%s\x1b[0m', '=====================================================');
}

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.env.NODE_ENV === 'production' ? '.next' : '.next-dev';

const nextConfig = {
    output: 'standalone',
    experimental: {
        lockDistDir: false,
        mcpServer: false
    },
    distDir,
    serverExternalPackages: ['jspdf', 'fflate', 'node-cron', 'nodemailer'],
    turbopack: {
        root: projectRoot
    }
};

export default nextConfig;
