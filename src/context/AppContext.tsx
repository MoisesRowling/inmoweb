'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { propertiesData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';

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

const seedProperties = async (firestore: ReturnType<typeof useFirestore>) => {
    const batch = writeBatch(firestore);
    const propertiesCol = collection(firestore, 'properties');
    let hasWrites = false;

    for (const prop of propertiesData) {
        const docRef = doc(propertiesCol, String(prop.id));
        // For seeding, we'll just add them all. In a real app you might check existence.
        batch.set(docRef, {
            id: String(prop.id),
            name: prop.name,
            location: prop.location,
            type: prop.type,
            price: prop.price,
            minInvestment: prop.minInvestment,
            totalShares: prop.totalShares,
            image: prop.image,
            dailyReturn: prop.dailyReturn
        });
        hasWrites = true;
    }
    
    if (hasWrites) {
        await batch.commit();
        console.log("Properties seeded to Firestore.");
    }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // === Firestore Data Hooks ===
  const propertiesQuery = useMemoFirebase(() => collection(firestore, 'properties'), [firestore]);
  const { data: properties, isLoading: isLoadingProperties } = useCollection<Property>(propertiesQuery);
  
  const balanceDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.id, 'account_balance', user.id) : null, [user, firestore]);
  const { data: balanceData, isLoading: isLoadingBalance } = useDoc<{ balance: number }>(balanceDocRef);
  const balance = balanceData?.balance ?? 0;

  const transactionsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.id, 'transactions') : null, [user, firestore]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.id, 'investments') : null, [user, firestore]);
  const { data: investments, isLoading: isLoadingInvestments } = useCollection<Investment>(investmentsQuery);

  // Seed properties on initial load if not present
  useEffect(() => {
    if (firestore && properties && properties.length === 0) {
        seedProperties(firestore);
    }
  }, [firestore, properties]);
  
  // Set user state based on Firebase Auth
  useEffect(() => {
    if (!isUserLoading && firebaseUser) {
      const appUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        email: firebaseUser.email || '',
      };
      setUser(appUser);
      if(window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
        router.push('/dashboard');
      }
    } else if (!isUserLoading && !firebaseUser) {
      setUser(null);
    }
  }, [firebaseUser, isUserLoading, router]);

  const addTransaction = useCallback(async (type: 'deposit' | 'withdraw' | 'investment', amount: number, description: string) => {
    if (!user) return;
    const newTransaction = {
      userId: user.id,
      type,
      amount,
      description,
      date: new Date().toISOString(),
    };
    const transactionsCol = collection(firestore, 'users', user.id, 'transactions');
    addDocumentNonBlocking(transactionsCol, newTransaction);
  }, [user, firestore]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const registerAndCreateUser = useCallback(async (name: string, email: string, password: string) => {
    if (!auth || !firestore) return;
    
    // This will trigger onAuthStateChanged, which will set the user
    initiateEmailSignUp(auth, email, password, async (userCredential) => {
      // This callback runs on successful user creation in Firebase Auth
      const fUser = userCredential.user;
      await updateProfile(fUser, { displayName: name });

      // Now, create the user profile and balance documents in Firestore
      const userDocRef = doc(firestore, 'users', fUser.uid);
      const userData = {
        id: fUser.uid,
        name: name,
        email: email
      };
      setDocumentNonBlocking(userDocRef, userData, { merge: false });

      const balanceDocRef = doc(firestore, 'users', fUser.uid, 'account_balance', fUser.uid);
      const balanceData = {
        userId: fUser.uid,
        balance: 0,
      }
      setDocumentNonBlocking(balanceDocRef, balanceData, { merge: false });

      toast({
        title: '¡Cuenta creada exitosamente!',
        description: 'Ahora puedes iniciar sesión.',
      });
      router.push('/login');
    });
  }, [auth, firestore, router, toast]);

  const handleDeposit = (amount: number) => {
    if(!user) return;
    const newBalance = balance + amount;
    const balanceRef = doc(firestore, 'users', user.id, 'account_balance', user.id);
    setDocumentNonBlocking(balanceRef, { balance: newBalance, userId: user.id }, { merge: true });
    
    addTransaction('deposit', amount, `Depósito por SPEI`);
    toast({
      title: 'Depósito Registrado',
      description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}. El saldo se actualizará en breve.`,
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
    if(!user) return false;

    const newBalance = balance - amount;
    const balanceRef = doc(firestore, 'users', user.id, 'account_balance', user.id);
    setDocumentNonBlocking(balanceRef, { balance: newBalance }, { merge: true });

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
    if(!user) return;

    const newBalance = balance - amount;
    const balanceRef = doc(firestore, 'users', user.id, 'account_balance', user.id);
    setDocumentNonBlocking(balanceRef, { balance: newBalance }, { merge: true });

    const newInvestment = {
        userId: user.id,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: 1, // Simplified
        investmentDate: new Date().toISOString(),
        term,
    };
    const investmentsCol = collection(firestore, 'users', user.id, 'investments');
    addDocumentNonBlocking(investmentsCol, newInvestment);

    addTransaction('investment', amount, `Inversión en ${property.name} (${term} días)`);
    toast({
      title: '¡Inversión Exitosa!',
      description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.`,
    });
  };
  
  const value = {
    user,
    isAuthenticated: !!user,
    balance: balance || 0,
    properties: properties || [],
    transactions: transactions || [],
    investments: investments || [],
    modals,
    logout,
    registerAndCreateUser,
    handleDeposit,
    handleWithdraw,
    handleInvest,
    setModals,
  };

  const isDataLoading = isUserLoading || isLoadingProperties || isLoadingBalance || isLoadingTransactions || isLoadingInvestments;

  return <AppContext.Provider value={value}>{isDataLoading && !user ? null : children}</AppContext.Provider>;
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};