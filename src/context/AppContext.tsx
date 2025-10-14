'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Helper function to fetch data
const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

// Local storage for the user session
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
};

const setInLocalStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage`);
    }
};

function AppProviderContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => getFromLocalStorage('inmosmart-user', null));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // Set user to local storage on change
  useEffect(() => {
    setInLocalStorage('inmosmart-user', currentUser);
    setIsAuthLoading(false);
  }, [currentUser]);
  
  // Use SWR to fetch user data if authenticated
  const { data, error } = useSWR(currentUser ? `/api/data?userId=${currentUser.id}` : null, fetcher, {
    refreshInterval: 5000, // Refresh data every 5 seconds
  });
  
  const refreshData = useCallback(() => {
    if (currentUser) {
      mutate(`/api/data?userId=${currentUser.id}`);
    }
  }, [currentUser]);


  const login = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });
        const result = await response.json();
        if (response.ok && result.user) {
            setCurrentUser(result.user);
            toast({ title: '¡Bienvenido de vuelta!' });
            router.push('/dashboard');
        } else {
            throw new Error(result.message || 'Credenciales inválidas');
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
          if (response.ok && result.user) {
              setCurrentUser(result.user);
              toast({ title: '¡Cuenta creada exitosamente!' });
              router.push('/dashboard');
          } else {
              throw new Error(result.message || 'Error al registrarse');
          }
      } catch (err: any) {
           toast({ title: 'Error de registro', description: err.message, variant: 'destructive' });
      } finally {
        setIsAuthLoading(false);
      }
  };
  
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    // Clear all SWR cache on logout
    mutate(() => true, undefined, { revalidate: false });
    router.push('/login');
  }, [router]);

  const apiAction = async (action: string, payload: any) => {
      if (!currentUser) return;
      try {
          const response = await fetch(`/api/data?userId=${currentUser.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action, payload }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          refreshData(); // Re-fetch data to update UI
          return result;
      } catch (err: any) {
          toast({ title: `Error en ${action}`, description: err.message, variant: 'destructive' });
          throw err;
      }
  };

  const handleDeposit = async (amount: number) => {
    await apiAction('deposit', { amount });
    toast({ title: 'Depósito Exitoso', description: `Has simulado un depósito de ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
  };

  const handleWithdraw = async (amount: number, clabe: string, accountHolderName: string): Promise<boolean> => {
     try {
        await apiAction('withdraw', { amount, clabe, accountHolderName });
        toast({ title: 'Solicitud de Retiro Enviada', description: `Tu solicitud para retirar ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} ha sido enviada.` });
        return true;
     } catch (e) {
        return false;
     }
  };
  
  const handleInvest = async (amount: number, property: Property, term: number) => {
    try {
        await apiAction('invest', { amount, property, term });
        toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
    } catch (e) {
        // Error is already handled by apiAction
    }
  };

  const value: AppContextType = {
    user: data?.user || currentUser,
    isAuthenticated: !!currentUser,
    isAuthLoading,
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
