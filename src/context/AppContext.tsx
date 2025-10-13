'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { propertiesData } from '@/lib/data';
import dbData from '../../../db.json';

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
  handleDeposit: (amount: number) => void;
  handleWithdraw: (amount: number, clabe: string) => boolean;
  handleInvest: (amount: number, property: Property, term: number) => void;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


// Function to get current UTC time from an external service or fallback
async function getCurrentTime() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/Etc/UTC', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch time');
        const data = await response.json();
        return new Date(data.utc_datetime);
    } catch (error) {
        console.error("Could not fetch external time, falling back to server time:", error);
        return new Date();
    }
}


export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  // Local state for the whole app
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>(propertiesData);


  // Load user from localStorage on initial render
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('inmosmart-user');
      if (storedUser) {
        const userData: User = JSON.parse(storedUser);
        const userBalance = dbData.balances[userData.id as keyof typeof dbData.balances];
        const userInvestments = dbData.investments.filter(inv => inv.userId === userData.id);
        const userTransactions = dbData.transactions.filter(t => t.userId === userData.id);

        setUser(userData);
        setBalance(userBalance.amount);
        setInvestments(userInvestments);
        setTransactions(userTransactions);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('inmosmart-user');
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('inmosmart-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('inmosmart-user');
    }
  }, [user]);
  
  // Real-time investment calculation effect
  useEffect(() => {
    if (!user || investments.length === 0) return;

    const interval = setInterval(async () => {
      const now = new Date(); // Use local time for simplicity in this simulation
      let totalGainsFromStart = 0;
      
      const updatedInvestments = investments.map(investment => {
        const property = properties.find(p => p.id === investment.propertyId);
        if (!property) return { ...investment, currentValue: investment.investedAmount };
        
        const investmentDate = new Date(investment.investmentDate);
        const secondsElapsed = (now.getTime() - investmentDate.getTime()) / 1000;
        
        if (secondsElapsed <= 0) {
            return { ...investment, currentValue: investment.investedAmount };
        }
        
        const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400; // 86400 seconds
        const investmentTotalGains = gainPerSecond * secondsElapsed;
        
        return {
          ...investment,
          currentValue: investment.investedAmount + investmentTotalGains
        };
      });
      setInvestments(updatedInvestments);

    }, 2000); // Recalculate every 2 seconds

    return () => clearInterval(interval);
  }, [user, investments, properties]);


  const login = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    const foundUser = dbData.users.find(u => u.email === email && u.password === pass);
    if (foundUser) {
        const { password, ...userSafe } = foundUser;
        const userBalance = dbData.balances[userSafe.id as keyof typeof dbData.balances];
        const userInvestments = dbData.investments.filter(inv => inv.userId === userSafe.id);
        const userTransactions = dbData.transactions.filter(t => t.userId === userSafe.id);

        setUser(userSafe);
        setBalance(userBalance.amount);
        setInvestments(userInvestments);
        setTransactions(userTransactions);
        
        toast({ title: '¡Bienvenido de vuelta!' });
        router.push('/dashboard');
    } else {
        toast({ title: 'Error de inicio de sesión', description: 'El correo o la contraseña son incorrectos.', variant: 'destructive' });
    }
    setIsAuthLoading(false);
  };
  
  const logout = useCallback(() => {
    setUser(null);
    setBalance(0);
    setInvestments([]);
    setTransactions([]);
    router.push('/login');
  }, [router]);

  const registerAndCreateUser = async (name: string, email: string, password: string) => {
    setIsAuthLoading(true);
    if (dbData.users.find(u => u.email === email)) {
        toast({ title: 'Error de registro', description: 'El correo electrónico ya está en uso.', variant: 'destructive' });
        setIsAuthLoading(false);
        return;
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        publicId: Math.floor(10000 + Math.random() * 90000).toString(),
        name,
        email,
    };
    
    setUser(newUser);
    setBalance(0);
    setInvestments([]);
    setTransactions([]);

    toast({ title: '¡Cuenta creada exitosamente!', description: 'Bienvenido a InmoSmart.' });
    router.push('/dashboard');
    setIsAuthLoading(false);
  };

  const handleDeposit = (amount: number) => {
    if (!user) return;
    const newBalance = balance + amount;
    setBalance(newBalance);
    
    const newTransaction: Transaction = {
        id: `trans-${Date.now()}`,
        userId: user.id,
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
        toast({ title: 'Saldo insuficiente', description: 'No tienes suficiente saldo para este retiro.', variant: 'destructive' });
        return false;
    }
    if (!user) return false;

    setBalance(prev => prev - amount);

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      userId: user.id,
      type: 'withdraw',
      amount,
      description: `Retiro a CLABE: ...${clabe.slice(-4)}`,
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);

    toast({ title: 'Retiro Exitoso', description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
    return true;
  };

  const handleInvest = (amount: number, property: Property, term: number) => {
    if (amount > balance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (!user) return;

    setBalance(prev => prev - amount);

    const newInvestment: Investment = {
        id: `inv-${Date.now()}`,
        userId: user.id,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: amount / property.price * property.totalShares,
        investmentDate: new Date().toISOString(),
        term,
    };
    setInvestments(prev => [...prev, newInvestment]);

    const newTransaction: Transaction = {
        id: newInvestment.id, // Use same ID for consistency
        userId: user.id,
        type: 'investment',
        amount,
        description: `Inversión en ${property.name}`,
        date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);

    toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
  };
  
  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isAuthLoading,
    balance,
    properties,
    transactions,
    investments,
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
