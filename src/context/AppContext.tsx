'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User } from '@/lib/types';
import { propertiesData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

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
  handleInvest: (amount: number, property: Property, term: number) => void;
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  setModals: React.Dispatch<React.SetStateAction<ModalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const arePropertiesOutdated = (storedProperties: Property[]): boolean => {
  if (storedProperties.length !== propertiesData.length) return true;
  for (const propData of propertiesData) {
    const storedProp = storedProperties.find(p => p.id === propData.id);
    if (!storedProp || storedProp.name !== propData.name || storedProp.image !== propData.image) {
      return true;
    }
  }
  return false;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
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
    if (!isUserLoading && firebaseUser) {
      const appUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        email: firebaseUser.email || '',
      };
      setUser(appUser);
      router.push('/dashboard');
    } else if (!isUserLoading && !firebaseUser) {
      setUser(null);
    }
  }, [firebaseUser, isUserLoading, router]);

  useEffect(() => {
    if (!firebaseUser) {
      setIsHydrated(true);
      return;
    }
    try {
      const storedBalance = localStorage.getItem(`inmosmart-balance-${firebaseUser.uid}`);
      const storedPropertiesJSON = localStorage.getItem(`inmosmart-properties-${firebaseUser.uid}`);
      const storedTransactions = localStorage.getItem(`inmosmart-transactions-${firebaseUser.uid}`);
      const storedInvestmentDate = localStorage.getItem(`inmosmart-investmentDate-${firebaseUser.uid}`);

      if (storedBalance) setBalance(JSON.parse(storedBalance));
      
      if (storedPropertiesJSON) {
        const storedProperties = JSON.parse(storedPropertiesJSON);
        if (arePropertiesOutdated(storedProperties)) {
            const updatedProperties = propertiesData.map(freshProp => {
                const oldProp = storedProperties.find((p: Property) => p.id === freshProp.id);
                return oldProp ? { ...freshProp, ...{
                    invested: oldProp.invested,
                    initialInvestment: oldProp.initialInvestment,
                    ownedShares: oldProp.ownedShares,
                    investmentTerm: oldProp.investmentTerm
                }} : freshProp;
            });
            setProperties(updatedProperties);
        } else {
            setProperties(storedProperties);
        }
      } else {
        setProperties(propertiesData);
      }

      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedInvestmentDate && storedInvestmentDate !== 'null') {
        const date = new Date(JSON.parse(storedInvestmentDate));
        if (!isNaN(date.getTime())) {
          setFirstInvestmentDate(date);
        }
      }
    } catch (error) {
      console.error("Failed to hydrate state from localStorage", error);
    } finally {
      setIsHydrated(true);
    }
  }, [firebaseUser, isHydrated]);
  
  useEffect(() => {
    if (!isHydrated || !firebaseUser) return;
    try {
      localStorage.setItem(`inmosmart-balance-${firebaseUser.uid}`, JSON.stringify(balance));
      localStorage.setItem(`inmosmart-properties-${firebaseUser.uid}`, JSON.stringify(properties));
      localStorage.setItem(`inmosmart-transactions-${firebaseUser.uid}`, JSON.stringify(transactions));
      localStorage.setItem(`inmosmart-investmentDate-${firebaseUser.uid}`, JSON.stringify(firstInvestmentDate));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [user, balance, properties, transactions, firstInvestmentDate, isHydrated, firebaseUser]);

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
    // This is now handled by firebase auth state change
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setBalance(0);
    setProperties(propertiesData);
    setTransactions([]);
    setFirstInvestmentDate(null);
    // Clear all localStorage for safety, or selectively clear user data
    // localStorage.clear();
    router.push('/login');
  };

  const handleDeposit = (amount: number, method: string) => {
    setBalance(prev => prev + amount);
    addTransaction('deposit', amount, `Depósito por SPEI`);
    toast({
      title: 'Depósito Exitoso',
      description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
      variant: 'default',
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
    addTransaction('withdraw', amount, `Retiro a CLABE: ...${clabe.slice(-4)}`);
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

    if (!firstInvestmentDate) {
      setFirstInvestmentDate(new Date());
    }

    setBalance(prev => prev - amount);
    setProperties(prevProps =>
      prevProps.map(p =>
        p.id === property.id
          ? { 
              ...p, 
              invested: p.invested + amount, 
              initialInvestment: p.initialInvestment + amount,
              ownedShares: p.ownedShares + 1,
              investmentTerm: term,
            }
          : p
      )
    );
    addTransaction('investment', amount, `Inversión en ${property.name} (${term} días)`);
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

  return <AppContext.Provider value={value}>{(isHydrated && !isUserLoading) ? children : null}</AppContext.Provider>;
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
