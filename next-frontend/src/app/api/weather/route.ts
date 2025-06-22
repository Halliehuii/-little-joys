import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染，避免静态生成问题
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lng');
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: '缺少坐标参数' },
        { status: 400 }
      );
    }

    // 使用环境变量获取OpenWeatherMap API密钥
    const openWeatherKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!openWeatherKey) {
      return NextResponse.json(
        { error: '天气服务配置错误' },
        { status: 500 }
      );
    }
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=metric&lang=zh_cn`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API调用失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.weather && data.main) {
      const temperature = Math.round(data.main.temp);
      const description = data.weather[0].description;
      const weatherMain = data.weather[0].main;
      
      // 获取天气图标
      const getWeatherIcon = (weatherMain: string): string => {
        const iconMap: { [key: string]: string } = {
          'Clear': '☀️',
          'Clouds': '⛅',
          'Rain': '🌧️',
          'Drizzle': '🌦️',
          'Thunderstorm': '⛈️',
          'Snow': '❄️',
          'Mist': '🌫️',
          'Fog': '🌫️',
          'Haze': '🌫️'
        };
        return iconMap[weatherMain] || '🌤️';
      };
      
      const icon = getWeatherIcon(weatherMain);
      const weatherString = `${icon} ${description} ${temperature}°C`;
      
      return NextResponse.json({
        success: true,
        weather: weatherString,
        details: {
          temperature,
          description,
          icon,
          location: data.name || '当前位置'
        },
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        source: 'OpenWeatherMap'
      });
    } else {
      return NextResponse.json(
        { error: '天气数据解析失败', details: data },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('天气API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 