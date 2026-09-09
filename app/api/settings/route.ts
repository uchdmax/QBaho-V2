import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'settings.json');

export interface SystemSettings {
  clinicName: string;
  logoUrl: string;
  googleMapsUrl: string;
  telegramLink: string;
  instagramLink: string;
  websiteLink: string;
  telegramBotToken?: string;
  telegramAdminGroupId?: string;
  telegramCriticalAdminId?: string;
  statsionarOrder: 'special_first' | 'floors_first';
}

const defaultSettings: SystemSettings = {
  clinicName: 'Smile Baby',
  logoUrl: '/logo.png',
  googleMapsUrl: 'https://maps.google.com/?q=Smile+Baby+Andijan',
  telegramLink: 'https://t.me/smilebaby_uz',
  instagramLink: 'https://instagram.com/smilebaby.uz',
  websiteLink: 'https://migroup.uz',
  telegramBotToken: '',
  telegramAdminGroupId: '',
  telegramCriticalAdminId: '',
  statsionarOrder: 'special_first'
};

export function readSettings(): SystemSettings {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const content = fs.readFileSync(settingsFilePath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(content) };
    }
  } catch (e) {
    console.error('Failed to read settings.json', e);
  }
  return defaultSettings;
}

export function writeSettings(data: any) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write settings.json', e);
  }
}

// GET - Barcha uchun ochiq (bemor interfeysi va admin panel o'qishi uchun)
export async function GET() {
  const session = await getServerSession(authOptions);
  const settings = readSettings();

  // Agar admin bo'lmasa, maxfiy bot tokenini yashiramiz
  if (!session) {
    const { telegramBotToken, ...publicSettings } = settings;
    return NextResponse.json(publicSettings);
  }

  return NextResponse.json(settings);
}

// POST - Faqat tizimga kirgan admin uchun
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = readSettings();
    const updated: SystemSettings = {
      ...current,
      ...(typeof body.clinicName === 'string' ? { clinicName: body.clinicName.trim() } : {}),
      ...(typeof body.logoUrl === 'string' ? { logoUrl: body.logoUrl.trim() } : {}),
      ...(typeof body.googleMapsUrl === 'string' ? { googleMapsUrl: body.googleMapsUrl.trim() } : {}),
      ...(typeof body.telegramLink === 'string' ? { telegramLink: body.telegramLink.trim() } : {}),
      ...(typeof body.instagramLink === 'string' ? { instagramLink: body.instagramLink.trim() } : {}),
      ...(typeof body.websiteLink === 'string' ? { websiteLink: body.websiteLink.trim() } : {}),
      ...(typeof body.telegramBotToken === 'string' ? { telegramBotToken: body.telegramBotToken.trim() } : {}),
      ...(typeof body.telegramAdminGroupId === 'string' ? { telegramAdminGroupId: body.telegramAdminGroupId.trim() } : {}),
      ...(typeof body.telegramCriticalAdminId === 'string' ? { telegramCriticalAdminId: body.telegramCriticalAdminId.trim() } : {}),
      ...(body.statsionarOrder ? { statsionarOrder: body.statsionarOrder } : {})
    };
    writeSettings(updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (e) {
    console.error('Sozlamalarni saqlashda xatolik:', e);
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 });
  }
}
