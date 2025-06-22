import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取用户ID
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 验证token并获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }

    const userId = user.id;

    // 获取用户发布的帖子数量
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    // 获取用户帖子收到的总点赞数
    const { data: userPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    let likesReceived = 0;
    let commentsReceived = 0;
    let rewardsReceived = 0;

    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(post => post.id);

      // 获取总点赞数
      const { count: totalLikes } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);

      // 获取总评论数
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);

      // 获取总打赏数
      const { count: totalRewards } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)
        .eq('status', 'completed');

      likesReceived = totalLikes || 0;
      commentsReceived = totalComments || 0;
      rewardsReceived = totalRewards || 0;
    }

    const stats = {
      postsCount: postsCount || 0,
      likesReceived,
      commentsReceived,
      rewardsReceived,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: '用户统计数据获取成功'
    });

  } catch (error) {
    console.error('获取用户统计失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取用户统计失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 