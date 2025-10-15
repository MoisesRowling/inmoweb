'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment, UserBalance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc } from '@/firebase/firestore';
import { auth, firestore } from '@/firebase/config';
import { collection, doc, serverTimestamp, writeBatch, type Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

type ModalState = {
  deposit: boolean;
  withdraw: boolean;
  invest: Property | null;
};

interface AppContextType {
  user: User | null;
  authUser: import('firebase/auth').User | null;
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
  const router = useRouter();
  const { toast } = useToast();
  
  const { user: authUser, isLoading: isAuthLoading, error: authError } = useUser();
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // Fetch user profile
  const { data: user, mutate: mutateUser } = useDoc<User>(authUser ? doc(firestore, 'users', authUser.uid) : null);
  
  // Fetch balance
  const { data: balanceData, mutate: mutateBalance } = useDoc<UserBalance>(authUser ? doc(firestore, 'balances', authUser.uid) : null);

  // Fetch properties, investments, and transactions
  const { data: properties } = useCollection<Property>(collection(firestore, 'properties'));
  const { data: investments, mutate: mutateInvestments } = useCollection<Investment>(authUser ? collection(firestore, 'investments', authUser.uid, 'userInvestments') : null);
  const { data: transactions, mutate: mutateTransactions } = useCollection<Transaction>(authUser ? collection(firestore, 'transactions', authUser.uid, 'userTransactions') : null);
  
  const refreshData = useCallback(() => {
    mutateUser();
    mutateBalance();
    mutateInvestments();
    mutateTransactions();
  }, [mutateUser, mutateBalance, mutateInvestments, mutateTransactions]);

  // Handle Auth errors
  useEffect(() => {
    if (authError) {
        toast({ title: 'Error de Autenticación', description: authError.message, variant: 'destructive'});
    }
  }, [authError, toast]);


  const login = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        toast({ title: '¡Bienvenido de vuelta!' });
        router.push('/dashboard');
    } catch (err: any) {
        toast({ title: 'Error de inicio de sesión', description: err.message, variant: 'destructive' });
    }
  };

  const registerAndCreateUser = async (name: string, email: string, password: string) => {
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          const batch = writeBatch(firestore);

          // Create user profile document
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const newUser: User = {
              uid: firebaseUser.uid,
              publicId: Math.floor(10000 + Math.random() * 90000).toString(),
              name,
              email: firebaseUser.email!,
          };
          batch.set(userDocRef, newUser);
          
          // Create initial balance document
          const balanceDocRef = doc(firestore, 'balances', firebaseUser.uid);
          const newBalance: UserBalance = {
              amount: 0,
              lastUpdated: serverTimestamp() as Timestamp
          };
          batch.set(balanceDocRef, newBalance);

          await batch.commit();
          
          toast({ title: '¡Cuenta creada exitosamente!' });
          router.push('/dashboard');
      } catch (err: any) {
           toast({ title: 'Error de registro', description: err.message, variant: 'destructive' });
      }
  };
  
  const logout = useCallback(async () => {
    await signOut(auth);
    // Clear local state if needed
    router.push('/login');
  }, [router]);

  const handleDeposit = async (amount: number) => {
     if (!authUser) return;
     const batch = writeBatch(firestore);
     const balanceRef = doc(firestore, 'balances', authUser.uid);
     const transactionRef = doc(collection(firestore, 'transactions', authUser.uid, 'userTransactions'));
     
     batch.update(balanceRef, {
         amount: (balanceData?.amount || 0) + amount,
         lastUpdated: serverTimestamp()
     });

     batch.set(transactionRef, {
         userId: authUser.uid,
         type: 'deposit',
         amount,
         description: 'Depósito simulado',
         date: serverTimestamp()
     });

     try {
        await batch.commit();
        toast({ title: 'Depósito Exitoso', description: `Has simulado un depósito de ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
        refreshData();
     } catch(e: any) {
         toast({ title: 'Error en depósito', description: e.message, variant: 'destructive'});
     }
  };

  const handleWithdraw = async (amount: number, clabe: string, accountHolderName: string): Promise<boolean> => {
     if (!authUser) return false;
     if ((balanceData?.amount || 0) < amount) {
         toast({ title: 'Saldo insuficiente', variant: 'destructive'});
         return false;
     }

     const batch = writeBatch(firestore);
     const balanceRef = doc(firestore, 'balances', authUser.uid);
     const requestRef = doc(collection(firestore, 'withdrawalRequests'));

     // Retain funds
     batch.update(balanceRef, {
         amount: (balanceData?.amount || 0) - amount,
         lastUpdated: serverTimestamp()
     });

     // Create request
     batch.set(requestRef, {
         userId: authUser.uid,
         amount,
         clabe,
         accountHolderName,
         date: serverTimestamp(),
         status: 'pending'
     });

     try {
        await batch.commit();
        toast({ title: 'Solicitud de Retiro Enviada', description: `Tu solicitud para retirar ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} ha sido enviada.` });
        refreshData();
        return true;
     } catch (e: any) {
        toast({ title: 'Error en solicitud', description: e.message, variant: 'destructive'});
        // Ideally, you'd have a mechanism to refund the retained amount if the request creation fails.
        // For simplicity, we'll assume this commit is atomic.
        return false;
     }
  };
  
  const handleInvest = async (amount: number, property: Property, term: number) => {
    if (!authUser) return;
    if ((balanceData?.amount || 0) < amount) {
        toast({ title: 'Saldo insuficiente', variant: 'destructive'});
        return;
    }
    
    const batch = writeBatch(firestore);
    const balanceRef = doc(firestore, 'balances', authUser.uid);
    const investmentRef = doc(collection(firestore, 'investments', authUser.uid, 'userInvestments'));
    const transactionRef = doc(collection(firestore, 'transactions', authUser.uid, 'userTransactions'));

    const investmentDate = new Date();
    const expirationDate = new Date(investmentDate);
    expirationDate.setDate(expirationDate.getDate() + term);

    // 1. Debit balance
    batch.update(balanceRef, {
        amount: (balanceData?.amount || 0) - amount,
        lastUpdated: serverTimestamp()
    });

    // 2. Create investment
    batch.set(investmentRef, {
        userId: authUser.uid,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: amount / property.price * property.totalShares,
        investmentDate: serverTimestamp(),
        term,
        status: 'active',
        expirationDate,
    });

    // 3. Create transaction
    batch.set(transactionRef, {
        userId: authUser.uid,
        type: 'investment',
        amount,
        description: `Inversión en ${property.name}`,
        date: serverTimestamp()
    });
    
    try {
        await batch.commit();
        toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
        refreshData();
    } catch (e: any) {
        toast({ title: 'Error en inversión', description: e.message, variant: 'destructive'});
    }
  };

  const value: AppContextType = {
    user,
    authUser,
    isAuthenticated: !!authUser,
    isAuthLoading,
    balance: balanceData?.amount ?? 0,
    properties: properties ?? [],
    transactions: transactions ?? [],
    investments: investments ?? [],
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
