import type { Metadata } from 'next'
import { BRAND } from '@/lib/brand'
import CookieBanner from '@/components/CookieBanner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: BRAND.seo.defaultTitle,
    template: BRAND.seo.titleTemplate,
  },
  description: BRAND.seo.description,
  keywords: BRAND.seo.keywords,
  metadataBase: new URL(BRAND.url),
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: BRAND.url,
    siteName: BRAND.name,
    title: BRAND.seo.defaultTitle,
    description: BRAND.seo.description,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet" />
        <meta name="theme-color" content={BRAND.seo.themeColor} />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
