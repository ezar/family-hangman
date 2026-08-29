import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import Backdrop from '@/components/Backdrop';
import './globals.css';

const display = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ahorcado en Familia',
  description:
    'Ahorcado por turnos para jugar en familia desde cualquier sitio. En solitario o en sala compartida, en espanol e ingles.',
  manifest: '/manifest.json',
  applicationName: 'Ahorcado en Familia',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Ahorcado' },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#150f1e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <Backdrop />
        <div className="safe-top relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
