import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/telegram';

export async function generateReportText(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  const now = new Date();
  let startDate = new Date();
  let title = '';

  if (period === 'daily') {
    startDate.setHours(0, 0, 0, 0);
    title = `🌅 <b>KUNLIK HISOBOT: ${now.toLocaleDateString('uz-UZ')}</b>`;
  } else if (period === 'weekly') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    title = `📅 <b>HAFTALIK HISOBOT: ${startDate.toLocaleDateString('uz-UZ')} – ${now.toLocaleDateString('uz-UZ')}</b>`;
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    title = `🗓 <b>OYLIK HISOBOT: Oxirgi 30 kun</b>`;
  }

  const allDepts = await prisma.department.findMany();
  const getDeptName = (code: string) => allDepts.find(d => d.code === code)?.name || code;

  const ratings = await prisma.rating.findMany({
    where: { createdAt: { gte: startDate } },
    include: { values: { include: { criterion: true } } }
  });

  if (ratings.length === 0) {
    return `${title}\n🏥 <b>Smile Baby Baholash Tizimi</b>\n━━━━━━━━━━━━━━━━━━━\n\nUshbu davrda hech qanday yangi baho kelib tushmadi.`;
  }

  let totalScoreSum = 0;
  let scoreCount = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let callRequests = 0;
  let voiceCount = 0;

  const deptScores: Record<string, { sum: number; count: number }> = {};
  const criteriaScores: Record<string, { sum: number; count: number }> = {};

  ratings.forEach(r => {
    let rScore = 0;
    if (r.overallScore) {
      if (r.overallScore === 4) rScore = 100;
      else if (r.overallScore === 3) rScore = 75;
      else if (r.overallScore === 2) rScore = 50;
      else rScore = 25;
    } else if (r.values && r.values.length > 0) {
      const avg = r.values.reduce((acc, v) => acc + v.score, 0) / r.values.length;
      rScore = (avg - 1) * 25;
    }

    totalScoreSum += rScore;
    scoreCount++;

    if (rScore >= 75) positiveCount++;
    else if (rScore >= 50) neutralCount++;
    else negativeCount++;

    if (r.phone) callRequests++;
    if (r.audioUrl) voiceCount++;

    // Bo'limlar
    const deptName = getDeptName(r.department);
    if (!deptScores[deptName]) deptScores[deptName] = { sum: 0, count: 0 };
    deptScores[deptName].sum += rScore;
    deptScores[deptName].count++;

    // Mezonlar
    if (r.values) {
      r.values.forEach(v => {
        const cName = v.criterion?.name || `Mezon #${v.criterionId}`;
        if (!criteriaScores[cName]) criteriaScores[cName] = { sum: 0, count: 0 };
        criteriaScores[cName].sum += (v.score - 1) * 25;
        criteriaScores[cName].count++;
      });
    }
  });

  const avgPercent = scoreCount > 0 ? (totalScoreSum / scoreCount).toFixed(1) : '0';
  const qualityStatus = Number(avgPercent) >= 80 ? "A'lo 🟢" : Number(avgPercent) >= 60 ? "Yaxshi 🟡" : "Qoniqarsiz 🔴";

  // Bo'limlar saralash
  const deptList = Object.entries(deptScores)
    .map(([name, s]) => ({ name, avg: s.sum / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg);

  const bestDept = deptList[0] ? `${deptList[0].name} (${deptList[0].avg.toFixed(0)}%)` : '-';
  const worstDept = (deptList.length > 1 && deptList[deptList.length - 1].avg < 80)
    ? `${deptList[deptList.length - 1].name} (${deptList[deptList.length - 1].avg.toFixed(0)}%)` 
    : null;

  let msg = `${title}\n🏥 <b>Smile Baby Baholash Tizimi</b>\n━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `📊 <b>UMUMIY KO'RSATKICHLAR:</b>\n`;
  msg += `• Jami baholar: <b>${ratings.length} ta</b>\n`;
  msg += `• O'rtacha sifat: <b>${avgPercent}% — ${qualityStatus}</b>\n`;
  msg += `• 🟢 Ijobiy (a'lo): <b>${positiveCount} ta</b>\n`;
  msg += `• 🟡 O'rtacha: <b>${neutralCount} ta</b>\n`;
  msg += `• 🔴 Salbiy (shikoyat): <b>${negativeCount} ta</b>\n`;

  if (callRequests > 0 || voiceCount > 0) {
    msg += `\n⚠️ <b>E'TIBOR TALAB HOLATLAR:</b>\n`;
    if (callRequests > 0) msg += `• 📞 Qo'ng'iroq kutayotganlar: <b>${callRequests} ta</b>\n`;
    if (voiceCount > 0) msg += `• 🎙 Ovozli shikoyatlar: <b>${voiceCount} ta</b>\n`;
  }

  msg += `\n🏆 <b>BO'LIMLAR NATIJASI:</b>\n`;
  msg += `• Eng yuqori: <b>${bestDept}</b>\n`;
  if (worstDept) {
    msg += `• E'tibor talab: <b>${worstDept}</b>\n`;
  }

  // Mezonlar saralash
  const critList = Object.entries(criteriaScores)
    .map(([name, s]) => ({ name, avg: s.sum / s.count }))
    .sort((a, b) => b.avg - a.avg);

  if (critList.length > 0) {
    msg += `\n🎯 <b>MEZONLAR TAHLILI:</b>\n`;
    critList.slice(0, 4).forEach(c => {
      const emoji = c.avg >= 80 ? '🟢' : c.avg >= 60 ? '🟡' : '🔴';
      msg += `• ${emoji} ${c.name}: <b>${c.avg.toFixed(0)}%</b>\n`;
    });
  }

  msg += `\n━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🔗 Batafsil: <a href="http://localhost:3000/admin">Admin Panel</a>`;

  return msg;
}

export async function sendReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  const message = await generateReportText(period);
  // Hisobotlar ham guruhga, ham shaxsiy lichkaga yetkaziladi
  await sendNotification(message, true);
  return { success: true, message };
}
