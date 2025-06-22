import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({
        success: false,
        message: '缺少刷新Token'
      }, { status: 400 })
    }

    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 使用刷新Token获取新的访问Token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Token刷新失败',
        error: error.message
      }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json({
        success: false,
        message: '无法获取新的会话'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    })

  } catch (error) {
    console.error('Token刷新错误:', error)
    return NextResponse.json({
      success: false,
      message: 'Token刷新过程中发生错误'
    }, { status: 500 })
  }
} 