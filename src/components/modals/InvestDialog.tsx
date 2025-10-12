'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/context/AppContext';
import type { Property } from '@/lib/types';
import { DollarSign } from 'lucide-react';
import { useWatch } from 'react-hook-form';

const formSchema = (min: number, max: number) => z.object({
  amount: z.coerce
    .number()
    .min(min, { message: `La inversión mínima es de ${min.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` })
    .max(max, { message: `No tienes suficiente saldo disponible.` }),
});

interface InvestDialogProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const EarningPreview = ({ control, dailyReturn }: { control: any, dailyReturn: number }) => {
    const amount = useWatch({ control, name: 'amount' });
    if (!amount || typeof amount !== 'number' || amount <= 0) return null;

    const daily = amount * dailyReturn;
    const weekly = daily * 7;
    const monthly = daily * 30;

    return (
        <div className="my-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-200">Ganancias estimadas:</h4>
             <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-300">Diario:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{daily.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-300">Semanal:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{weekly.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-300">Mensual:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{monthly.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
            </div>
        </div>
    )
}

export function InvestDialog({ property, isOpen, onClose }: InvestDialogProps) {
  const { balance, handleInvest } = useApp();

  const currentFormSchema = formSchema(property.minInvestment, balance);
  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof currentFormSchema>) {
    handleInvest(values.amount, property);
    onClose();
    form.reset();
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
          <DialogTitle>Invertir en {property.name}</DialogTitle>
          <DialogDescription>
            Estás a punto de adquirir acciones en esta propiedad.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
           <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inversión mínima:</span>
                <span className="font-bold text-primary">{property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rendimiento diario:</span>
                <span className="font-bold text-green-600">{(property.dailyReturn * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo disponible:</span>
                <span className="font-bold">{balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
              </div>
            </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a invertir (MXN)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder={`${property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} o más`} min={property.minInvestment} max={balance} className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EarningPreview control={form.control} dailyReturn={property.dailyReturn} />

            <DialogFooter>
              <Button type="submit" className="w-full">Confirmar Inversión</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
