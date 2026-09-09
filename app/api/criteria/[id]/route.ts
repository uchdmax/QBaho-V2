import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT — faqat admin
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, options } = await request.json();
    const criterion = await prisma.criterion.update({
      where: { id: parseInt(id) },
      data: { 
        name,
        options: options !== undefined ? (typeof options === 'string' ? options : JSON.stringify(options)) : undefined
      }
    });
    return NextResponse.json(criterion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update criterion' }, { status: 500 });
  }
}

// DELETE — faqat admin
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.criterion.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete criterion' }, { status: 500 });
  }
}
