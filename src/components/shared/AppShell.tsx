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
  const isPublicPage = isAuthPage || pathname === '/';

  useEffect(() => {
    if (isAuthLoading) {
      return; // No hacer nada mientras se verifica la autenticación
    }

    // Si no está autenticado y no está en una página pública, redirigir a login
    if (!isAuthenticated && !isPublicPage) {
      router.replace('/login');
    }

  }, [isAuthenticated, isAuthLoading, isPublicPage, router]);

  // Si se está autenticando y no es una página pública, mostrar un esqueleto de carga
  if (isAuthLoading && !isPublicPage) {
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

  // Si no está autenticado y está en una página pública, simplemente renderiza el contenido
  if (!isAuthenticated && isPublicPage) {
      return <>{children}</>;
  }

  // Si no está autenticado y está en una página protegida, el useEffect ya lo redirigió,
  // podemos retornar null o un loader para evitar renderizar nada
  if (!isAuthenticated) {
      return null;
  }

  // Si está autenticado, muestra el layout de la aplicación
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
