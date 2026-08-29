import { NextResponse } from 'next/server';
import { getLiveMonitoringData } from '@/servers/overview.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getLiveMonitoringData();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('API Error fetching live overview data:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data live monitoring' },
      { status: 500 },
    );
  }
}
