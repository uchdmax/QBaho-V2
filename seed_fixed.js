const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const depts = [
  // -1 qavat (Podval)
  { code: 'laboratoriya', name: 'Laboratoriya', type: 'general', floor: -1, icon: 'flask', color: 'blue' },
  
  // 1-qavat
  { code: 'kassa', name: 'Kassa', type: 'general', floor: 1, icon: 'credit-card', color: 'green' },
  { code: 'reception', name: 'Registratura (Reception)', type: 'general', floor: 1, icon: 'clipboard', color: 'purple' },
  { code: 'qabulxona', name: 'Qabulxona', type: 'general', floor: 1, icon: 'door-open', color: 'red' },
  { code: 'uzi', name: 'UZI', type: 'general', floor: 1, icon: 'monitor', color: 'indigo' },
  { code: 'shifokorlar', name: 'Shifokorlar', type: 'general', floor: 1, icon: 'stethoscope', color: 'cyan' },
  
  // 2-qavat
  { code: 'tugruq', name: 'Rod zal (Tug\'ruq)', type: 'floor', floor: 2, icon: 'baby', color: 'pink' },
  { code: 'neonatologiya', name: 'Bolalar bo\'limi', type: 'floor', floor: 2, icon: 'heart', color: 'rose' },
  { code: 'reanimatsiya', name: 'Reanimatsiya', type: 'floor', floor: 2, icon: 'activity', color: 'red' },
  { code: 'operatsiya', name: 'Oper blok', type: 'general', floor: 2, icon: 'scissors', color: 'orange' },
  
  // Qolganlari
  { code: '3-qavat', name: '3-qavat', type: 'floor', floor: 3, icon: 'building', color: 'teal' },
  { code: '4-qavat', name: '4-qavat', type: 'floor', floor: 4, icon: 'building', color: 'teal' },
  { code: '5-qavat', name: '5-qavat', type: 'floor', floor: 5, icon: 'building', color: 'teal' },
  { code: '6-qavat', name: '6-qavat', type: 'floor6', floor: 6, icon: 'building', color: 'teal' },
];

async function main() {
  await prisma.department.deleteMany({});
  
  for (let i = 0; i < depts.length; i++) {
    const d = depts[i];
    await prisma.department.create({
      data: {
        code: d.code,
        name: d.name,
        type: d.type,
        floor: d.floor,
        icon: d.icon,
        color: d.color,
        bg: d.color,
        order: i,
        active: true
      }
    });
  }
  console.log('Seeded fixed departments successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
