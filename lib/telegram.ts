import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';

function getTelegramConfig() {
  let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  let adminGroupIds = (process.env.TELEGRAM_ADMIN_GROUP_ID || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  let criticalAdminIds = (process.env.TELEGRAM_CRITICAL_ADMIN_ID || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.telegramBotToken && settings.telegramBotToken.trim()) {
        botToken = settings.telegramBotToken.trim();
      }
      if (settings.telegramAdminGroupId && settings.telegramAdminGroupId.trim()) {
        adminGroupIds = settings.telegramAdminGroupId.split(',').map((id: string) => id.trim()).filter(Boolean);
      }
      if (settings.telegramCriticalAdminId && settings.telegramCriticalAdminId.trim()) {
        criticalAdminIds = settings.telegramCriticalAdminId.split(',').map((id: string) => id.trim()).filter(Boolean);
      }
    }
  } catch (e) {
    console.error('Failed to read telegram settings from settings.json', e);
  }

  return { botToken, adminGroupIds, criticalAdminIds };
}

export const bot = process.env.TELEGRAM_BOT_TOKEN ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN) : null;

export async function sendNotification(message: string, isCritical: boolean = false, audioUrl?: string | null) {
  const { botToken, adminGroupIds, criticalAdminIds } = getTelegramConfig();
  if (!botToken) {
    console.warn('Telegram bot is not configured. Message:', message);
    return;
  }

  const botInstance = new Telegraf(botToken);

  // Helper audio yuborish
  const sendAudioToChat = async (chatId: string) => {
    if (audioUrl) {
      const fullAudioPath = path.join(process.cwd(), 'public', audioUrl.replace(/^\//, ''));
      if (fs.existsSync(fullAudioPath)) {
        await botInstance.telegram.sendVoice(chatId, { source: fullAudioPath }, { caption: '🎙 Bemorning ovozli xabari' });
      }
    }
  };

  // 1. Asosiy guruhlarga barcha baholarni yuborish
  for (const groupId of adminGroupIds) {
    try {
      await botInstance.telegram.sendMessage(groupId, message, { parse_mode: 'HTML' });
      if (audioUrl) {
        await sendAudioToChat(groupId);
      }
    } catch (error) {
      console.error(`Failed to send telegram notification to group (${groupId}):`, error);
    }
  }

  // 2. Agar muhim/past baho (1, 2, 3) yoki audio/telefon bo'lsa — Belgilangan shaxslar (Klinika egasi, HR) lichkasiga yuborish
  if (isCritical) {
    const alertMessage = `⚠️ <b>DIQQAT: MUHIM SHIKOYAT / OVOZLI XABAR!</b>\n\n${message}`;
    for (const adminId of criticalAdminIds) {
      if (adminGroupIds.includes(adminId)) continue; // guruhga takror yubormaslik uchun
      try {
        await botInstance.telegram.sendMessage(adminId, alertMessage, { parse_mode: 'HTML' });
        if (audioUrl) {
          await sendAudioToChat(adminId);
        }
      } catch (error) {
        console.error(`Failed to send critical telegram notification to (${adminId}):`, error);
      }
    }
  }
}
