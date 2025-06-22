import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET() {
  try {
    // 检查supabaseAdmin是否可用
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: '管理员权限未配置，请设置SUPABASE_SERVICE_ROLE_KEY环境变量'
      }, { status: 500 })
    }

    // 查询认证用户表
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('查询认证用户失败:', authError)
      return NextResponse.json({
        success: false,
        message: '查询认证用户失败',
        error: authError.message
      }, { status: 500 })
    }

    // 查询用户配置文件表
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
    
    return NextResponse.json({
      success: true,
      message: '查询用户成功',
      authUsers: authUsers.users || [],
      authUsersCount: authUsers.users?.length || 0,
      profiles: profiles || [],
      profilesCount: profiles?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('查询用户异常:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 