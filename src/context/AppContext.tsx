'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { propertiesData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type ModalState = {
  deposit: boolean;
  withdraw: boolean;
  invest: Property | null;
};

// Mock user data
const mockUser: User = {
  id: 'mock-user-id',
  publicId: '12345',
  name: 'Usuario Demo',
  email: 'demo@inmosmart.com'
};

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  balance: number;
  properties: Property[];
  transactions: Transaction[];
  investments: Investment[];
  modals: ModalState;
  logout: () => void;
  registerAndCreateUser: (name: string, email: string, password: string) => void;
  handleDeposit: (amount: number) => void;
  handleWithdraw: (amount: number, clabe: string) => boolean;
  handleInvest: (amount: number, property: Property, term: number) => void;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balance, setBalance] = useState(25000);
  const [properties, setProperties] = useState<Property[]>(propertiesData as Property[]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });


  // Simulate login
  const login = (name: string) => {
    const newUser = { ...mockUser, name };
    setUser(newUser);
    setIsAuthenticated(true);
    toast({
      title: '¡Bienvenido de vuelta!',
      description: `Has iniciado sesión como ${name}.`,
    });
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const registerAndCreateUser = (name: string, email: string, password: string) => {
    toast({
      title: '¡Cuenta creada exitosamente!',
      description: 'Ahora puedes iniciar sesión con tus credenciales.',
    });
    router.push('/login');
  };

  const handleDeposit = (amount: number) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    
    const newTransaction: Transaction = {
      id: new Date().toISOString(),
      userId: user!.id,
      type: 'deposit',
      amount,
      description: 'Depósito simulado',
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);

    toast({
      title: 'Depósito Exitoso',
      description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
    });
  };

  const handleWithdraw = (amount: number, clabe: string): boolean => {
    if (amount > balance) {
        toast({
            title: 'Saldo insuficiente',
            description: 'No tienes suficiente saldo para este retiro.',
            variant: 'destructive',
        });
        return false;
    }

    setBalance(prev => prev - amount);
    const newTransaction: Transaction = {
      id: new Date().toISOString(),
      userId: user!.id,
      type: 'withdraw',
      amount,
      description: `Retiro a CLABE: ...${clabe.slice(-4)}`,
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    toast({
      title: 'Retiro Exitoso',
      description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
    });
    return true;
  };

  const handleInvest = (amount: number, property: Property, term: number) => {
     if (amount > balance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (amount < property.minInvestment) {
        toast({ title: `La inversión mínima es de ${property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`, variant: "destructive" });
        return;
    }

    setBalance(prev => prev - amount);

    const newInvestment: Investment = {
        id: new Date().toISOString(),
        userId: user!.id,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: amount / property.price * property.totalShares,
        investmentDate: new Date().toISOString(),
        term,
    };
    setInvestments(prev => [...prev, newInvestment]);

    const newTransaction: Transaction = {
      id: `t-${new Date().toISOString()}`,
      userId: user!.id,
      type: 'investment',
      amount: amount,
      description: `Inversión en ${property.name}`,
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    toast({
      title: '¡Inversión Exitosa!',
      description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.`,
    });
  };
  
  const value = {
    user,
    isAuthenticated,
    balance,
    properties,
    transactions,
    investments,
    modals,
    logout,
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
