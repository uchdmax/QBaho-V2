const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.ratingValue.deleteMany();
  await prisma.rating.deleteMany();
  console.log("Barcha eski baholar tozalandi.");

  await prisma.criterion.deleteMany();
  console.log("Eski mezonlar o`chirildi.");

  const ambulatorData = [
    { name: "Xodimlarning muomalasi qanday bo`ldi?", options: JSON.stringify(["Juda yaxshi", "O`rtacha", "Qo`pol"]) },
    { name: "Navbat kutish vaqtingiz", options: JSON.stringify(["Tez kirdim", "Biroz kutdim", "Uzoq kutdim"]) },
    { name: "Xonaning tozaligi", options: JSON.stringify(["Juda toza", "O`rtacha", "Qoniqarsiz"]) }
  ];

  const statsionarData = [
    { name: "Shifokor xonangizga necha marta kirdi?", options: JSON.stringify(["2 va undan ko`p", "1 marta", "Kirmadi"]) },
    { name: "Hamshiralar chaqirganda tez kelishdimi?", options: JSON.stringify(["Tez kelishdi", "Kechikib kelishdi", "Kelishmadi"]) },
    { name: "Xonangiz tozaligi qanday?", options: JSON.stringify(["Juda toza", "O`rtacha", "Iflos"]) },
    { name: "Ovqat sifati qanday?", options: JSON.stringify(["Juda mazali", "O`rtacha", "Yoqmadi"]) }
  ];

  const createdAmbulator = [];
  for (const c of ambulatorData) {
    createdAmbulator.push(await prisma.criterion.create({ data: c }));
  }

  const createdStatsionar = [];
  for (const c of statsionarData) {
    createdStatsionar.push(await prisma.criterion.create({ data: c }));
  }

  const departments = await prisma.department.findMany();
  for (const dept of departments) {
    const toConnect = dept.type === "general" ? createdAmbulator : createdStatsionar;
    await prisma.department.update({
      where: { id: dept.id },
      data: {
        criteria: {
          connect: toConnect.map(c => ({ id: c.id }))
        }
      }
    });
  }

  console.log("Muvaffaqiyatli yakunlandi!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
