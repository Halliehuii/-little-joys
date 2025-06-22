import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      clientConnection: { success: false, message: '', details: null as any },
      adminConnection: { success: false, message: '', details: null as any },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      summary: { success: false, message: '' }
    }

    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: false,
        message: '缺少NEXT_PUBLIC_SUPABASE_URL环境变量',
        diagnostics
      }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        message: '缺少NEXT_PUBLIC_SUPABASE_ANON_KEY环境变量',
        diagnostics
      }, { status: 500 })
    }

    // 测试客户端连接
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)

      if (clientError) {
        diagnostics.clientConnection = {
          success: false,
          message: `客户端连接失败: ${clientError.message}`,
          details: clientError
        }
      } else {
        diagnostics.clientConnection = {
          success: true,
          message: '客户端连接成功',
          details: clientData
        }
      }
    } catch (error) {
      diagnostics.clientConnection = {
        success: false,
        message: `客户端连接异常: ${error instanceof Error ? error.message : '未知错误'}`,
        details: error
      }
    }

    // 测试管理员连接
    if (!supabaseAdmin) {
      diagnostics.adminConnection = {
        success: false,
        message: 'supabaseAdmin未初始化，请检查SUPABASE_SERVICE_ROLE_KEY',
        details: null
      }
    } else {
      try {
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('user_profiles')
          .select('count')
          .limit(1)

        if (adminError) {
          diagnostics.adminConnection = {
            success: false,
            message: `管理员连接失败: ${adminError.message}`,
            details: adminError
          }
        } else {
          diagnostics.adminConnection = {
            success: true,
            message: '管理员连接成功',
            details: adminData
          }
        }
      } catch (error) {
        diagnostics.adminConnection = {
          success: false,
          message: `管理员连接异常: ${error instanceof Error ? error.message : '未知错误'}`,
          details: error
        }
      }
    }

    // 生成总结
    const clientOk = diagnostics.clientConnection.success
    const adminOk = diagnostics.adminConnection.success

    if (clientOk && adminOk) {
      diagnostics.summary = {
        success: true,
        message: '所有Supabase连接正常'
      }
    } else if (clientOk) {
      diagnostics.summary = {
        success: false,
        message: '客户端连接正常，但管理员连接有问题'
      }
    } else {
      diagnostics.summary = {
        success: false,
        message: 'Supabase连接存在问题'
      }
    }

    return NextResponse.json({
      success: diagnostics.summary.success,
      message: diagnostics.summary.message,
      diagnostics
    })

  } catch (error) {
    console.error('Supabase诊断失败:', error)
    return NextResponse.json({
      success: false,
      message: 'Supabase诊断过程中发生错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 