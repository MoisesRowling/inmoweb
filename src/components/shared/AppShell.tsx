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
    // Si todavía estamos verificando el estado de autenticación, no hagas nada todavía.
    if (isAuthLoading) {
      return;
    }

    // Si el usuario está en una página de autenticación (login/register) pero ya está autenticado,
    // lo redirigimos al dashboard.
    if (isAuthenticated && isAuthPage) {
      router.replace('/dashboard');
    }

    // Si el usuario NO está autenticado y NO está en una página de autenticación,
    // lo redirigimos a la página de login.
    if (!isAuthenticated && !isAuthPage) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, isAuthPage, router, pathname]);

  // Mientras se verifica el estado de la sesión, si estamos en una ruta protegida,
  // muestra un esqueleto de carga para evitar mostrar contenido incorrecto.
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

  // Si no está autenticado y está en una página protegida, el useEffect ya lo está redirigiendo.
  // Renderizar null evita cualquier parpadeo de contenido no autorizado.
  if (!isAuthenticated && !isAuthPage) {
      return null;
  }
  
  // Si está autenticado y en una página de autenticación, el useEffect lo está redirigiendo.
  // Renderizar null evita el parpadeo de la página de login/register.
  if (isAuthenticated && isAuthPage) {
      return null;
  }

  // Si está autenticado, muestra el layout de la aplicación con su contenido
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
