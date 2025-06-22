import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function POST() {
  try {
    // 检查supabaseAdmin是否可用
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: '管理员权限未配置，请设置SUPABASE_SERVICE_ROLE_KEY环境变量'
      }, { status: 500 })
    }

    const results = {
      step1_createUser: null as any,
      step2_createProfile: null as any,
      step3_createPost: null as any,
      step4_createLike: null as any,
      step5_createComment: null as any,
      step6_finalStats: null as any,
      errors: [] as string[]
    }

    // 第1步：创建测试用户（模拟注册）
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'test@example.com',
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          nickname: '测试用户小王'
        }
      })

      if (authError) throw authError
      results.step1_createUser = { success: true, userId: authUser.user.id }

      // 第2步：用户配置文件应该由触发器自动创建，我们验证一下
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待触发器执行

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single()

      if (profileError) {
        // 如果触发器没有创建，我们手动创建
        const { data: newProfile, error: createProfileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: authUser.user.id,
            nickname: '测试用户小王',
            bio: '这是一个完整测试流程中的用户',
            total_rewards: 0,
            post_count: 0,
            is_verified: false
          })
          .select()
          .single()

        if (createProfileError) throw createProfileError
        results.step2_createProfile = { success: true, profile: newProfile }
      } else {
        results.step2_createProfile = { success: true, profile }
      }

      // 第3步：创建测试便签
      const { data: post, error: postError } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: authUser.user.id,
          content: '这是我的第一个小确幸便签！今天阳光很好，心情也很棒！ 🌞',
          location_data: {
            city: '北京市',
            district: '朝阳区',
            latitude: 39.9042,
            longitude: 116.4074
          },
          weather_data: {
            temperature: 22,
            weather: '晴天',
            humidity: 45
          }
        })
        .select()
        .single()

      if (postError) throw postError
      results.step3_createPost = { success: true, post }

      // 第4步：创建第二个用户来点赞
      const { data: authUser2, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
        email: 'test2@example.com',
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          nickname: '测试用户小李'
        }
      })

      if (authError2) throw authError2

      // 为第二个用户创建配置文件
      await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUser2.user.id,
          nickname: '测试用户小李',
          bio: '我是来点赞的用户',
          total_rewards: 0,
          post_count: 0,
          is_verified: false
        })

      // 点赞
      const { data: like, error: likeError } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: authUser2.user.id,
          post_id: post.id
        })
        .select()
        .single()

      if (likeError) throw likeError
      results.step4_createLike = { success: true, like }

      // 第5步：创建评论
      const { data: comment, error: commentError } = await supabaseAdmin
        .from('comments')
        .insert({
          user_id: authUser2.user.id,
          post_id: post.id,
          content: '真是太棒了！我也有同样的感受！'
        })
        .select()
        .single()

      if (commentError) throw commentError
      results.step5_createComment = { success: true, comment }

      // 第6步：获取最终统计数据
      const { data: finalStats } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          user_profiles!posts_user_id_fkey (nickname, bio),
          likes (id, user_id),
          comments (id, content, user_profiles!comments_user_id_fkey (nickname))
        `)
        .eq('id', post.id)
        .single()

      const { data: allUsers } = await supabaseAdmin
        .from('user_profiles')
        .select('*')

      const { count: totalPosts } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })

      const { count: totalLikes } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })

      const { count: totalComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })

      results.step6_finalStats = {
        success: true,
        postWithRelations: finalStats,
        allUsers,
        totalStats: {
          users: allUsers?.length || 0,
          posts: totalPosts || 0,
          likes: totalLikes || 0,
          comments: totalComments || 0
        }
      }

    } catch (error) {
      results.errors.push(`流程执行错误: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? '完整测试流程执行成功！' : '测试流程有部分错误',
      results,
      summary: {
        stepsCompleted: Object.values(results).filter(v => v && typeof v === 'object' && v.success).length,
        totalSteps: 6,
        hasErrors: results.errors.length > 0,
        errorCount: results.errors.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('完整测试流程失败:', error)
    return NextResponse.json({
      success: false,
      message: '测试流程执行失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 