"""
生活小确幸 - FastAPI后端服务
集成Supabase数据库和第三方API服务
使用Supabase JWT认证系统
"""

import os
import httpx
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 应用配置
app = FastAPI(
    title="生活小确幸 API",
    description="记录生活中每一个温暖的小瞬间",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase配置
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# API密钥配置
AMAP_API_KEY = os.getenv("AMAP_API_KEY")
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

# 认证配置
security = HTTPBearer()

# 导入新的认证依赖
from dependencies import get_current_user_id, get_current_user_info, get_optional_user_id

# ================================
# 数据模型定义
# ================================

class UserProfile(BaseModel):
    nickname: str = Field(..., max_length=50)
    bio: Optional[str] = Field(None, max_length=200)
    avatar_url: Optional[str] = None

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    location_data: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=200)

class RewardCreate(BaseModel):
    payment_method: str = Field(..., regex="^(wechat|alipay)$")
    transaction_id: str = Field(..., min_length=1)

class PaymentAccountCreate(BaseModel):
    payment_type: str = Field(..., regex="^(wechat|alipay)$")
    account_info: Dict[str, Any]
    real_name: str = Field(..., max_length=50)

# ================================
# 认证相关
# ================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前认证用户"""
    try:
        # 验证JWT token
        user = supabase.auth.get_user(credentials.credentials)
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

# ================================
# 认证测试API
# ================================

@app.get("/api/v1/auth/me")
async def get_current_user_me(current_user_id: str = Depends(get_current_user_id)):
    """
    获取当前登录用户的基本信息
    这个API用于测试JWT认证是否正常工作
    """
    try:
        # 从数据库获取用户信息
        response = supabase.table('user_profiles').select(
            'id, nickname, avatar_url, bio, total_rewards, post_count, is_verified, created_at'
        ).eq('id', current_user_id).single().execute()
        
        return {
            "success": True,
            "data": {
                "user_id": current_user_id,
                "profile": response.data
            },
            "message": "认证成功，用户信息获取成功"
        }
    except Exception as e:
        return {
            "success": True,
            "data": {
                "user_id": current_user_id,
                "profile": None
            },
            "message": f"认证成功，但用户资料不存在: {str(e)}"
        }

@app.get("/api/v1/auth/info")
async def get_auth_info(user_info: dict = Depends(get_current_user_info)):
    """
    获取JWT Token中的完整用户信息
    这个API用于查看Token中包含的所有信息
    """
    return {
        "success": True,
        "data": user_info,
        "message": "Token信息解析成功"
    }

# ================================
# 地理编码和天气API（原有功能）
# ================================

@app.get("/api/v1/location/reverse-geocode")
async def reverse_geocode(latitude: float, longitude: float, lang: str = "zh-CN"):
    """逆地理编码 - 将坐标转换为地址"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://restapi.amap.com/v3/geocode/regeo",
                params={
                    "key": AMAP_API_KEY,
                    "location": f"{longitude},{latitude}",
                    "poitype": "",
                    "radius": 1000,
                    "extensions": "base",
                    "batch": "false",
                    "roadlevel": 0
                }
            )
            data = response.json()
            
            if data.get("status") == "1":
                regeocode = data.get("regeocode", {})
                formatted_address = regeocode.get("formatted_address", "")
                
                return {
                    "data": {
                        "formatted_address": formatted_address,
                        "coordinates": {
                            "latitude": latitude,
                            "longitude": longitude
                        }
                    },
                    "message": "位置详情获取成功"
                }
            else:
                raise HTTPException(status_code=503, detail="地理编码服务暂时不可用")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取位置信息失败: {str(e)}")

@app.get("/api/v1/weather/current")
async def get_current_weather(latitude: float, longitude: float, units: str = "metric", lang: str = "zh_cn"):
    """获取当前天气信息"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "appid": OPENWEATHERMAP_API_KEY,
                    "units": units,
                    "lang": lang
                }
            )
            data = response.json()
            
            return {
                "data": {
                    "location_name": data.get("name", ""),
                    "coordinates": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "temperature": {
                        "current": data["main"]["temp"],
                        "feels_like": data["main"]["feels_like"],
                        "min": data["main"]["temp_min"],
                        "max": data["main"]["temp_max"],
                        "unit": "celsius" if units == "metric" else "fahrenheit"
                    },
                    "weather": {
                        "main_condition": data["weather"][0]["main"],
                        "description": data["weather"][0]["description"],
                        "icon_code": data["weather"][0]["icon"]
                    },
                    "humidity_percent": data["main"]["humidity"],
                    "wind": {
                        "speed_mps": data["wind"]["speed"],
                        "direction_deg": data["wind"].get("deg", 0)
                    },
                    "pressure_hpa": data["main"]["pressure"],
                    "visibility_km": data.get("visibility", 0) / 1000,
                    "timestamp_utc": datetime.utcnow().isoformat() + "Z"
                },
                "message": "当前天气数据获取成功"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取天气信息失败: {str(e)}")

# ================================
# 用户相关API（使用新的认证系统）
# ================================

@app.get("/api/v1/users/profile")
async def get_user_profile(current_user_id: str = Depends(get_current_user_id)):
    """获取当前用户信息"""
    try:
        response = supabase.table('user_profiles').select(
            'id, nickname, avatar_url, bio, total_rewards, post_count, is_verified, created_at'
        ).eq('id', current_user_id).single().execute()
        
        return {
            "success": True,
            "data": response.data,
            "message": "用户信息获取成功"
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"用户信息不存在: {str(e)}")

@app.put("/api/v1/users/profile")
async def update_user_profile(
    profile_data: UserProfile,
    current_user_id: str = Depends(get_current_user_id)
):
    """更新用户资料"""
    try:
        response = supabase.table('user_profiles').update({
            'nickname': profile_data.nickname,
            'bio': profile_data.bio,
            'avatar_url': profile_data.avatar_url,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', current_user_id).execute()
        
        return {
            "success": True,
            "data": response.data[0],
            "message": "用户资料更新成功"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"更新用户资料失败: {str(e)}")

# ================================
# 便签相关API
# ================================

@app.post("/api/v1/posts")
async def create_post(
    post_data: PostCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """创建新便签"""
    try:
        insert_data = {
            'user_id': current_user_id,
            'content': post_data.content,
            'image_url': post_data.image_url,
            'audio_url': post_data.audio_url,
            'location_data': post_data.location_data,
            'weather_data': post_data.weather_data
        }
        
        # 移除空值
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        response = supabase.table('posts').insert(insert_data).execute()
        
        return {
            "success": True,
            "data": response.data[0] if response.data else None,
            "message": "便签创建成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建便签失败: {str(e)}")

@app.get("/api/v1/posts")
async def get_posts_list(
    page: int = 1,
    limit: int = 20,
    sort_type: str = "latest",
    user_id: Optional[str] = None
):
    """获取便签列表"""
    try:
        offset = (page - 1) * limit
        
        query = supabase.table('posts').select(
            '''
            id, content, image_url, audio_url, location_data, weather_data,
            likes_count, comments_count, rewards_count, rewards_amount, created_at,
            user_profiles!posts_user_id_fkey(nickname, avatar_url)
            '''
        ).eq('is_deleted', False)
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        if sort_type == 'hottest':
            query = query.order('likes_count', desc=True)
        else:
            query = query.order('created_at', desc=True)
        
        response = query.range(offset, offset + limit - 1).execute()
        
        # 获取总数
        count_query = supabase.table('posts').select('id', count='exact').eq('is_deleted', False)
        if user_id:
            count_query = count_query.eq('user_id', user_id)
        total_count = count_query.execute().count
        
        return {
            "success": True,
            "data": {
                "posts": response.data,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_count,
                    "pages": (total_count + limit - 1) // limit
                }
            },
            "message": "便签列表获取成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取便签列表失败: {str(e)}")

@app.get("/api/v1/posts/{post_id}")
async def get_post_detail(post_id: str, current_user_id: Optional[str] = Depends(get_current_user_id)):
    """获取便签详情"""
    try:
        response = supabase.table('posts').select(
            '''
            id, content, image_url, audio_url, location_data, weather_data,
            likes_count, comments_count, rewards_count, rewards_amount, created_at,
            user_profiles!posts_user_id_fkey(nickname, avatar_url)
            '''
        ).eq('id', post_id).eq('is_deleted', False).single().execute()
        
        post_data = response.data
        
        # 检查当前用户是否已点赞
        is_liked = False
        if current_user_id:
            like_response = supabase.table('likes').select('id').eq('post_id', post_id).eq('user_id', current_user_id).execute()
            is_liked = len(like_response.data) > 0
        
        post_data['is_liked'] = is_liked
        
        return {
            "success": True,
            "data": post_data,
            "message": "便签详情获取成功"
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"便签不存在或已删除")

@app.delete("/api/v1/posts/{post_id}")
async def delete_post(post_id: str, current_user_id: str = Depends(get_current_user_id)):
    """删除便签（软删除）"""
    try:
        # 验证便签归属
        post_check = supabase.table('posts').select('user_id').eq('id', post_id).single().execute()
        if post_check.data['user_id'] != current_user_id:
            raise HTTPException(status_code=403, detail="无权删除此便签")
        
        # 软删除
        supabase.table('posts').update({'is_deleted': True}).eq('id', post_id).execute()
        
        return {
            "success": True,
            "message": "便签删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除便签失败: {str(e)}")

# ================================
# 点赞相关API
# ================================

@app.post("/api/v1/posts/{post_id}/like")
async def toggle_like(post_id: str, current_user_id: str = Depends(get_current_user_id)):
    """切换点赞状态"""
    try:
        # 检查是否已点赞
        existing_like = supabase.table('likes').select('id').eq('post_id', post_id).eq('user_id', current_user_id).execute()
        
        if existing_like.data:
            # 取消点赞
            supabase.table('likes').delete().eq('post_id', post_id).eq('user_id', current_user_id).execute()
            action = 'unliked'
            message = '取消点赞成功'
        else:
            # 添加点赞
            supabase.table('likes').insert({
                'post_id': post_id,
                'user_id': current_user_id
            }).execute()
            action = 'liked'
            message = '点赞成功'
        
        # 获取最新点赞数
        post_response = supabase.table('posts').select('likes_count').eq('id', post_id).single().execute()
        likes_count = post_response.data['likes_count']
        
        return {
            "success": True,
            "data": {
                "action": action,
                "likes_count": likes_count
            },
            "message": message
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"点赞操作失败: {str(e)}")

# ================================
# 评论相关API
# ================================

@app.post("/api/v1/posts/{post_id}/comments")
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """创建评论"""
    try:
        # 验证便签存在且未删除
        post_check = supabase.table('posts').select('id').eq('id', post_id).eq('is_deleted', False).execute()
        if not post_check.data:
            raise HTTPException(status_code=404, detail="便签不存在或已删除")
        
        response = supabase.table('comments').insert({
            'post_id': post_id,
            'user_id': current_user_id,
            'content': comment_data.content
        }).execute()
        
        return {
            "success": True,
            "data": response.data[0] if response.data else None,
            "message": "评论创建成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建评论失败: {str(e)}")

@app.get("/api/v1/posts/{post_id}/comments")
async def get_comments_list(post_id: str, page: int = 1, limit: int = 10):
    """获取便签评论列表"""
    try:
        offset = (page - 1) * limit
        
        response = supabase.table('comments').select(
            '''
            id, content, created_at,
            user_profiles!comments_user_id_fkey(nickname, avatar_url)
            '''
        ).eq('post_id', post_id).eq('is_deleted', False).order('created_at', desc=False).range(offset, offset + limit - 1).execute()
        
        # 获取总数
        total_count = supabase.table('comments').select('id', count='exact').eq('post_id', post_id).eq('is_deleted', False).execute().count
        
        return {
            "success": True,
            "data": {
                "comments": response.data,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_count,
                    "pages": (total_count + limit - 1) // limit
                }
            },
            "message": "评论列表获取成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取评论列表失败: {str(e)}")

# ================================
# 启动信息
# ================================

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    print("🚀 生活小确幸 API 服务启动成功!")
    print("🔐 Supabase JWT 认证系统已集成")
    print("📱 支持前端 Token 认证")
    
    # 测试数据库连接
    try:
        supabase.table('user_profiles').select('count').limit(1).execute()
        print("✅ Supabase 数据库连接正常")
    except Exception as e:
        print(f"❌ Supabase 数据库连接失败: {e}")
        
    # 检查认证配置
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if jwt_secret:
        print("✅ JWT Secret 配置正常")
    else:
        print("❌ JWT Secret 未配置")

    print("🔑 API密钥配置状态:")
    print(f"   - 高德地图 API: {'✅ 已配置' if AMAP_API_KEY else '❌ 未配置'}")
    print(f"   - OpenWeatherMap API: {'✅ 已配置' if OPENWEATHERMAP_API_KEY else '❌ 未配置'}")
    print(f"   - Supabase: {'✅ 已配置' if SUPABASE_URL and SUPABASE_KEY else '❌ 未配置'}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 