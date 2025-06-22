# Supabase 邮箱认证配置指南

## 问题描述
如果你遇到以下问题：
- 用户注册后收到确认邮件，但点击确认链接后页面无法显示
- 邮箱确认失败，用户无法正常登录
- 确认链接指向错误的URL

## 解决方案

### 1. 登录Supabase控制台
1. 访问 [https://supabase.com](https://supabase.com)
2. 登录你的账号
3. 选择你的项目

### 2. 配置认证设置

#### 方法一：通过Supabase控制台界面配置
1. 在左侧菜单中点击 **Authentication（认证）**
2. 点击 **Settings（设置）** 标签
3. 找到 **Site URL** 设置
4. 将 **Site URL** 设置为：`http://localhost:3000`（开发环境）或你的实际域名
5. 在 **Redirect URLs** 中添加以下URL：
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirmed
   http://localhost:3000/auth/error
   http://localhost:3000/login
   ```

#### 方法二：通过SQL命令配置（如果界面配置不生效）
在Supabase SQL编辑器中执行以下命令：

```sql
-- 查看当前配置
SELECT * FROM auth.config;

-- 更新站点URL（替换为你的实际URL）
UPDATE auth.config 
SET site_url = 'http://localhost:3000'
WHERE id = 1;

-- 更新重定向URLs
UPDATE auth.config 
SET redirect_urls = ARRAY[
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/auth/confirmed', 
  'http://localhost:3000/auth/error',
  'http://localhost:3000/login'
]
WHERE id = 1;
```

### 3. 配置邮件模板（可选）

如果需要自定义确认邮件，可以在 **Authentication > Email Templates** 中修改：

1. 选择 **Confirm signup** 模板
2. 确保确认链接使用正确的URL格式：
   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
   ```

### 4. 环境配置检查

确保你的 `.env` 文件包含正确的Supabase配置：

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 5. 重启开发服务器

配置完成后，重启你的Next.js开发服务器：

```bash
cd next-frontend
npm run dev
```

## 测试流程

1. 访问测试页面：`http://localhost:3000/test-auth-flow`
2. 运行自动测试检查配置
3. 手动注册新用户进行测试

### 手动测试步骤：
1. 访问 `http://localhost:3000/login`
2. 点击"邮箱注册"标签
3. 使用真实邮箱地址注册
4. 检查邮箱确认邮件
5. 点击确认链接
6. 确认跳转到成功页面
7. 返回登录页面测试登录

## 常见问题排查

### 问题1：确认链接显示"页面无法显示"
**原因**：Site URL配置错误或回调路由不存在
**解决**：检查Supabase中的Site URL设置，确保与你的应用URL一致

### 问题2：点击确认链接后跳转到错误页面
**原因**：确认代码处理失败
**解决**：检查控制台错误信息，确认callback路由正常工作

### 问题3：用户注册成功但无法登录
**原因**：邮箱未确认
**解决**：确保用户点击了确认邮件中的链接

### 问题4：没有收到确认邮件
**原因**：SMTP配置问题或邮件被拦截
**解决**：
- 检查垃圾邮件文件夹
- 在Supabase中检查SMTP配置
- 使用Supabase提供的默认邮件服务

## 生产环境配置

部署到生产环境时，需要更新以下配置：

1. **Supabase Site URL**：更新为生产域名（如：`https://yourapp.com`）
2. **Redirect URLs**：添加生产环境的回调URL
3. **环境变量**：确保生产环境使用正确的Supabase配置

```
生产环境Redirect URLs示例：
https://yourapp.com/auth/callback
https://yourapp.com/auth/confirmed
https://yourapp.com/auth/error
https://yourapp.com/login
```

## 联系支持

如果问题仍然存在，请：
1. 检查Supabase项目状态
2. 查看浏览器控制台错误信息
3. 联系Supabase技术支持
4. 在项目中创建issue报告问题 