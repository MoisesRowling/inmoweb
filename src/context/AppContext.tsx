'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const postAction = async (action: string, payload: any, userId: string) => {
    if (!userId) throw new Error("User not authenticated");
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, userId }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Failed to perform action: ${action}`);
    }
    return result;
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
  logout: () => void;
  login: (email: string, pass: string) => Promise<void>;
  registerAndCreateUser: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  handleDeposit: (amount: number) => Promise<void>;
  handleWithdraw: (amount: number, clabe: string, accountHolderName: string) => Promise<boolean>;
  handleInvest: (amount: number, property: Property, term: number) => Promise<void>;
  modals: ModalState;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // Load user from localStorage on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('user');
    } finally {
        setIsAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
    toast({ title: "Has cerrado sesión." });
  }, [router, toast]);


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

  const registerAndCreateUser = async (name: string, email: string, password: string, referralCode?: string) => {
    setIsAuthLoading(true);
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, referralCode }),
        });
        const result = await response.json();
        if (response.status === 201) {
            toast({ title: '¡Cuenta creada exitosamente!', description: 'Ahora puedes iniciar sesión.' });
            router.push('/login');
        } else {
            throw new Error(result.message || 'Error al registrar la cuenta.');
        }
    } catch (err: any) {
        toast({ title: 'Error de registro', description: err.message, variant: 'destructive' });
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleDeposit = async (amount: number) => {
     try {
        if (!user) throw new Error("User not authenticated");
        await postAction('deposit', { amount }, user.id);
        toast({ title: 'Depósito Exitoso', description: `Has simulado un depósito de ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
     } catch (e: any) {
        toast({ title: 'Error en depósito', description: e.message, variant: 'destructive'});
     }
  };

  const handleWithdraw = async (amount: number, clabe: string, accountHolderName: string): Promise<boolean> => {
     try {
        if (!user) throw new Error("User not authenticated");
        await postAction('withdraw', { amount, clabe, accountHolderName }, user.id);
        toast({ title: 'Solicitud de Retiro Enviada', description: `Tu solicitud para retirar ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} ha sido enviada.` });
        return true;
     } catch (e: any) {
        toast({ title: 'Error en solicitud', description: e.message, variant: 'destructive'});
        return false;
     }
  };
  
  const handleInvest = async (amount: number, property: Property, term: number) => {
    try {
        if (!user) throw new Error("User not authenticated");
        await postAction('invest', { amount, property, term }, user.id);
        toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
    } catch (e: any) {
        toast({ title: 'Error en inversión', description: e.message, variant: 'destructive'});
    }
  };

  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isAuthLoading,
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
