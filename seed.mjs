import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  const departments = [
    { code: 'reception', name: 'Ro\'yxatxona (Qabulxona)', type: 'general', order: 1, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { code: 'kassa', name: 'Kassa', type: 'general', order: 2, bg: 'bg-blue-50', color: 'text-blue-600' },
    { code: 'shifokorlar', name: 'Shifokorlar ko\'rigi', type: 'general', order: 3, bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { code: 'uzi', name: 'UZI', type: 'general', order: 4, bg: 'bg-purple-50', color: 'text-purple-600' },
    { code: 'laboratoriya', name: 'Laboratoriya', type: 'general', order: 5, bg: 'bg-rose-50', color: 'text-rose-600' },
    { code: 'tugruq', name: 'Tug\'ruq bo\'limi', type: 'floor', order: 6, bg: 'bg-pink-50', color: 'text-pink-600' },
    { code: 'neonatologiya', name: 'Neonatologiya (Bolalar)', type: 'floor', order: 7, bg: 'bg-cyan-50', color: 'text-cyan-600' },
    { code: 'operatsiya', name: 'Operatsiya / Reanimatsiya', type: 'floor', order: 8, bg: 'bg-red-50', color: 'text-red-600' },
    { code: '3-qavat', name: '3-qavat (Statsionar)', type: 'floor', order: 9, bg: 'bg-orange-50', color: 'text-orange-600' },
    { code: '4-qavat', name: '4-qavat (Statsionar)', type: 'floor', order: 10, bg: 'bg-amber-50', color: 'text-amber-600' },
    { code: '5-qavat', name: '5-qavat (Statsionar)', type: 'floor', order: 11, bg: 'bg-yellow-50', color: 'text-yellow-600' },
    { code: '6-qavat', name: '6-qavat (Statsionar)', type: 'floor', order: 12, bg: 'bg-lime-50', color: 'text-lime-600' }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }
  console.log("Departments seeded.");

  const criteriaList = [
    // General (Reception, Kassa, UZI, Lab)
    { name: "Xodimning muomalasi", depts: ['reception', 'kassa', 'uzi', 'laboratoriya'] },
    { name: "Xizmat ko'rsatish tezligi", depts: ['reception', 'kassa', 'uzi', 'laboratoriya'] },
    { name: "Navbatlarning yo'qligi", depts: ['reception', 'kassa', 'uzi', 'laboratoriya'] },
    
    // Doctor
    { name: "Shifokorning malakasi va yordami", depts: ['shifokorlar'] },
    { name: "Shifokorning muomalasi", depts: ['shifokorlar'] },
    { name: "Konsultatsiya sifati", depts: ['shifokorlar'] },

    // Floors & Wards (Statsionar)
    { name: "Palata tozaligi va sharoiti", depts: ['tugruq', 'neonatologiya', 'operatsiya', '3-qavat', '4-qavat', '5-qavat', '6-qavat'] },
    { name: "Shifokorlar e'tibori", depts: ['tugruq', 'neonatologiya', 'operatsiya', '3-qavat', '4-qavat', '5-qavat', '6-qavat'] },
    { name: "Hamshiralar muomalasi va tezkorligi", depts: ['tugruq', 'neonatologiya', 'operatsiya', '3-qavat', '4-qavat', '5-qavat', '6-qavat'] },
    { name: "Ovqat sifati", depts: ['3-qavat', '4-qavat', '5-qavat', '6-qavat'] }
  ];

  for (const c of criteriaList) {
    const createdCriterion = await prisma.criterion.upsert({
      where: { name: c.name },
      update: { name: c.name },
      create: { name: c.name }
    });

    // Link to departments
    for (const dCode of c.depts) {
      await prisma.department.update({
        where: { code: dCode },
        data: {
          criteria: {
            connect: { id: createdCriterion.id }
          }
        }
      });
    }
  }

  console.log("Criteria seeded.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
