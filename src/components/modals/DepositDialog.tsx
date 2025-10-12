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
import { CreditCard, DollarSign, ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Por favor ingresa una cantidad válida mayor a $0.' }),
});

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositDialog({ isOpen, onClose }: DepositDialogProps) {
  const { handleDeposit } = useApp();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'card' | 'spei' | null>(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Depositar Fondos</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Selecciona tu método de pago preferido.' : 'Ingresa la cantidad a depositar.'}
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
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
