# 安装指南 - 幸福小事日记

## 快速开始

### 方法一：使用启动脚本（推荐）

```bash
# 进入项目目录
cd next-frontend

# 运行启动脚本
./start.sh
```

启动脚本会自动检查环境并安装所需依赖。

### 方法二：手动安装

#### 1. 安装 Node.js

**macOS 用户：**
```bash
# 如果没有安装 Homebrew，先安装它
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 使用 Homebrew 安装 Node.js
brew install node
```

**其他方式：**
- 访问 [Node.js 官网](https://nodejs.org/) 下载安装包
- 推荐安装 LTS 版本（18.x 或更高）

#### 2. 验证安装

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version
```

#### 3. 安装项目依赖

```bash
# 进入项目目录
cd next-frontend

# 安装依赖
npm install
```

#### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev
```

## 访问应用

启动成功后，在浏览器中访问：
- **本地地址**: http://localhost:3000

## 故障排除

### 问题 1: 端口被占用
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案:**
```bash
# 方法一：使用不同端口
npm run dev -- -p 3001

# 方法二：查找并终止占用端口的进程
lsof -ti:3000 | xargs kill -9
```

### 问题 2: 权限错误
```
Error: EACCES: permission denied
```

**解决方案:**
```bash
# 修复 npm 权限
sudo chown -R $(whoami) ~/.npm
```

### 问题 3: 依赖安装失败

**解决方案:**
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 4: TypeScript 错误

由于这是初始版本，可能会有一些 TypeScript 类型错误。这些不会影响应用运行，后续版本会修复。

## 开发环境配置

### VS Code 推荐插件
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint

### 浏览器推荐
- Chrome（推荐，有 React Developer Tools）
- Firefox
- Safari
- Edge

## 性能优化建议

1. **开发环境**: 使用 `npm run dev` 获得最佳开发体验
2. **生产环境**: 使用 `npm run build && npm run start` 获得最佳性能
3. **内存**: 建议至少 4GB RAM
4. **网络**: 首次安装需要良好的网络连接下载依赖

## 下一步

安装完成后，您可以：

1. 🎨 自定义颜色主题（修改 `tailwind.config.ts`）
2. 🔧 添加新功能（在 `src/components` 目录下）
3. 🌐 集成后端 API（修改 `src/app/page.tsx` 中的 API 调用）
4. 📱 测试响应式设计（使用浏览器开发者工具）

## 获取帮助

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查控制台错误信息
3. 确保 Node.js 版本 >= 18
4. 尝试重新安装依赖

---

**记住**: 第一次启动可能需要几分钟来下载和安装所有依赖。请耐心等待！ 