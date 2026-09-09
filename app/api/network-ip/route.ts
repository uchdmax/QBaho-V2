import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }

  let tunnelUrl = '';
  try {
    const tunnelPath = path.join(process.cwd(), 'tunnel.txt');
    if (fs.existsSync(tunnelPath)) {
      const content = fs.readFileSync(tunnelPath, 'utf8').trim();
      if (content) tunnelUrl = content;
    }
  } catch (e) {}

  return NextResponse.json({ 
    ip: localIp, 
    url: `http://${localIp}:3000`,
    tunnelUrl
  });
}

