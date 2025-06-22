# 🌸 生活小确幸 - 完整项目设置指南

## 📋 项目概述

这是一个完整的全栈应用，包含：
- **前端**: Next.js + TypeScript + Tailwind CSS
- **后端**: FastAPI + Python
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage

## 🚀 快速开始

### 第一步：设置Supabase数据库

1. **创建Supabase项目**
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目
   - 记录项目URL和API密钥

2. **执行数据库初始化**
   - 在Supabase Dashboard中打开SQL编辑器
   - 复制并执行 `database/setup.sql` 中的所有SQL语句
   - 确认所有表和触发器创建成功

3. **配置Storage Buckets**
   - 在Supabase Dashboard中进入Storage
   - 创建以下buckets：
     - `post-images` (公开访问)
     - `post-audios` (公开访问)  
     - `user-avatars` (公开访问)

### 第二步：配置环境变量

1. **复制环境变量文件**
   ```bash
   cp .env .env.local
   ```

2. **更新环境变量**
   ```bash
   # 第三方API密钥
   AMAP_API_KEY="你的高德地图API密钥"
   OPENWEATHERMAP_API_KEY="你的OpenWeatherMap API密钥"
   
   # Supabase配置 (从你的Supabase项目获取)
   NEXT_PUBLIC_SUPABASE_URL="你的Supabase项目URL"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="你的Supabase匿名密钥"
   SUPABASE_SERVICE_ROLE_KEY="你的Supabase服务角色密钥"
   ```

### 第三步：启动后端服务

1. **进入后端目录**
   ```bash
   cd backend
   ```

2. **创建虚拟环境**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # macOS/Linux
   # 或
   .venv\Scripts\activate     # Windows
   ```

3. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

4. **启动服务**
   ```bash
   python main.py
   ```
   
   服务将在 `http://localhost:8000` 启动

### 第四步：启动前端应用

1. **进入前端目录**
   ```bash
   cd next-frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   应用将在 `http://localhost:3000` 启动

## 🔧 API密钥获取指南

### 高德地图API密钥
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并创建应用
3. 获取Web服务API密钥

### OpenWeatherMap API密钥
1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册账号
3. 获取免费API密钥

## 📊 数据库表结构

项目包含以下主要数据表：

- **user_profiles** - 用户扩展信息
- **posts** - 便签内容
- **likes** - 点赞记录
- **comments** - 评论记录
- **rewards** - 打赏记录
- **payment_accounts** - 支付账户

详细结构请参考 `database_design.md`

## 🔐 认证流程

1. **用户注册/登录** - 通过Supabase Auth
2. **自动创建Profile** - 数据库触发器自动创建用户扩展信息
3. **JWT认证** - 所有API请求需要携带有效JWT token

## 📱 主要功能

### 用户功能
- ✅ 用户注册/登录
- ✅ 个人信息管理
- ✅ 头像上传

### 便签功能
- ✅ 创建便签（文字+图片+音频）
- ✅ 自动获取位置和天气信息
- ✅ 便签列表展示（最新/最热排序）
- ✅ 便签详情查看
- ✅ 便签删除（软删除）

### 互动功能
- ✅ 点赞/取消点赞
- ✅ 评论功能
- ✅ 打赏功能（预留接口）

## 🛠️ 开发工具推荐

### 数据库管理
- **Supabase Dashboard** - 在线数据库管理
- **DBeaver** - 本地数据库客户端

### API测试
- **Postman** - API接口测试
- **FastAPI Docs** - 自动生成的API文档 (`http://localhost:8000/docs`)

### 代码编辑
- **VS Code** - 推荐安装以下插件：
  - Python
  - TypeScript
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

## 🚨 常见问题

### 1. 数据库连接失败
- 检查Supabase URL和密钥是否正确
- 确认网络连接正常
- 验证RLS策略是否正确配置

### 2. API请求失败
- 检查后端服务是否正常启动
- 确认API密钥配置正确
- 查看控制台错误信息

### 3. 前端编译错误
- 确认Node.js版本 >= 18
- 删除node_modules重新安装依赖
- 检查TypeScript类型错误

### 4. 图片上传失败
- 确认Supabase Storage buckets已创建
- 检查文件大小和格式限制
- 验证存储权限配置

## 📈 后续开发计划

### 短期目标
- [ ] 完善前端UI组件
- [ ] 添加图片上传功能
- [ ] 实现音频录制和播放
- [ ] 优化移动端体验

### 中期目标
- [ ] 添加用户关注功能
- [ ] 实现消息通知系统
- [ ] 集成支付功能
- [ ] 添加内容审核机制

### 长期目标
- [ ] 开发移动端App
- [ ] 添加AI内容推荐
- [ ] 实现多语言支持
- [ ] 构建社区功能

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 📞 技术支持

如遇到问题，请：
1. 查看本指南的常见问题部分
2. 检查项目日志和错误信息
3. 在GitHub Issues中提问

---

**祝您开发愉快！🌸** 