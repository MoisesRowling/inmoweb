'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/context/AppContext';
import { CreditCard, DollarSign, ArrowLeft, Info, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';


const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Por favor ingresa una cantidad válida mayor a $0.' }),
});

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositDialog({ isOpen, onClose }: DepositDialogProps) {
  const { user, handleDeposit } = useApp();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'card' | 'spei' | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
    },
  });

  const handleMethodSelect = (selectedMethod: 'card' | 'spei') => {
    setMethod(selectedMethod);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setMethod(null);
    form.reset();
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (method) {
      handleDeposit(values.amount, method);
      onClose();
      handleBack();
    }
  }

  const handleDialogClose = () => {
    onClose();
    setTimeout(() => {
        handleBack();
    }, 200);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado al portapapeles' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Depositar Fondos</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Selecciona tu método de pago preferido.' : (method === 'card' ? 'Ingresa la cantidad a depositar.' : 'Realiza la transferencia para abonar saldo.')}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="py-4 space-y-3">
            <Button variant="outline" className="w-full justify-start h-16" onClick={() => handleMethodSelect('card')}>
              <CreditCard className="w-6 h-6 mr-4 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Tarjeta de Débito/Crédito</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-16" onClick={() => handleMethodSelect('spei')}>
              <DollarSign className="w-6 h-6 mr-4 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Transferencia SPEI</p>
                <p className="text-xs text-muted-foreground">Desde cualquier banco</p>
              </div>
            </Button>
          </div>
        )}

        {step === 2 && (
            <div>
                 <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                {method === 'spei' ? (
                     <div className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 [&>svg]:text-blue-600">
                            <Info className="h-4 w-4" />
                            <AlertTitle className="font-semibold">¡Importante!</AlertTitle>
                            <AlertDescription>
                                Para identificar tu pago, usa tu ID de usuario en el <strong>concepto</strong> de la transferencia.
                            </AlertDescription>
                        </Alert>

                         <div className="space-y-3 rounded-lg border bg-secondary/50 p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Banco</p>
                                <p className="font-semibold">BBVA</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">CLABE</p>
                                    <p className="font-mono font-semibold">1234567890</p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard('1234567890')}>
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                             <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">Tu ID de Usuario (Concepto)</p>
                                    <p className="font-mono font-bold text-primary">{user?.id}</p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(user?.id || '')}>
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                             <div>
                                <p className="text-xs text-muted-foreground">Beneficiario</p>
                                <p className="font-semibold">InmoSmart</p>
                            </div>
                         </div>
                         <DialogFooter>
                            <Button onClick={handleDialogClose} className='w-full'>Hecho</Button>
                         </DialogFooter>
                     </div>
                ) : (
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cantidad a depositar (MXN)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <DialogFooter>
                            <Button type="submit" className="w-full">Confirmar Depósito</Button>
                        </DialogFooter>
                    </form>
                    </Form>
                )}
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
