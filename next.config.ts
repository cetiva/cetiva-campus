import type { NextConfig } from 'next'

const securityHeaders = [
  // Previene clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Previene MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // XSS Protection (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Controla información en Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permisos de APIs del browser
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // HSTS - fuerza HTTPS (habilitado por Vercel en prod, pero lo declaramos)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval necesario para Next.js dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src https://player.vimeo.com", // Reproductor de videos
      "media-src 'self' https://*.supabase.co https://player.vimeo.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Headers de seguridad en todas las rutas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Imágenes desde Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Logging mínimo en producción
  logging: {
    fetches: { fullUrl: false },
  },
}

export default nextConfig
