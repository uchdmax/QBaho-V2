import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const dept = await prisma.department.findUnique({ where: { code: 'reanimatsiya' } });
    if (dept) {
      // First delete related criteria links if any, though prisma handles Cascade maybe? 
      // Department has `criteria Criterion[]` which is implicit m2m. Prisma handles implicit m2m cleanup automatically when a record is deleted.
      // But let's just delete the department.
      await prisma.department.delete({ where: { code: 'reanimatsiya' } });
      console.log('Deleted duplicate "reanimatsiya" department.');
    } else {
      console.log('Duplicate "reanimatsiya" not found.');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
