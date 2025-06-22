import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function DELETE() {
  try {
    // 检查supabaseAdmin是否可用
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: '管理员权限未配置，请设置SUPABASE_SERVICE_ROLE_KEY环境变量'
      }, { status: 500 })
    }

    const results = {
      deletedAuthUsers: 0,
      deletedProfiles: 0,
      deletedPosts: 0,
      deletedLikes: 0,
      deletedComments: 0,
      errors: [] as string[]
    }

    // 获取所有测试用户
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const testUsers = authUsers.users.filter(user => 
      user.email?.includes('test@example.com') || 
      user.email?.includes('test2@example.com')
    )

    // 删除测试数据（按顺序删除，避免外键约束错误）
    for (const user of testUsers) {
      try {
        // 删除评论
        const { error: commentsError } = await supabaseAdmin
          .from('comments')
          .delete()
          .eq('user_id', user.id)
        if (commentsError) throw commentsError

        // 删除点赞
        const { error: likesError } = await supabaseAdmin
          .from('likes')
          .delete()
          .eq('user_id', user.id)
        if (likesError) throw likesError

        // 删除便签
        const { error: postsError } = await supabaseAdmin
          .from('posts')
          .delete()
          .eq('user_id', user.id)
        if (postsError) throw postsError

        // 删除用户配置文件
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .delete()
          .eq('id', user.id)
        if (profileError) throw profileError
        results.deletedProfiles++

        // 删除认证用户
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (authError) throw authError
        results.deletedAuthUsers++

      } catch (error) {
        results.errors.push(`删除用户 ${user.email} 时出错: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    // 获取清理后的统计数据
    const { count: remainingUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    const { count: remainingPosts } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })

    const { count: remainingLikes } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })

    const { count: remainingComments } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? '测试数据清理成功' : '清理过程中有部分错误',
      results,
      remainingCounts: {
        users: remainingUsers || 0,
        posts: remainingPosts || 0,
        likes: remainingLikes || 0,
        comments: remainingComments || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('清理测试数据失败:', error)
    return NextResponse.json({
      success: false,
      message: '清理测试数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 