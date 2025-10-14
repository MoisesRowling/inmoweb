'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useSWR, { SWRConfig, mutate as globalMutate } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};


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
  handleWithdraw: (amount: number, clabe: string, accountHolderName: string) => Promise<boolean>;
  handleInvest: (amount: number, property: Property, term: number) => Promise<void>;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // SWR will fetch data and keep it up to date
  const { data, error, mutate, isLoading } = useSWR(user ? `/api/data?userId=${user.id}` : null, fetcher, {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 5000, // refresh data every 5 seconds
  });

  // Effect to load user from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem('inmosmart-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsAuthLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('inmosmart-user');
    globalMutate(() => true, undefined, { revalidate: false }); // Clear all SWR cache
    router.push('/login');
  }, [router]);

  // Effect to handle loading and error states from SWR
  useEffect(() => {
    if (!user) return; // Don't do anything if there's no user
    if (error) {
      console.error("SWR Error:", error);
      // If auth error (user not found in DB), log out
      if (error.status === 401 || error.status === 404) {
        toast({ title: 'Error de sesión', description: 'Tu sesión es inválida o ha expirado.', variant: 'destructive'});
        logout();
      }
    }
  }, [data, error, isLoading, user, logout, toast]);

  const login = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      setUser(data.user);
      localStorage.setItem('inmosmart-user', JSON.stringify(data.user));
      toast({ title: '¡Bienvenido de vuelta!' });
      router.push('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error de inicio de sesión', description: err.message, variant: 'destructive' });
    } finally {
        setIsAuthLoading(false);
    }
  };

  const registerAndCreateUser = async (name: string, email: string, password: string) => {
    setIsAuthLoading(true);
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Error al registrarse');
        }
        setUser(data.user);
        localStorage.setItem('inmosmart-user', JSON.stringify(data.user));
        toast({ title: '¡Cuenta creada exitosamente!' });
        router.push('/dashboard');
    } catch (err: any) {
        toast({ title: 'Error de registro', description: err.message, variant: 'destructive' });
    } finally {
        setIsAuthLoading(false);
    }
  };

  const postAction = async (action: string, payload: any) => {
      if (!user) throw new Error("User not authenticated");
      const res = await fetch(`/api/data?userId=${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload })
      });
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'La acción falló');
      }
      return res.json();
  }

  const handleDeposit = async (amount: number) => {
    try {
      await postAction('deposit', { amount });
      await mutate(); // Re-fetch data
      toast({ title: 'Depósito Exitoso', description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
    } catch (err: any) {
      toast({ title: 'Error en el depósito', description: err.message, variant: 'destructive' });
    }
  };

  const handleWithdraw = async (amount: number, clabe: string, accountHolderName: string): Promise<boolean> => {
    try {
        await postAction('withdraw', { amount, clabe, accountHolderName });
        await mutate();
        toast({ title: 'Solicitud de Retiro Enviada', description: `Tu solicitud para retirar ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} ha sido enviada para aprobación.` });
        return true;
    } catch (err: any) {
        toast({ title: 'Error en la solicitud', description: err.message, variant: 'destructive' });
        return false;
    }
  };

  const handleInvest = async (amount: number, property: Property, term: number) => {
    try {
        await postAction('invest', { amount, property, term });
        await mutate();
        toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
    } catch (err: any) {
        toast({ title: 'Error en la inversión', description: err.message, variant: 'destructive' });
    }
  };

  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isAuthLoading: isAuthLoading || (!!user && isLoading),
    balance: data?.balance ?? 0,
    properties: data?.properties ?? [],
    transactions: data?.transactions ?? [],
    investments: data?.investments ?? [],
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

export function AppProvider({ children }: { children: ReactNode }) {
    return (
        <SWRConfig>
            <AppProviderContent>{children}</AppProviderContent>
        </SWRConfig>
    );
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
