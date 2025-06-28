// 用户信息工具模块
import { supabase } from './supabase'

// 用户信息缓存，避免重复请求
const userCache = new Map<string, UserProfileInfo>()

export interface UserProfileInfo {
  id: string
  nickname: string
  avatar_url?: string
  bio?: string
  created_at: string
}

/**
 * 获取用户的真实昵称和信息
 * @param userId 用户ID
 * @returns 用户信息，如果获取失败返回默认信息
 */
export const getUserProfile = async (userId: string): Promise<UserProfileInfo> => {
  // 检查缓存
  if (userCache.has(userId)) {
    return userCache.get(userId)!
  }

  try {
    // 从数据库获取用户配置文件
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, nickname, avatar_url, bio, created_at')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.warn('获取用户配置文件失败:', error)
      // 返回默认信息
      const defaultProfile: UserProfileInfo = {
        id: userId,
        nickname: '用户',
        created_at: new Date().toISOString()
      }
      return defaultProfile
    }

    // 缓存结果
    const userProfile: UserProfileInfo = {
      id: data.id,
      nickname: data.nickname || '用户',
      avatar_url: data.avatar_url,
      bio: data.bio,
      created_at: data.created_at
    }
    
    userCache.set(userId, userProfile)
    return userProfile

  } catch (error) {
    console.error('获取用户信息异常:', error)
    // 返回默认信息
    return {
      id: userId,
      nickname: '用户',
      created_at: new Date().toISOString()
    }
  }
}

/**
 * 批量获取多个用户的信息
 * @param userIds 用户ID数组
 * @returns 用户信息映射表
 */
export const getUserProfiles = async (userIds: string[]): Promise<Map<string, UserProfileInfo>> => {
  const result = new Map<string, UserProfileInfo>()
  const uncachedIds: string[] = []

  // 检查缓存
  for (const userId of userIds) {
    if (userCache.has(userId)) {
      result.set(userId, userCache.get(userId)!)
    } else {
      uncachedIds.push(userId)
    }
  }

  // 批量获取未缓存的用户信息
  if (uncachedIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, nickname, avatar_url, bio, created_at')
        .in('id', uncachedIds)

      if (error) {
        console.warn('批量获取用户配置文件失败:', error)
      } else if (data) {
        // 处理获取到的数据
        for (const profile of data) {
          const userProfile: UserProfileInfo = {
            id: profile.id,
            nickname: profile.nickname || '用户',
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            created_at: profile.created_at
          }
          
          userCache.set(profile.id, userProfile)
          result.set(profile.id, userProfile)
        }
      }

      // 为没有找到配置文件的用户创建默认信息
      for (const userId of uncachedIds) {
        if (!result.has(userId)) {
          const defaultProfile: UserProfileInfo = {
            id: userId,
            nickname: '用户',
            created_at: new Date().toISOString()
          }
          result.set(userId, defaultProfile)
        }
      }

    } catch (error) {
      console.error('批量获取用户信息异常:', error)
      // 为所有未缓存的用户创建默认信息
      for (const userId of uncachedIds) {
        const defaultProfile: UserProfileInfo = {
          id: userId,
          nickname: '用户',
          created_at: new Date().toISOString()
        }
        result.set(userId, defaultProfile)
      }
    }
  }

  return result
}

/**
 * 清除用户信息缓存
 * @param userId 可选，指定用户ID清除单个用户缓存，不传则清除所有缓存
 */
export const clearUserCache = (userId?: string) => {
  if (userId) {
    userCache.delete(userId)
  } else {
    userCache.clear()
  }
}

/**
 * 获取当前登录用户的昵称
 * 优先从 user_profiles 表获取，如果没有则使用 user_metadata 中的昵称
 */
export const getCurrentUserNickname = async (): Promise<string> => {
  try {
    // 获取当前用户
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return '用户'
    }

    // 尝试从 user_profiles 表获取昵称
    const userProfile = await getUserProfile(user.id)
    if (userProfile.nickname && userProfile.nickname !== '用户') {
      return userProfile.nickname
    }

    // 如果 user_profiles 中没有，尝试从 user_metadata 获取
    const metaNickname = user.user_metadata?.nickname
    if (metaNickname) {
      return metaNickname
    }

    // 最后使用邮箱前缀
    if (user.email) {
      return user.email.split('@')[0]
    }

    return '用户'
  } catch (error) {
    console.error('获取当前用户昵称失败:', error)
    return '用户'
  }
} 