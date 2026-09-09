import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const ratings = await prisma.rating.findMany({
    include: { values: { include: { criterion: true } } }
  });
  const employeesCount = await prisma.employee.count();
  
  const allDepts = await prisma.department.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
    include: { 
      criteria: true,
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true } }
    }
  });

  return (
    <DashboardClient 
      initialRatings={ratings} 
      employeesCount={employeesCount} 
      allDepts={allDepts} 
    />
  );
}
