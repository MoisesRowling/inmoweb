'use client';

import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositDialog({ isOpen, onClose }: DepositDialogProps) {
  const { user } = useApp();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado al portapapeles' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Depositar Fondos</DialogTitle>
          <DialogDescription>
            Realiza una transferencia SPEI para abonar saldo a tu cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 [&>svg]:text-blue-600">
              <Info className="h-4 w-4" />
              <AlertTitle className="font-semibold">¡Importante!</AlertTitle>
              <AlertDescription>
                  Para identificar tu pago, usa tu ID de usuario en el <strong>concepto</strong> de la transferencia.
              </AlertDescription>
          </Alert>

           <div className="space-y-3 rounded-lg border bg-secondary/50 p-4">
               <div>
                  <p className="text-xs text-muted-foreground">Beneficiario</p>
                  <p className="font-semibold">InmoSmart</p>
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="font-semibold">BBVA</p>
              </div>
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-xs text-muted-foreground">CLABE</p>
                      <p className="font-mono font-semibold">1234567890</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard('1234567890')}>
                      <Copy className="h-4 w-4"/>
                  </Button>
              </div>
               <div className="flex justify-between items-center">
                  <div>
                      <p className="text-xs text-muted-foreground">Tu ID de Usuario (Concepto)</p>
                      <p className="font-mono font-bold text-primary">{user?.id}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(user?.id || '')}>
                      <Copy className="h-4 w-4"/>
                  </Button>
              </div>
           </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className='w-full'>Hecho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
