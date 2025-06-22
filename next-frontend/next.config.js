/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 实验性功能
  experimental: {
    // 服务器组件日志
    logging: {
      level: 'error',
    },
  },
  
  // TypeScript 配置
  typescript: {
    // 在构建时忽略 TypeScript 错误（谨慎使用）
    ignoreBuildErrors: false,
  }
}

module.exports = nextConfig 