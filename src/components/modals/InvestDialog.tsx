'use client';

import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { Property } from '@/lib/types';
import { DollarSign } from 'lucide-react';

const formSchema = (min: number, max: number) => z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Debe ser un número válido.',
  }).pipe(
    z.coerce
      .number()
      .min(min, { message: `La inversión mínima es de ${min.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.` })
      .max(max, { message: `No tienes suficiente saldo disponible.` })
  ),
  term: z.enum(['7', '30'], { required_error: 'Debes seleccionar un plazo.' }),
});

interface InvestDialogProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const EarningPreview = ({ control, dailyReturn }: { control: any, dailyReturn: number }) => {
    const amount = useWatch({ control, name: 'amount' });
    const term = useWatch({ control, name: 'term' });
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const parsedTerm = parseInt(term, 10);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) return null;

    const daily = parsedAmount * dailyReturn;
    const weekly = daily * 7;
    const monthly = daily * 30;
    const yearly = daily * 365;
    
    let relevantEarning = 0;
    let termLabel = '';

    if (parsedTerm === 7) {
        relevantEarning = weekly;
        termLabel = '7 días';
    } else if (parsedTerm === 30) {
        relevantEarning = monthly;
        termLabel = '1 Mes';
    }

    return (
        <div className="my-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-200">Ganancias estimadas para tu inversión:</h4>
             <div className="space-y-1.5 text-sm">
                {termLabel && (
                    <div className="flex justify-between font-bold text-base bg-green-100 dark:bg-green-900/80 p-2 rounded-md">
                        <span className="text-green-800 dark:text-green-200">En {termLabel}:</span>
                        <span className="text-green-600 dark:text-green-300">{relevantEarning.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                    </div>
                )}
                <div className="flex justify-between pt-2">
                    <span className="text-green-800 dark:text-green-400">Diario:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">{daily.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-400">Semanal:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">{weekly.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-400">Mensual:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">{monthly.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-400">Anual:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">{yearly.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
            </div>
        </div>
    )
}

export function InvestDialog({ property, isOpen, onClose }: InvestDialogProps) {
  const { handleInvest } = useApp();
  const { balance, refreshData } = usePortfolio();

  const currentFormSchema = formSchema(property.minInvestment, balance);
  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      amount: '',
      term: '7',
    },
    mode: 'onTouched'
  });

  async function onSubmit(values: z.infer<typeof currentFormSchema>) {
    await handleInvest(values.amount, property, parseInt(values.term, 10));
    refreshData(); // Refresh portfolio data after investing
    onClose();
    form.reset();
  }
  
  const handleDialogClose = () => {
    onClose();
    setTimeout(() => {
        form.reset();
    }, 200);
  }
  
  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invertir en {property.name}</DialogTitle>
          <DialogDescription>
            Selecciona el plazo y la cantidad para adquirir acciones en esta propiedad.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="py-2 space-y-3">
                <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Inversión mínima:</span>
                        <span className="font-bold text-primary">{property.minInvestment.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Rendimiento diario:</span>
                        <span className="font-bold text-green-600">{(property.dailyReturn * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Saldo disponible:</span>
                        <span className="font-bold">{balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                    </div>
                </div>
            </div>
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Selecciona el plazo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                            <div className='w-full'>
                                <RadioGroupItem value="7" id="7" className='sr-only peer' />
                                <Label htmlFor="7" className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'>
                                    <span className='text-lg font-bold'>7 Días</span>
                                </Label>
                            </div>
                        </FormControl>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                           <div className='w-full'>
                                <RadioGroupItem value="30" id="30" className='sr-only peer' />
                                <Label htmlFor="30" className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'>
                                    <span className='text-lg font-bold'>1 Mes</span>
                                </Label>
                            </div>
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
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
                  <FormLabel>Cantidad a invertir (MXN)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder={`${property.minInvestment.toLocaleString('es-MX')}`} min={property.minInvestment} max={balance} className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EarningPreview control={form.control} dailyReturn={property.dailyReturn} />

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={!form.formState.isValid}>Confirmar Inversión</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
