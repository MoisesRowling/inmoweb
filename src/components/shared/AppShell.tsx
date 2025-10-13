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
  // The home page is public, but has special logic, so we exclude it here.
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (isAuthLoading) {
      // If we are checking auth, we don't do any redirects yet.
      // The loader will be shown below.
      return;
    }

    // If user is authenticated and tries to access a public page (login/register)
    if (isAuthenticated && isPublicPage) {
      router.replace('/dashboard');
    }

    // If user is NOT authenticated and tries to access a protected page
    if (!isAuthenticated && !isPublicPage && pathname !== '/') {
        router.replace('/login');
    }

  }, [isAuthenticated, isAuthLoading, isPublicPage, router, pathname]);

  // While checking auth, show a full page loader to prevent any content flashing
  if (isAuthLoading) {
    return <FullPageLoader />;
  }

  // If user is authenticated, show the app layout
  if (isAuthenticated) {
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
  
  // If user is NOT authenticated, only allow access to public pages and the landing page
  if (!isPublicPage && pathname !== '/') {
    // While the redirect in useEffect is happening, show a loader
    return <FullPageLoader />;
  }

  // Render children for public pages (login, register, home)
  return <>{children}</>;
}
