/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.loca.lt",
  ],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
