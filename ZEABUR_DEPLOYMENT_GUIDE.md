# Zeabur 部署指南

## 项目结构说明

这是一个包含前端（Next.js）和后端（FastAPI）的 monorepo 项目：

```
Little joys/
├── next-frontend/          # Next.js 前端应用
│   ├── zbpack.json        # 前端部署配置
│   └── package.json
├── backend/               # FastAPI 后端应用
│   ├── requirements.txt   # Python 依赖
│   └── zbpack.json       # 后端部署配置
└── zbpack.json           # 主部署配置（后端）
```

## 部署步骤

### 1. 后端部署（FastAPI）

#### 方法一：使用根目录配置
1. 在 Zeabur 中创建新项目
2. 连接你的 GitHub 仓库
3. Zeabur 会自动检测根目录的 `zbpack.json` 配置
4. 配置环境变量（见下方环境变量部分）
5. 部署后端服务

#### 方法二：使用 backend 目录
1. 在部署时选择 `backend` 目录作为根目录
2. 使用 `backend/zbpack.json` 配置

### 2. 前端部署（Next.js）

1. 在同一个 Zeabur 项目中添加新服务
2. 选择 `next-frontend` 目录作为根目录
3. 配置前端环境变量
4. 部署前端服务

## 环境变量配置

### 后端环境变量
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AMAP_API_KEY=your_amap_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
DEBUG=False
```

### 前端环境变量
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url
```

## 常见问题解决

### 1. 依赖冲突问题
已修复 `httpx` 版本冲突：
- 原来：`httpx==0.25.2`
- 修复后：`httpx==0.24.1`（与 supabase 2.0.2 兼容）

### 2. 构建失败
如果遇到构建失败，检查：
- Python 版本是否正确（3.11）
- Node.js 版本是否正确（18）
- 环境变量是否配置完整

### 3. 服务连接问题
确保：
- 后端服务正常运行
- 前端的 `NEXT_PUBLIC_API_BASE_URL` 指向正确的后端地址
- CORS 设置正确

## 部署验证

### 后端验证
访问：`https://your-backend-domain.zeabur.app/docs`
应该能看到 FastAPI 的 Swagger 文档

### 前端验证
访问：`https://your-frontend-domain.zeabur.app`
应该能正常加载页面

## 注意事项

1. **分别部署**：前端和后端需要作为两个独立的服务部署
2. **域名配置**：部署后记得更新前端的 API 基础 URL
3. **数据库**：确保 Supabase 配置正确
4. **API 密钥**：确保第三方 API 密钥有效且配额充足

## 故障排除

如果部署失败，检查构建日志中的错误信息：
1. 依赖安装错误 → 检查 requirements.txt 或 package.json
2. 环境变量错误 → 检查 Zeabur 环境变量配置
3. 代码错误 → 检查本地是否能正常运行

## 更新部署

代码更新后，Zeabur 会自动重新部署。如果需要手动触发：
1. 在 Zeabur 控制台找到对应服务
2. 点击 "Redeploy" 按钮 