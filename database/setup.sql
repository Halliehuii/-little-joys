-- ================================
-- 生活小确幸 - 数据库初始化脚本
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
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建用户注册后自动创建profile的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, nickname)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'User_' || substr(NEW.id::text, 1, 8)));
    RETURN NEW;
END;
$$ language 'plpgsql';

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

CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- ================================
-- 5. 打赏记录表
-- ================================
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 1.00 CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('wechat', 'alipay')),
    transaction_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, post_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rewards_to_user_created_at ON rewards(to_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rewards_from_user_id ON rewards(from_user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_post_id ON rewards(post_id);
CREATE INDEX IF NOT EXISTS idx_rewards_transaction_id ON rewards(transaction_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);

-- 创建打赏数量和金额自动更新触发器
CREATE OR REPLACE FUNCTION update_post_rewards_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE posts SET 
            rewards_count = rewards_count + 1,
            rewards_amount = rewards_amount + NEW.amount
        WHERE id = NEW.post_id;
        
        UPDATE user_profiles SET 
            total_rewards = total_rewards + NEW.amount
        WHERE id = NEW.to_user_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 状态变更处理
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            UPDATE posts SET 
                rewards_count = rewards_count + 1,
                rewards_amount = rewards_amount + NEW.amount
            WHERE id = NEW.post_id;
            
            UPDATE user_profiles SET 
                total_rewards = total_rewards + NEW.amount
            WHERE id = NEW.to_user_id;
        ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            UPDATE posts SET 
                rewards_count = rewards_count - 1,
                rewards_amount = rewards_amount - OLD.amount
            WHERE id = OLD.post_id;
            
            UPDATE user_profiles SET 
                total_rewards = total_rewards - OLD.amount
            WHERE id = OLD.to_user_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rewards_stats_trigger
    AFTER INSERT OR UPDATE ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_post_rewards_stats();

-- ================================
-- 6. 支付账号绑定表
-- ================================
CREATE TABLE IF NOT EXISTS payment_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('wechat', 'alipay')),
    account_info JSONB NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, payment_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_accounts_user_active ON payment_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_payment_type ON payment_accounts(payment_type);

-- 添加更新触发器
CREATE TRIGGER update_payment_accounts_updated_at
    BEFORE UPDATE ON payment_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 7. 启用RLS (Row Level Security)
-- ================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- user_profiles 策略
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- posts 策略
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

-- likes 策略
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- comments 策略
DROP POLICY IF EXISTS "Users can view comments on posts" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can view comments on posts" ON comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = comments.post_id 
        AND posts.is_deleted = false
    )
);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- rewards 策略
DROP POLICY IF EXISTS "Users can view rewards they gave or received" ON rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON rewards;
CREATE POLICY "Users can view rewards they gave or received" ON rewards FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "Users can insert own rewards" ON rewards FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- payment_accounts 策略
DROP POLICY IF EXISTS "Users can manage own payment accounts" ON payment_accounts;
CREATE POLICY "Users can manage own payment accounts" ON payment_accounts FOR ALL USING (auth.uid() = user_id);

-- ================================
-- 完成提示
-- ================================
SELECT 'Database setup completed successfully!' as status; 