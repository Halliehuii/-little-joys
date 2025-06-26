-- ================================
-- 生活小确幸 - 简化数据库初始化脚本
-- 在Supabase SQL编辑器中执行此脚本
-- ================================

-- 创建更新时间函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================
-- 1. 用户扩展信息表
-- ================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    total_rewards DECIMAL(10,2) DEFAULT 0 CHECK (total_rewards >= 0),
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建用户注册后自动创建profile的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, nickname)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'User_' || substr(NEW.id::text, 1, 8)))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ================================
-- 2. 便签内容主表
-- ================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 500 AND LENGTH(content) > 0),
    image_url TEXT,
    audio_url TEXT,
    location_data JSONB,
    weather_data JSONB,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
    rewards_count INTEGER DEFAULT 0 CHECK (rewards_count >= 0),
    rewards_amount DECIMAL(10,2) DEFAULT 0 CHECK (rewards_amount >= 0),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hotness ON posts((likes_count + rewards_count) DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);

-- 添加更新触发器
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 3. 点赞记录表
-- ================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);

-- 创建点赞数量自动更新触发器
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_likes_count_trigger ON likes;
CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- ================================
-- 4. 评论记录表
-- ================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 200 AND LENGTH(content) > 0),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- 添加更新触发器
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建评论数量自动更新触发器
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 软删除时减少计数
        IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
            UPDATE posts SET comments_count = comments_count - 1 WHERE id = NEW.post_id;
        ELSIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_count_trigger ON comments;
CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- ================================
-- 完成提示
-- ================================
DO $$
BEGIN
    RAISE NOTICE '✅ 数据库初始化完成！';
    RAISE NOTICE '📊 已创建表：user_profiles, posts, likes, comments';
    RAISE NOTICE '🔧 已创建所有必要的触发器和索引';
    RAISE NOTICE '🚀 现在可以正常使用应用了！';
END $$; 