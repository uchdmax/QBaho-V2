import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await request.json();
    
    if (!['NEW', 'REVIEWED', 'RESOLVED'].includes(body.status)) {
      return NextResponse.json({ error: 'Noto\'g\'ri status' }, { status: 400 });
    }

    const rating = await prisma.rating.update({
      where: { id },
      data: { status: body.status }
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rating' },
      { status: 500 }
    );
  }
}
