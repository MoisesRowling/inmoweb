'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User } from '@/lib/types';
import { propertiesData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type ModalState = {
  deposit: boolean;
  withdraw: boolean;
  invest: Property | null;
};

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  balance: number;
  properties: Property[];
  transactions: Transaction[];
  firstInvestmentDate: Date | null;
  modals: ModalState;
  login: (email: string, name: string) => void;
  logout: () => void;
  addTransaction: (type: 'deposit' | 'withdraw' | 'investment', amount: number, description: string) => void;
  handleDeposit: (amount: number, method: string) => void;
  handleWithdraw: (amount: number, clabe: string) => boolean;
  handleInvest: (amount: number, property: Property) => void;
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [properties, setProperties] = useState<Property[]>(propertiesData);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [firstInvestmentDate, setFirstInvestmentDate] = useState<Date | null>(null);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('inmosmart-user');
      const storedBalance = localStorage.getItem('inmosmart-balance');
      const storedProperties = localStorage.getItem('inmosmart-properties');
      const storedTransactions = localStorage.getItem('inmosmart-transactions');
      const storedInvestmentDate = localStorage.getItem('inmosmart-investmentDate');

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedBalance) setBalance(JSON.parse(storedBalance));
      if (storedProperties) setProperties(JSON.parse(storedProperties));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedInvestmentDate) setFirstInvestmentDate(new Date(JSON.parse(storedInvestmentDate)));
    } catch (error) {
      console.error("Failed to hydrate state from localStorage", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);
  
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('inmosmart-user', JSON.stringify(user));
      localStorage.setItem('inmosmart-balance', JSON.stringify(balance));
      localStorage.setItem('inmosmart-properties', JSON.stringify(properties));
      localStorage.setItem('inmosmart-transactions', JSON.stringify(transactions));
      localStorage.setItem('inmosmart-investmentDate', JSON.stringify(firstInvestmentDate));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [user, balance, properties, transactions, firstInvestmentDate, isHydrated]);


  const addTransaction = useCallback((type: 'deposit' | 'withdraw' | 'investment', amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: Date.now(),
      type,
      amount,
      description,
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString('es-MX'),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const login = (email: string, name: string) => {
    const newUserId = 'IT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
    const newUser: User = { id: newUserId, email, name };
    setUser(newUser);
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    setBalance(0);
    setProperties(propertiesData);
    setTransactions([]);
    setFirstInvestmentDate(null);
    localStorage.clear();
    router.push('/login');
  };

  const handleDeposit = (amount: number, method: string) => {
    setBalance(prev => prev + amount);
    addTransaction('deposit', amount, `Depósito por ${method === 'card' ? 'Tarjeta' : 'SPEI'}`);
    toast({
      title: 'Depósito Exitoso',
      description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
      variant: 'default',
    });
  };

  const handleWithdraw = (amount: number, clabe: string): boolean => {
    if (!firstInvestmentDate) {
      toast({
        title: 'Retiro no permitido',
        description: 'Necesitas realizar al menos una inversión antes de poder retirar.',
        variant: 'destructive',
      });
      return false;
    }

    const daysSinceInvestment = Math.floor((new Date().getTime() - firstInvestmentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceInvestment < 14) {
      toast({
        title: 'Retiro no permitido',
        description: `Debes esperar 14 días desde tu primera inversión. Días restantes: ${14 - daysSinceInvestment}.`,
        variant: 'destructive',
      });
      return false;
    }

    if (amount > balance) {
        toast({
            title: 'Saldo insuficiente',
            description: 'No tienes suficiente saldo para este retiro.',
            variant: 'destructive',
        });
        return false;
    }

    setBalance(prev => prev - amount);
    addTransaction('withdraw', amount, `Retiro a CLABE: ...${clabe.slice(-4)}`);
    toast({
      title: 'Retiro Exitoso',
      description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
    });
    return true;
  };

  const handleInvest = (amount: number, property: Property) => {
     if (amount > balance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (amount < property.minInvestment) {
        toast({ title: `La inversión mínima es de ${property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`, variant: "destructive" });
        return;
    }

    if (!firstInvestmentDate) {
      setFirstInvestmentDate(new Date());
    }

    setBalance(prev => prev - amount);
    setProperties(prevProps =>
      prevProps.map(p =>
        p.id === property.id
          ? { ...p, invested: p.invested + amount, ownedShares: p.ownedShares + 1 }
          : p
      )
    );
    addTransaction('investment', amount, `Inversión en ${property.name}`);
    toast({
      title: '¡Inversión Exitosa!',
      description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.`,
    });
  };
  
  const value = {
    user,
    isAuthenticated: !!user,
    balance,
    properties,
    transactions,
    firstInvestmentDate,
    modals,
    login,
    logout,
    addTransaction,
    handleDeposit,
    handleWithdraw,
    handleInvest,
    setProperties,
    setModals,
  };

  return <AppContext.Provider value={value}>{isHydrated ? children : null}</AppContext.Provider>;
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
