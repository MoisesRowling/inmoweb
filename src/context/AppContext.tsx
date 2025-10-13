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

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
});

const postUpdater = async (url: string, { arg }: { arg: any }) => {
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

  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthFormLoading, setIsAuthFormLoading] = useState(false);
  
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // Load userId from localStorage on initial load
  useEffect(() => {
    const storedUserId = localStorage.getItem('inmosmart-userid');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const { data, error, isLoading } = useSWR(userId ? `/api/data?userId=${userId}` : null, fetcher);

  const isAuthenticated = !!data && !!data.user;

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

      const { user } = await res.json();
      localStorage.setItem('inmosmart-userid', user.id);
      setUserId(user.id);
      toast({ title: '¡Bienvenido de vuelta!' });
      router.push('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error de inicio de sesión', description: err.message || 'El correo o la contraseña son incorrectos.', variant: 'destructive' });
    } finally {
      setIsAuthFormLoading(false);
    }
  };
  
  const logout = useCallback(() => {
    localStorage.removeItem('inmosmart-userid');
    setUserId(null);
    mutate(key => typeof key === 'string' && key.startsWith('/api/data'), undefined, false); // Clear SWR cache for user data
    router.push('/login');
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

      const { user } = await res.json();
      localStorage.setItem('inmosmart-userid', user.id);
      setUserId(user.id);
      toast({ title: '¡Cuenta creada exitosamente!', description: 'Bienvenido a InmoSmart.' });
      router.push('/dashboard');

    } catch (err: any) {
        toast({ title: 'Error de registro', description: err.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
    } finally {
        setIsAuthFormLoading(false);
    }
  };

  const handleDataUpdate = async (action: string, payload: any) => {
    try {
      // We optimistically update the local data, then revalidate.
      // SWR will handle rolling back if the API call fails.
      const { data: updatedData } = await postUpdater('/api/data', { arg: { action, payload } });
      mutate(`/api/data?userId=${userId}`, updatedData, false); // Update local cache without re-fetching
      return { success: true };
    } catch (error: any) {
      // SWR will automatically roll back the optimistic update on error.
      return { success: false, error: error.message };
    }
  }

  const handleDeposit = async (amount: number) => {
    const { success, error } = await handleDataUpdate('deposit', { userId, amount });
     if (success) {
      toast({
          title: 'Depósito Exitoso',
          description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
      });
    } else {
      toast({ title: 'Error en el depósito', description: error, variant: 'destructive' });
    }
  };

  const handleWithdraw = async (amount: number, clabe: string): Promise<boolean> => {
     if (amount > (data?.balance || 0)) {
        toast({ title: 'Saldo insuficiente', description: 'No tienes suficiente saldo para este retiro.', variant: 'destructive' });
        return false;
    }
    const { success, error } = await handleDataUpdate('withdraw', { userId, amount, clabe });
    if (success) {
      toast({ title: 'Retiro Exitoso', description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
      return true;
    } else {
       toast({ title: 'Error en el retiro', description: error, variant: 'destructive' });
       return false;
    }
  };

  const handleInvest = async (amount: number, property: Property, term: number) => {
    if (amount > (data?.balance || 0)) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    const { success, error } = await handleDataUpdate('invest', { userId, amount, property, term });
    if(success) {
      toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
    } else {
       toast({ title: 'Error en la inversión', description: error, variant: 'destructive' });
    }
  };
  
  const value: AppContextType = {
    user: data?.user || null,
    isAuthenticated,
    isAuthLoading: isLoading && !data, // Show loading only on initial load
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
