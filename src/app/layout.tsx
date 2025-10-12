import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { GlobalModals } from '@/components/modals/GlobalModals';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'InmoSmart - La Nueva Era de la Inversión Inmobiliaria',
  description: 'En InmoSmart, integramos herramientas digitales de vanguardia para que tu inversión inmobiliaria sea más inteligente, segura y rentable.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} font-body antialiased`}>
        <AppProvider>
          {children}
          <Toaster />
          <GlobalModals />
        </AppProvider>
      </body>
    </html>
  );
}
