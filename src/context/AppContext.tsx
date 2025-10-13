'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Property, Transaction, User, Investment } from '@/lib/types';
import { propertiesData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, doc, writeBatch, serverTimestamp, Timestamp, runTransaction, getDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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

async function generateUniquePublicId(firestore: ReturnType<typeof useFirestore>): Promise<string> {
  const publicIdsRef = collection(firestore, 'publicIds');
  let publicId: string;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) { // Limit attempts to prevent infinite loops
    publicId = Math.floor(10000 + Math.random() * 90000).toString();
    const idDocRef = doc(publicIdsRef, publicId);
    const docSnap = await getDoc(idDocRef);
    if (!docSnap.exists()) {
      isUnique = true;
      return publicId;
    }
    attempts++;
  }

  throw new Error("Could not generate a unique public ID after multiple attempts.");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [modals, setModals] = useState<ModalState>({ deposit: false, withdraw: false, invest: null });

  // === Firestore Data Hooks ===
  const propertiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'properties') : null, [firestore]);
  const { data: properties, isLoading: isLoadingProperties } = useCollection<Property>(propertiesQuery);
  
  const userDocRef = useMemoFirebase(() => firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null, [firebaseUser, firestore]);
  const { data: userData } = useDoc<User>(userDocRef);

  const balanceDocRef = useMemoFirebase(() => firebaseUser ? doc(firestore, 'users', firebaseUser.uid, 'account_balance', firebaseUser.uid) : null, [firebaseUser, firestore]);
  const { data: balanceData, isLoading: isLoadingBalance } = useDoc<{ balance: number }>(balanceDocRef);
  const balance = balanceData?.balance ?? 0;

  const transactionsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'users', firebaseUser.uid, 'transactions') : null, [firebaseUser, firestore]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const investmentsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'users', firebaseUser.uid, 'investments') : null, [firebaseUser, firestore]);
  const { data: investments, isLoading: isLoadingInvestments } = useCollection<Investment>(investmentsQuery);

  // Seed properties on initial load if not present
  useEffect(() => {
    if (firestore && properties && properties.length === 0) {
        seedProperties(firestore);
    }
  }, [firestore, properties]);
  
  // Set user state based on Firebase Auth and Firestore user data
  useEffect(() => {
    if (!isUserLoading && firebaseUser && userData) {
      setUser(userData);
       if(window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
        router.push('/dashboard');
      }
    } else if (!isUserLoading && !firebaseUser) {
      setUser(null);
    }
  }, [firebaseUser, isUserLoading, userData, router]);

  const addTransaction = useCallback(async (type: 'deposit' | 'withdraw' | 'investment', amount: number, description: string) => {
    if (!firebaseUser) return;
    const newTransaction = {
      userId: firebaseUser.uid,
      type,
      amount,
      description,
      date: new Date().toISOString(),
    };
    const transactionsCol = collection(firestore, 'users', firebaseUser.uid, 'transactions');
    addDocumentNonBlocking(transactionsCol, newTransaction);
  }, [firebaseUser, firestore]);

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const registerAndCreateUser = useCallback(async (name: string, email: string, password: string) => {
    if (!auth || !firestore) return;

    initiateEmailSignUp(
      auth,
      email,
      password,
      async (userCredential) => {
        const fUser = userCredential.user;
        await updateProfile(fUser, { displayName: name });

        const userDocData = { id: fUser.uid, name, email };
        
        // This is a non-blocking operation. It will run in the background.
        runTransaction(firestore, async (transaction) => {
          const publicId = await generateUniquePublicId(firestore);
          
          const userDocRef = doc(firestore, 'users', fUser.uid);
          const publicIdDocRef = doc(firestore, 'publicIds', publicId);
          const balanceDocRef = doc(firestore, 'users', fUser.uid, 'account_balance', fUser.uid);

          transaction.set(publicIdDocRef, { uid: fUser.uid });
          
          const finalUserDoc = { ...userDocData, publicId };
          transaction.set(userDocRef, finalUserDoc);

          transaction.set(balanceDocRef, {
            userId: fUser.uid,
            balance: 0,
          });
          
          return { finalUserDoc, publicId };
        })
        .then(({ finalUserDoc, publicId }) => {
            // Add the publicId to the userDocData for full context in case of error later
            const fullUserData = { ...finalUserDoc, publicId };
            
            // Chain a then block for success
            toast({
              title: '¡Cuenta creada exitosamente!',
              description: 'Ahora puedes iniciar sesión.',
            });
            router.push('/login');
        })
        .catch((serverError) => {
          // This is the critical change: Use .catch() for error handling.
          const permissionError = new FirestorePermissionError({
            path: `users/${fUser.uid}`, // The primary document being created
            operation: 'create',
            requestResourceData: userDocData, // Pass the data that was attempted
          });
          
          // Emit the contextual error. DO NOT use console.error here.
          errorEmitter.emit('permission-error', permissionError);

          // We also inform the user that the registration failed at a high level.
          toast({
            title: 'Error de registro',
            description: 'No se pudo crear el perfil de usuario. Inténtalo de nuevo.',
            variant: 'destructive',
          });

          // Optional but recommended: Clean up the created auth user if the DB transaction fails.
          fUser.delete();
        });
      },
      (authError) => {
        if (authError.code === 'auth/email-already-in-use') {
          toast({
            title: 'Correo ya registrado',
            description: 'El correo electrónico que ingresaste ya está en uso. Por favor, inicia sesión.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error de registro',
            description: 'Ocurrió un error inesperado al crear tu cuenta.',
            variant: 'destructive',
          });
        }
      }
    );
  }, [auth, firestore, router, toast]);

  const handleDeposit = (amount: number) => {
    if(!firebaseUser) return;
    const newBalance = balance + amount;
    const balanceRef = doc(firestore, 'users', firebaseUser.uid, 'account_balance', firebaseUser.uid);
    setDocumentNonBlocking(balanceRef, { balance: newBalance, userId: firebaseUser.uid }, { merge: true });
    
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
    if(!firebaseUser) return false;

    const newBalance = balance - amount;
    const balanceRef = doc(firestore, 'users', firebaseUser.uid, 'account_balance', firebaseUser.uid);
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
    if(!firebaseUser) return;

    const newBalance = balance - amount;
    const balanceRef = doc(firestore, 'users', firebaseUser.uid, 'account_balance', firebaseUser.uid);
    setDocumentNonBlocking(balanceRef, { balance: newBalance }, { merge: true });

    const newInvestment = {
        userId: firebaseUser.uid,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: 1, // Simplified
        investmentDate: new Date().toISOString(),
        term,
    };
    const investmentsCol = collection(firestore, 'users', firebaseUser.uid, 'investments');
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
