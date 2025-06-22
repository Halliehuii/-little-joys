import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: '邮箱和密码不能为空'
      }, { status: 400 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 尝试注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: '注册失败',
        error: error.message,
        code: error.status || 500
      })
    }
    
    return NextResponse.json({
      success: true,
      message: '注册成功！',
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        confirmed: !!data.user.email_confirmed_at
      } : null,
      session: data.session ? '已创建会话' : '待邮箱确认'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '注册过程出错',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 