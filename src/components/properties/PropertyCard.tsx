'use client';
import Image from 'next/image';
import { MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Property } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

interface PropertyCardProps {
  property: Property;
  isGuest?: boolean;
}

export function PropertyCard({ property, isGuest = false }: PropertyCardProps) {
  const { setModals } = useApp();
  const router = useRouter();
  const placeholderImage = PlaceHolderImages.find(img => img.id === property.image);

  const handleAction = () => {
    if (isGuest) {
      router.push('/register');
    } else {
      setModals(prev => ({ ...prev, invest: property }));
    }
  };

  const potentialDailyEarning = property.minInvestment * property.dailyReturn;
  const potentialWeeklyEarning = potentialDailyEarning * 7;
  const potentialMonthlyEarning = potentialDailyEarning * 30;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col">
      <CardHeader className="p-0 relative">
        {placeholderImage && (
          <Image
            src={placeholderImage.imageUrl}
            alt={placeholderImage.description}
            width={800}
            height={600}
            className="h-48 w-full object-cover"
            data-ai-hint={placeholderImage.imageHint}
          />
        )}
        <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-card-foreground">
          {property.type}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <CardTitle className="text-lg mb-1 font-headline">{property.name}</CardTitle>
        <CardDescription className="flex items-center gap-1.5 text-sm mb-4">
          <MapPin className="w-4 h-4" />
          {property.location}
        </CardDescription>

        <div className="space-y-3 mb-4 text-sm flex-1">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Inversión Mínima</span>
            <span className="font-semibold text-primary">{property.minInvestment.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Retorno Diario</span>
            <span className="font-semibold text-green-600">{(property.dailyReturn * 100).toFixed(0)}%</span>
          </div>
          {isGuest && (
             <div className="!mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-foreground mb-2">Con inversión mínima ganarías:</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diario:</span>
                  <span className="font-bold text-green-600">{potentialDailyEarning.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semanal:</span>
                  <span className="font-bold text-green-600">{potentialWeeklyEarning.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Mensual:</span>
                  <span className="font-bold text-green-600">{potentialMonthlyEarning.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
                </div>
              </div>
            </div>
          )}
          {!isGuest && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tu Inversión</span>
                <span className="font-semibold">{property.invested.toLocaleString('es-MX', {style: 'currency', currency: 'MXN'})}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tus Acciones</span>
                <span className="font-semibold text-primary">{property.ownedShares}</span>
              </div>
            </>
          )}
        </div>

        <Button onClick={handleAction} className="w-full font-bold shadow-lg mt-auto">
          {isGuest ? 'Ver Detalles' : 'Invertir Ahora'}
        </Button>
      </CardContent>
    </Card>
  );
}
