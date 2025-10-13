'use client';

import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { propertiesData } from "@/lib/data";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Activity, ArrowRight, Building2, Home as HomeIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/lib/types";

export default function Home() {
  const { isAuthenticated, isAuthLoading, properties } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading || isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 p-8">
            <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
            </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 font-headline">
              La Nueva Era de la<br />Inversión Inmobiliaria
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              En InmoSmart, integramos herramientas digitales de vanguardia para que tu inversión inmobiliaria sea más inteligente, segura y rentable.
            </p>
            <Button asChild size="lg" className="text-lg font-bold shadow-lg">
              <Link href="/register">
                EMPEZAR A INVERTIR
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black text-foreground text-center mb-4 font-headline">Propiedades Destacadas</h2>
            <p className="text-center text-muted-foreground mb-12">Invierte desde cualquier cantidad en bienes raíces premium.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(properties.length > 0 ? properties : propertiesData as Property[]).slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} isGuest={true} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary/5 dark:bg-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black text-foreground text-center mb-16 font-headline">¿Por qué InmoSmart?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HomeIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-3 font-headline">Acceso a Propiedades Premium</h3>
                <p className="text-muted-foreground">Invierte en inmuebles exclusivos desde montos accesibles.</p>
              </div>

              <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-3 font-headline">Rendimientos Atractivos</h3>
                <p className="text-muted-foreground">Obtén retornos competitivos con rentas diarias garantizadas.</p>
              </div>

              <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-3 font-headline">100% Digital y Seguro</h3>
                <p className="text-muted-foreground">Plataforma tecnológica con respaldo legal en cada inversión.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
