"""
FastAPI 依赖函数
用于在API路由中注入认证和其他依赖
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import jwt_handler

# HTTP Bearer认证方案
security = HTTPBearer()

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    获取当前认证用户的ID
    
    这个依赖函数会：
    1. 从请求头中提取Bearer Token
    2. 验证JWT Token的有效性
    3. 提取并返回用户ID
    
    Args:
        credentials: HTTP认证凭据（包含Bearer Token）
        
    Returns:
        str: 当前用户的ID
        
    Raises:
        HTTPException: 如果Token无效或过期
    """
    try:
        # 提取Bearer Token（去掉"Bearer "前缀）
        token = credentials.credentials
        
        # 验证Token并提取用户ID
        user_id = jwt_handler.extract_user_id(token)
        
        return user_id
        
    except HTTPException:
        # 重新抛出认证相关的HTTP异常
        raise
    except Exception as e:
        # 处理其他异常
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"认证失败: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    获取当前认证用户的完整信息
    
    这个依赖函数会：
    1. 从请求头中提取Bearer Token
    2. 验证JWT Token的有效性
    3. 提取并返回完整的用户信息
    
    Args:
        credentials: HTTP认证凭据（包含Bearer Token）
        
    Returns:
        dict: 包含用户信息的字典
        
    Raises:
        HTTPException: 如果Token无效或过期
    """
    try:
        # 提取Bearer Token
        token = credentials.credentials
        
        # 验证Token并提取用户信息
        user_info = jwt_handler.extract_user_info(token)
        
        return user_info
        
    except HTTPException:
        # 重新抛出认证相关的HTTP异常
        raise
    except Exception as e:
        # 处理其他异常
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"认证失败: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    获取可选的当前用户ID
    
    这个依赖函数用于不强制要求认证的API端点
    如果提供了有效Token，返回用户ID；否则返回None
    
    Args:
        credentials: 可选的HTTP认证凭据
        
    Returns:
        Optional[str]: 用户ID或None
    """
    if not credentials:
        return None
        
    try:
        # 提取Bearer Token
        token = credentials.credentials
        
        # 验证Token并提取用户ID
        user_id = jwt_handler.extract_user_id(token)
        
        return user_id
        
    except HTTPException:
        # 对于可选认证，即使Token无效也返回None而不是抛出异常
        return None
    except Exception:
        # 对于可选认证，出现任何错误都返回None
        return None 