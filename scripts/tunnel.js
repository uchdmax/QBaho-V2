const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const urlFile = path.join(__dirname, '..', 'public_tunnel.json');

function startTunnel() {
  console.log('Starting localhost.run tunnel...');
  const proc = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-R', '80:localhost:3000',
    'nokey@localhost.run'
  ]);

  proc.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    console.log('[STDOUT]', text);
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.lhr\.life/);
    if (match) {
      const publicUrl = match[0];
      console.log('>>>> PUBLIC TUNNEL LINK:', publicUrl);
      fs.writeFileSync(urlFile, JSON.stringify({ url: publicUrl, updatedAt: new Date().toISOString() }));
    }
  });

  proc.stderr.on('data', (chunk) => {
    console.log('[STDERR%', chunk.toString());
  });

  proc.on('close', (code) => {
    console.log('Tunnel closed, starting new in 3s...');
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
