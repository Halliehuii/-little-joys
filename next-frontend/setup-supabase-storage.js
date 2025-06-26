const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 手动读取.env.local文件
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (key && value) {
          process.env[key] = value
        }
      }
    })
  }
}

async function setupSupabaseStorage() {
  try {
    console.log('🚀 开始设置Supabase Storage buckets...')
    
    // 加载环境变量
    loadEnvFile()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ 缺少NEXT_PUBLIC_SUPABASE_URL环境变量')
      process.exit(1)
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ 缺少NEXT_PUBLIC_SUPABASE_ANON_KEY环境变量')
      process.exit(1)
    }
    
    // 创建Supabase管理员客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 定义需要创建的buckets
    const buckets = [
      {
        id: 'post-images',
        name: 'post-images',
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
      },
      {
        id: 'post-audios',
        name: 'post-audios', 
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3']
      },
      {
        id: 'user-avatars',
        name: 'user-avatars',
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
      }
    ]

    // 检查和创建buckets
    for (const bucketConfig of buckets) {
      console.log(`📦 检查bucket: ${bucketConfig.id}`)
      
      // 先尝试获取bucket
      const { data: existingBucket, error: getError } = await supabase.storage.getBucket(bucketConfig.id)
      
      if (existingBucket) {
        console.log(`✅ Bucket "${bucketConfig.id}" 已存在`)
        continue
      }

      // 如果bucket不存在，创建它
      console.log(`🔨 正在创建bucket: ${bucketConfig.id}`)
      const { data, error } = await supabase.storage.createBucket(bucketConfig.id, {
        public: bucketConfig.public,
        fileSizeLimit: bucketConfig.fileSizeLimit,
        allowedMimeTypes: bucketConfig.allowedMimeTypes
      })

      if (error) {
        console.error(`❌ 创建bucket "${bucketConfig.id}" 失败:`, error.message)
      } else {
        console.log(`✅ 成功创建bucket: ${bucketConfig.id}`)
      }
    }

    // 设置存储策略（RLS policies）
    console.log('🔐 设置存储安全策略...')
    
    // 这些策略需要在Supabase Dashboard的SQL编辑器中手动执行
    const policies = `
-- 允许认证用户上传文件
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允许所有人查看公共文件
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('post-images', 'post-audios', 'user-avatars'));

-- 允许用户删除自己的文件
CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
`

    console.log('📋 请在Supabase Dashboard的SQL编辑器中执行以下策略:')
    console.log(policies)

    console.log('🎉 Supabase Storage设置完成!')
    console.log('\n📝 下一步:')
    console.log('1. 登录Supabase Dashboard')
    console.log('2. 进入SQL编辑器')
    console.log('3. 执行上面显示的安全策略SQL')
    console.log('4. 确保在Storage页面中看到创建的buckets')

  } catch (error) {
    console.error('❌ 设置过程中出错:', error.message)
    process.exit(1)
  }
}

// 运行设置
setupSupabaseStorage() 