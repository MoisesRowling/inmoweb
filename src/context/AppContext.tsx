'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type ModalState = {
  deposit: boolean;
  withdraw: boolean;
  invest: Property | null;
};

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean; 
  balance: number;
  properties: Property[];
  transactions: Transaction[];
  investments: Investment[];
  modals: ModalState;
  logout: () => void;
  login: (email: string, pass: string) => Promise<void>;
  registerAndCreateUser: (name: string, email: string, password: string) => Promise<void>;
  handleDeposit: (amount: number) => Promise<void>;
  handleWithdraw: (amount: number, clabe: string) => Promise<boolean>;
  handleInvest: (amount: number, property: Property, term: number) => Promise<void>;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetcher = async (url: string) => {
    const res = await fetch(url);
    // If the user is not authenticated, the API will return a 401.
    // SWR will see this as an error and data will be undefined.
    if (res.status === 401) {
        return null;
    }
    if (!res.ok) {
        throw new Error('An error occurred while fetching the data.');
    }
    return res.json();
};

const apiUpdater = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'An error occurred while updating the data.');
  }
  return res.json();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const [isAuthFormLoading, setIsAuthFormLoading] = useState(false);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  const { data, error, isLoading } = useSWR('/api/data', fetcher, {
    refreshInterval: 2000, 
    shouldRetryOnError: false, // Important! Prevents retrying on 401.
    revalidateOnFocus: true,
  });
  
  const isAuthenticated = !!data && !error;
  const isAuthLoading = isLoading;

  const login = async (email: string, pass: string) => {
    setIsAuthFormLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Invalid credentials');
      }
      
      toast({ title: '¡Bienvenido de vuelta!' });
      // Instead of complex client-side state management, we just tell Next.js
      // to refresh the page. This will re-run the server-side logic (including AppShell)
      // with the new session cookie. It's the most robust way.
      router.refresh();

    } catch (err: any) {
      toast({ title: 'Error de inicio de sesión', description: err.message || 'El correo o la contraseña son incorrectos.', variant: 'destructive' });
    } finally {
      setIsAuthFormLoading(false);
    }
  };
  
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Same as login, refresh to re-run server logic. AppShell will see the user
    // is logged out and redirect to /login.
    router.refresh();
  }, [router]);

  const registerAndCreateUser = async (name: string, email: string, password: string) => {
    setIsAuthFormLoading(true);
    try {
       const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message);
      }
      
      toast({ title: '¡Cuenta creada exitosamente!', description: 'Bienvenido a InmoSmart.' });
      router.refresh();

    } catch (err: any) {
        toast({ title: 'Error de registro', description: err.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
    } finally {
        setIsAuthFormLoading(false);
    }
  };

  const handleAction = async (action: string, payload: any) => {
    try {
      // Use mutate to optimistically update UI and then revalidate
      await mutate('/api/data', apiUpdater('/api/data', { arg: { action, payload } }), {
          optimisticData: data, // use current data as a base
          rollbackOnError: true,
          populateCache: true, // populate cache with response
          revalidate: false, // data is fresh from the API response
      });
      return { success: true };
    } catch (error: any) {
      toast({ title: `Error en la operación: ${action}`, description: error.message, variant: 'destructive' });
      return { success: false, error: error.message };
    }
  }

  const handleDeposit = async (amount: number) => {
    const { success } = await handleAction('deposit', { amount });
     if (success) {
      toast({
          title: 'Depósito Exitoso',
          description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
      });
    }
  };

  const handleWithdraw = async (amount: number, clabe: string): Promise<boolean> => {
     if (amount > (data?.balance || 0)) {
        toast({ title: 'Saldo insuficiente', description: 'No tienes suficiente saldo para este retiro.', variant: 'destructive' });
        return false;
    }
    const { success } = await handleAction('withdraw', { amount, clabe });
    if (success) {
      toast({ title: 'Retiro Exitoso', description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
      return true;
    }
    return false;
  };

  const handleInvest = async (amount: number, property: Property, term: number) => {
    if (amount > (data?.balance || 0)) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    const { success } = await handleAction('invest', { amount, property, term });
    if(success) {
      toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
    }
  };
  
  const value: AppContextType = {
    user: data?.user || null,
    isAuthenticated,
    isAuthLoading: isAuthLoading || isAuthFormLoading,
    balance: data?.balance ?? 0,
    properties: data?.properties || [],
    transactions: data?.transactions || [],
    investments: data?.investments || [],
    modals,
    logout,
    login,
    registerAndCreateUser,
    handleDeposit,
    handleWithdraw,
    handleInvest,
    setModals,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
