import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    message: '环境变量测试',
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '未设置',
    key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '未设置',
    timestamp: new Date().toISOString()
  })
} 