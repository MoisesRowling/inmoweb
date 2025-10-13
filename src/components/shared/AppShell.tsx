'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Skeleton } from '../ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    // If auth state is still loading, do nothing to prevent premature redirects.
    if (isAuthLoading) {
      return;
    }

    // If the user is NOT authenticated and is trying to access a protected page,
    // redirect them to the login page.
    if (!isAuthenticated && !isAuthPage) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, isAuthPage, router]);

  // While checking auth state, show a global loading skeleton.
  // This prevents flashing content.
  if (isAuthLoading && !isAuthPage) {
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
  // let the page render itself.
  if (!isAuthenticated) {
      return <>{children}</>;
  }

  // If authenticated, show the main app layout for protected routes.
  // The child component (e.g., DashboardPage) will be responsible for its own content-specific loading state.
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
