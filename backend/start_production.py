#!/usr/bin/env python3
"""
生产环境启动脚本
设置生产环境变量并启动FastAPI应用
"""

import os
import sys
from pathlib import Path

# 设置生产环境
os.environ["ENVIRONMENT"] = "production"

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 导入并运行主应用
if __name__ == "__main__":
    # 导入主应用
    from backend.main import app
    import uvicorn
    
    # 生产环境配置
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    print(f"🚀 启动生产环境服务: {HOST}:{PORT}")
    
    # 启动服务
    uvicorn.run(
        "backend.main:app",
        host=HOST,
        port=PORT,
        log_level="info",
        access_log=True,
        workers=1,  # 单worker模式，适合Zeabur等平台
    ) 