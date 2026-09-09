import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — faqat admin
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const departmentIdStr = searchParams.get('departmentId');
    
    let employees;
    if (departmentIdStr) {
      employees = await prisma.employee.findMany({
        where: { departmentId: parseInt(departmentIdStr) },
        orderBy: { firstName: 'asc' }
      });
    } else {
      employees = await prisma.employee.findMany({
        orderBy: { departmentId: 'asc' }
      });
    }
    
    return NextResponse.json({ success: true, employees });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST — faqat admin
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const employee = await prisma.employee.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        departmentId: body.departmentId,
        position: body.position,
      },
    });

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save employee' },
      { status: 500 }
    );
  }
}
