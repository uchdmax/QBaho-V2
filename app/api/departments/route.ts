import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — ochiq (mijozlar va adminlar uchun kerak)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';
  const where = all ? {} : { active: true };

  const depts = await prisma.department.findMany({
    where,
    orderBy: { order: 'asc' },
    include: { 
      criteria: true,
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true } }
    }
  });
  return NextResponse.json(depts);
}

// POST — faqat admin
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  const { name, code, type, floor, icon, color, bg, order, criteriaIds, parentId } = await request.json();
  const dept = await prisma.department.create({
    data: {
      name,
      code,
      type,
      floor: floor !== undefined && floor !== null && floor !== '' ? Number(floor) : null,
      icon: icon ?? null,
      color: color ?? null,
      bg: bg ?? null,
      order: order !== undefined && order !== null && order !== '' ? Number(order) : 0,
      active: true,
      parentId: parentId ? Number(parentId) : null,
      criteria: criteriaIds ? { connect: criteriaIds.map((id: number) => ({ id })) } : undefined
    },
    include: {
      criteria: true,
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true } }
    }
  });
  return NextResponse.json(dept);
}

// PUT — faqat admin
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get('id');

  const body = await request.json().catch(() => ({}));
  if (!id) id = body.id;

  if (!id) return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });

  const { id: _bodyId, criteriaIds, parent, children, parentId, ...updates } = body;
  
  const parsedId = parseInt(id as string);
  const parsedParentId = parentId ? Number(parentId) : null;
  if (parsedParentId && parsedParentId === parsedId) {
    return NextResponse.json({ error: "Bo'lim o'ziga ota bo'lim bo'la olmaydi" }, { status: 400 });
  }

  const dept = await prisma.department.update({
    where: { id: parsedId },
    data: {
      ...updates,
      parentId: parsedParentId,
      criteria: criteriaIds ? { set: criteriaIds.map((cId: number) => ({ id: cId })) } : undefined
    },
    include: {
      criteria: true,
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true } }
    }
  });
  return NextResponse.json(dept);
}

// DELETE — faqat admin
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get('id');

  const body = await request.json().catch(() => ({}));
  if (!id) id = body.id;

  if (!id) return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });

  if (body.soft) {
    const dept = await prisma.department.update({
      where: { id: parseInt(id as string) },
      data: { active: false },
    });
    return NextResponse.json(dept);
  }
  
  await prisma.department.delete({ where: { id: parseInt(id as string) } });
  return NextResponse.json({ success: true });
}
