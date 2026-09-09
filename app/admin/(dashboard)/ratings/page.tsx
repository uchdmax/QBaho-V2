import { prisma } from '@/lib/prisma';
import RatingsTable from './RatingsTable';

export const dynamic = 'force-dynamic';

export default async function RatingsPage() {
  const ratings = await prisma.rating.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      employee: true,
      values: { include: { criterion: true } }
    }
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Barcha Baholar</h2>
          <p className="text-slate-500">Mijozlar tomonidan qoldirilgan izohlar va baholar tarixi.</p>
        </div>
      </div>
      
      <RatingsTable ratings={ratings} />
    </div>
  );
}
