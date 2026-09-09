import { NextResponse } from 'next/server';
import { sendReport } from '@/lib/reports';

export async function GET() {
  try {
    const result = await sendReport('weekly');
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Weekly report cron error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send weekly report' }, { status: 500 });
  }
}
