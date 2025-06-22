import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 环境变量检查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 验证必需的环境变量
if (!supabaseUrl) {
  console.warn('⚠️ 缺少 NEXT_PUBLIC_SUPABASE_URL 环境变量')
}

if (!supabaseAnonKey) {
  console.warn('⚠️ 缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量')
}

// 创建一个安全的 Supabase 客户端
let supabase: any = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    // 客户端 Supabase 实例（用于浏览器）
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    console.log('✅ Supabase 客户端初始化成功')
  } else {
    console.warn('⚠️ Supabase 环境变量不完整，使用模拟客户端')
    // 创建一个模拟的 Supabase 客户端
    supabase = {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase 未配置' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase 未配置' } }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: { message: 'Supabase 未配置' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase 未配置' } }),
        update: () => ({ data: null, error: { message: 'Supabase 未配置' } }),
        delete: () => ({ data: null, error: { message: 'Supabase 未配置' } })
      })
    }
  }
} catch (error) {
  console.error('❌ Supabase 客户端初始化失败:', error)
  // 提供一个基本的模拟客户端
  supabase = {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase 初始化失败' } }),
      signUp: async () => ({ data: null, error: { message: 'Supabase 初始化失败' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: { message: 'Supabase 初始化失败' } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
}

export { supabase }

// 服务端 Supabase 实例（用于API路由，具有更高权限）
export const supabaseAdmin = supabaseServiceKey && supabaseUrl
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// 测试数据库连接的函数
export async function testConnection() {
  try {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) {
      return { success: false, message: 'Supabase 未正确配置' }
    }
    
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    if (error) throw error
    return { success: true, message: '数据库连接成功' }
  } catch (error) {
    console.error('数据库连接失败:', error)
    return { success: false, message: '数据库连接失败', error }
  }
}

// 数据库类型定义
export interface UserProfile {
  id: string
  nickname: string
  avatar_url?: string
  bio?: string
  total_rewards: number
  post_count: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  audio_url?: string
  location_data?: any
  weather_data?: any
  likes_count: number
  comments_count: number
  rewards_count: number
  rewards_amount: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
  is_liked?: boolean
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Reward {
  id: string
  from_user_id: string
  to_user_id: string
  post_id: string
  amount: number
  payment_method: 'wechat' | 'alipay'
  transaction_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface PaymentAccount {
  id: string
  user_id: string
  payment_type: 'wechat' | 'alipay'
  account_info: any
  real_name: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
} 