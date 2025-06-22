import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // 使用service role密钥创建管理员客户端
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // 检查user_profiles表是否存在
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.message.includes('relation "public.user_profiles" does not exist')) {
      return NextResponse.json({
        success: false,
        message: 'user_profiles表不存在',
        needToCreateTables: true,
        error: tableError.message,
        solution: '请在Supabase SQL编辑器中执行数据库建表语句'
      })
    }
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        message: '检查表时发生错误',
        error: tableError.message,
        code: tableError.code
      })
    }
    
    // 如果能执行到这里，说明表存在且连接正常
    const { count, error: countError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      message: '数据库连接和表检查成功',
      tableExists: true,
      userProfilesCount: count || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('表检查失败:', error)
    return NextResponse.json({
      success: false,
      message: '表检查异常',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 