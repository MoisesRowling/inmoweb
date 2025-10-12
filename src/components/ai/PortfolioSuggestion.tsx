'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getPortfolioSuggestion } from '@/actions/suggest-portfolio-action';
import type { SuggestPortfolioOutput } from '@/ai/flows/suggest-portfolio';
import { useApp } from '@/context/AppContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wand2, Loader2, PieChart, Info } from 'lucide-react';
import { Progress } from '../ui/progress';

const formSchema = z.object({
  riskTolerance: z.enum(['low', 'medium', 'high'], { required_error: 'Debes seleccionar un nivel de riesgo.' }),
});

export function PortfolioSuggestion() {
  const { balance, properties } = useApp();
  const [suggestion, setSuggestion] = useState<SuggestPortfolioOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riskTolerance: 'medium',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    const availableProperties = properties.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        type: p.type,
        price: p.price,
        minInvestment: p.minInvestment,
        invested: p.invested,
        totalShares: p.totalShares,
        ownedShares: p.ownedShares,
        image: p.image,
    }));

    const result = await getPortfolioSuggestion({
      currentBalance: balance,
      riskTolerance: values.riskTolerance,
      properties: availableProperties,
    });
    
    setIsLoading(false);

    if ('error' in result) {
      setError(result.error);
    } else {
      setSuggestion(result);
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Wand2 className='text-primary' />
            Asesor de Inversión IA
          </CardTitle>
          <CardDescription>
            Recibe una sugerencia de portafolio personalizada basada en tu saldo y tolerancia al riesgo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="riskTolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Riesgo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu tolerancia al riesgo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Bajo</SelectItem>
                        <SelectItem value="medium">Medio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || balance <= 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PieChart className="mr-2 h-4 w-4" />}
                Generar Sugerencia
              </Button>
              {balance <= 0 && <p className='text-sm text-destructive mt-2'>Necesitas saldo para generar una sugerencia.</p>}
              {error && <p className='text-sm text-destructive mt-2'>{error}</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'><Wand2 />Sugerencia de Portafolio IA</DialogTitle>
            <DialogDescription>
              Basado en tu balance y perfil de riesgo, te recomendamos la siguiente distribución.
            </DialogDescription>
          </DialogHeader>
          {suggestion && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-secondary rounded-lg">
                <h4 className="font-semibold text-secondary-foreground">Resumen de la Estrategia</h4>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.summary}</p>
              </div>
              <div className="space-y-4">
                {suggestion.suggestions.map((s, index) => {
                  const property = properties.find(p => p.id === s.propertyId);
                  if (!property) return null;

                  return (
                    <div key={index} className="space-y-2">
                        <div className='flex justify-between items-center'>
                             <h5 className="font-semibold">{property.name}</h5>
                             <span className='font-bold text-primary'>{s.investmentPercentage}%</span>
                        </div>
                         <Progress value={s.investmentPercentage} />
                        <p className="text-sm text-muted-foreground flex gap-2 items-start pt-1">
                            <Info size={14} className='mt-0.5 shrink-0'/> <span>{s.reason}</span>
                        </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
