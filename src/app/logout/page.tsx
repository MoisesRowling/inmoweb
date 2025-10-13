'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { logout } = useApp();

  useEffect(() => {
    logout();
  }, [logout]); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold text-foreground">Cerrando sesión...</h1>
      <p className="text-muted-foreground">Serás redirigido en un momento.</p>
    </div>
  );
}
