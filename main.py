import os
from typing import Optional, Dict, Any
import datetime
import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import httpx

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # 输出到控制台
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Retrieve the API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AMAP_API_KEY = os.getenv("AMAP_API_KEY")
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found in .env file. Some functionalities might be affected if real OpenAI calls were intended.")

if not AMAP_API_KEY:
    logger.warning("AMAP_API_KEY not found in .env file. Geocoding service will not work.")

if not OPENWEATHERMAP_API_KEY:
    logger.warning("OPENWEATHERMAP_API_KEY not found in .env file. Weather service will not work.")

app = FastAPI(
    title="生活小确幸 API",
    description="API for recording and sharing small moments of happiness, with location and weather features.",
    version="0.1.0",
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有域名，生产环境建议指定具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有请求头
)

logger.info("🚀 生活小确幸 API 服务启动成功")
logger.info(f"🔑 API密钥配置状态:")
logger.info(f"   - OpenAI API: {'✅ 已配置' if OPENAI_API_KEY else '❌ 未配置'}")
logger.info(f"   - 高德地图 API: {'✅ 已配置' if AMAP_API_KEY else '❌ 未配置'}")
logger.info(f"   - OpenWeatherMap API: {'✅ 已配置' if OPENWEATHERMAP_API_KEY else '❌ 未配置'}")

# --- Helper Models (Shared or common structures) ---
class Coordinates(BaseModel):
    latitude: float = Field(..., example=31.2304)
    longitude: float = Field(..., example=121.4737)

# --- 1. Reverse Geocoding ---

class AddressComponents(BaseModel):
    road: Optional[str] = Field(None, example="人民大道")
    neighbourhood: Optional[str] = Field(None, example="黄浦区政府")
    suburb: Optional[str] = Field(None, example="黄浦区")
    city: Optional[str] = Field(None, example="上海市")
    state: Optional[str] = Field(None, example="上海市")
    postcode: Optional[str] = Field(None, example="200000")
    country: Optional[str] = Field(None, example="中国")
    country_code: Optional[str] = Field(None, example="cn")

class GeocodeData(BaseModel):
    formatted_address: str = Field(..., example="人民广场, 黄浦区, 上海市, 中国")
    address_components: AddressComponents
    coordinates: Coordinates

class ReverseGeocodeResponse(BaseModel):
    data: GeocodeData
    message: str = Field(..., example="位置详情获取成功。")

class ErrorResponseDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorResponseDetail


async def amap_geocoding_service(latitude: float, longitude: float, lang: Optional[str]) -> Dict[str, Any]:
    """
    Call Amap (高德地图) geocoding service to convert coordinates to address.
    Documentation: https://lbs.amap.com/api/webservice/guide/api/georegeo
    """
    logger.info(f"🌍 开始调用高德地图API: 纬度={latitude}, 经度={longitude}, 语言={lang}")
    
    if not AMAP_API_KEY:
        logger.error("❌ 高德地图API密钥未配置")
        raise ValueError("AMAP_API_KEY not configured")
    
    logger.info(f"✅ 高德地图API密钥已配置: {AMAP_API_KEY[:10]}...")
    
    # 检查是否为中国境内坐标，高德地图主要服务中国地区
    is_china_region = (18 <= latitude <= 54) and (73 <= longitude <= 135)
    logger.info(f"📍 坐标区域判断: 是否为中国境内={is_china_region}")
    
    if not is_china_region:
        logger.info("🌐 坐标不在中国境内，使用海外地理编码服务")
        # 对于海外地址，提供基于坐标的简化地址信息
        return await mock_overseas_geocoding_service(latitude, longitude, lang)
    
    # 高德地图逆地理编码API端点
    url = "https://restapi.amap.com/v3/geocode/regeo"
    
    # API参数
    params = {
        "key": AMAP_API_KEY,
        "location": f"{longitude},{latitude}",  # 高德地图要求经度在前，纬度在后
        "poitype": "",  # 可选，返回附近POI类型
        "radius": 1000,  # 搜索半径，默认1000米
        "extensions": "base",  # base返回基本地址信息，all返回详细信息
        "batch": "false",
        "roadlevel": 0  # 道路等级
    }
    
    logger.info(f"🔗 准备调用高德地图API: {url}")
    logger.info(f"📋 API参数: location={params['location']}, radius={params['radius']}")
    
    # 如果指定了语言，设置输出语言（高德地图支持zh_cn, en）
    if lang:
        logger.info(f"🌐 请求语言设置: {lang}")
        if lang.lower() in ["zh-cn", "zh_cn", "chinese", "中文"]:
            # 高德地图默认就是中文，无需额外参数
            logger.info("🇨🇳 使用中文输出")
            pass
        elif lang.lower() in ["en", "english", "英文"]:
            # 高德地图的英文支持有限，但可以尝试
            logger.info("🇺🇸 尝试英文输出")
            pass
    
    try:
        # 发送异步HTTP请求
        logger.info("📡 发送HTTP请求到高德地图API...")
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            logger.info(f"📡 HTTP响应状态: {response.status_code}")
            
            response.raise_for_status()  # 如果HTTP状态码不是2xx，会抛出异常
            
            data = response.json()
            logger.info(f"📋 高德地图API返回数据: {data}")
            
            # 检查高德地图API返回状态
            if data.get("status") != "1":
                error_info = data.get("info", "未知错误")
                logger.error(f"❌ 高德地图API返回错误: status={data.get('status')}, info={error_info}")
                raise ValueError(f"高德地图API错误: {error_info}")
            
            logger.info("✅ 高德地图API调用成功")
            
            # 解析返回的地理编码数据
            regeocode = data.get("regeocode", {})
            if not regeocode:
                logger.error("❌ 高德地图API返回数据中未找到regeocode字段")
                raise ValueError("未找到地址信息")
            
            # logger.info(f"📍 获取到regeocode数据: {regeocode}")
            
            # 获取格式化地址
            formatted_address = regeocode.get("formatted_address", "")
            logger.info(f"📍 格式化地址: {formatted_address}")
            
            # 获取地址组件
            address_component = regeocode.get("addressComponent", {})
            
            # 安全获取字符串值的辅助函数
            def safe_get_string(data, key, default=""):
                """安全获取字符串值，处理数组和字典类型"""
                value = data.get(key, default)
                
                # 如果值为空或None，返回默认值
                if not value:
                    return default
                    
                if isinstance(value, list):
                    # 过滤掉空值，然后连接
                    non_empty_values = [str(v).strip() for v in value if v and str(v).strip()]
                    return " ".join(non_empty_values) if non_empty_values else default
                elif isinstance(value, dict):
                    # 对于像neighborhood这样的复杂对象，尝试获取name字段
                    if 'name' in value:
                        names = value['name']
                        if isinstance(names, list):
                            non_empty_names = [str(n).strip() for n in names if n and str(n).strip()]
                            return " ".join(non_empty_names) if non_empty_names else default
                        return str(names).strip() if names else default
                    return default
                
                # 普通字符串处理
                result = str(value).strip()
                return result if result else default
            
            # 构建街道地址
            street_info = address_component.get("streetNumber", {})
            road = ""
            if isinstance(street_info, dict):
                street = street_info.get("street", "")
                number = street_info.get("number", "")
                road = f"{street}{number}".strip()
            
            logger.info(f"📍 解析的街道信息: {road}")
            
            # 映射到我们的数据结构
            result = {
                "formatted_address": formatted_address,
                "address_components": {
                    "road": road,
                    "neighbourhood": safe_get_string(address_component, "neighborhood"),
                    "suburb": safe_get_string(address_component, "district"),
                    "city": safe_get_string(address_component, "city", address_component.get("province", "")),  # 如果city为空，使用province
                    "state": safe_get_string(address_component, "province"),
                    "postcode": safe_get_string(address_component, "adcode"),
                    "country": safe_get_string(address_component, "country", "中国"),
                    "country_code": "cn"
                },
                "coordinates": {
                    "latitude": latitude,
                    "longitude": longitude
                }
            }
            
            logger.info(f"🎯 最终返回结果: {result}")
            return result
            
    except httpx.HTTPStatusError as e:
        logger.error(f"❌ HTTP请求错误: {e.response.status_code}")
        raise ValueError(f"HTTP请求错误: {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"❌ 网络请求错误: {str(e)}")
        raise ValueError(f"网络请求错误: {str(e)}")
    except Exception as e:
        logger.error(f"❌ 地理编码服务错误: {str(e)}")
        raise ValueError(f"地理编码服务错误: {str(e)}")

async def mock_overseas_geocoding_service(latitude: float, longitude: float, lang: Optional[str]) -> Dict[str, Any]:
    """
    为海外地址提供真实的地理编码服务，使用Nominatim API（OpenStreetMap）
    这是一个免费的地理编码服务，无需API密钥
    """
    logger.info(f"🌐 使用Nominatim API进行海外地理编码: 纬度={latitude}, 经度={longitude}")
    
    try:
        # 使用Nominatim API（OpenStreetMap的免费地理编码服务）
        url = "https://nominatim.openstreetmap.org/reverse"
        
        # 设置语言
        accept_language = "zh,en"  # 默认首选中文，回退到英文
        if lang:
            lang_lower = lang.lower()
            if lang_lower in ["en", "english", "英文"]:
                accept_language = "en,zh"
            elif lang_lower in ["zh-cn", "zh_cn", "chinese", "中文"]:
                accept_language = "zh,en"
        
        logger.info(f"🌐 Nominatim API语言设置: {accept_language}")
        
        # API参数
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "json",
            "addressdetails": 1,  # 返回详细地址组件
            "accept-language": accept_language,
            "zoom": 16  # 详细程度，16表示街道级别
        }
        
        # 设置User-Agent以符合Nominatim使用政策
        headers = {
            "User-Agent": "LittleJoys-App/1.0 (contact@littlejoys.app)"
        }
        
        logger.info(f"🔗 调用Nominatim API: {url}")
        logger.info(f"📋 请求参数: {params}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            logger.info(f"📡 Nominatim API响应状态: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"❌ Nominatim API请求失败: {response.status_code}")
                raise ValueError(f"Nominatim API请求失败: {response.status_code}")
            
            data = response.json()
            logger.info(f"📋 Nominatim API返回数据: {data}")
            
            if not data:
                logger.error("❌ Nominatim API未返回地址信息")
                raise ValueError("未找到地址信息")
            
            # 解析Nominatim返回的地址组件
            address = data.get("address", {})
            display_name = data.get("display_name", "")
            # logger.info(f"📍 解析地址组件: {address}")
            logger.info(f"📍 显示名称: {display_name}")
            
            # 安全获取地址组件
            def safe_get_address_component(key, default=""):
                return address.get(key, default) or default
            
            # 获取各级地址组件
            road = safe_get_address_component("road") or safe_get_address_component("pedestrian")
            house_number = safe_get_address_component("house_number")
            neighbourhood = safe_get_address_component("neighbourhood") or safe_get_address_component("suburb")
            district = safe_get_address_component("city_district") or safe_get_address_component("district")
            city = safe_get_address_component("city") or safe_get_address_component("town") or safe_get_address_component("village")
            state = safe_get_address_component("state") or safe_get_address_component("province")
            country = safe_get_address_component("country")
            country_code = safe_get_address_component("country_code")
            postcode = safe_get_address_component("postcode")
            
            # 构建完整街道地址
            full_road = ""
            if house_number and road:
                full_road = f"{house_number} {road}"
            elif road:
                full_road = road
            
            # 如果没有获取到基本地址信息，尝试从display_name中提取
            if not country and display_name:
                # 从display_name的最后部分提取国家信息
                parts = display_name.split(", ")
                if parts:
                    country = parts[-1]
                    if len(parts) > 1 and not state:
                        state = parts[-2]
                    if len(parts) > 2 and not city:
                        city = parts[-3]
            
            # 构建格式化地址
            address_parts = []
            if full_road:
                address_parts.append(full_road)
            if neighbourhood and neighbourhood != district:
                address_parts.append(neighbourhood)
            if district and district != city:
                address_parts.append(district)
            if city and city != state:
                address_parts.append(city)
            if state and state != country:
                address_parts.append(state)
            if country:
                address_parts.append(country)
            
            formatted_address = ", ".join(address_parts) if address_parts else display_name
            logger.info(f"🎯 Nominatim解析结果: {formatted_address}")
            
            # 构建返回结果
            result = {
                "formatted_address": formatted_address,
                "address_components": {
                    "road": full_road,
                    "neighbourhood": neighbourhood,
                    "suburb": district,
                    "city": city,
                    "state": state,
                    "postcode": postcode,
                    "country": country,
                    "country_code": country_code
                },
                "coordinates": {
                    "latitude": latitude,
                    "longitude": longitude
                }
            }
            
            return result
            
    except httpx.HTTPStatusError as e:
        # 如果Nominatim API失败，回退到基础的地区判断
        logger.warning(f"⚠️ Nominatim API请求失败: {e.response.status_code}，使用基础地区判断")
        return await fallback_regional_geocoding(latitude, longitude, lang)
    except httpx.RequestError as e:
        # 网络错误，回退到基础判断
        logger.warning(f"⚠️ 网络请求错误: {str(e)}，使用基础地区判断")
        return await fallback_regional_geocoding(latitude, longitude, lang)
    except Exception as e:
        # 其他错误，回退到基础判断
        logger.warning(f"⚠️ 地理编码错误: {str(e)}，使用基础地区判断")
        return await fallback_regional_geocoding(latitude, longitude, lang)

async def fallback_regional_geocoding(latitude: float, longitude: float, lang: Optional[str]) -> Dict[str, Any]:
    """
    当API服务不可用时的回退地理编码服务
    提供基于坐标范围的地区判断
    """
    logger.info(f"🗺️ 使用回退地理编码服务: 纬度={latitude}, 经度={longitude}")
    
    # 更详细的地区判断逻辑
    country = "未知地区"
    city = "未知位置"
    
    # 北美地区
    if 20 <= latitude <= 70 and -170 <= longitude <= -50:
        if latitude >= 55:  # 加拿大北部
            country = "加拿大"
            city = f"加拿大 ({latitude:.2f}, {longitude:.2f})"
        elif latitude >= 49:  # 加拿大南部
            country = "加拿大"
            city = f"加拿大 ({latitude:.2f}, {longitude:.2f})"
        else:  # 美国
            country = "美国"
            # 更精确的美国城市判断
            if 25.7 <= latitude <= 25.8 and -80.3 <= longitude <= -80.1:
                city = "迈阿密"
            elif 34.0 <= latitude <= 34.1 and -118.3 <= longitude <= -118.2:
                city = "洛杉矶"
            elif 37.7 <= latitude <= 37.8 and -122.5 <= longitude <= -122.4:
                city = "旧金山"
            elif 40.7 <= latitude <= 40.8 and -74.1 <= longitude <= -73.9:
                city = "纽约"
            elif 41.8 <= latitude <= 41.9 and -87.7 <= longitude <= -87.6:
                city = "芝加哥"
            elif 30.2 <= latitude <= 30.3 and -97.8 <= longitude <= -97.7:
                city = "奥斯汀"
            elif 29.7 <= latitude <= 29.8 and -95.4 <= longitude <= -95.3:
                city = "休斯顿"
            elif 32.7 <= latitude <= 32.8 and -96.8 <= longitude <= -96.7:
                city = "达拉斯"
            elif 33.4 <= latitude <= 33.5 and -112.1 <= longitude <= -112.0:
                city = "凤凰城"
            elif 39.0 <= latitude <= 39.1 and -77.1 <= longitude <= -77.0:
                city = "华盛顿特区"
            elif 42.3 <= latitude <= 42.4 and -71.1 <= longitude <= -71.0:
                city = "波士顿"
            else:
                city = f"美国 ({latitude:.2f}, {longitude:.2f})"
    
    # 欧洲地区
    elif 35 <= latitude <= 72 and -25 <= longitude <= 45:
        country = "欧洲"
        if 51.4 <= latitude <= 51.6 and -0.2 <= longitude <= 0.0:
            city = "伦敦"
            country = "英国"
        elif 48.8 <= latitude <= 48.9 and 2.2 <= longitude <= 2.4:
            city = "巴黎"
            country = "法国"
        elif 52.4 <= latitude <= 52.6 and 13.3 <= longitude <= 13.5:
            city = "柏林"
            country = "德国"
        elif 41.8 <= latitude <= 41.9 and 12.4 <= longitude <= 12.5:
            city = "罗马"
            country = "意大利"
        elif 40.3 <= latitude <= 40.5 and -3.8 <= longitude <= -3.6:
            city = "马德里"
            country = "西班牙"
        else:
            city = f"欧洲 ({latitude:.2f}, {longitude:.2f})"
    
    # 亚洲地区（除中国外）
    elif 0 <= latitude <= 55 and 90 <= longitude <= 180:
        # 日本
        if 24 <= latitude <= 46 and 123 <= longitude <= 146:
            country = "日本"
            if 35.6 <= latitude <= 35.7 and 139.6 <= longitude <= 139.8:
                city = "东京"
            elif 34.6 <= latitude <= 34.7 and 135.4 <= longitude <= 135.6:
                city = "大阪"
            else:
                city = f"日本 ({latitude:.2f}, {longitude:.2f})"
        # 韩国
        elif 33 <= latitude <= 39 and 124 <= longitude <= 132:
            country = "韩国"
            if 37.5 <= latitude <= 37.6 and 126.9 <= longitude <= 127.0:
                city = "首尔"
            else:
                city = f"韩国 ({latitude:.2f}, {longitude:.2f})"
        # 东南亚
        elif -10 <= latitude <= 25 and 95 <= longitude <= 140:
            country = "东南亚"
            city = f"东南亚 ({latitude:.2f}, {longitude:.2f})"
        else:
            country = "亚洲"
            city = f"亚洲 ({latitude:.2f}, {longitude:.2f})"
    
    # 大洋洲
    elif -50 <= latitude <= -10 and 110 <= longitude <= 180:
        country = "澳大利亚"
        if -33.9 <= latitude <= -33.8 and 151.1 <= longitude <= 151.3:
            city = "悉尼"
        elif -37.9 <= latitude <= -37.7 and 144.9 <= longitude <= 145.0:
            city = "墨尔本"
        else:
            city = f"澳大利亚 ({latitude:.2f}, {longitude:.2f})"
    
    # 南美洲
    elif -60 <= latitude <= 15 and -85 <= longitude <= -30:
        country = "南美洲"
        city = f"南美洲 ({latitude:.2f}, {longitude:.2f})"
    
    # 非洲
    elif -35 <= latitude <= 38 and -20 <= longitude <= 55:
        country = "非洲"
        city = f"非洲 ({latitude:.2f}, {longitude:.2f})"
    
    else:
        # 其他地区
        country = "其他地区"
        city = f"位置 ({latitude:.2f}, {longitude:.2f})"
    
    formatted_address = f"{country} {city}" if city != country else country
    
    logger.info(f"🎯 回退地理编码结果: {formatted_address} (国家={country}, 城市={city})")
    
    return {
        "formatted_address": formatted_address,
        "address_components": {
            "road": "",
            "neighbourhood": "",
            "suburb": "",
            "city": city,
            "state": city if city != country else "",
            "postcode": "",
            "country": country,
            "country_code": "unknown"
        },
        "coordinates": {
            "latitude": latitude,
            "longitude": longitude
        }
    }

@app.get(
    "/api/v1/location/reverse-geocode",
    response_model=ReverseGeocodeResponse,
    summary="Reverse Geocode Location",
    description="Converts geographic coordinates (latitude and longitude) into a human-readable address.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid parameters provided"},
        503: {"model": ErrorResponse, "description": "Geocoding service unavailable"}
    }
)
async def reverse_geocode_location(
    latitude: float = Query(..., example=31.2304, description="Latitude of the location."),
    longitude: float = Query(..., example=121.4737, description="Longitude of the location."),
    lang: Optional[str] = Query(None, example="zh-CN", description="Preferred language for the response (e.g., 'en', 'zh-CN').")
):
    logger.info(f"🎯 收到反向地理编码请求: 纬度={latitude}, 经度={longitude}, 语言={lang}")
    
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        logger.error(f"❌ 无效的坐标参数: 纬度={latitude}, 经度={longitude}")
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_PARAMETERS", "message": "纬度和经度为必填项，且必须是有效的数字。"}}
        )

    try:
        logger.info("🚀 开始调用地理编码服务...")
        geocoding_result = await amap_geocoding_service(latitude, longitude, lang)
        logger.info(f"✅ 地理编码服务调用成功: {geocoding_result.get('formatted_address', 'N/A')}")
        
        # Construct the Pydantic models from the (mocked) service response
        address_components_model = AddressComponents(**geocoding_result.get("address_components", {}))
        coordinates_model = Coordinates(**geocoding_result.get("coordinates", {}))
        geocode_data_model = GeocodeData(
            formatted_address=geocoding_result.get("formatted_address", "N/A"),
            address_components=address_components_model,
            coordinates=coordinates_model
        )
        
        response = ReverseGeocodeResponse(
            data=geocode_data_model,
            message="位置详情获取成功。"
        )
        logger.info(f"📤 返回响应: {response.data.formatted_address}")
        return response
        
    except ValueError as e: # Catching specific error from mock
        logger.error(f"❌ 地理编码服务错误: {e}")
        # This simulates the external service being unavailable or returning an error
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "GEOCODING_SERVICE_UNAVAILABLE", "message": f"地理编码服务当前不可用: {e}"}}
        )
    except Exception as e:
        logger.error(f"❌ 内部服务器错误: {e}")
        # Generic internal error
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_SERVER_ERROR", "message": f"An unexpected error occurred: {e}"}}
        )

# --- 2. Get Current Weather ---

class Temperature(BaseModel):
    current: float = Field(..., example=22.5)
    feels_like: float = Field(..., example=23.0)
    min: float = Field(..., example=20.0)
    max: float = Field(..., example=25.0)
    unit: str = Field(..., example="celsius")

class WeatherCondition(BaseModel):
    main_condition: str = Field(..., example="Clouds")
    description: str = Field(..., example="多云")
    icon_code: str = Field(..., example="04d")

class Wind(BaseModel):
    speed_mps: float = Field(..., example=3.5)
    direction_deg: int = Field(..., example=180)
    direction_abbr: Optional[str] = Field(None, example="S")

class WeatherData(BaseModel):
    location_name: str = Field(..., example="上海市")
    coordinates: Coordinates
    temperature: Temperature
    weather: WeatherCondition
    humidity_percent: int = Field(..., example=75)
    wind: Wind
    pressure_hpa: int = Field(..., example=1012)
    visibility_km: int = Field(..., example=10)
    sunrise_utc: str = Field(..., example="2023-10-27T22:00:00Z")
    sunset_utc: str = Field(..., example="2023-10-28T09:00:00Z")
    timestamp_utc: str = Field(..., example="2023-10-27T10:30:00Z")

class CurrentWeatherResponse(BaseModel):
    data: WeatherData
    message: str = Field(..., example="当前天气数据获取成功。")


async def openweathermap_weather_service(latitude: float, longitude: float, units: Optional[str], lang: Optional[str]) -> Dict[str, Any]:
    """
    Call OpenWeatherMap API to get current weather data.
    Documentation: https://openweathermap.org/current
    """
    if not OPENWEATHERMAP_API_KEY:
        raise ValueError("OPENWEATHERMAP_API_KEY not configured")
    
    # OpenWeatherMap Current Weather API端点
    url = "https://api.openweathermap.org/data/2.5/weather"
    
    # 设置单位系统
    api_units = "metric" if units == "metric" else "imperial"
    temp_unit = "celsius" if units == "metric" else "fahrenheit"
    
    # 设置语言
    api_lang = "en"  # 默认英文
    if lang:
        lang_lower = lang.lower()
        if lang_lower in ["zh-cn", "zh_cn", "chinese", "中文"]:
            api_lang = "zh_cn"
        elif lang_lower in ["en", "english", "英文"]:
            api_lang = "en"
    
    # API参数
    params = {
        "lat": latitude,
        "lon": longitude,
        "appid": OPENWEATHERMAP_API_KEY,
        "units": api_units,
        "lang": api_lang
    }
    
    try:
        # 发送异步HTTP请求
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code != 200:
                response_text = response.text
                raise ValueError(f"HTTP请求错误: {response.status_code} - {response_text}")
            
            data = response.json()
            
            # 检查OpenWeatherMap API返回状态
            if data.get("cod") != 200:
                error_message = data.get("message", "未知错误")
                raise ValueError(f"OpenWeatherMap API错误: {error_message}")
            
            # 解析天气数据
            main = data.get("main", {})
            weather = data.get("weather", [{}])[0]  # weather是一个数组，取第一个
            wind = data.get("wind", {})
            sys_data = data.get("sys", {})
            clouds = data.get("clouds", {})
            visibility = data.get("visibility", 10000)  # 米为单位，转换为公里
            
            # 获取风向缩写
            def get_wind_direction_abbr(degree):
                """根据风向角度获取风向缩写"""
                if degree is None:
                    return "N"
                directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
                index = round(degree / 22.5) % 16
                return directions[index]
            
            # 格式化时间戳为UTC ISO格式
            def format_timestamp(timestamp):
                if timestamp:
                    return datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc).isoformat()
                return None
            
            # 映射到我们的数据结构
            result = {
                "location_name": data.get("name", "未知位置"),
                "coordinates": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "temperature": {
                    "current": main.get("temp", 0),
                    "feels_like": main.get("feels_like", 0),
                    "min": main.get("temp_min", 0),
                    "max": main.get("temp_max", 0),
                    "unit": temp_unit
                },
                "weather": {
                    "main_condition": weather.get("main", ""),
                    "description": weather.get("description", ""),
                    "icon_code": weather.get("icon", "")
                },
                "humidity_percent": main.get("humidity", 0),
                "wind": {
                    "speed_mps": wind.get("speed", 0),
                    "direction_deg": wind.get("deg", 0),
                    "direction_abbr": get_wind_direction_abbr(wind.get("deg"))
                },
                "pressure_hpa": main.get("pressure", 0),
                "visibility_km": round(visibility / 1000, 1),  # 转换为公里
                "sunrise_utc": format_timestamp(sys_data.get("sunrise")),
                "sunset_utc": format_timestamp(sys_data.get("sunset")),
                "timestamp_utc": format_timestamp(data.get("dt"))
            }
            
            return result
            
    except httpx.HTTPStatusError as e:
        raise ValueError(f"HTTP请求错误: {e.response.status_code}")
    except httpx.RequestError as e:
        raise ValueError(f"网络请求错误: {str(e)}")
    except Exception as e:
        raise ValueError(f"天气服务错误: {str(e)}")

async def mock_external_weather_service_fallback(latitude: float, longitude: float, units: Optional[str], lang: Optional[str]) -> Dict[str, Any]:
    """
    Fallback mock function when OpenWeatherMap API is not available.
    """
    print(f"使用模拟天气数据: Lat={latitude}, Lon={longitude}, Units={units}, Lang={lang}")
    
    temp_unit = "celsius" if units == "metric" else "fahrenheit"
    
    # 根据位置返回不同的模拟数据
    if abs(latitude - 31.2304) < 0.01 and abs(longitude - 121.4737) < 0.01:
        # 上海的模拟数据
        return {
            "location_name": "上海市",
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "temperature": {"current": 22.5, "feels_like": 23.0, "min": 20.0, "max": 25.0, "unit": temp_unit},
            "weather": {"main_condition": "Clouds", "description": "多云" if lang in ["zh-CN", "zh_cn"] else "Cloudy", "icon_code": "04d"},
            "humidity_percent": 75,
            "wind": {"speed_mps": 3.5, "direction_deg": 180, "direction_abbr": "S"},
            "pressure_hpa": 1012,
            "visibility_km": 10,
            "sunrise_utc": "2023-10-27T22:00:00Z",
            "sunset_utc": "2023-10-28T09:00:00Z",
            "timestamp_utc": "2023-10-27T10:30:00Z"
        }
    elif abs(latitude - 39.9042) < 0.01 and abs(longitude - 116.4074) < 0.01:
        # 北京的模拟数据
        return {
            "location_name": "北京市",
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "temperature": {"current": 18.0, "feels_like": 17.5, "min": 15.0, "max": 21.0, "unit": temp_unit},
            "weather": {"main_condition": "Clear", "description": "晴朗" if lang in ["zh-CN", "zh_cn"] else "Clear sky", "icon_code": "01d"},
            "humidity_percent": 45,
            "wind": {"speed_mps": 2.8, "direction_deg": 270, "direction_abbr": "W"},
            "pressure_hpa": 1018,
            "visibility_km": 15,
            "sunrise_utc": "2023-10-27T22:30:00Z",
            "sunset_utc": "2023-10-28T09:30:00Z",
            "timestamp_utc": "2023-10-27T11:15:00Z"
        }
    else:
        # 通用模拟数据
        return {
            "location_name": f"位置 ({latitude:.2f},{longitude:.2f})",
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "temperature": {"current": 20.0, "feels_like": 21.0, "min": 16.0, "max": 24.0, "unit": temp_unit},
            "weather": {"main_condition": "Clear", "description": "晴朗" if lang in ["zh-CN", "zh_cn"] else "Clear sky", "icon_code": "01d"},
            "humidity_percent": 60,
            "wind": {"speed_mps": 2.0, "direction_deg": 90, "direction_abbr": "E"},
            "pressure_hpa": 1015,
            "visibility_km": 12,
            "sunrise_utc": "2023-10-27T21:00:00Z",
            "sunset_utc": "2023-10-28T10:00:00Z",
            "timestamp_utc": "2023-10-27T11:00:00Z"
        }

@app.get(
    "/api/v1/weather/current",
    response_model=CurrentWeatherResponse,
    summary="Get Current Weather",
    description="Retrieves the current weather conditions for a given geographic coordinate.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid coordinates provided"},
        503: {"model": ErrorResponse, "description": "Weather service error"}
    }
)
async def get_current_weather(
    latitude: float = Query(..., example=31.2304, description="Latitude of the location."),
    longitude: float = Query(..., example=121.4737, description="Longitude of the location."),
    units: Optional[str] = Query("metric", enum=["metric", "imperial"], description="Temperature units ('metric' for Celsius, 'imperial' for Fahrenheit)."),
    lang: Optional[str] = Query(None, example="zh_cn", description="Preferred language for weather descriptions (e.g., 'en', 'zh_cn').")
):
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_COORDINATES", "message": "提供的经纬度坐标无效。"}}
        )

    try:
        # 首先尝试调用真实的OpenWeatherMap API
        try:
            weather_result = await openweathermap_weather_service(latitude, longitude, units, lang)
            print(f"成功获取OpenWeatherMap真实数据: {weather_result.get('location_name', '未知')}")
        except ValueError as e:
            error_msg = str(e)
            # 如果OpenWeatherMap API失败（如API密钥未激活或HTTP错误），回退到模拟数据
            if any(keyword in error_msg for keyword in ["Invalid API key", "401", "HTTP请求错误: 401", "API错误"]):
                print(f"OpenWeatherMap API密钥问题，使用模拟数据: {error_msg}")
                weather_result = await mock_external_weather_service_fallback(latitude, longitude, units, lang)
            else:
                raise e
        
        # Construct Pydantic models from service response
        return CurrentWeatherResponse(
            data=WeatherData(**weather_result),
            message="当前天气数据获取成功。"
        )
    except ValueError as e: # Catching specific error from mock
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "WEATHER_SERVICE_ERROR", "message": f"从外部天气服务获取数据失败: {e}"}}
        )
    except Exception as e:
        # Generic internal error
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_SERVER_ERROR", "message": f"An unexpected error occurred: {e}"}}
        )

# --- To run this application ---
# 1. Save this code as main.py
# 2. Create a .env file in the same directory with:
#    OPENAI_API_KEY="your_actual_openai_api_key_or_placeholder"
#    AMAP_API_KEY="your_actual_amap_api_key_or_placeholder"
#    OPENWEATHERMAP_API_KEY="your_actual_openweathermap_api_key_or_placeholder"
# 3. Install dependencies: pip install fastapi uvicorn python-dotenv pydantic httpx
# 4. Run with Uvicorn: uvicorn main:app --reload