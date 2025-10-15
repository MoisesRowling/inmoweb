'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Save, Loader2, PlusCircle, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import type { User, Transaction, Investment, Property, WithdrawalRequest, UserBalance } from '@/lib/types';
import { AppShell } from '@/components/shared/AppShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestore } from '@/firebase/config';
import { collection, doc, getDocs, writeBatch, query, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { seedProperties } from '@/lib/seed';

const CRUD_PASSWORD = process.env.NEXT_PUBLIC_CRUD_PASSWORD || "caballos1212";

type DataSnapshot = {
    users: User[];
    balances: { [key: string]: UserBalance };
    investments: (Investment & {userId: string})[];
    transactions: (Transaction & {userId: string})[];
    properties: Property[];
    withdrawalRequests: WithdrawalRequest[];
}

async function approveWithdrawal(requestId: string, userId: string, amount: number) {
    const batch = writeBatch(firestore);
    const requestRef = doc(firestore, 'withdrawalRequests', requestId);
    const transactionRef = doc(collection(firestore, 'transactions', userId, 'userTransactions'));
    
    // NOTE: Balance was already debited at time of request.
    // We just create the transaction and delete the request.
    batch.set(transactionRef, {
        userId,
        type: 'withdraw',
        amount,
        description: 'Retiro procesado con éxito',
        date: new Date(),
    });
    batch.delete(requestRef);
    await batch.commit();
}

async function rejectWithdrawal(requestId: string, userId: string, amount: number) {
    const batch = writeBatch(firestore);
    const requestRef = doc(firestore, 'withdrawalRequests', requestId);
    const balanceRef = doc(firestore, 'balances', userId);

    // Refund the user's balance
    const balanceSnap = await getDoc(balanceRef);
    const currentBalance = balanceSnap.exists() ? balanceSnap.data().amount : 0;
    batch.update(balanceRef, { amount: currentBalance + amount });

    // Delete the request
    batch.delete(requestRef);
    await batch.commit();
}

async function deleteInvestment(investmentId: string, userId: string, propertyId: string) {
    const batch = writeBatch(firestore);
    const investmentRef = doc(firestore, 'investments', userId, 'userInvestments', investmentId);
    const balanceRef = doc(firestore, 'balances', userId);
    const transactionRef = doc(collection(firestore, 'transactions', userId, 'userTransactions'));
    
    const investmentSnap = await getDoc(investmentRef);
    const propertySnap = await getDoc(doc(firestore, 'properties', propertyId));

    if (!investmentSnap.exists()) throw new Error("Investment not found");
    const investment = investmentSnap.data() as Investment;
    const propertyName = propertySnap.exists() ? (propertySnap.data() as Property).name : 'N/A';
    
    // Refund user
    const balanceSnap = await getDoc(balanceRef);
    const currentBalance = balanceSnap.exists() ? balanceSnap.data().amount : 0;
    batch.update(balanceRef, { amount: currentBalance + investment.investedAmount });

    // Create refund transaction
    batch.set(transactionRef, {
        userId,
        type: 'deposit',
        amount: investment.investedAmount,
        description: `Reembolso por inversión cancelada en ${propertyName}`,
        date: new Date(),
    });
    
    // Delete investment
    batch.delete(investmentRef);
    
    await batch.commit();
}


export default function CrudPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [dbData, setDbData] = useState<DataSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingState, setEditingState] = useState<{ [key: string]: any }>({});
    const { toast } = useToast();
    
    const [newTransaction, setNewTransaction] = useState({
        userId: '',
        type: 'deposit',
        amount: '',
        description: '',
    });

    const handleAuth = () => {
        if (password === CRUD_PASSWORD) {
            setIsAuthenticated(true);
            fetchData();
        } else {
            toast({ title: "Error", description: "Contraseña incorrecta.", variant: "destructive" });
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all data from firestore
            const [usersSnap, propertiesSnap, withdrawalRequestsSnap] = await Promise.all([
                getDocs(collection(firestore, 'users')),
                getDocs(collection(firestore, 'properties')),
                getDocs(collection(firestore, 'withdrawalRequests')),
            ]);

            const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            const properties = propertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
            const withdrawalRequests = withdrawalRequestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
            
            const balances: { [key: string]: UserBalance } = {};
            const investments: DataSnapshot['investments'] = [];
            const transactions: DataSnapshot['transactions'] = [];

            for(const user of users) {
                const balanceSnap = await getDoc(doc(firestore, 'balances', user.uid));
                if (balanceSnap.exists()) {
                    balances[user.uid] = balanceSnap.data() as UserBalance;
                }

                const investmentsSnap = await getDocs(collection(firestore, 'investments', user.uid, 'userInvestments'));
                investmentsSnap.forEach(doc => investments.push({ userId: user.uid, id: doc.id, ...doc.data()} as Investment & {userId: string}));

                const transactionsSnap = await getDocs(collection(firestore, 'transactions', user.uid, 'userTransactions'));
                transactionsSnap.forEach(doc => transactions.push({ userId: user.uid, id: doc.id, ...doc.data()} as Transaction & {userId: string}));
            }

            setDbData({ users, balances, properties, investments, transactions, withdrawalRequests });

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar los datos de Firestore.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const handleFieldChange = (userId: string, field: string, value: any) => {
        setEditingState(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: value }
        }));
    };
    
    const handleNewTransactionChange = (field: string, value: any) => {
        setNewTransaction(prev => ({ ...prev, [field]: value }));
    };

    const runAction = async (action: () => Promise<any>, successMsg: string) => {
        setLoading(true);
        try {
            await action();
            toast({ title: "Éxito", description: successMsg });
            fetchData();
        } catch (error: any) {
            toast({ title: "Error en la operación", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedProperties();
            if (result.success) {
                toast({ title: "Éxito", description: result.message });
                fetchData();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({ title: "Error en Seeding", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateUser = async (userId: string, newName: string) => {
        if (!newName) return;
        await runAction(() => updateDoc(doc(firestore, 'users', userId), { name: newName }), 'Usuario actualizado.');
    }

    const handleUpdateBalance = async (userId: string, newBalance: string) => {
        if (newBalance === null || newBalance === undefined) return;
        const amount = parseFloat(newBalance);
        if (isNaN(amount)) return;
        await runAction(() => updateDoc(doc(firestore, 'balances', userId), { amount }), 'Saldo actualizado.');
    }

    const handleDeleteUser = async (userId: string) => {
         await runAction(async () => {
            // This is a simplified delete. In a real app, you would want a Cloud Function
            // to handle cascading deletes of subcollections. For now, we just delete the top-level docs.
            const batch = writeBatch(firestore);
            batch.delete(doc(firestore, 'users', userId));
            batch.delete(doc(firestore, 'balances', userId));
            await batch.commit();
            // Note: Investments and transactions subcollections will be orphaned.
         }, 'Usuario eliminado.');
    }
    
    const handleDeleteTransaction = async (transactionId: string, userId: string) => {
        await runAction(() => deleteDoc(doc(firestore, 'transactions', userId, 'userTransactions', transactionId)), 'Transacción eliminada.');
    }

    const handleAddTransaction = async () => {
         await runAction(async () => {
            const { userId, type, amount, description } = newTransaction;
            if (!userId || !amount || !description) {
                throw new Error("Por favor, completa todos los campos.");
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount)) throw new Error('Monto inválido');

            const batch = writeBatch(firestore);
            const balanceRef = doc(firestore, 'balances', userId);
            const transactionRef = doc(collection(firestore, 'transactions', userId, 'userTransactions'));

            const balanceSnap = await getDoc(balanceRef);
            const currentBalance = balanceSnap.exists() ? balanceSnap.data().amount : 0;
            let newBalance = currentBalance;

            if (type === 'deposit') {
                newBalance += parsedAmount;
            } else { // Direct withdraw
                if (currentBalance < parsedAmount) throw new Error('Fondos insuficientes');
                newBalance -= parsedAmount;
            }

            batch.update(balanceRef, { amount: newBalance, lastUpdated: new Date() });
            batch.set(transactionRef, { userId, type, amount: parsedAmount, description, date: new Date() });

            await batch.commit();
            setNewTransaction({ userId: '', type: 'deposit', amount: '', description: '' });

        }, 'Transacción añadida con éxito.');
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Admin Access</CardTitle>
                        <CardDescription>Ingresa la contraseña para gestionar la base de datos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input 
                            type="password" 
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                        <Button onClick={handleAuth} className="w-full">Entrar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (loading && !dbData) {
        return (
             <AppShell>
                <div className="flex items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin" />
                </div>
            </AppShell>
        );
    }

    const toDate = (timestamp: any) => {
        if (!timestamp) return new Date();
        if (timestamp.toDate) return timestamp.toDate();
        return new Date(timestamp);
    }

    return (
        <AppShell>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Panel de Administración Firestore</h1>
                    <Button onClick={handleSeed} variant="outline" disabled={loading}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Poblar Propiedades
                    </Button>
                </div>
                
                {/* Withdrawal Requests Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Solicitudes de Retiro Pendientes</CardTitle>
                        <CardDescription>Aprueba o rechaza los retiros para que se procesen.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Titular</TableHead>
                                    <TableHead>CLABE</TableHead>
                                    <TableHead>Fecha Solicitud</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {dbData?.withdrawalRequests && dbData.withdrawalRequests.length > 0 ? (
                                    dbData.withdrawalRequests.map((req) => {
                                        const user = dbData.users.find(u => u.uid === req.userId);
                                        return (
                                            <TableRow key={req.id}>
                                                <TableCell>
                                                    <div>{user?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                                                </TableCell>
                                                <TableCell>{req.amount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                                <TableCell>{req.accountHolderName}</TableCell>
                                                <TableCell className="font-mono">{req.clabe}</TableCell>
                                                <TableCell>{toDate(req.date).toLocaleString()}</TableCell>
                                                <TableCell className="flex gap-2">
                                                    <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                        onClick={() => runAction(() => approveWithdrawal(req.id, req.userId, req.amount), 'Retiro aprobado.')}
                                                        disabled={loading}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Aprobar
                                                    </Button>
                                                     <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => runAction(() => rejectWithdrawal(req.id, req.userId, req.amount), 'Retiro rechazado.')}
                                                        disabled={loading}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Rechazar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No hay solicitudes de retiro pendientes.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Public ID</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Firebase UID</TableHead>
                                    <TableHead>Saldo</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dbData?.users.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-mono text-xs font-bold text-primary">{user.publicId}</TableCell>
                                        <TableCell>
                                            <Input 
                                                defaultValue={user.name}
                                                onChange={(e) => handleFieldChange(user.uid, 'name', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="font-mono text-xs">{user.uid}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number"
                                                defaultValue={dbData.balances[user.uid]?.amount ?? 0}
                                                onChange={(e) => handleFieldChange(user.uid, 'balance', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button size="icon" variant="outline" onClick={() => handleUpdateUser(user.uid, editingState[user.uid]?.name)}>
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" onClick={() => handleUpdateBalance(user.uid, editingState[user.uid]?.balance)}>
                                                <Save className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleDeleteUser(user.uid)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                 {/* Add Transaction */}
                <Card>
                    <CardHeader>
                        <CardTitle>Añadir Transacción Manual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <Select onValueChange={(value) => handleNewTransactionChange('userId', value)} value={newTransaction.userId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dbData?.users.map((user) => (
                                        <SelectItem key={user.uid} value={user.uid}>{user.name} ({user.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => handleNewTransactionChange('type', value)} defaultValue="deposit">
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de transacción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deposit">Depósito</SelectItem>
                                    <SelectItem value="withdraw">Retiro (Directo)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input 
                                type="number"
                                placeholder="Monto"
                                value={newTransaction.amount}
                                onChange={(e) => handleNewTransactionChange('amount', e.target.value)}
                            />
                            <Input 
                                placeholder="Descripción"
                                value={newTransaction.description}
                                onChange={(e) => handleNewTransactionChange('description', e.target.value)}
                                className="md:col-span-2"
                            />
                        </div>
                        <Button onClick={handleAddTransaction} disabled={loading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Transacción
                        </Button>
                         <p className="text-xs text-muted-foreground">Nota: El retiro manual descuenta el saldo directamente, sin pasar por aprobación.</p>
                    </CardContent>
                </Card>
                
                 {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Transacciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dbData?.transactions.sort((a,b) => toDate(b.date).getTime() - toDate(a.date).getTime()).map((t) => (
                                     <TableRow key={t.id}>
                                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                                        <TableCell className="font-mono text-xs">{t.userId}</TableCell>
                                        <TableCell>{t.type}</TableCell>
                                        <TableCell>{t.amount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell>{toDate(t.date).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="destructive" onClick={() => handleDeleteTransaction(t.id, t.userId)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 {/* Investments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Inversiones Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Propiedad</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Fecha Inversión</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Tiempo Restante</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dbData?.investments.filter(inv => inv.status === 'active').map((inv) => {
                                    const user = dbData.users.find(u => u.uid === inv.userId);
                                    const property = dbData.properties.find(p => p.id === inv.propertyId);
                                    const expirationDate = toDate(inv.expirationDate);
                                    
                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                <div>{user?.name}</div>
                                                <div className="text-xs text-muted-foreground">{user?.email}</div>
                                            </TableCell>
                                            <TableCell>{property?.name ?? 'N/A'}</TableCell>
                                            <TableCell>{inv.investedAmount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                            <TableCell>{toDate(inv.investmentDate).toLocaleString()}</TableCell>
                                            <TableCell>{expirationDate.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {formatDistanceToNow(expirationDate, { addSuffix: true, locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="icon" 
                                                    variant="destructive" 
                                                    onClick={() => runAction(() => deleteInvestment(inv.id, inv.userId, inv.propertyId), 'Inversión eliminada y fondos devueltos.')}
                                                    disabled={loading}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </AppShell>
    );
}
