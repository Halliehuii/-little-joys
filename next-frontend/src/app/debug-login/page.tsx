'use client';

import { useState } from 'react';

export default function DebugLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[调试] ${message}`);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleTestConnection = async () => {
    addLog('🔍 开始测试 Supabase 连接...');
    try {
      // 检查环境变量
      addLog('📋 检查环境变量...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      addLog(`📍 Supabase URL: ${supabaseUrl || '未设置'}`);
      addLog(`🔑 Supabase Key: ${supabaseKey ? '已设置 (长度: ' + supabaseKey.length + ')' : '未设置'}`);
      
      if (!supabaseUrl || !supabaseKey) {
        addLog('❌ 环境变量缺失！');
        return;
      }

      // 动态导入 Supabase
      addLog('📦 动态加载 Supabase...');
      const { supabase } = await import('@/lib/supabase');
      addLog('✅ Supabase 模块加载成功');
      
      // 测试连接
      addLog('🔗 测试 Supabase 连接...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`❌ 连接错误: ${error.message}`);
        addLog(`🔍 错误详情: ${JSON.stringify(error, null, 2)}`);
      } else {
        addLog('✅ Supabase 连接成功');
        addLog(`👤 当前会话: ${data.session ? '已登录' : '未登录'}`);
      }
    } catch (error: any) {
      addLog(`💥 连接异常: ${error?.message || error}`);
      addLog(`🔍 异常详情: ${JSON.stringify(error, null, 2)}`);
    }
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 立即添加日志，确保函数被调用
    addLog('🚀 登录测试函数已触发');
    
    setIsLoading(true);
    
    try {
      addLog(`📧 输入邮箱: ${email}`);
      addLog(`🔒 密码长度: ${password.length}`);

      // 1. 基本验证
      if (!email.trim()) {
        addLog('❌ 错误: 邮箱为空');
        return;
      }
      
      if (!password.trim()) {
        addLog('❌ 错误: 密码为空');
        return;
      }

      // 2. 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        addLog('❌ 错误: 邮箱格式不正确');
        return;
      }

      addLog('✅ 基本验证通过');

      // 3. 检查环境变量
      addLog('🔍 检查环境变量...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      addLog(`📍 Supabase URL: ${supabaseUrl}`);
      
      if (!supabaseUrl) {
        addLog('❌ Supabase URL 未配置');
        return;
      }

      // 4. 动态导入认证函数
      addLog('📦 加载认证模块...');
      const { signIn } = await import('@/lib/auth');
      addLog('✅ 认证模块加载成功');
      
      // 5. 尝试登录
      addLog('🔐 开始登录...');
      const result = await signIn(email, password);
      
      addLog(`📊 登录结果: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addLog('🎉 登录成功！');
        if (result.user) {
          addLog(`👤 用户信息: ${JSON.stringify(result.user, null, 2)}`);
        }
      } else {
        addLog(`❌ 登录失败: ${result.error}`);
      }

    } catch (error: any) {
      addLog(`💥 登录异常: ${error?.message || error}`);
      addLog(`🔍 异常堆栈: ${error?.stack || '无堆栈信息'}`);
      console.error('详细错误信息:', error);
    } finally {
      setIsLoading(false);
      addLog('🏁 登录测试完成');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 日志已清空');
  };

  const handleTestBasic = () => {
    addLog('🧪 基础功能测试');
    addLog('✅ React state 正常');
    addLog('✅ 日志系统正常');
    addLog(`📧 当前邮箱: ${email}`);
    addLog(`🔒 当前密码: ${password}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 登录调试工具
          </h1>
          <p className="text-gray-600">
            诊断登录问题和查看详细日志
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 登录测试表单 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              登录测试
            </h2>
            
            <form onSubmit={handleTestLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入邮箱"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入密码"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? '测试中...' : '测试登录'}
                </button>
                
                <button
                  type="button"
                  onClick={handleTestConnection}
                  className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  测试连接
                </button>
                
                <button
                  type="button"
                  onClick={handleTestBasic}
                  className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  基础测试
                </button>
                
                <button
                  type="button"
                  onClick={clearLogs}
                  className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  清空日志
                </button>
              </div>
            </form>
          </div>

          {/* 日志显示 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                调试日志 ({logs.length})
              </h2>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">暂无日志...点击任意按钮开始测试</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 break-words">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 返回链接 */}
        <div className="text-center mt-8">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← 返回登录页面
          </a>
        </div>
      </div>
    </div>
  );
} 