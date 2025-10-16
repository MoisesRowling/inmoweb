'use client';

import { AppShell } from "@/components/shared/AppShell";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PropertyCard } from "@/components/properties/PropertyCard";

export default function PropertiesPage() {
  const { properties } = usePortfolio();

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline">Propiedades Disponibles</h1>
          <p className="text-muted-foreground mt-1">Diversifica tu portafolio con estas propiedades exclusivas.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
