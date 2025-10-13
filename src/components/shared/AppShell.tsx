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
    // Do nothing while auth status is loading. The loader will be shown below.
    if (isAuthLoading) {
      return;
    }

    // If user is authenticated and tries to access a public page (login/register) or the homepage,
    // redirect them to the dashboard.
    if (isAuthenticated && (isPublicPage || isHomePage)) {
      router.replace('/dashboard');
    }

    // If user is NOT authenticated and tries to access a protected page
    // (any page that is not public and not the home page), redirect to login.
    if (!isAuthenticated && !isPublicPage && !isHomePage) {
        router.replace('/login');
    }

  }, [isAuthenticated, isAuthLoading, isPublicPage, isHomePage, router]);

  // While checking auth, show a full page loader to prevent any content flashing.
  if (isAuthLoading) {
    return <FullPageLoader />;
  }

  // If user is NOT authenticated, but is trying to access a protected page,
  // show a loader while the redirect in useEffect is happening.
  if (!isAuthenticated && !isPublicPage && !isHomePage) {
    return <FullPageLoader />;
  }
  
  // If user is authenticated, but is on a public page, show loader while redirect happens
  if (isAuthenticated && (isPublicPage || isHomePage)) {
    return <FullPageLoader />;
  }

  // If we reach here, we are clear to render the content.
  // For authenticated users, this will be the app layout.
  // For unauthenticated users, this will be the public page content (login, register, home).
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

  // Render children for public pages (login, register, home) for unauthenticated users.
  return <>{children}</>;
}
