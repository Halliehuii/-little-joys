import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'

// 获取用户配置文件
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: '缺少用户ID参数'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('获取用户信息失败:', error)
      return NextResponse.json({
        success: false,
        message: '获取用户信息失败',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: '获取用户信息成功'
    })

  } catch (error) {
    console.error('获取用户信息异常:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 更新用户配置文件
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, nickname, bio, avatar_url } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: '缺少用户ID'
      }, { status: 400 })
    }

    const updateData: any = {}
    if (nickname) updateData.nickname = nickname
    if (bio !== undefined) updateData.bio = bio
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户信息失败:', error)
      return NextResponse.json({
        success: false,
        message: '更新用户信息失败',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: '更新用户信息成功'
    })

  } catch (error) {
    console.error('更新用户信息异常:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 