/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 构建优化配置
  swcMinify: true,
  
  // 输出配置
  output: 'standalone',
  
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
  },
  
  // ESLint 配置
  eslint: {
    // 在构建时忽略 ESLint 错误（谨慎使用）
    ignoreDuringBuilds: false,
  },
  
  images: {
    domains: ['localhost', 'mgicejesamlzjgvnlphy.supabase.co', 'api.littlejoys.xyz'],
    // 添加图片优化配置
    formats: ['image/webp', 'image/avif'],
  },
  
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  async rewrites() {
    // 获取API基础URL，支持环境变量配置
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000'
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  
  // Webpack 配置优化
  webpack: (config, { isServer }) => {
    // 忽略特定的警告
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ];
    
    // 优化构建
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 