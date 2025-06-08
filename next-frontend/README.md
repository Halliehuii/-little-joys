# 幸福小事日记 - Little Joys Journal

一个温馨的日记应用，让您记录生活中的美好瞬间和幸福小事。

## 功能特点

- 📝 写日记：记录您的幸福瞬间
- 📷 图片上传：为您的日记添加照片
- 📍 地理位置：自动获取当前位置
- 🌤️ 天气信息：记录当时的天气状况
- ✏️ 署名功能：为您的日记添加个人署名
- 📱 响应式设计：支持各种设备

## 技术栈

- **前端框架**: Next.js 14
- **UI样式**: TailwindCSS
- **开发语言**: TypeScript
- **图标库**: Lucide React
- **字体**: Inter

## 安装和运行

### 前提条件

确保您的系统已安装：
- Node.js (版本 18 或更高)
- npm 或 yarn

### 安装依赖

```bash
# 如果您还没有安装 Node.js，请先安装
# macOS 用户可以使用 Homebrew:
# brew install node

# 进入项目目录
cd next-frontend

# 安装依赖
npm install
# 或使用 yarn
yarn install
```

### 运行开发服务器

```bash
# 启动开发服务器
npm run dev
# 或使用 yarn
yarn dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
# 构建生产版本
npm run build
# 或使用 yarn
yarn build

# 启动生产服务器
npm run start
# 或使用 yarn
yarn start
```

## 项目结构

```
next-frontend/
├── src/
│   ├── app/
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局组件
│   │   └── page.tsx         # 主页面组件
│   ├── components/          # 可复用组件
│   ├── lib/                 # 工具函数
│   └── types/               # TypeScript 类型定义
├── public/                  # 静态资源
├── package.json             # 项目依赖
├── next.config.js           # Next.js 配置
├── tailwind.config.ts       # TailwindCSS 配置
└── tsconfig.json           # TypeScript 配置
```

## 使用说明

1. **写日记**: 在文字输入框中记录您的幸福瞬间（最多100字）
2. **添加署名**: 在署名栏输入您的名字（最多30字）
3. **上传图片**: 点击图片区域选择并上传照片
4. **获取位置**: 点击"点击自动获取位置"按钮获取当前地理位置
5. **获取天气**: 点击"点击自动获取天气"按钮获取当前天气信息
6. **预览日记**: 在右侧查看日记预览效果
7. **提交上传**: 点击"确认上传"按钮提交您的日记

## 自定义配置

### 颜色主题

在 `tailwind.config.ts` 中可以自定义应用的颜色主题：

```typescript
colors: {
  'journal-yellow': '#FEF3A2',
  'journal-pink': '#FFD1DC',
  'journal-purple': '#E6A8E6',
  'journal-light-pink': '#F5E6E8',
}
```

### API 集成

目前应用使用模拟数据。要集成真实的后端API，请修改以下函数：

- `handleSubmit`: 上传日记数据
- `handleGetLocation`: 获取地理位置
- `handleGetWeather`: 获取天气信息

## 开发指南

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 React Hooks 最佳实践
- 使用 TailwindCSS 进行样式设计
- 保持组件的简洁和可复用性

### 贡献代码

1. Fork 本项目
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系我们

如有问题或建议，请联系我们：
- 邮箱: support@littlejoys.com
- 项目地址: https://github.com/yourusername/little-joys-journal

---

**Find Your Happy in the Little Things** | **Joy Lives in the Details** 