# 技术设计文档 (Tech Spec) - 附加功能

本文档定义了为"生活小确幸"应用新增的实时定位和天气相关功能的API接口。
这些功能旨在增强用户记录和分享幸福瞬间的体验。

## 1. 反向地理编码 (Reverse Geocoding)

**目的**: 将用户的地理坐标 (经纬度) 转换为人类可读的地址或地点描述，用户可以选择将此信息附加到他们发布的"幸福小事"中。

**接口名称**: `ReverseGeocodeLocation`

**请求路径和方法**: `GET /api/v1/location/reverse-geocode`

**请求参数**:

| 参数名    | 类型   | 是否必需 | 描述                                                                 |
| :-------- | :----- | :------- | :------------------------------------------------------------------- |
| `latitude`  | number | 是       | 地点的纬度坐标。                                                       |
| `longitude` | number | 是       | 地点的经度坐标。                                                       |
| `lang`      | string | 否       | 返回结果的优选语言代码 (例如: 'en', 'zh-CN')。默认为服务器配置或英语。 |

**依赖的外部服务**:

*   第三方地理编码服务 (例如: Nominatim, Google Geocoding API, Mapbox Geocoding API等。具体选择将在实施阶段根据免费额度、使用限制和准确性确定)。

**示例成功返回 JSON (200 OK)**:

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

**示例错误返回 JSON (例如: 400 Bad Request, 503 Service Unavailable)**:

```json
{
  "error": {
    "code": "INVALID_PARAMETERS", 
    "message": "纬度和经度为必填项，且必须是有效的数字。"
  }
}
```
```json
{
  "error": {
    "code": "GEOCODING_SERVICE_UNAVAILABLE",
    "message": "地理编码服务当前不可用，请稍后再试。"
  }
}
```

## 2. 获取当前天气状况

**目的**: 根据用户提供的地理坐标 (经纬度) 获取当前的天气状况。用户可以选择将此天气信息附加到他们发布的"幸福小事"中。

**接口名称**: `GetCurrentWeather`

**请求路径和方法**: `GET /api/v1/weather/current`

**请求参数**:

| 参数名    | 类型   | 是否必需 | 描述                                                                       |
| :-------- | :----- | :------- | :------------------------------------------------------------------------- |
| `latitude`  | number | 是       | 地点的纬度坐标。                                                             |
| `longitude` | number | 是       | 地点的经度坐标。                                                             |
| `units`     | string | 否       | 温度单位 ('metric' 表示摄氏度, 'imperial' 表示华氏度)。默认为 'metric'。     |
| `lang`      | string | 否       | 天气描述的优选语言代码 (例如: 'en', 'zh_cn')。默认为服务器配置或英语。        |

**依赖的外部服务**:

*   第三方天气 API (例如: OpenWeatherMap API, WeatherAPI.com, AccuWeather API等。具体选择将在实施阶段根据功能、免费额度及可靠性确定)。

**示例成功返回 JSON (200 OK)**:

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

**示例错误返回 JSON (例如: 400 Bad Request, 503 Service Unavailable)**:

```json
{
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "提供的经纬度坐标无效。"
  }
}
```
```json
{
  "error": {
    "code": "WEATHER_SERVICE_ERROR",
    "message": "从外部天气服务获取数据失败，请稍后再试。"
  }
}
``` 