import { NextResponse } from 'next/server';
import { sendReport } from '@/lib/reports';

export async function GET() {
  try {
    const result = await sendReport('daily');
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Daily report cron error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send daily report' }, { status: 500 });
  }
}
