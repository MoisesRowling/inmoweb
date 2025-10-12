'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/context/AppContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, DollarSign } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'La cantidad debe ser mayor a $0.' }),
  clabe: z.string().length(18, { message: 'La CLABE debe tener 18 dígitos.' }).regex(/^\d+$/, { message: 'La CLABE solo debe contener números.' }),
});

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ isOpen, onClose }: WithdrawDialogProps) {
  const { balance, handleWithdraw } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
      clabe: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const success = handleWithdraw(values.amount, values.clabe);
    if(success) {
      onClose();
      form.reset();
    }
  }

  const handleDialogClose = () => {
    onClose();
    setTimeout(() => {
        form.reset();
    }, 200);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar Fondos</DialogTitle>
          <DialogDescription>
            Tu dinero será transferido a la cuenta CLABE proporcionada.
          </DialogDescription>
        </DialogHeader>
        <div className='py-2'>
            <p className="text-sm text-muted-foreground">Saldo disponible:</p>
            <p className="text-2xl font-bold text-foreground mb-4">
                {balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clabe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta CLABE (18 dígitos)</FormLabel>
                  <FormControl>
                    <Input placeholder="000000000000000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a retirar (MXN)</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="0.00" max={balance} className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
                <Info className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
                <AlertTitle className="font-semibold !text-yellow-900 dark:!text-yellow-200">Importante</AlertTitle>
                <AlertDescription>
                    Se requiere mantener la inversión por un mínimo de 14 días antes de poder realizar retiros.
                </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="submit" className="w-full">Confirmar Retiro</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
