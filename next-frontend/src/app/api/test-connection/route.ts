import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const results = {
      client: { success: false, message: '', data: null as any },
      admin: { success: false, message: '', data: null as any },
      overall: { success: false, message: '' }
    }

    // 测试客户端连接
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (clientError) {
        results.client = { success: false, message: clientError.message, data: null }
      } else {
        results.client = { success: true, message: '客户端连接成功', data: clientData }
      }
    } catch (error) {
      results.client = { success: false, message: `客户端连接失败: ${error}`, data: null }
    }

    // 测试管理员连接
    if (!supabaseAdmin) {
      results.admin = { success: false, message: '管理员客户端未配置（SUPABASE_SERVICE_ROLE_KEY缺失）', data: null }
    } else {
      try {
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('user_profiles')
          .select('count')
          .limit(1)
        
        if (adminError) {
          results.admin = { success: false, message: adminError.message, data: null }
        } else {
          results.admin = { success: true, message: '管理员连接成功', data: adminData }
        }
      } catch (error) {
        results.admin = { success: false, message: `管理员连接失败: ${error}`, data: null }
      }
    }

    // 获取表统计信息
    let stats = null
    if (supabaseAdmin) {
      try {
        const [userCount, postCount, likeCount, commentCount] = await Promise.all([
          supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('likes').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('comments').select('*', { count: 'exact', head: true })
        ])

        stats = {
          users: userCount.count || 0,
          posts: postCount.count || 0,
          likes: likeCount.count || 0,
          comments: commentCount.count || 0
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
        stats = { users: 0, posts: 0, likes: 0, comments: 0 }
      }
    }

    // 设置整体状态
    results.overall = {
      success: results.client.success && results.admin.success,
      message: results.client.success && results.admin.success 
        ? '所有连接正常' 
        : '部分连接存在问题'
    }

    return NextResponse.json({
      success: true,
      message: '数据库连接测试完成',
      results,
      client_connection: results.client.success ? '正常' : results.client.message,
      admin_connection: results.admin.success ? '正常' : results.admin.message,
      table_stats: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('连接测试失败:', error)
    return NextResponse.json({
      success: false,
      message: '连接测试过程中发生错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 