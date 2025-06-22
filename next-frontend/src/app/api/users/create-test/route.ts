import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function POST() {
  try {
    // 检查supabaseAdmin是否可用
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: '管理员权限未配置，请设置SUPABASE_SERVICE_ROLE_KEY环境变量'
      }, { status: 500 })
    }

    // 创建一个测试用户配置文件
    const testUserId = '550e8400-e29b-41d4-a716-446655440000' // 测试UUID
    
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: testUserId,
        nickname: '测试用户小明',
        bio: '这是一个测试用户的简介',
        total_rewards: 0,
        post_count: 0,
        is_verified: false
      })
      .select()
      .single()

    if (error) {
      console.error('创建测试用户失败:', error)
      return NextResponse.json({
        success: false,
        message: '创建测试用户失败',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '测试用户创建成功',
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('创建测试用户异常:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 