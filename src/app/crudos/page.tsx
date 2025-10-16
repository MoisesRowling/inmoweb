
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, User, DollarSign, Briefcase, Pencil, CheckCircle, XCircle, Banknote, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/shared/AppShell';
import type { User as UserType, Investment, WithdrawalRequest, Property } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, add, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DbData {
    users: UserType[];
    balances: { [key: string]: { amount: number }};
    investments: Investment[];
    withdrawalRequests: WithdrawalRequest[];
    properties: Property[];
}

const ManualDepositCard = ({ onAction, isSaving }: { onAction: Function, isSaving: boolean }) => {
    const [publicId, setPublicId] = useState('');
    const [amount, setAmount] = useState('');

    const handleDeposit = () => {
        const numericAmount = parseFloat(amount);
        if (publicId && numericAmount > 0) {
            onAction('deposit_to_user', { publicId, amount: numericAmount });
            setPublicId('');
            setAmount('');
        }
    };

    return (
        <Card className="bg-background/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                    <ArrowRight className="h-5 w-5"/>
                    Depósito Manual
                </CardTitle>
                <CardDescription>Añade fondos a la cuenta de un usuario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="deposit-user-id">ID de Usuario (5 dígitos)</Label>
                    <Input 
                        id="deposit-user-id" 
                        placeholder="12345" 
                        value={publicId} 
                        onChange={(e) => setPublicId(e.target.value)}
                    />
                </div>
                 <div>
                    <Label htmlFor="deposit-amount">Cantidad (MXN)</Label>
                    <Input 
                        id="deposit-amount" 
                        type="number" 
                        placeholder="500.00" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <Button onClick={handleDeposit} disabled={isSaving || !publicId || !amount} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Realizar Depósito
                </Button>
            </CardContent>
        </Card>
    )
}


const ManualWithdrawalCard = ({ onAction, isSaving }: { onAction: Function, isSaving: boolean }) => {
    const [publicId, setPublicId] = useState('');
    const [amount, setAmount] = useState('');

    const handleWithdraw = () => {
        const numericAmount = parseFloat(amount);
        if (publicId && numericAmount > 0) {
            onAction('withdraw_from_user', { publicId, amount: numericAmount });
            setPublicId('');
            setAmount('');
        }
    };

    return (
        <Card className="bg-background/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                    <ArrowLeft className="h-5 w-5"/>
                    Retiro Manual
                </CardTitle>
                <CardDescription>Retira fondos de la cuenta de un usuario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="withdraw-user-id">ID de Usuario (5 dígitos)</Label>
                    <Input 
                        id="withdraw-user-id" 
                        placeholder="12345" 
                        value={publicId} 
                        onChange={(e) => setPublicId(e.target.value)}
                    />
                </div>
                 <div>
                    <Label htmlFor="withdraw-amount">Cantidad (MXN)</Label>
                    <Input 
                        id="withdraw-amount" 
                        type="number" 
                        placeholder="500.00" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <Button onClick={handleWithdraw} disabled={isSaving || !publicId || !amount} className="w-full" variant="destructive">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Realizar Retiro
                </Button>
            </CardContent>
        </Card>
    )
}

export default function CrudosPage() {
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
        setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'read' })
      });
      if (!response.ok) {
        throw new Error('No se pudieron cargar los datos. ¿Contraseña incorrecta?');
      }
      const data: DbData = await response.json();
      setDbData(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      setIsAuthenticated(false); // Lock out on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'update_user' | 'approve_withdrawal' | 'reject_withdrawal' | 'deposit_to_user' | 'withdraw_from_user', payload: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/crudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action, payload })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'La operación falló.');
      }
      toast({
        title: 'Éxito',
        description: result.message || 'La base de datos ha sido actualizada.',
      });
      fetchData(); // Refresh data after action
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAuth = () => {
      if (password) {
        setIsAuthenticated(true);
      } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Por favor, introduce la contraseña.',
        });
      }
  }

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    handleAction('update_user', editingUser);
    setEditingUser(null);
  };
  
  const getInvestmentTimeLeft = (investment: Investment) => {
    const investmentDate = new Date(investment.investmentDate);
    const expirationDate = add(investmentDate, { days: investment.term });
    const now = new Date();

    if (now > expirationDate) {
        return <span className="text-muted-foreground">Vencido</span>;
    }

    return formatDistanceToNow(expirationDate, { addSuffix: true, locale: es });
  };
  
  const findUserById = (userId: string) => dbData?.users.find(u => u.id === userId);
  const findPropertyById = (propertyId: string) => dbData?.properties.find(p => p.id === propertyId);

  if (!isAuthenticated) {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Acceso de Administrador</h1>
                <p className="text-muted-foreground">Introduce la clave secreta para gestionar la base de datos.</p>
                <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                    <Input 
                        type="password" 
                        placeholder="Contraseña de administrador" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                    <Button onClick={handleAuth}>Acceder</Button>
                </div>
            </div>
        </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold text-foreground font-headline">CRUD Manager</CardTitle>
                    <CardDescription>
                        Gestiona los datos de la aplicación, realiza depósitos y retiros manuales.
                    </CardDescription>
                </div>
                <Button onClick={fetchData} disabled={isLoading || isSaving} variant="outline" size="sm">
                    {isLoading || isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Recargar Datos
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <ManualDepositCard onAction={handleAction} isSaving={isSaving} />
              <ManualWithdrawalCard onAction={handleAction} isSaving={isSaving} />
            </CardContent>
          </Card>
          

          <Tabs defaultValue="users">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users"><User className="mr-2"/>Usuarios</TabsTrigger>
              <TabsTrigger value="withdrawals"><DollarSign className="mr-2"/>Retiros</TabsTrigger>
              <TabsTrigger value="investments"><Briefcase className="mr-2"/>Inversiones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="mt-4">
               <Card>
                  <CardHeader>
                    <CardTitle>Usuarios Registrados</CardTitle>
                    <CardDescription>Edita los datos de los usuarios.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Contraseña</TableHead>
                                <TableHead>Saldo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dbData?.users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono">{user.publicId}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="font-mono">{user.password}</TableCell>
                                    <TableCell>
                                      {(dbData.balances[user.id]?.amount ?? 0).toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
                 <Card>
                  <CardHeader>
                    <CardTitle>Solicitudes de Retiro</CardTitle>
                    <CardDescription>Aprueba o rechaza las solicitudes de retiro pendientes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>CLABE</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dbData?.withdrawalRequests.map(req => {
                                const user = findUserById(req.userId);
                                return (
                                    <TableRow key={req.id}>
                                        <TableCell>{user?.name || req.userId}</TableCell>
                                        <TableCell>{req.amount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                        <TableCell className="font-mono">{req.clabe}</TableCell>
                                        <TableCell>{req.accountHolderName}</TableCell>
                                        <TableCell>{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</TableCell>
                                        <TableCell><span className={`px-2 py-1 text-xs rounded-full ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{req.status}</span></TableCell>
                                        <TableCell className="text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleAction('approve_withdrawal', {id: req.id})} disabled={isSaving}>
                                                        <CheckCircle className="mr-2 h-4 w-4"/> Aprobar
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleAction('reject_withdrawal', {id: req.id})} disabled={isSaving}>
                                                        <XCircle className="mr-2 h-4 w-4"/> Rechazar
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                  </CardContent>
                 </Card>
            </TabsContent>

            <TabsContent value="investments" className="mt-4">
                 <Card>
                  <CardHeader>
                    <CardTitle>Inversiones Activas</CardTitle>
                    <CardDescription>Monitoriza todas las inversiones de los usuarios.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Inversor</TableHead>
                                <TableHead>Propiedad</TableHead>
                                <TableHead>Monto Invertido</TableHead>
                                <TableHead>Fecha de Inversión</TableHead>
                                <TableHead>Plazo</TableHead>
                                <TableHead>Tiempo Restante</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dbData?.investments.map(inv => {
                                const user = findUserById(inv.userId);
                                const property = findPropertyById(inv.propertyId);
                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell>{user?.name || inv.userId}</TableCell>
                                        <TableCell>{property?.name || inv.propertyId}</TableCell>
                                        <TableCell>{inv.investedAmount.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</TableCell>
                                        <TableCell>{format(new Date(inv.investmentDate), "dd MMM yyyy")}</TableCell>
                                        <TableCell>{inv.term} días</TableCell>
                                        <TableCell>{getInvestmentTimeLeft(inv)}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                  </CardContent>
                 </Card>
            </TabsContent>
          </Tabs>
          </>
        )}
      </div>

       <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editando a: {editingUser?.name}</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del usuario. La contraseña se actualizará inmediatamente.
                    </DialogDescription>
                </DialogHeader>
                {editingUser && (
                    <form onSubmit={handleUpdateUser}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input id="name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">Contraseña</Label>
                                <Input id="password" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </AppShell>
  );
}
