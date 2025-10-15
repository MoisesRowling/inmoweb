'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment, UserBalance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc } from '@/firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, type Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const { auth, firestore } = initializeFirebase();

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

  const userDocRef = authUser ? doc(firestore, 'users', authUser.uid) : null;
  const balanceDocRef = authUser ? doc(firestore, 'balances', authUser.uid) : null;
  const investmentsColRef = authUser ? collection(firestore, 'investments', authUser.uid, 'userInvestments') : null;
  const transactionsColRef = authUser ? collection(firestore, 'transactions', authUser.uid, 'userTransactions') : null;

  // Fetch user profile
  const { data: user, mutate: mutateUser } = useDoc<User>(userDocRef);
  
  // Fetch balance
  const { data: balanceData, mutate: mutateBalance } = useDoc<UserBalance>(balanceDocRef);

  // Fetch properties, investments, and transactions
  const { data: properties } = useCollection<Property>(collection(firestore, 'properties'));
  const { data: investments, mutate: mutateInvestments } = useCollection<Investment>(investmentsColRef);
  const { data: transactions, mutate: mutateTransactions } = useCollection<Transaction>(transactionsColRef);
  
  const refreshData = useCallback(() => {
    if (!authUser) return;
    mutateUser();
    mutateBalance();
    mutateInvestments();
    mutateTransactions();
  }, [authUser, mutateUser, mutateBalance, mutateInvestments, mutateTransactions]);

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
  
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const newUser: Omit<User, 'id'> = {
        uid: firebaseUser.uid,
        publicId: Math.floor(10000 + Math.random() * 90000).toString(),
        name,
        email: firebaseUser.email!,
      };
      batch.set(userDocRef, newUser);
  
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
      // Check for permission denied error and emit a contextual error
      if (err.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `/users/{userId} or /balances/{userId}`,
          operation: 'create',
          // Can't know which one failed, but context is still useful
          requestResourceData: { name, email },
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        toast({ title: 'Error de registro', description: err.message, variant: 'destructive' });
      }
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
     
     const newBalanceAmount = (balanceData?.amount || 0) + amount;
     const transactionData = {
         userId: authUser.uid,
         type: 'deposit',
         amount,
         description: 'Depósito simulado',
         date: serverTimestamp()
     };

     batch.update(balanceRef, {
         amount: newBalanceAmount,
         lastUpdated: serverTimestamp()
     });

     batch.set(transactionRef, transactionData);

     batch.commit()
      .then(() => {
        toast({ title: 'Depósito Exitoso', description: `Has simulado un depósito de ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` });
        refreshData();
      })
      .catch((err: any) => {
        const permissionError = new FirestorePermissionError({
          path: `${balanceRef.path} or ${transactionRef.path}`,
          operation: 'write',
          requestResourceData: { balanceUpdate: { amount: newBalanceAmount }, transaction: transactionData },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ title: 'Error en depósito', description: 'No se pudo completar el depósito por un problema de permisos.', variant: 'destructive'});
      });
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

     const newBalanceAmount = (balanceData?.amount || 0) - amount;
     const requestData = {
         userId: authUser.uid,
         amount,
         clabe,
         accountHolderName,
         date: serverTimestamp(),
         status: 'pending'
     };

     batch.update(balanceRef, {
         amount: newBalanceAmount,
         lastUpdated: serverTimestamp()
     });

     batch.set(requestRef, requestData);

     try {
        await batch.commit()
          .catch((err: any) => {
              const permissionError = new FirestorePermissionError({
                  path: `${balanceRef.path} or ${requestRef.path}`,
                  operation: 'write',
                  requestResourceData: { balanceUpdate: { amount: newBalanceAmount }, withdrawalRequest: requestData },
              });
              errorEmitter.emit('permission-error', permissionError);
              throw err; // Re-throw to be caught by outer catch
          });

        toast({ title: 'Solicitud de Retiro Enviada', description: `Tu solicitud para retirar ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} ha sido enviada.` });
        refreshData();
        return true;
     } catch (e: any) {
        toast({ title: 'Error en solicitud', description: 'No se pudo enviar la solicitud por un problema de permisos.', variant: 'destructive'});
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

    const newBalanceAmount = (balanceData?.amount || 0) - amount;
    const investmentData = {
        userId: authUser.uid,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: amount / property.price * property.totalShares,
        investmentDate: serverTimestamp(),
        term,
        status: 'active',
        expirationDate,
    };
    const transactionData = {
        userId: authUser.uid,
        type: 'investment' as const,
        amount,
        description: `Inversión en ${property.name}`,
        date: serverTimestamp()
    };
    
    batch.update(balanceRef, {
        amount: newBalanceAmount,
        lastUpdated: serverTimestamp()
    });
    batch.set(investmentRef, investmentData);
    batch.set(transactionRef, transactionData);
    
    batch.commit()
      .then(() => {
        toast({ title: '¡Inversión Exitosa!', description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.` });
        refreshData();
      })
      .catch((err: any) => {
         const permissionError = new FirestorePermissionError({
          path: `${balanceRef.path}, ${investmentRef.path}, or ${transactionRef.path}`,
          operation: 'write',
          requestResourceData: { balanceUpdate: {amount: newBalanceAmount}, investment: investmentData, transaction: transactionData },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ title: 'Error en inversión', description: 'No se pudo completar la inversión por un problema de permisos.', variant: 'destructive'});
      });
  };

  const value: AppContextType = {
    user: user ?? null,
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
