# 生活小确幸 API 文档

## 📖 概述

**生活小确幸 API** 是一个用于记录和分享生活中小快乐瞬间的后端服务，提供位置解析和天气查询功能。

- **API 版本**: 0.1.0
- **基础 URL**: `http://localhost:8000` (开发环境)
- **技术栈**: FastAPI + Python 3.8+

## 🔧 环境配置

### 环境变量 (.env 文件)
```bash
# OpenAI API密钥 (可选，用于AI功能扩展)
OPENAI_API_KEY=your_openai_api_key

# 高德地图API密钥 (必需，用于地理编码)
AMAP_API_KEY=your_amap_api_key

# OpenWeatherMap API密钥 (必需，用于天气数据)
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
```

### 安装依赖
```bash
pip install fastapi uvicorn python-dotenv pydantic httpx
```

### 启动服务
```bash
uvicorn main:app --reload
```

## 🌐 API 端点

### 1. 逆地理编码 (位置解析)

将经纬度坐标转换为人类可读的地址信息。

**端点**: `GET /api/v1/location/reverse-geocode`

#### 请求参数
| 参数名 | 类型 | 是否必需 | 描述 | 示例值 |
|--------|------|----------|------|--------|
| `latitude` | float | 是 | 纬度坐标 (-90 到 90) | 31.2304 |
| `longitude` | float | 是 | 经度坐标 (-180 到 180) | 121.4737 |
| `lang` | string | 否 | 返回语言偏好 | "zh-CN" 或 "en" |

#### 请求示例
```http
GET /api/v1/location/reverse-geocode?latitude=31.2304&longitude=121.4737&lang=zh-CN
```

#### 响应格式

**成功响应 (200 OK):**
```json
{
  "data": {
    "formatted_address": "人民广场, 黄浦区, 上海市, 中国",
    "address_components": {
      "road": "人民大道",
      "neighbourhood": "黄浦区政府",
      "suburb": "黄浦区",
      "city": "上海市",
      "state": "上海市",
      "postcode": "200000",
      "country": "中国",
      "country_code": "cn"
    },
    "coordinates": {
      "latitude": 31.2304,
      "longitude": 121.4737
    }
  },
  "message": "位置详情获取成功。"
}
```

**错误响应:**
```json
{
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "提供的经纬度坐标无效。"
  }
}
```

#### 错误码说明
- **400 Bad Request**: 无效的坐标参数
- **503 Service Unavailable**: 地理编码服务不可用

---

### 2. 获取当前天气

根据地理坐标获取当前天气状况信息。

**端点**: `GET /api/v1/weather/current`

#### 请求参数
| 参数名 | 类型 | 是否必需 | 描述 | 可选值 | 示例值 |
|--------|------|----------|------|--------|--------|
| `latitude` | float | 是 | 纬度坐标 (-90 到 90) | - | 31.2304 |
| `longitude` | float | 是 | 经度坐标 (-180 到 180) | - | 121.4737 |
| `units` | string | 否 | 温度单位 | "metric", "imperial" | "metric" |
| `lang` | string | 否 | 天气描述语言 | "zh_cn", "en" | "zh_cn" |

#### 请求示例
```http
GET /api/v1/weather/current?latitude=31.2304&longitude=121.4737&units=metric&lang=zh_cn
```

#### 响应格式

**成功响应 (200 OK):**
```json
{
  "data": {
    "location_name": "上海市",
    "coordinates": {
      "latitude": 31.2304,
      "longitude": 121.4737
    },
    "temperature": {
      "current": 22.5,
      "feels_like": 23.0,
      "min": 20.0,
      "max": 25.0,
      "unit": "celsius"
    },
    "weather": {
      "main_condition": "Clouds",
      "description": "多云",
      "icon_code": "04d"
    },
    "humidity_percent": 75,
    "wind": {
      "speed_mps": 3.5,
      "direction_deg": 180,
      "direction_abbr": "S"
    },
    "pressure_hpa": 1012,
    "visibility_km": 10,
    "sunrise_utc": "2023-10-27T22:00:00Z",
    "sunset_utc": "2023-10-28T09:00:00Z",
    "timestamp_utc": "2023-10-27T10:30:00Z"
  },
  "message": "当前天气数据获取成功。"
}
```

**错误响应:**
```json
{
  "error": {
    "code": "WEATHER_SERVICE_ERROR",
    "message": "从外部天气服务获取数据失败: API密钥无效"
  }
}
```

#### 错误码说明
- **400 Bad Request**: 无效的坐标参数
- **503 Service Unavailable**: 天气服务不可用
- **500 Internal Server Error**: 服务器内部错误

## 📋 数据模型

### Coordinates (坐标)
```json
{
  "latitude": 31.2304,   // 纬度
  "longitude": 121.4737  // 经度
}
```

### AddressComponents (地址组件)
```json
{
  "road": "人民大道",           // 道路名称
  "neighbourhood": "黄浦区政府", // 社区/街区
  "suburb": "黄浦区",          // 区域
  "city": "上海市",            // 城市
  "state": "上海市",           // 省/州
  "postcode": "200000",        // 邮政编码
  "country": "中国",           // 国家
  "country_code": "cn"         // 国家代码
}
```

### Temperature (温度信息)
```json
{
  "current": 22.5,     // 当前温度
  "feels_like": 23.0,  // 体感温度
  "min": 20.0,         // 最低温度
  "max": 25.0,         // 最高温度
  "unit": "celsius"    // 温度单位
}
```

### WeatherCondition (天气状况)
```json
{
  "main_condition": "Clouds",  // 主要天气状况
  "description": "多云",       // 天气描述
  "icon_code": "04d"          // 天气图标代码
}
```

### Wind (风力信息)
```json
{
  "speed_mps": 3.5,        // 风速 (米/秒)
  "direction_deg": 180,    // 风向角度
  "direction_abbr": "S"    // 风向缩写
}
```

## 🔍 使用示例

### 1. 获取位置信息
```python
import httpx

async def get_location(lat, lon):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/v1/location/reverse-geocode",
            params={
                "latitude": lat,
                "longitude": lon,
                "lang": "zh-CN"
            }
        )
        return response.json()

# 使用示例
location_info = await get_location(31.2304, 121.4737)
print(location_info["data"]["formatted_address"])
```

### 2. 获取天气信息
```python
async def get_weather(lat, lon):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/v1/weather/current",
            params={
                "latitude": lat,
                "longitude": lon,
                "units": "metric",
                "lang": "zh_cn"
            }
        )
        return response.json()

# 使用示例
weather_info = await get_weather(31.2304, 121.4737)
print(f"当前温度: {weather_info['data']['temperature']['current']}°C")
```

### 3. JavaScript (前端使用)
```javascript
// 获取位置信息
async function getLocation(lat, lon) {
    const response = await fetch(
        `/api/v1/location/reverse-geocode?latitude=${lat}&longitude=${lon}&lang=zh-CN`
    );
    return await response.json();
}

// 获取天气信息
async function getWeather(lat, lon) {
    const response = await fetch(
        `/api/v1/weather/current?latitude=${lat}&longitude=${lon}&units=metric&lang=zh_cn`
    );
    return await response.json();
}

// 使用示例
getLocation(31.2304, 121.4737)
    .then(data => console.log(data.data.formatted_address));

getWeather(31.2304, 121.4737)
    .then(data => console.log(`${data.data.temperature.current}°C`));
```

## 🛡️ 错误处理

### 通用错误响应格式
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "详细错误信息"
  }
}
```

### 常见错误码
| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| `INVALID_COORDINATES` | 400 | 坐标参数无效 |
| `GEOCODING_SERVICE_ERROR` | 503 | 地理编码服务错误 |
| `WEATHER_SERVICE_ERROR` | 503 | 天气服务错误 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

## 🌍 支持的地区

### 地理编码服务
- **中国境内**: 使用高德地图API，提供详细的中文地址信息
- **海外地区**: 使用模拟服务，提供基础的英文地址信息

### 天气服务
- **全球范围**: 使用OpenWeatherMap API，支持全球天气数据查询
- **语言支持**: 中文 (zh_cn) 和英文 (en)

## 📊 API 限制

### 请求频率
- 建议: 每秒不超过10次请求
- 具体限制取决于第三方API服务商的配额

### 数据精度
- **位置精度**: 精确到街道级别
- **天气数据**: 实时更新，精度取决于气象站密度

## 🔄 服务状态

API服务启动时会检查并显示各项配置状态：

```
🚀 生活小确幸 API 服务启动成功
🔑 API密钥配置状态:
   - OpenAI API: ✅ 已配置 / ❌ 未配置
   - 高德地图 API: ✅ 已配置 / ❌ 未配置
   - OpenWeatherMap API: ✅ 已配置 / ❌ 未配置
```

## 📝 更新日志

### v0.1.0 (当前版本)
- ✅ 实现逆地理编码功能
- ✅ 实现天气查询功能
- ✅ 支持中英文响应
- ✅ 完善错误处理机制
- ✅ 添加CORS跨域支持

## 📞 技术支持

如果您在使用过程中遇到问题，请检查：

1. **环境变量配置** - 确保API密钥正确设置
2. **网络连接** - 确保可以访问第三方API服务
3. **参数格式** - 确保请求参数符合要求
4. **服务状态** - 检查服务启动日志中的配置状态

---

*本文档最后更新时间: 2023-10-27* 