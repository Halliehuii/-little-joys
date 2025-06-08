# 🌸 Little Joys - 幸福小事日记

记录生活中每一个温暖的小瞬间，让幸福变得可见。

## ✨ 项目简介

Little Joys 是一个简洁优雅的生活记录应用，帮助用户记录日常生活中的小确幸。通过简单的文字、图片和位置信息，让每一个美好的瞬间都得到珍藏。

### 🎯 主要功能

- 📝 **记录幸福小事** - 简洁的文字记录界面
- 📸 **图片上传** - 为每个故事添加视觉记忆
- 📍 **自动定位** - 智能获取当前位置信息
- 🌤️ **天气记录** - 自动获取当前天气状况
- 👤 **署名功能** - 个性化的作者标识
- 📱 **响应式设计** - 支持各种设备访问

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 后端
- **FastAPI** - Python Web框架
- **Uvicorn** - ASGI服务器
- **Pydantic** - 数据验证
- **HTTPx** - 异步HTTP客户端

### 第三方服务
- **高德地图API** - 地理编码服务
- **OpenWeatherMap API** - 天气数据

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 18+
- npm 或 yarn

### 后端设置

1. 克隆项目
```bash
git clone <repository-url>
cd little-joys
```

2. 创建虚拟环境
```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# 或
.venv\Scripts\activate     # Windows
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，添加API密钥
```

5. 启动后端服务
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 前端设置

1. 进入前端目录
```bash
cd next-frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问应用
```
http://localhost:3000
```

## 📁 项目结构

```
little-joys/
├── main.py                 # FastAPI后端主文件
├── requirements.txt        # Python依赖
├── .env.example           # 环境变量模板
├── next-frontend/         # Next.js前端项目
│   ├── src/
│   │   └── app/
│   │       └── page.tsx   # 主页面组件
│   │   ├── package.json
│   │   └── ...
│   └── README.md             # 项目说明
```

## 🔧 API 接口

### 地理编码
```
GET /api/v1/location/reverse-geocode
- latitude: 纬度
- longitude: 经度  
- lang: 语言代码（可选）
```

### 天气查询
```
GET /api/v1/weather/current
- latitude: 纬度
- longitude: 经度
- units: 单位（metric/imperial）
- lang: 语言代码（可选）
```

## 🌟 特色功能

### 智能定位
- 支持GPS高精度定位
- 网络定位作为备选方案
- 友好的错误处理和手动输入选项

### 优雅的用户体验
- 渐变色彩设计
- 流畅的交互动画
- 响应式布局适配

### 数据安全
- API数据验证
- 错误处理机制
- 用户隐私保护

## 📝 使用说明

1. **记录小事** - 在文本框中输入你想记录的幸福瞬间
2. **添加署名** - 输入你的名字或昵称
3. **上传图片** - 选择一张图片来增强记忆
4. **获取位置** - 点击按钮自动获取当前位置
5. **获取天气** - 自动记录当前的天气状况
6. **确认上传** - 完成记录的创建

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请通过GitHub Issues联系。

---

> "Find Your Happy in the Little Things" - 在小事中发现幸福
> 
> "Joy Lives in the Details" - 快乐存在于细节中 