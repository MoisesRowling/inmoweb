'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Save, Loader2, PlusCircle } from 'lucide-react';
import type { User, Transaction, Investment, Property } from '@/lib/types';
import { AppShell } from '@/components/shared/AppShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow, addDays } from 'date-fns';
import { es } from 'date-fns/locale';


const CRUD_PASSWORD = process.env.NEXT_PUBLIC_CRUD_PASSWORD || "caballos1212";

type DBState = {
    users: User[];
    balances: { [key: string]: { amount: number; lastUpdated: string; } };
    investments: Investment[];
    transactions: Transaction[];
    properties: Property[];
}

export default function CrudPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [dbData, setDbData] = useState<DBState | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingState, setEditingState] = useState<{ [key: string]: any }>({});
    const { toast } = useToast();
    
    // State for new transaction form
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
    
    const apiRequest = async (action: string, payload: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/crud', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': CRUD_PASSWORD,
                },
                body: JSON.stringify({ action, payload }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }
            toast({ title: "Éxito", description: `Acción ${action} completada.` });
            fetchData(); // Refresh data after action
        } catch (error: any) {
            toast({ title: "Error en la operación", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/crud', {
                headers: { 'Authorization': CRUD_PASSWORD }
            });
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setDbData(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
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

    const handleAddTransaction = () => {
        if (!newTransaction.userId || !newTransaction.amount || !newTransaction.description) {
            toast({ title: "Error", description: "Por favor, completa todos los campos de la transacción.", variant: "destructive" });
            return;
        }
        apiRequest('addTransaction', newTransaction);
        setNewTransaction({ userId: '', type: 'deposit', amount: '', description: '' });
    };

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


    return (
        <AppShell>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Panel de Administración</h1>

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
                                    <TableHead>Password</TableHead>
                                    <TableHead>Saldo</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dbData?.users.map((user: any) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-mono text-xs font-bold text-primary">{user.publicId}</TableCell>
                                        <TableCell>
                                            <Input 
                                                value={editingState[user.id]?.name ?? user.name}
                                                onChange={(e) => handleFieldChange(user.id, 'name', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.password}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number"
                                                value={editingState[user.id]?.balance ?? dbData.balances[user.id]?.amount ?? 0}
                                                onChange={(e) => handleFieldChange(user.id, 'balance', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button size="icon" variant="outline" onClick={() => apiRequest('updateUser', { userId: user.id, newName: editingState[user.id]?.name })}>
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" onClick={() => apiRequest('updateBalance', { userId: user.id, newBalance: editingState[user.id]?.balance })}>
                                                <Save className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => apiRequest('deleteUser', { userId: user.id })}>
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
                        <CardTitle>Añadir Transacción</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <Select onValueChange={(value) => handleNewTransactionChange('userId', value)} value={newTransaction.userId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dbData?.users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => handleNewTransactionChange('type', value)} defaultValue="deposit">
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de transacción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deposit">Depósito</SelectItem>
                                    <SelectItem value="withdraw">Retiro</SelectItem>
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
                    </CardContent>
                </Card>
                
                 {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transacciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dbData?.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: any) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                                        <TableCell className="font-mono text-xs">{t.userId}</TableCell>
                                        <TableCell>{t.type}</TableCell>
                                        <TableCell>{t.amount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell>{new Date(t.date).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="destructive" onClick={() => apiRequest('deleteTransaction', { transactionId: t.id })}>
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
                                {dbData?.investments.map((inv: Investment) => {
                                    const user = dbData.users.find(u => u.id === inv.userId);
                                    const property = dbData.properties.find(p => p.id === inv.propertyId);
                                    const investmentDate = new Date(inv.investmentDate);
                                    const expirationDate = addDays(investmentDate, inv.term);
                                    
                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                <div>{user?.name}</div>
                                                <div className="text-xs text-muted-foreground">{user?.email}</div>
                                            </TableCell>
                                            <TableCell>{property?.name ?? 'N/A'}</TableCell>
                                            <TableCell>{inv.investedAmount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                            <TableCell>{investmentDate.toLocaleString()}</TableCell>
                                            <TableCell>{expirationDate.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {formatDistanceToNow(expirationDate, { addSuffix: true, locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="icon" 
                                                    variant="destructive" 
                                                    onClick={() => apiRequest('deleteInvestment', { investmentId: inv.id, userId: inv.userId })}
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

    
