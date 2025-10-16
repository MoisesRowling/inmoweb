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
  
  const publicPages = ['/', '/login', '/register'];
  const isCrudPage = pathname === '/crudos';
  
  const isPublicRoute = publicPages.includes(pathname);

  useEffect(() => {
    if (isCrudPage) return;

    if (!isAuthLoading) {
        if (isAuthenticated && publicPages.includes(pathname) && pathname !== '/') {
            router.replace('/dashboard');
        }
        if (!isAuthenticated && !isPublicRoute) {
            router.replace('/login');
        }
    }
  }, [isAuthenticated, isAuthLoading, pathname, router, isPublicRoute, isCrudPage]);
  
  if (isCrudPage) {
      return <>{children}</>;
  }

  // Show a loader for protected routes while auth is loading
  if (isAuthLoading && !isPublicRoute) {
    return <FullPageLoader />;
  }
  
  // Show loader for public routes if user is authenticated (they will be redirected)
  if (isAuthenticated && publicPages.includes(pathname) && pathname !== '/') {
      return <FullPageLoader />;
  }
  
  // For public pages like Home, Login, Register, render only children
  if (isPublicRoute) {
      return <>{children}</>;
  }
  
  // For authenticated app routes
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