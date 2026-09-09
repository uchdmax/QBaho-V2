import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendReport } from '@/lib/reports';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const { period } = await request.json();
    const result = await sendReport(period || 'daily');
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Report send error:', error);
    return NextResponse.json({ error: error.message || 'Hisobot yuborishda xatolik' }, { status: 500 });
  }
}
