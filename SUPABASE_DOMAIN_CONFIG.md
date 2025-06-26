# 🌐 Supabase 域名配置指南

## 🎯 配置目标
确保你的网站 `littlejoys.xyz` 可以正常使用邮箱注册和认证功能。

## 📋 必须配置的 Supabase 设置

### 1. 登录 Supabase 控制台
1. 访问 [https://supabase.com](https://supabase.com)
2. 登录你的账号
3. 选择你的项目

### 2. 配置认证 URLs

#### 进入 URL 配置页面
1. 点击左侧菜单的 **Authentication**
2. 点击 **URL Configuration** 标签

#### 设置 Site URL
```
Site URL: https://littlejoys.xyz
```

#### 设置 Redirect URLs
在 "Redirect URLs" 部分添加以下URLs（每行一个）：
```
https://littlejoys.xyz/auth/callback
https://littlejoys.xyz/auth/confirmed
https://littlejoys.xyz/auth/error
https://littlejoys.xyz/login
https://www.littlejoys.xyz/auth/callback
https://www.littlejoys.xyz/auth/confirmed
https://www.littlejoys.xyz/auth/error
https://www.littlejoys.xyz/login
http://localhost:3000/**
```

> 💡 **说明**: 
> - 生产环境URLs确保线上功能正常
> - localhost URLs允许本地开发测试
> - `**` 通配符匹配所有localhost路径

### 3. 检查邮件模板（重要）

#### 确认邮件模板配置
1. 在 Supabase 控制台，点击 **Authentication > Email Templates**
2. 选择 **Confirm signup** 模板
3. 确保邮件中的确认链接使用正确格式：

**正确的邮件模板链接**:
```html
<a href="{{ .RedirectTo }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">
  确认你的邮箱
</a>
```

**或者使用 SiteURL**:
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">
  确认你的邮箱
</a>
```

### 4. 环境变量检查

#### 确保生产环境变量正确
在 Zeabur 前端项目的环境变量中确认：
```env
NEXT_PUBLIC_SUPABASE_URL=https://mgicejesamlzjgvnlphy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
NEXT_PUBLIC_API_URL=https://api.littlejoys.xyz
```

#### 确保后端 CORS 配置
在 Zeabur 后端项目的环境变量中确认：
```env
CORS_ALLOWED_ORIGINS=https://littlejoys.xyz,https://www.littlejoys.xyz
```

## 🧪 测试步骤

### 自动测试
1. 访问: `https://littlejoys.xyz/test-auth-flow`
2. 运行完整测试
3. 检查所有步骤是否通过

### 手动测试
1. 访问: `https://littlejoys.xyz/login`
2. 使用真实邮箱注册新账户
3. 检查邮箱确认邮件
4. 点击确认链接
5. 确认跳转到 `https://littlejoys.xyz/auth/confirmed`
6. 尝试登录确认功能正常

## ⚠️ 常见问题

### 问题1: 点击邮件链接跳转到 localhost
**原因**: Supabase 的 Redirect URLs 配置不正确
**解决**: 确保在 Redirect URLs 中添加了生产域名

### 问题2: 邮件确认链接显示 "Invalid link"
**原因**: Site URL 与实际域名不匹配
**解决**: 确保 Site URL 设置为 `https://littlejoys.xyz`

### 问题3: CORS 错误
**原因**: 后端未允许前端域名访问
**解决**: 检查后端 CORS_ALLOWED_ORIGINS 配置

## 🚀 配置完成确认

完成所有配置后，你的网站应该能够：
- ✅ 通过域名 `https://littlejoys.xyz` 正常访问
- ✅ 用户可以注册新账户
- ✅ 邮箱确认链接正确指向你的域名
- ✅ 用户可以成功登录
- ✅ 前后端 API 调用正常工作

## 🔧 下一步操作

1. **立即配置**: 按照以上步骤配置 Supabase
2. **重新部署**: 如果修改了环境变量，重新部署前后端应用
3. **测试验证**: 使用真实邮箱进行完整测试
4. **DNS 检查**: 确认域名解析正确指向 Zeabur 服务器

> 💡 **提示**: 配置完成后，通常需要等待几分钟让设置生效。如果仍有问题，请检查 Zeabur 的部署日志。 