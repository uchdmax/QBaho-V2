import { prisma } from '@/lib/prisma';
import EmployeesClient from './EmployeesClient';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Xodimlar</h2>
        <p className="text-slate-500">Klinika xodimlarini bo'limlarga qarab qo'shishingiz va o'chirishingiz mumkin.</p>
      </div>
      
      <EmployeesClient initialEmployees={employees} />
    </div>
  );
}
