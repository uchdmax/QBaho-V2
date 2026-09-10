import type { NextConfig } from "next";
import os from "os";
import fs from "fs";
import path from "path";

const allowedDevOrigins: string[] = [
  "localhost:3000",
  "127.0.0.1:3000",
  "difficulty-workstation-descending-shareware.trycloudflare.com",
];

try {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        allowedDevOrigins.push(net.address);
        allowedDevOrigins.push(`${net.address}:3000`);
      }
    }
  }
} catch (e) {}

try {
  const tunnelFile = path.join(process.cwd(), "tunnel.txt");
  if (fs.existsSync(tunnelFile)) {
    const raw = fs.readFileSync(tunnelFile, "utf8").trim();
    if (raw) {
      const clean = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!allowedDevOrigins.includes(clean)) {
        allowedDevOrigins.push(clean);
      }
    }
  }
} catch (e) {}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins,
  async redirects() {
    return [
      {
        source: '/about',
        destination: '/',
        permanent: true,
      },
      {
        source: '/services',
        destination: '/',
        permanent: true,
      },
      {
        source: '/doctors',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/',
        permanent: true,
      },
      {
        source: '/karyera',
        destination: '/',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:path*.php',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

