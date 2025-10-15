'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/context/AppContext';
import { DollarSign } from 'lucide-react';

const formSchema = (maxBalance: number) => z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'La cantidad debe ser mayor a $0.' })
    .max(maxBalance, { message: `No puedes retirar más de tu saldo disponible.` }),
  clabe: z.string().length(18, { message: 'La CLABE debe tener 18 dígitos.' }).regex(/^\d+$/, { message: 'La CLABE solo debe contener números.' }),
  accountHolderName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
});

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ isOpen, onClose }: WithdrawDialogProps) {
  const { balance, handleWithdraw } = useApp();
  
  const currentFormSchema = formSchema(balance);

  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      amount: '' as any,
      clabe: '',
      accountHolderName: '',
    },
    mode: 'onTouched'
  });

  async function onSubmit(values: z.infer<typeof currentFormSchema>) {
    const success = await handleWithdraw(values.amount, values.clabe, values.accountHolderName);
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
          <DialogTitle>Solicitar Retiro</DialogTitle>
          <DialogDescription>
            Tu solicitud será revisada por un administrador. Una vez aprobada, el dinero será transferido a la cuenta CLABE proporcionada.
          </DialogDescription>
        </DialogHeader>
        <div className='py-2'>
            <p className="text-sm text-muted-foreground">Saldo disponible para retirar:</p>
            <p className="text-2xl font-bold text-foreground mb-4">
                {balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountHolderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del titular de la cuenta</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={!form.formState.isValid}>Enviar Solicitud de Retiro</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
