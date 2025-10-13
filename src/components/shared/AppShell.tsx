'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Skeleton } from '../ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading, user } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && pathname !== '/login' && pathname !== '/register') {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, router, pathname]);

  // Show skeleton loader while auth state is resolving OR
  // if user is authenticated but user data hasn't loaded from firestore yet.
  if (isAuthLoading || (isAuthenticated && !user)) {
    return (
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
  }

  // If not authenticated and not loading, it's a public page or login/register
  // This case is handled by the useEffect above which redirects to /login.
  // The children (e.g. login page) will render while the redirect happens.
  if (!isAuthenticated) {
      return children;
  }

  // If authenticated and user data is loaded, show the app shell
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
