import { NextRequest, NextResponse } from 'next/server';

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

    // 使用高德地图API获取地址
    const amapKey = '43b289c4722b57ab060dea621064e4a8';
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${amapKey}&radius=1000&extensions=all&batch=false&roadlevel=0`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`高德地图API调用失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      const province = addressComponent.province || '';
      const city = addressComponent.city || '';
      const district = addressComponent.district || '';
      const township = addressComponent.township || '';
      const street = addressComponent.streetNumber?.street || '';
      const number = addressComponent.streetNumber?.number || '';
      
      const formattedAddress = `${province}${city}${district}${township}${street}${number}`.replace(/undefined/g, '');
      
      return NextResponse.json({
        success: true,
        address: formattedAddress,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        source: '高德地图'
      });
    } else {
      return NextResponse.json(
        { error: '地址解析失败', details: data },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('地理编码API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 