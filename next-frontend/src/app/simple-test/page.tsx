'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('页面已加载');

  const handleClick = () => {
    setCount(count + 1);
    setMessage(`按钮被点击了 ${count + 1} 次`);
    console.log('按钮点击事件触发');
  };

  const testAlert = () => {
    alert('如果你看到这个弹窗，说明 JavaScript 正常工作');
  };

  const testConsole = () => {
    console.log('控制台测试消息');
    console.error('这是一个测试错误消息');
    setMessage('检查浏览器控制台是否有消息');
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">
          🧪 简单功能测试
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">{message}</p>
            <p className="text-2xl font-bold text-blue-600">计数器: {count}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleClick}
              className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              点击测试 (+1)
            </button>
            
            <button
              onClick={testAlert}
              className="py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              弹窗测试
            </button>
            
            <button
              onClick={testConsole}
              className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              控制台测试
            </button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">测试说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 如果按钮没有反应，说明 JavaScript 被阻止或有错误</li>
              <li>• 如果计数器不更新，说明 React 状态有问题</li>
              <li>• 如果弹窗不出现，说明浏览器阻止了弹窗</li>
              <li>• 打开浏览器开发者工具查看控制台错误</li>
            </ul>
          </div>
          
          <div className="text-center">
            <a
              href="/debug-login"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              返回调试页面
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 