'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error('Network response was not ok');
    }
    return res.json();
});

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
  logout: () => void;
  login: (email: string, pass: string) => Promise<void>;
  registerAndCreateUser: (name: string, email: string, password: string) => Promise<void>;
  handleDeposit: (amount: number) => Promise<void>;
  handleWithdraw: (amount: number, clabe: string, accountHolderName: string) => Promise<boolean>;
  handleInvest: (amount: number, property: Property, term: number) => Promise<void>;
  modals: ModalState;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  const { data, error, isLoading } = useSWR(user ? `/api/data?userId=${user.id}` : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  const refreshData = useCallback(() => {
    if (user) {
        mutate(`/api/data?userId=${user.id}`);
    }
  }, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (error) {
        toast({ title: 'Error de Datos', description: 'No se pudieron cargar los datos del portafolio.', variant: 'destructive'});
        console.error("SWR Error:", error);
    }
  }, [error, toast]);


  const login = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });
        const result = await response.json();
        if (response.ok) {
            setUser(result.user);
            localStorage.setItem('user', JSON.stringify(result.user));
            toast({ title: '¡Bienvenido de vuelta!' });
            router.push('/dashboard');
        } else {
            throw new Error(result.message || 'Error al iniciar sesión');
        }
    } catch (err: any) {
        toast({ title: 'Error de inicio de sesión', description: err.message, variant: 'destructive' });
    } finally {
        setIsAuthLoading(false);
    }
  };

  const registerAndCreateUser = async (name: string, email: string, password: string) => {
    setIsAuthLoading(true);
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const result = await response.json();
        if (response.ok) {
            setUser(result.user);
            localStorage.setItem('user', JSON.stringify(result.user));
            toast({ title: '¡Cuenta creada exitosamente!' });
            router.push('/dashboard');
        } else {
            throw new Error(result.message || 'Error al registrar la cuenta.');
        }
    } catch (err: any) {
        toast({ title: 'Error de registro', description: err.message, variant: 'destructive' });
    } finally {
        setIsAuthLoading(false);
    }
  };
  
  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const postAction = async (action: string, payload: any) => {
    if (!user) throw new Error("User not authenticated");
    const response = await fetch(`/api/data?userId=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Failed to perform action: ${action}`);
    }
    return result;
  }

  const handleDeposit = async (amount: number) => {
     try {
        await postAction('deposit', { amount });
        refreshData();
        toast({ title: 'Depósito Exitoso', description: `Has simulado un depósito de ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
     } catch (e: any) {
        toast({ title: 'Error en depósito', description: e.message, variant: 'destructive'});
     }
  };

  const handleWithdraw = async (amount: number, clabe: string, accountHolderName: string): Promise<boolean> => {
     try {
        await postAction('withdraw', { amount, clabe, accountHolderName });
        refreshData();
        toast({ title: 'Solicitud de Retiro Enviada', description: `Tu solicitud para retirar ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} ha sido enviada.` });
        return true;
     } catch (e: any) {
        toast({ title: 'Error en solicitud', description: e.message, variant: 'destructive'});
        return false;
     }
  };
  
  const handleInvest = async (amount: number, property: Property, term: number) => {
    try {
        await postAction('invest', { amount, property, term });
        refreshData();
        toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
    } catch (e: any) {
        toast({ title: 'Error en inversión', description: e.message, variant: 'destructive'});
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
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
    return <AppProviderContent>{children}</AppProviderContent>;
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
