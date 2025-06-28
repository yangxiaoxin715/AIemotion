/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 允许从局域网其他设备访问开发服务器
  allowedDevOrigins: [
    '192.168.0.118',  // 你当前的IP地址
    '192.168.0.0/24', // 允许整个192.168.0.x网段
    'localhost',      // 本地访问
    '127.0.0.1',      // 本地回环地址
  ],
}

export default nextConfig