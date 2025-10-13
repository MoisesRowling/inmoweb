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
  
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.includes(pathname);
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (isAuthLoading) {
      return; // Do nothing while loading, the loader will be shown.
    }

    // If authenticated, and on a public page (or home), redirect to dashboard
    if (isAuthenticated && (isPublicPage || isHomePage)) {
        router.replace('/dashboard');
    }

    // If not authenticated, and on a protected page, redirect to login
    if (!isAuthenticated && !isPublicPage && !isHomePage) {
        router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, isPublicPage, isHomePage, router, pathname]);

  // While checking auth state, show a full page loader.
  if (isAuthLoading) {
    return <FullPageLoader />;
  }

  // If we are on a protected route but not authenticated yet, show loader to prevent flicker.
  if (!isAuthenticated && !isPublicPage && !isHomePage) {
      return <FullPageLoader />;
  }

  // If we are on a public route but authenticated, show loader while redirecting.
  if (isAuthenticated && (isPublicPage || isHomePage)) {
      return <FullPageLoader />;
  }
  
  // If user is authenticated and on a protected page, show the app shell.
  if (isAuthenticated && !isPublicPage && !isHomePage) {
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

  // For unauthenticated users on public pages (login, register, home), render the children directly.
  return <>{children}</>;
}
