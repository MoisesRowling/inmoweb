'use client';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from './Logo';
import { ArrowDownCircle, ArrowUpCircle, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';

export function Header() {
  const { isAuthenticated, user, logout, balance, setModals } = useApp();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {getInitials(user?.name ?? '')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setModals(prev => ({ ...prev, deposit: true }))}}>
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          <span>Depositar Fondos</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setModals(prev => ({ ...prev, withdraw: true }))}}>
          <ArrowDownCircle className="mr-2 h-4 w-4" />
          <span>Retirar Fondos</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MobileNav = () => (
     <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <div className="mt-4">
            <Logo />
          </div>
          <nav className="flex flex-col gap-4 mt-8">
            {isAuthenticated ? (
               <>
                 <Link href="/dashboard" className="text-lg font-medium text-foreground hover:text-primary">Dashboard</Link>
                 <Link href="/properties" className="text-lg font-medium text-foreground hover:text-primary">Propiedades</Link>
                 <Button onClick={() => setModals(prev => ({ ...prev, deposit: true }))} variant="outline">Depositar</Button>
                 <Button onClick={() => setModals(prev => ({ ...prev, withdraw: true }))} variant="outline">Retirar</Button>
                 <Button onClick={logout} variant="ghost">Cerrar Sesión</Button>
               </>
             ) : (
               <>
                 <Link href="/login" className="text-lg font-medium text-foreground hover:text-primary">Iniciar Sesión</Link>
                 <Link href="/register">
                  <Button className="w-full">Crear Cuenta</Button>
                 </Link>
               </>
             )}
          </nav>
        </SheetContent>
      </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/properties">Propiedades</Link>
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Saldo:</span>
                  <span className="font-semibold">{balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                </div>
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Crear Cuenta</Button>
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center md:hidden">
             {isAuthenticated && <UserMenu />}
             <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
