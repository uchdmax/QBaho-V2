import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting demo seeding...");

  // 1. Clear existing dynamic data (but keep departments)
  await prisma.ratingValue.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.employee.deleteMany({});
  
  // Detach all criteria from departments, then delete criteria
  const depts = await prisma.department.findMany();
  for (const dept of depts) {
    await prisma.department.update({
      where: { id: dept.id },
      data: { criteria: { set: [] } }
    });
  }
  await prisma.criterion.deleteMany({});

  console.log("Cleared old data.");

  // 2. Create Criteria
  const criteriaNames = [
    "Shifokor ko'rigi va muomalasi",
    "Hamshiralar e'tibori va tezkorligi",
    "Bolalar hamshirasi parvarishi",
    "Xona tozaligi va gigiyena",
    "Oshxona ovqatlari sifati",
    "Qabulxona xizmati tezligi",
    "Kassa xizmati madaniyati",
    "Laboratoriya aniqligi va tezligi",
    "UZI mutaxassisi maslahati",
    "Reanimatsiya xodimlari tezkorligi",
    "Umumiy qulaylik va muhit"
  ];

  const criteriaMap: Record<string, any> = {};
  for (const name of criteriaNames) {
    const c = await prisma.criterion.create({ data: { name } });
    criteriaMap[name] = c;
  }

  // 3. Assign criteria to departments
  const assignCriteria = async (deptCode: string, cNames: string[]) => {
    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    if (dept) {
      await prisma.department.update({
        where: { id: dept.id },
        data: {
          criteria: {
            connect: cNames.map(name => ({ id: criteriaMap[name].id }))
          }
        }
      });
    }
  };

  // Floor departments (statsionar)
  const floorCriteria = [
    "Shifokor ko'rigi va muomalasi",
    "Hamshiralar e'tibori va tezkorligi",
    "Bolalar hamshirasi parvarishi",
    "Xona tozaligi va gigiyena",
    "Oshxona ovqatlari sifati"
  ];
  await assignCriteria('3-qavat', floorCriteria);
  await assignCriteria('4-qavat', floorCriteria);
  await assignCriteria('5-qavat', floorCriteria);
  await assignCriteria('6-qavat', floorCriteria.filter(c => c !== "Bolalar hamshirasi parvarishi")); // oper blok
  await assignCriteria('2-qavat', floorCriteria); // bolalar bo'limi

  // General departments
  await assignCriteria('registratura', ["Qabulxona xizmati tezligi", "Umumiy qulaylik va muhit"]);
  await assignCriteria('kassa', ["Kassa xizmati madaniyati", "Umumiy qulaylik va muhit"]);
  await assignCriteria('laboratoriya', ["Laboratoriya aniqligi va tezligi", "Hamshiralar e'tibori va tezkorligi"]);
  await assignCriteria('uzi', ["UZI mutaxassisi maslahati", "Qabulxona xizmati tezligi"]);

  console.log("Criteria assigned.");

  // 4. Create Employees
  const deptsDb = await prisma.department.findMany();
  const deptCodeToId: Record<string, number> = {};
  deptsDb.forEach(d => deptCodeToId[d.code] = d.id);

  const employees = [
    { firstName: "Alisher", lastName: "Tursunov", departmentId: deptCodeToId["3-qavat"], position: "Shifokor" },
    { firstName: "Nargiza", lastName: "Karimova", departmentId: deptCodeToId["3-qavat"], position: "Hamshira" },
    { firstName: "Zuhra", lastName: "Ahmedova", departmentId: deptCodeToId["2-qavat"], position: "Bolalar hamshirasi" },
    { firstName: "Rustam", lastName: "Jalilov", departmentId: deptCodeToId["4-qavat"], position: "Shifokor" },
    { firstName: "Madina", lastName: "Ergasheva", departmentId: deptCodeToId["4-qavat"], position: "Hamshira" },
    { firstName: "Dilmurod", lastName: "Rahmonov", departmentId: deptCodeToId["5-qavat"], position: "Shifokor" },
    { firstName: "Sevara", lastName: "Qosimova", departmentId: deptCodeToId["6-qavat"], position: "Operatsiya hamshirasi" },
    { firstName: "Jamshid", lastName: "Usmonov", departmentId: deptCodeToId["laboratoriya"], position: "Laborant" },
    { firstName: "Oygul", lastName: "Murodova", departmentId: deptCodeToId["uzi"], position: "UZI mutaxassisi" },
    { firstName: "Gulnora", lastName: "Toxirova", departmentId: deptCodeToId["registratura"], position: "Qabulxona xodimi" },
    { firstName: "Sanjar", lastName: "Bekmurodov", departmentId: deptCodeToId["kassa"], position: "Kassir" },
  ];

  const empMap: Record<string, any> = {};
  for (const emp of employees) {
    const created = await prisma.employee.create({ data: emp });
    empMap[emp.firstName] = created;
  }

  console.log("Employees created.");

  // 5. Generate random ratings
  const activeDepts = await prisma.department.findMany({ include: { criteria: true } });
  let ratingCount = 0;

  const getRandScore = () => Math.floor(Math.random() * 2) + 4; // mostly 4 or 5
  
  for (const dept of activeDepts) {
    if (dept.criteria.length === 0) continue;
    
    const numRatings = Math.floor(Math.random() * 10) + 15; // 15-24 ratings per department
    for (let i = 0; i < numRatings; i++) {
      // Find a random employee for this dept
      const deptEmps = employees.filter(e => e.departmentId === dept.id).map(e => empMap[e.firstName].id);
      const empId = deptEmps.length > 0 && Math.random() > 0.3 ? deptEmps[Math.floor(Math.random() * deptEmps.length)] : null;
      
      const values = dept.criteria.map(c => ({
        criterionId: c.id,
        score: getRandScore()
      }));

      await prisma.rating.create({
        data: {
          department: dept.code,
          comment: Math.random() > 0.7 ? "Juda yaxshi xizmat, rahmat!" : null,
          employeeId: empId,
          values: {
            create: values
          }
        }
      });
      ratingCount++;
    }
  }

  console.log(`Generated ${ratingCount} demo ratings.`);
  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
