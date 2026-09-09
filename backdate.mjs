import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ratings = await prisma.rating.findMany();
  
  let updated = 0;
  for (let i = 0; i < ratings.length; i++) {
    // Leave the first 46 ratings as today
    if (i < 46) continue;
    
    // Shift next 50 to 3 days ago (this week)
    if (i >= 46 && i < 96) {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      await prisma.rating.update({
        where: { id: ratings[i].id },
        data: { createdAt: d }
      });
      updated++;
    }
    
    // Shift the rest (50 ratings) to 15 days ago (this month, but not this week)
    if (i >= 96) {
      const d = new Date();
      d.setDate(d.getDate() - 15);
      await prisma.rating.update({
        where: { id: ratings[i].id },
        data: { createdAt: d }
      });
      updated++;
    }
  }
  
  console.log(`Successfully backdated ${updated} ratings for testing filters.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
