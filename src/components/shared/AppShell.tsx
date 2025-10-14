'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Skeleton } from '../ui/skeleton';

const FullPageLoader = () => (
    <div className="min-h-screen bg-background p-8">
      <div className="flex flex-col space-y-3">
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2 pt-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <Skeleton className="h-[125px] w-full rounded-xl" />
          </div>
      </div>
    </div>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  
  // Add '/crudos' to the list of public pages to bypass user auth logic
  const publicPages = ['/', '/login', '/register', '/crudos'];
  const isPublicPage = publicPages.includes(pathname);
  const isCrudPage = pathname === '/crudos';

  useEffect(() => {
    // Do not run auth logic on the CRUD page
    if (isCrudPage) return;

    if (isAuthLoading) {
      return; 
    }

    if (isAuthenticated && isPublicPage) {
        router.replace('/dashboard');
    }

    if (!isAuthenticated && !isPublicPage) {
        router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, isPublicPage, router, pathname, isCrudPage]);
  
  if (isCrudPage) {
      return <>{children}</>;
  }

  if ((isAuthLoading || !isAuthenticated) && !isPublicPage) {
    return <FullPageLoader />;
  }
  
  if (isAuthenticated && isPublicPage) {
      return <FullPageLoader />;
  }

  const renderShell = !isPublicPage || isAuthenticated;
  
  if (renderShell) {
     return (
        <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
        </main>
        <Footer />
        </div>
    );
  }

  return <>{children}</>;
}
