'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { propertiesData } from '@/lib/data';

// --- Local Data Simulation ---
// This replaces the direct import of db.json
const dbData = {
  "users": [
    {
      "id": "user-1",
      "publicId": "12345",
      "name": "Usuario de Prueba",
      "email": "test@test.com",
      "password": "password123"
    }
  ],
  "balances": {
    "user-1": {
      "amount": 15000,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  },
  "investments": [
    {
      "id": "inv-1",
      "userId": "user-1",
      "propertyId": "1",
      "investedAmount": 5000,
      "ownedShares": 16.66,
      "investmentDate": "2024-05-10T10:00:00.000Z",
      "term": 30
    }
  ],
  "transactions": [
     {
      "id": "trans-1",
      "userId": "user-1",
      "type": "deposit" as const,
      "amount": 20000,
      "description": "Depósito inicial",
      "date": "2024-05-01T09:00:00.000Z"
    },
    {
      "id": "trans-2",
      "userId": "user-1",
      "type": "investment" as const,
      "amount": 5000,
      "description": "Inversión en Hacienda Santorini",
      "date": "2024-05-10T10:00:00.000Z"
    }
  ]
};
// --- End of Local Data Simulation ---


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
  login: (email: string, pass: string) => void;
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
        setBalance(userBalance?.amount ?? 0);
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
      const now = new Date(); 
      
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


  const login = (email: string, pass: string) => {
    setIsAuthLoading(true);
    const foundUser = dbData.users.find(u => u.email === email && u.password === pass);
    if (foundUser) {
        const { password, ...userSafe } = foundUser;
        const userBalance = dbData.balances[userSafe.id as keyof typeof dbData.balances];
        const userInvestments = dbData.investments.filter(inv => inv.userId === userSafe.id);
        const userTransactions = dbData.transactions.filter(t => t.userId === userSafe.id);

        setUser(userSafe);
        setBalance(userBalance?.amount ?? 0);
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

  const registerAndCreateUser = (name: string, email: string, password: string) => {
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
