'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment, AccountBalance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useFirebaseAuth, useFirestore, useUser as useFirebaseUserHook, useMemoFirebase } from '@/firebase/provider';
import { 
    doc,
    collection,
    runTransaction,
    writeBatch,
    query,
    orderBy,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { FirestorePermissionError } from '@/firebase/errors';
import { User as FirebaseUser, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

type ModalState = {
  deposit: boolean;
  withdraw: boolean;
  invest: Property | null;
};

interface AppContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
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
  
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useFirebaseUserHook();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // --- Firestore Data Hooks ---
  const userDocRef = useMemoFirebase(() => firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null, [firestore, firebaseUser]);
  const { data: user } = useDoc<User>(userDocRef);
  
  const investmentsQuery = useMemoFirebase(() => firebaseUser ? query(collection(firestore, `users/${firebaseUser.uid}/investments`), orderBy('investmentDate', 'desc')) : null, [firestore, firebaseUser]);
  const { data: investments } = useCollection<Investment>(investmentsQuery);

  const transactionsQuery = useMemoFirebase(() => firebaseUser ? query(collection(firestore, `users/${firebaseUser.uid}/transactions`), orderBy('date', 'desc')) : null, [firestore, firebaseUser]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const propertiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'properties')) : null, [firestore]);
  const { data: properties } = useCollection<Property>(propertiesQuery);

  const balanceDocRef = useMemoFirebase(() => firebaseUser ? doc(firestore, `users/${firebaseUser.uid}/account/balance`) : null, [firestore, firebaseUser]);
  const { data: balanceData } = useDoc<AccountBalance>(balanceDocRef);
  
  const balance = balanceData?.balance ?? 0;

  // --- Auth Functions ---
  const login = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: '¡Bienvenido de vuelta!' });
    } catch (error) {
      console.error("Login Error:", error);
      toast({ title: 'Error de inicio de sesión', description: 'Tus credenciales son incorrectas.', variant: 'destructive' });
    } finally {
        setIsAuthLoading(false);
    }
  };
  
  const logout = useCallback(() => {
    signOut(auth);
    router.push('/login');
  }, [auth, router]);

  const registerAndCreateUser = async (name: string, email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fUser = userCredential.user;
      
      await runTransaction(firestore, async (transaction) => {
          const userDocRef = doc(firestore, 'users', fUser.uid);
          
          let publicId: string;
          let publicIdDocRef;
          let publicIdDoc;
          do {
            publicId = Math.floor(10000 + Math.random() * 90000).toString();
            publicIdDocRef = doc(firestore, 'publicIds', publicId);
            publicIdDoc = await transaction.get(publicIdDocRef);
          } while (publicIdDoc.exists());

          const finalUserDoc: User = {
              id: fUser.uid,
              name,
              email,
              publicId
          };
          
          const accountBalanceDocRef = doc(firestore, `users/${fUser.uid}/account`, 'balance');
          
          transaction.set(userDocRef, finalUserDoc);
          transaction.set(publicIdDocRef, { uid: fUser.uid });
          transaction.set(accountBalanceDocRef, { balance: 0, userId: fUser.uid });
      });

      toast({
        title: '¡Cuenta creada exitosamente!',
        description: 'Bienvenido a InmoSmart.',
      });
    } catch (error: any) {
        console.error("Registration Error:", error);
        if (error.code === 'auth/email-already-in-use') {
             toast({
                title: 'Error de registro',
                description: "El correo electrónico ya está en uso.",
                variant: 'destructive',
            });
        } else {
             toast({
                title: 'Error de registro',
                description: "Ocurrió un error inesperado. Intenta de nuevo.",
                variant: 'destructive',
            });
        }
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleDeposit = (amount: number) => {
    if (!firebaseUser || !balanceDocRef) return;
    const newBalance = (balanceData?.balance ?? 0) + amount;
    
    const transactionDocRef = doc(collection(firestore, `users/${firebaseUser.uid}/transactions`));
    
    const batch = writeBatch(firestore);
    batch.set(balanceDocRef, { balance: newBalance, userId: firebaseUser.uid }, { merge: true });
    batch.set(transactionDocRef, {
      id: transactionDocRef.id,
      userId: firebaseUser.uid,
      type: 'deposit',
      amount,
      description: 'Depósito simulado',
      date: new Date().toISOString(),
    });

    batch.commit().then(() => {
        toast({
          title: 'Depósito Exitoso',
          description: `Has depositado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
        });
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: balanceDocRef.path,
            operation: 'update',
            requestResourceData: { balance: newBalance },
        });
        throw permissionError;
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
    if(!firebaseUser || !balanceDocRef) return false;
    const newBalance = balance - amount;
    const transactionDocRef = doc(collection(firestore, `users/${firebaseUser.uid}/transactions`));

    const batch = writeBatch(firestore);
    batch.update(balanceDocRef, { balance: newBalance });
    batch.set(transactionDocRef, {
      id: transactionDocRef.id,
      userId: firebaseUser.uid,
      type: 'withdraw',
      amount,
      description: `Retiro a CLABE: ...${clabe.slice(-4)}`,
      date: new Date().toISOString(),
    });

    batch.commit().then(() => {
        toast({
          title: 'Retiro Exitoso',
          description: `Has retirado ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
        });
    }).catch(error => {
         const permissionError = new FirestorePermissionError({
            path: balanceDocRef.path,
            operation: 'update',
            requestResourceData: { balance: newBalance },
        });
        throw permissionError;
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
    if (!firebaseUser || !balanceDocRef) return;
    
    const newBalance = balance - amount;
    const investmentDocRef = doc(collection(firestore, `users/${firebaseUser.uid}/investments`));
    const transactionDocRef = doc(collection(firestore, `users/${firebaseUser.uid}/transactions`));

    const batch = writeBatch(firestore);
    
    batch.update(balanceDocRef, { balance: newBalance });
    
    batch.set(investmentDocRef, {
      id: investmentDocRef.id,
      userId: firebaseUser.uid,
      propertyId: property.id,
      investedAmount: amount,
      ownedShares: amount / property.price * property.totalShares,
      investmentDate: new Date().toISOString(),
      term,
    });
    
    batch.set(transactionDocRef, {
      id: transactionDocRef.id,
      userId: firebaseUser.uid,
      type: 'investment',
      amount,
      description: `Inversión en ${property.name}`,
      date: new Date().toISOString(),
    });

    batch.commit().then(() => {
        toast({
          title: '¡Inversión Exitosa!',
          description: `Has invertido ${amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} en ${property.name}.`,
        });
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: investmentDocRef.path,
            operation: 'create',
            requestResourceData: { amount, propertyId: property.id },
        });
        throw permissionError;
    });
  };
  
  const value: AppContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!firebaseUser,
    isAuthLoading: isAuthLoading || isFirebaseUserLoading,
    balance,
    properties: properties || [],
    transactions: transactions || [],
    investments: investments || [],
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
