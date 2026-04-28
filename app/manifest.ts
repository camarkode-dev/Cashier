import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'أولاد أيمن للأدوات المنزلية',
    short_name: 'أولاد أيمن',
    description: 'تطبيق نقطة البيع وإدارة المتجر لأولاد أيمن للأدوات المنزلية',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#1d2026',
    theme_color: '#1d2026',
    lang: 'ar',
    dir: 'rtl',
    categories: ['business', 'finance', 'productivity'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/maskable-icon.png',
        sizes: '512x512',
        type: 'image/png',
        // @ts-expect-error purpose is valid in PWA manifests
        purpose: 'maskable any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'نقطة البيع',
        short_name: 'POS',
        description: 'شاشة المبيعات السريعة',
        url: '/pos',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'لوحة التحكم',
        short_name: 'Dashboard',
        description: 'لوحة التحكم الرئيسية',
        url: '/dashboard',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
