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
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    // If auth state is still loading, do nothing.
    if (isAuthLoading) return;

    // If user is not authenticated and is not on an auth page, redirect to login.
    if (!isAuthenticated && !isAuthPage) {
      router.replace('/login');
    }
    
    // If user IS authenticated and on an auth page, redirect to dashboard.
    if (isAuthenticated && isAuthPage) {
        router.replace('/dashboard');
    }

  }, [isAuthenticated, isAuthLoading, isAuthPage, router]);


  // Show a skeleton loader while auth state is resolving OR
  // if the user is authenticated but user data hasn't loaded from Firestore yet.
  // This prevents content flashing for authenticated users on protected routes.
  const isLoading = isAuthLoading || (isAuthenticated && !user && !isAuthPage);

  if (isLoading) {
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

  // If the user is not authenticated, but we're on a public or auth page,
  // let the page render. The useEffect above will handle redirection if needed.
  if (!isAuthenticated) {
      return children;
  }

  // If authenticated and user data is loaded, show the app shell for protected routes.
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

    