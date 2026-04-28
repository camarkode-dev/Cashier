import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerRegistrar } from '@/components/common/ServiceWorkerRegistrar';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'أولاد أيمن للأدوات المنزلية | نظام نقطة البيع',
  description: 'تطبيق نقطة بيع متكامل لأولاد أيمن للأدوات المنزلية',
  applicationName: 'أولاد أيمن',
  keywords: ['نقطة بيع', 'POS', 'أدوات منزلية', 'مخزون', 'فواتير'],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
    shortcut: ['/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'أولاد أيمن',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1d2026' },
    { media: '(prefers-color-scheme: dark)', color: '#1d2026' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="أولاد أيمن" />
        <meta name="application-name" content="أولاد أيمن" />
        <meta name="msapplication-TileColor" content="#1d2026" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ServiceWorkerRegistrar />
          <InstallPrompt />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
              success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
