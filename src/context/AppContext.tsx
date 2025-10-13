'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment, AccountBalance, PublicId } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, useMemoFirebase } from '@/firebase/provider';
import { 
  initiateEmailSignUp, 
  initiateEmailSignIn,
} from '@/firebase/non-blocking-login';
import { 
    doc,
    collection,
    runTransaction,
    getDoc,
    serverTimestamp,
    writeBatch,
    query,
    orderBy,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { FirestorePermissionError } from '@/firebase/errors';
import { User as FirebaseUser, signOut } from 'firebase/auth';

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
  
  const { user: firebaseUser, isUserLoading: isAuthLoading, userError } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // --- Firestore Data Hooks ---
  const userQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: userData } = useCollection<User>(userQuery);

  const investmentsQuery = useMemoFirebase(() => firebaseUser ? query(collection(firestore, `users/${firebaseUser.uid}/investments`), orderBy('investmentDate', 'desc')) : null, [firestore, firebaseUser]);
  const { data: investments } = useCollection<Investment>(investmentsQuery);

  const transactionsQuery = useMemoFirebase(() => firebaseUser ? query(collection(firestore, `users/${firebaseUser.uid}/transactions`), orderBy('date', 'desc')) : null, [firestore, firebaseUser]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);
  
  const propertiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'properties') : null, [firestore]);
  const { data: properties } = useCollection<Property>(propertiesQuery);

  const balanceQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, `users/${firebaseUser.uid}/account_balance`) : null, [firestore, firebaseUser]);
  const { data: balanceData } = useCollection<AccountBalance>(balanceQuery);
  
  // --- Effects ---
  useEffect(() => {
    if (firebaseUser && userData) {
      const currentUserData = userData.find(u => u.id === firebaseUser.uid);
      setUser(currentUserData || null);
    } else {
      setUser(null);
    }
  }, [firebaseUser, userData]);

  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      setBalance(balanceData[0].balance);
    } else {
      setBalance(0);
    }
  }, [balanceData]);

  useEffect(() => {
    if (!isAuthLoading && firebaseUser) {
      router.replace('/dashboard');
    }
  }, [isAuthLoading, firebaseUser, router]);

  // --- Auth Functions ---
  const login = (email: string, pass: string) => {
    initiateEmailSignIn(auth, email, pass, 
      () => {
        toast({ title: '¡Bienvenido de vuelta!'});
        router.push('/dashboard');
      },
      (error) => {
        toast({ title: 'Error de inicio de sesión', description: 'Tus credenciales son incorrectas.', variant: 'destructive' });
      }
    );
  };
  
  const logout = () => {
    signOut(auth).then(() => {
      setUser(null);
      router.push('/login');
    });
  };

  const registerAndCreateUser = useCallback(async (name: string, email: string, password: string) => {
    initiateEmailSignUp(
      auth,
      email,
      password,
      async (userCredential) => {
        const fUser = userCredential.user;
        
        runTransaction(firestore, async (transaction) => {
            const userDocRef = doc(firestore, 'users', fUser.uid);
            
            // Generate a unique 5-digit public ID
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
            
            const accountBalanceDocRef = doc(collection(firestore, `users/${fUser.uid}/account_balance`));

            transaction.set(userDocRef, finalUserDoc);
            transaction.set(publicIdDocRef, { uid: fUser.uid });
            transaction.set(accountBalanceDocRef, { balance: 0, userId: fUser.uid });
          })
          .then(() => {
            toast({
              title: '¡Cuenta creada exitosamente!',
              description: 'Ahora puedes iniciar sesión.',
            });
            router.push('/login');
          })
          .catch((serverError) => {
             const permissionError = new FirestorePermissionError({
              path: `users/${fUser.uid}`,
              operation: 'create',
              requestResourceData: { name, email },
          });
          throw permissionError;
        });
      },
      (error) => {
        toast({
          title: 'Error de registro',
          description: error.message,
          variant: 'destructive',
        });
      }
    );
  }, [auth, firestore, router, toast]);

  const handleDeposit = (amount: number) => {
    if (!firebaseUser || !balanceData || balanceData.length === 0) return;
    const newBalance = (balance || 0) + amount;
    
    const balanceDocRef = doc(firestore, `users/${firebaseUser.uid}/account_balance`, balanceData![0].id);
    const transactionDocRef = doc(collection(firestore, `users/${firebaseUser.uid}/transactions`));
    
    const batch = writeBatch(firestore);
    batch.update(balanceDocRef, { balance: newBalance });
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
    if (amount > (balance || 0)) {
        toast({
            title: 'Saldo insuficiente',
            description: 'No tienes suficiente saldo para este retiro.',
            variant: 'destructive',
        });
        return false;
    }
    if(!firebaseUser || !balanceData || balanceData.length === 0) return false;

    const newBalance = balance - amount;
    const balanceDocRef = doc(firestore, `users/${firebaseUser.uid}/account_balance`, balanceData[0].id);
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
     if (amount > (balance || 0)) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (amount < property.minInvestment) {
        toast({ title: `La inversión mínima es de ${property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`, variant: "destructive" });
        return;
    }
    if (!firebaseUser || !balanceData || balanceData.length === 0) return;

    const newBalance = balance - amount;
    const balanceDocRef = doc(firestore, `users/${firebaseUser.uid}/account_balance`, balanceData[0].id);
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
    isAuthLoading,
    balance: balance || 0,
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
