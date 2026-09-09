import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — faqat admin
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const criteria = await prisma.criterion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(criteria);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch criteria' }, { status: 500 });
  }
}

// POST — faqat admin
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const { name, options } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const criterion = await prisma.criterion.create({
      data: { 
        name,
        options: options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null
      }
    });
    return NextResponse.json(criterion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create criterion' }, { status: 500 });
  }
}
