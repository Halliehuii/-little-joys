import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '未配置',
        supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '未配置',
        supabaseServiceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 30)}...` : '未配置',
        nodeEnv: process.env.NODE_ENV,
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 