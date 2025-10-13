'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { propertiesData } from '@/lib/data';

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

// --- Mock Local Database ---
const mockUsers: User[] = [];
let mockBalance = 0;
const mockInvestments: Investment[] = [];
const mockTransactions: Transaction[] = [];
let userIdCounter = 1;


export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthFormLoading, setIsAuthFormLoading] = useState(false);
  
  const [balance, setBalance] = useState(mockBalance);
  const [investments, setInvestments] = useState(mockInvestments);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [properties, setProperties] = useState<Property[]>(propertiesData as Property[]);

  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });
  
  useEffect(() => {
    // Simulate checking for a logged-in user in localStorage
    const storedUser = localStorage.getItem('inmosmart-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setBalance(parsedUser.balance || 0);
      setInvestments(parsedUser.investments || []);
      setTransactions(parsedUser.transactions || []);
      setIsAuthenticated(true);
    }
    // Artificial delay to simulate auth loading
    setTimeout(() => {
        setIsAuthLoading(false);
    }, 500);
  }, []);

  const syncLocalStorage = (userData: User, currentBalance: number, currentInvestments: Investment[], currentTransactions: Transaction[]) => {
      localStorage.setItem('inmosmart-user', JSON.stringify({
          ...userData,
          balance: currentBalance,
          investments: currentInvestments,
          transactions: currentTransactions,
      }));
  }

  // --- Auth Functions (Local) ---
  const login = (email: string, pass: string) => {
    setIsAuthFormLoading(true);
    const foundUser = mockUsers.find(u => u.email === email); // Password check is omitted for simplicity
    
    setTimeout(() => { // Simulate network delay
        if (foundUser) {
          setUser(foundUser);
          setIsAuthenticated(true);
          syncLocalStorage(foundUser, balance, investments, transactions);
          toast({ title: '¡Bienvenido de vuelta!' });
          router.push('/dashboard');
        } else {
          toast({ title: 'Error de inicio de sesión', description: 'El correo o la contraseña son incorrectos.', variant: 'destructive' });
        }
        setIsAuthFormLoading(false);
    }, 500);
  };
  
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('inmosmart-user');
    router.push('/login');
  }, [router]);

  const registerAndCreateUser = (name: string, email: string, password: string) => {
    setIsAuthFormLoading(true);
    
    setTimeout(() => {
        if (mockUsers.find(u => u.email === email)) {
            toast({ title: 'Error de registro', description: 'El correo electrónico ya está en uso.', variant: 'destructive' });
            setIsAuthFormLoading(false);
            return;
        }

        const newUser: User = {
            id: `user-${userIdCounter++}`,
            publicId: Math.floor(10000 + Math.random() * 90000).toString(),
            name,
            email,
        };

        mockUsers.push(newUser);
        setUser(newUser);
        setIsAuthenticated(true);
        setBalance(0); // Initial balance
        setInvestments([]);
        setTransactions([]);
        syncLocalStorage(newUser, 0, [], []);

        toast({ title: '¡Cuenta creada exitosamente!', description: 'Bienvenido a InmoSmart.' });
        router.push('/dashboard');
        setIsAuthFormLoading(false);
    }, 500);
  };

  // --- Data Functions (Local) ---
  const handleDeposit = (amount: number) => {
    if (!user) return;
    
    const newBalance = balance + amount;
    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount,
      description: 'Depósito simulado',
      date: new Date().toISOString(),
    };
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    syncLocalStorage(user, newBalance, investments, newTransactions);
    
    toast({
        title: 'Depósito Exitoso',
        description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
    });
  };

  const handleWithdraw = (amount: number, clabe: string): boolean => {
    if (!user) return false;

    if (amount > balance) {
        toast({ title: 'Saldo insuficiente', description: 'No tienes suficiente saldo para este retiro.', variant: 'destructive' });
        return false;
    }

    const newBalance = balance - amount;
    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      userId: user.id,
      type: 'withdraw',
      amount,
      description: `Retiro a CLABE: ...${clabe.slice(-4)}`,
      date: new Date().toISOString(),
    };
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    syncLocalStorage(user, newBalance, investments, newTransactions);
    
    toast({ title: 'Retiro Exitoso', description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
    return true;
  };

  const handleInvest = (amount: number, property: Property, term: number) => {
    if (!user) return;
    
    if (amount > balance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (amount < property.minInvestment) {
      toast({ title: `La inversión mínima es de ${property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`, variant: "destructive" });
      return;
    }
    
    const newBalance = balance - amount;
    
    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      userId: user.id,
      propertyId: property.id,
      investedAmount: amount,
      ownedShares: amount / property.price * property.totalShares,
      investmentDate: new Date().toISOString(),
      term,
    };
    const newInvestments = [newInvestment, ...investments];

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}-invest`,
      userId: user.id,
      type: 'investment',
      amount,
      description: `Inversión en ${property.name}`,
      date: new Date().toISOString(),
    };
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setInvestments(newInvestments);
    setTransactions(newTransactions);
    syncLocalStorage(user, newBalance, newInvestments, newTransactions);

    toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
  };
  
  const value: AppContextType = {
    user,
    isAuthenticated,
    isAuthLoading: isAuthLoading || isAuthFormLoading,
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
