import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/telegram';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// POST — ochiq (mijozlar baho berishi uchun), lekin rate-limited
export async function POST(request: Request) {
  try {
    // IP-asosiy cheklash
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Siz yaqinda baholashda qatnashgansiz. Fikringiz uchun rahmat! Iltimos, keyingi bahoni 2 soatdan keyin qoldiring.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    let department = 'Umumiy';
    let employeeId: number | null = null;
    let comment: string | null = null;
    let phone: string | null = null;
    let respondentType: string | null = null;
    let overallScore: number | null = null;
    let values: { criterionId: number; score: number, textAnswer?: string }[] = [];
    let audioUrl: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      department = (formData.get('department') as string) || 'Umumiy';
      const empIdStr = formData.get('employeeId') as string | null;
      if (empIdStr) employeeId = parseInt(empIdStr, 10);
      
      const overallStr = formData.get('overallScore') as string | null;
      if (overallStr) overallScore = parseInt(overallStr, 10);
      
      comment = formData.get('comment') as string | null;
      phone = formData.get('phone') as string | null;
      respondentType = formData.get('respondentType') as string | null;
      
      const valuesStr = formData.get('values') as string | null;
      if (valuesStr) {
        try { values = JSON.parse(valuesStr); } catch (e) {}
      }

      const audioFile = formData.get('audio') as Blob | null;
      if (audioFile && audioFile.size > 0) {
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = `voice_${Date.now()}.webm`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        audioUrl = `/uploads/${fileName}`;
      }
    } else {
      const body = await request.json();
      department = body.department || 'Umumiy';
      employeeId = body.employeeId || null;
      overallScore = body.overallScore || null;
      comment = body.comment || null;
      phone = body.phone || null;
      respondentType = body.respondentType || null;
      values = body.values || [];
      audioUrl = body.audioUrl || null;
    }
    
    const rating = await prisma.rating.create({
      data: {
        department,
        employeeId: employeeId || null,
        overallScore,
        comment,
        phone,
        audioUrl,
        respondentType: respondentType || null,
        values: {
          create: (values || []).map((v: any) => ({
            criterionId: v.criterionId,
            score: v.score ?? 0,
            textAnswer: v.textAnswer || null
          }))
        }
      },
      include: {
        values: {
          include: { criterion: true }
        },
        employee: true
      }
    });

    // Telegram xabar
    const respondentLabelMap: Record<string, string> = {
      PATIENT: "Bemorning o'zi",
      PARENT: "Bemorning ota-onasi",
      SPOUSE: "Turmush o'rtog'i",
      RELATIVE: "Yaqini / Qarindoshi"
    };

    let message = `🏥 <b>Yangi baho kiritildi!</b>\n`;
    message += `📍 <b>Bo'lim:</b> ${department}\n`;

    if (respondentType && respondentLabelMap[respondentType]) {
      message += `👥 <b>Baholovchi:</b> ${respondentLabelMap[respondentType]}\n`;
    }
    
    if (rating.employee) {
      message += `👤 <b>Xodim:</b> ${rating.employee.firstName} ${rating.employee.lastName}\n`;
    }
    message += `\n`;

    rating.values.forEach(v => {
      message += `⭐ <b>${v.criterion.name}:</b> ${v.score}/5\n`;
    });
    
    if (comment) {
      message += `\n💬 <b>Izoh:</b>\n<i>${comment}</i>`;
    }

    if (phone) {
      message += `\n📞 <b>Telefon:</b> <code>${phone}</code>`;
    }

    if (audioUrl) {
      message += `\n🎙 <b>Ovozli xabar qoldirildi!</b>`;
    }

    const isCritical = rating.values.some(v => v.score <= 3) || Boolean(phone) || Boolean(audioUrl);
    await sendNotification(message, isCritical, audioUrl);

    return NextResponse.json(
      { success: true, rating },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}

// GET — faqat admin
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const ratings = await prisma.rating.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        values: {
          include: { criterion: true }
        },
        employee: true
      }
    });
    return NextResponse.json({ success: true, ratings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
