'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Skeleton } from '../ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const router = useRouter();
  
  // This effect will run on the client after hydration
  useEffect(() => {
    // We check authentication status only on the client
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // While checking on the client or if not authenticated, show a loading state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render the full app shell
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
