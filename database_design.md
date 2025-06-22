# 生活小确幸 - 数据库系统设计文档

## 📊 数据库表结构设计

### 1. 用户扩展信息表 (user_profiles)

存储用户的扩展信息，关联到Supabase的`auth.users`表。

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | UUID | PRIMARY KEY | 主键，对应auth.users.id |
| nickname | VARCHAR(50) | NOT NULL | 用户昵称 |
| total_rewards | DECIMAL(10,2) | DEFAULT 0 | 累计获得打赏金额 |
| post_count | INTEGER | DEFAULT 0 | 发布便签数量 |
| is_verified | BOOLEAN | DEFAULT FALSE | 是否实名认证 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

**索引设计：**
- `nickname` - 支持昵称搜索
- `created_at` - 支持按注册时间排序

### 2. 便签内容主表 (posts)

存储用户发布的小确幸内容。

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 主键 |
| user_id | UUID | NOT NULL REFERENCES auth.users(id) | 用户ID |
| content | TEXT | NOT NULL CHECK (LENGTH(content) <= 500) | 文字内容，限制500字 |
| image_url | TEXT | NULL | 图片文件URL |
| location_data | JSONB | NULL | 位置信息JSON |
| weather_data | JSONB | NULL | 天气信息JSON |
| likes_count | INTEGER | DEFAULT 0 | 点赞数量 |
| comments_count | INTEGER | DEFAULT 0 | 评论数量 |
| rewards_count | INTEGER | DEFAULT 0 | 打赏次数 |
| rewards_amount | DECIMAL(10,2) | DEFAULT 0 | 打赏总金额 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

**索引设计：**
- `user_id` - 查询用户的便签
- `created_at DESC` - 按时间排序
- `(likes_count + rewards_count) DESC` - 热度排序
- `is_deleted` - 软删除查询

### 3. 点赞记录表 (likes)

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 主键 |
| user_id | UUID | NOT NULL REFERENCES auth.users(id) | 点赞用户ID |
| post_id | UUID | NOT NULL REFERENCES posts(id) | 便签ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 点赞时间 |

**唯一约束：**
- `UNIQUE(user_id, post_id)` - 防止重复点赞

**索引设计：**
- `post_id` - 查询便签的点赞记录
- `user_id` - 查询用户的点赞记录

### 4. 评论记录表 (comments)

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 主键 |
| user_id | UUID | NOT NULL REFERENCES auth.users(id) | 评论用户ID |
| post_id | UUID | NOT NULL REFERENCES posts(id) | 便签ID |
| content | TEXT | NOT NULL CHECK (LENGTH(content) <= 200) | 评论内容，限制200字 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 评论时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

**索引设计：**
- `post_id, created_at` - 按时间查询便签评论
- `user_id` - 查询用户的评论记录

### 5. 打赏记录表 (rewards)

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 主键 |
| from_user_id | UUID | NOT NULL REFERENCES auth.users(id) | 打赏用户ID |
| to_user_id | UUID | NOT NULL REFERENCES auth.users(id) | 接收用户ID |
| post_id | UUID | NOT NULL REFERENCES posts(id) | 便签ID |
| amount | DECIMAL(10,2) | NOT NULL DEFAULT 1.00 | 打赏金额，固定1元 |
| payment_method | VARCHAR(20) | NOT NULL | 支付方式：wechat/alipay |
| transaction_id | VARCHAR(100) | NOT NULL | 第三方交易号 |
| status | VARCHAR(20) | DEFAULT 'completed' | 状态：pending/completed/failed |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 打赏时间 |

**唯一约束：**
- `UNIQUE(from_user_id, post_id)` - 每用户对单便签仅可打赏1次

**索引设计：**
- `to_user_id, created_at` - 查询用户收益记录
- `from_user_id` - 查询用户打赏记录
- `post_id` - 查询便签的打赏记录

### 6. 支付账号绑定表 (payment_accounts)

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 主键 |
| user_id | UUID | NOT NULL REFERENCES auth.users(id) | 用户ID |
| payment_type | VARCHAR(20) | NOT NULL | 支付类型：wechat/alipay |
| account_info | JSONB | NOT NULL | 加密的账号信息 |
| real_name | VARCHAR(50) | NOT NULL | 实名信息 |
| is_verified | BOOLEAN | DEFAULT FALSE | 是否验证通过 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 绑定时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

**唯一约束：**
- `UNIQUE(user_id, payment_type)` - 每用户每种支付方式只能绑定一个账号

**索引设计：**
- `user_id, is_active` - 查询用户有效支付账号

## 🗂️ 对象存储设计

### Storage Buckets 配置

#### 1. Images Bucket (`post-images`)
- **用途**：存储用户上传的图片文件
- **访问权限**：Public read, Authenticated write
- **文件大小限制**：5MB
- **支持格式**：JPG, PNG
- **路径结构**：
  ```
  post-images/
  ├── YYYY/MM/DD/           # 按日期分组
  │   ├── {user_id}/        # 按用户分组
  │   │   ├── {uuid}.jpg    # 文件以UUID命名
  │   │   └── {uuid}.png
  ```

#### 2. Audios Bucket (`post-audios`)
- **用途**：存储用户上传的音频文件
- **访问权限**：Public read, Authenticated write
- **文件大小限制**：5MB
- **支持格式**：MP3
- **路径结构**：
  ```
  post-audios/
  ├── YYYY/MM/DD/           # 按日期分组
  │   ├── {user_id}/        # 按用户分组
  │   │   └── {uuid}.mp3    # 文件以UUID命名
  ```

#### 3. Avatars Bucket (`user-avatars`)
- **用途**：存储用户头像
- **访问权限**：Public read, Authenticated write
- **文件大小限制**：2MB
- **支持格式**：JPG, PNG
- **路径结构**：
  ```
  user-avatars/
  ├── {user_id}/            # 按用户分组
  │   └── avatar.{ext}      # 头像文件
  ```

## 📝 PostgreSQL 建表语句

### 1. 用户扩展信息表

```sql
-- 创建用户扩展信息表
CREATE TABLE user_profiles (
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
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
```

### 2. 便签内容主表

```sql
-- 创建便签内容主表
CREATE TABLE posts (
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
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_hotness ON posts((likes_count + rewards_count) DESC);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);

-- 添加更新触发器
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 点赞记录表

```sql
-- 创建点赞记录表
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 创建索引
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

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
```

### 4. 评论记录表

```sql
-- 创建评论记录表
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 200 AND LENGTH(content) > 0),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_comments_post_id_created_at ON comments(post_id, created_at);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);

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
```

### 5. 打赏记录表

```sql
-- 创建打赏记录表
CREATE TABLE rewards (
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
CREATE INDEX idx_rewards_to_user_created_at ON rewards(to_user_id, created_at);
CREATE INDEX idx_rewards_from_user_id ON rewards(from_user_id);
CREATE INDEX idx_rewards_post_id ON rewards(post_id);
CREATE INDEX idx_rewards_transaction_id ON rewards(transaction_id);
CREATE INDEX idx_rewards_status ON rewards(status);

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
```

### 6. 支付账号绑定表

```sql
-- 创建支付账号绑定表
CREATE TABLE payment_accounts (
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
CREATE INDEX idx_payment_accounts_user_active ON payment_accounts(user_id, is_active);
CREATE INDEX idx_payment_accounts_payment_type ON payment_accounts(payment_type);

-- 添加更新触发器
CREATE TRIGGER update_payment_accounts_updated_at
    BEFORE UPDATE ON payment_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 7. 创建 Storage Buckets

```sql
-- 创建存储桶（需要在Supabase Dashboard中执行或使用客户端SDK）
-- 这里提供SQL参考，实际创建建议使用Dashboard

-- 插入storage buckets配置
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg', 'image/png']),
    ('post-audios', 'post-audios', true, 5242880, ARRAY['audio/mpeg']),
    ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png']);
```

### 8. 创建 RLS (Row Level Security) 策略

```sql
-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- user_profiles 策略
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- posts 策略
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

-- likes 策略
CREATE POLICY "Users can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- comments 策略
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
CREATE POLICY "Users can view rewards they gave or received" ON rewards FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "Users can insert own rewards" ON rewards FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- payment_accounts 策略
CREATE POLICY "Users can manage own payment accounts" ON payment_accounts FOR ALL USING (auth.uid() = user_id);
```

## 📋 设计说明

### 🔑 关键设计决策

1. **用户系统**：基于Supabase Auth，通过`user_profiles`表扩展用户信息
2. **软删除**：重要数据采用软删除，保证数据完整性
3. **计数器字段**：通过触发器自动维护计数，提高查询性能
4. **即时发布**：用户发布内容后立即展示，无需审核流程
5. **支付安全**：敏感支付信息加密存储，防重复打赏
6. **地理位置**：使用JSONB存储位置和天气数据，保持灵活性

### 🚀 性能优化

1. **索引策略**：为高频查询字段建立复合索引
2. **分页支持**：按时间和热度排序的索引优化
3. **触发器优化**：自动维护统计数据，减少实时计算
4. **RLS策略**：精准的行级安全策略，保护数据安全

### 🔒 安全考虑

1. **权限控制**：完整的RLS策略，确保数据访问安全
2. **数据验证**：表级约束和检查，防止无效数据
3. **敏感信息**：支付信息加密存储
4. **内容管理**：通过软删除机制管理不当内容

这个数据库设计能够完全支持MVP阶段的所有功能需求，用户发布的内容将立即可见，无需等待审核。 