'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
);


export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  
  const publicPages = ['/', '/login', '/register', '/crudos'];
  const isPublicRoute = publicPages.includes(pathname);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !isPublicRoute) {
        router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, pathname, router, isPublicRoute]);
  
  if (isAuthLoading || (!isAuthenticated && !isPublicRoute)) {
    return <FullPageLoader />;
  }
  
  // For public routes, just render the content
  if (isPublicRoute) {
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
