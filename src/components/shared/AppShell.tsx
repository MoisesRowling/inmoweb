'use client';

import { useApp } from '@/context/AppContext';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const pathname = usePathname();
  
  const publicPages = ['/', '/login', '/register', '/crudos'];
  const isPublicPage = publicPages.includes(pathname);

  // For public pages, or if the user is not authenticated yet,
  // just render the page content without the main layout.
  // The AuthGuard will handle redirection.
  if (isPublicPage || !isAuthenticated) {
      return <>{children}</>;
  }
  
  // For authenticated routes, render the full app shell
  return (
    <div className="min-h-screen flex flex-col bg-secondary/50">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
      </main>
      <Footer />
    </div>
  );
}
