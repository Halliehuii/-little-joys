"""
Supabase JWT 认证模块
用于验证前端传来的JWT Token并提取用户信息
"""

import os
import jwt
from datetime import datetime
from fastapi import HTTPException, status
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 从环境变量获取JWT密钥
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
JWT_ALGORITHM = "HS256"  # Supabase使用HS256算法

if not JWT_SECRET:
    raise ValueError("缺少SUPABASE_JWT_SECRET环境变量")

class JWTHandler:
    """JWT处理类"""
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """
        验证JWT Token并提取载荷
        
        Args:
            token: JWT令牌字符串
            
        Returns:
            Dict: 解码后的JWT载荷
            
        Raises:
            HTTPException: Token无效或过期时抛出异常
        """
        try:
            # 解码JWT Token
            payload = jwt.decode(
                token, 
                JWT_SECRET, 
                algorithms=[JWT_ALGORITHM],
                # 验证Token的有效期
                options={"verify_exp": True, "verify_iat": True}
            )
            
            # 检查Token是否过期
            exp = payload.get('exp')
            if exp and datetime.utcnow().timestamp() > exp:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token已过期",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            # Token过期
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token已过期",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError:
            # Token无效
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的Token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            # 其他错误
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token验证失败: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def extract_user_id(token: str) -> str:
        """
        从JWT Token中提取用户ID
        
        Args:
            token: JWT令牌字符串
            
        Returns:
            str: 用户ID (UUID)
            
        Raises:
            HTTPException: Token无效或不包含用户ID时抛出异常
        """
        payload = JWTHandler.verify_token(token)
        
        # 从载荷中提取用户ID
        # Supabase JWT中用户ID通常在'sub'字段中
        user_id = payload.get('sub')
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token中未找到用户ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_id
    
    @staticmethod
    def extract_user_info(token: str) -> Dict[str, Any]:
        """
        从JWT Token中提取完整用户信息
        
        Args:
            token: JWT令牌字符串
            
        Returns:
            Dict: 包含用户信息的字典
            
        Raises:
            HTTPException: Token无效时抛出异常
        """
        payload = JWTHandler.verify_token(token)
        
        # 提取用户相关信息
        user_info = {
            'user_id': payload.get('sub'),                    # 用户ID
            'email': payload.get('email'),                    # 用户邮箱
            'email_verified': payload.get('email_confirmed_at') is not None,  # 邮箱是否验证
            'role': payload.get('role', 'authenticated'),     # 用户角色
            'aud': payload.get('aud'),                        # 受众
            'iss': payload.get('iss'),                        # 签发者
            'iat': payload.get('iat'),                        # 签发时间
            'exp': payload.get('exp'),                        # 过期时间
        }
        
        return user_info

# 创建全局JWT处理器实例
jwt_handler = JWTHandler() 