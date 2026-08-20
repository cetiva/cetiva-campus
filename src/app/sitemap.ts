import type { MetadataRoute } from 'next'
import { BRAND } from '@/lib/brand'

const url = BRAND.url

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${url}/cursos`,          lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${url}/programas`,       lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${url}/nosotros`,        lastModified: new Date(), changeFrequency: 'monthly',priority: 0.6 },
    { url: `${url}/contacto`,        lastModified: new Date(), changeFrequency: 'monthly',priority: 0.5 },
    { url: `${url}/terminos`,        lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${url}/aviso-privacidad`,lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
