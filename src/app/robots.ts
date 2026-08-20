import type { MetadataRoute } from 'next'
import { BRAND } from '@/lib/brand'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/','/teacher/','/instructor/','/inicio/','/dashboard/','/avance/','/agenda/','/perfil/','/home/'],
    }],
    sitemap: `${BRAND.url}/sitemap.xml`,
  }
}
