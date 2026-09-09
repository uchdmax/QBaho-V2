import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  // 1. Xavfsizlik tekshiruvi: Faqat tizimga kirgan admin rasm yuklay oladi
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fayl hajmi 5MB dan oshmasligi kerak' }, { status: 400 });
    }

    // Fayl formati tekshiruvi
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Faqat rasm formatlari (PNG, JPG, SVG, WebP) qabul qilinadi' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Xavfsiz fayl kengaytmasini aniqlash
    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : (file.type.split('/')[1] || 'png');
    const safeExt = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext) ? ext : 'png';

    const fileName = `logo_${Date.now()}.${safeExt}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({ success: true, url: fileUrl, fileName });
  } catch (error) {
    console.error('Fayl yuklashda xatolik:', error);
    return NextResponse.json({ error: 'Faylni yuklab bo\'lmadi' }, { status: 500 });
  }
}
