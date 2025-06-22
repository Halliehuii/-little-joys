import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 测试基本连接
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Supabase连接失败',
        error: error.message,
        url: supabaseUrl,
        keyPrefix: supabaseKey.substring(0, 20) + '...'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase连接成功',
      url: supabaseUrl,
      keyPrefix: supabaseKey.substring(0, 20) + '...',
      session: data.session ? '已登录' : '未登录',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '连接测试异常',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 