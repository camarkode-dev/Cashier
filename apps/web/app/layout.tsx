import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerRegistrar } from '@/components/common/ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: 'أولاد أيمن للأدوات المنزلية | نظام نقطة البيع',
  description: 'نظام نقطة بيع متكامل لأولاد أيمن للأدوات المنزلية',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.png',
    apple: '/icons/icon.png',
  },
  applicationName: 'أولاد أيمن POS',
  keywords: ['نقطة بيع', 'POS', 'أدوات منزلية', 'مخزون', 'فواتير'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ServiceWorkerRegistrar />
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
