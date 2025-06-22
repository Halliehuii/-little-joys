// 本地认证系统 - 临时解决方案
// 用于网络连接问题时的离线使用

interface LocalUser {
  id: string
  email: string
  nickname: string
  created_at: string
}

interface LocalAuthResult {
  success: boolean
  error?: string
  user?: LocalUser
}

// 本地用户存储键
const LOCAL_USERS_KEY = 'local_users'
const LOCAL_CURRENT_USER_KEY = 'local_current_user'
const LOCAL_TOKEN_KEY = 'local_auth_token'

// 获取本地用户列表
const getLocalUsers = (): LocalUser[] => {
  if (typeof window === 'undefined') return []
  const users = localStorage.getItem(LOCAL_USERS_KEY)
  return users ? JSON.parse(users) : []
}

// 保存本地用户列表
const saveLocalUsers = (users: LocalUser[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

// 生成简单的用户ID
const generateUserId = () => {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 生成简单的token
const generateToken = (userId: string) => {
  return btoa(`${userId}:${Date.now()}:local_auth`)
}

// 本地登录
export const signInLocal = async (email: string, password: string): Promise<LocalAuthResult> => {
  try {
    const users = getLocalUsers()
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return { success: false, error: '用户不存在，请先注册' }
    }
    
    // 简单的密码验证（实际应用中应该使用哈希）
    const storedPassword = localStorage.getItem(`local_password_${user.id}`)
    if (storedPassword !== password) {
      return { success: false, error: '密码错误' }
    }
    
    // 生成token并保存登录状态
    const token = generateToken(user.id)
    localStorage.setItem(LOCAL_TOKEN_KEY, token)
    localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(user))
    
    return { success: true, user }
  } catch (error) {
    return { success: false, error: '登录过程中发生错误' }
  }
}

// 本地注册
export const signUpLocal = async (email: string, password: string, nickname?: string): Promise<LocalAuthResult> => {
  try {
    const users = getLocalUsers()
    
    // 检查邮箱是否已存在
    if (users.find(u => u.email === email)) {
      return { success: false, error: '该邮箱已被注册' }
    }
    
    // 创建新用户
    const newUser: LocalUser = {
      id: generateUserId(),
      email,
      nickname: nickname || email.split('@')[0],
      created_at: new Date().toISOString()
    }
    
    // 保存用户信息和密码
    users.push(newUser)
    saveLocalUsers(users)
    localStorage.setItem(`local_password_${newUser.id}`, password)
    
    return { success: true, user: newUser }
  } catch (error) {
    return { success: false, error: '注册过程中发生错误' }
  }
}

// 本地登出
export const signOutLocal = async () => {
  try {
    localStorage.removeItem(LOCAL_TOKEN_KEY)
    localStorage.removeItem(LOCAL_CURRENT_USER_KEY)
    return { success: true }
  } catch (error) {
    return { success: false, error: '登出过程中发生错误' }
  }
}

// 获取当前本地用户
export const getCurrentUserLocal = (): LocalUser | null => {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem(LOCAL_CURRENT_USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

// 获取本地token
export const getCurrentUserTokenLocal = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LOCAL_TOKEN_KEY)
}

// 检查本地认证状态
export const isAuthenticatedLocal = (): boolean => {
  const token = getCurrentUserTokenLocal()
  const user = getCurrentUserLocal()
  return !!(token && user)
}

// 创建默认测试用户
export const createTestUser = () => {
  const users = getLocalUsers()
  const testEmail = 'test@example.com'
  
  if (!users.find(u => u.email === testEmail)) {
    const testUser: LocalUser = {
      id: generateUserId(),
      email: testEmail,
      nickname: '测试用户',
      created_at: new Date().toISOString()
    }
    
    users.push(testUser)
    saveLocalUsers(users)
    localStorage.setItem(`local_password_${testUser.id}`, '123456')
    
    console.log('已创建测试用户：')
    console.log('邮箱：test@example.com')
    console.log('密码：123456')
  }
} 