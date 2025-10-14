'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Save, Loader2 } from 'lucide-react';
import type { User, Transaction, Investment } from '@/lib/types';
import { AppShell } from '@/components/shared/AppShell';

const CRUD_PASSWORD = process.env.NEXT_PUBLIC_CRUD_PASSWORD || "caballos1212";

type DBState = {
    users: any[];
    balances: { [key: string]: { amount: number; lastUpdated: string; } };
    investments: any[];
    transactions: any[];
    properties: any[];
}

export default function CrudPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [dbData, setDbData] = useState<DBState | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingState, setEditingState] = useState<{ [key: string]: any }>({});
    const { toast } = useToast();

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
                                    <TableHead>ID</TableHead>
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
                                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
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

            </div>
        </AppShell>
    );
}