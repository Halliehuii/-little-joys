import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// 强制动态渲染，避免静态生成问题
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    // 如果有错误参数，直接重定向到错误页面
    if (error) {
      console.error('邮箱确认错误:', error, errorDescription)
      const errorUrl = new URL('/auth/error', requestUrl.origin)
      errorUrl.searchParams.set('error', error)
      errorUrl.searchParams.set('description', errorDescription || '邮箱确认失败')
      return NextResponse.redirect(errorUrl)
    }

    // 如果没有code参数，重定向到登录页面
    if (!code) {
      console.error('缺少确认代码')
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('message', '邮箱确认链接无效')
      return NextResponse.redirect(loginUrl)
    }

    // 创建Supabase客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

    // 使用code换取session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('代码交换失败:', exchangeError)
      const errorUrl = new URL('/auth/error', requestUrl.origin)
      errorUrl.searchParams.set('error', 'exchange_failed')
      errorUrl.searchParams.set('description', '邮箱确认失败：' + exchangeError.message)
      return NextResponse.redirect(errorUrl)
    }

    if (!data.session) {
      console.error('未获取到会话')
      const errorUrl = new URL('/auth/error', requestUrl.origin)
      errorUrl.searchParams.set('error', 'no_session')
      errorUrl.searchParams.set('description', '邮箱确认失败：未能创建会话')
      return NextResponse.redirect(errorUrl)
    }

    // 确认成功，重定向到成功页面
    console.log('邮箱确认成功:', data.user?.email)
    const successUrl = new URL('/auth/confirmed', requestUrl.origin)
    successUrl.searchParams.set('email', data.user?.email || '')
    
    // 设置session cookie（可选，因为前端会自动处理）
    const response = NextResponse.redirect(successUrl)
    
    return response

  } catch (error) {
    console.error('邮箱确认处理异常:', error)
    const requestUrl = new URL(request.url)
    const errorUrl = new URL('/auth/error', requestUrl.origin)
    errorUrl.searchParams.set('error', 'unexpected_error')
    errorUrl.searchParams.set('description', '邮箱确认过程中发生意外错误')
    return NextResponse.redirect(errorUrl)
  }
} 