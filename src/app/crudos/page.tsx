
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { AppShell } from '@/components/shared/AppShell';

export default function CrudosPage() {
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
        setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'read' })
      });
      if (!response.ok) {
        throw new Error('No se pudieron cargar los datos. ¿Contraseña incorrecta?');
      }
      const dbData = await response.json();
      setData(JSON.stringify(dbData, null, 2));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      setIsAuthenticated(false); // Lock out on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      JSON.parse(data); // Validate JSON before sending
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de formato',
        description: 'El texto no es un JSON válido.',
      });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/crudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'write', data: JSON.parse(data) })
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar la base de datos.');
      }

      toast({
        title: 'Éxito',
        description: 'La base de datos ha sido actualizada.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAuth = () => {
      if (password) {
        setIsAuthenticated(true);
      } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Por favor, introduce la contraseña.',
        });
      }
  }

  if (!isAuthenticated) {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Acceso de Administrador</h1>
                <p className="text-muted-foreground">Introduce la clave secreta para gestionar la base de datos.</p>
                <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                    <Input 
                        type="password" 
                        placeholder="Contraseña de administrador" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                    <Button onClick={handleAuth}>Acceder</Button>
                </div>
            </div>
        </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-foreground font-headline">Administrador de Base de Datos (db.json)</h1>
            <p className="text-muted-foreground mt-1">
            Aquí puedes ver y editar directamente el contenido del archivo `db.json`. Ten cuidado, los cambios son permanentes.
            </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="min-h-[600px] font-mono text-xs bg-muted/50"
              placeholder="Contenido de db.json..."
            />
            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={fetchData} disabled={isSaving}>
                    Recargar Datos
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar Cambios
                </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

