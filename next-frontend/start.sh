#!/bin/bash

echo "=== 幸福小事日记 - Little Joys Journal ==="
echo "正在启动前端应用..."

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    echo "💡 macOS 用户可以使用以下命令安装:"
    echo "   brew install node"
    echo "💡 或者访问 https://nodejs.org/ 下载安装"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm，请确保 Node.js 正确安装"
    exit 1
fi

echo "✅ 检测到 Node.js 版本: $(node --version)"
echo "✅ 检测到 npm 版本: $(npm --version)"

# 检查是否存在 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo "📱 请在浏览器中访问: http://localhost:3000"
echo "🛑 按 Ctrl+C 停止服务器"
echo ""

npm run dev 