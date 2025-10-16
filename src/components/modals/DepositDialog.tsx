'use client';

import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositDialog({ isOpen, onClose }: DepositDialogProps) {
  const { user } = useApp();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado al portapapeles' });
    } else {
        toast({ title: 'No se pudo copiar', variant: 'destructive'});
    }
  };

  const WhatsAppIcon = () => (
    <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current">
        <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.315 0-.765.11-1.057.332-.308.24-.81.77-1.037 1.318-.282.68-.308 1.38-.308 1.983 0 .68.143 1.31.332 1.857.187.56.594 1.254 1.18 1.877.586.623 1.35 1.195 2.23 1.677.88.482 1.82.766 2.89.923.956.143 1.87.11 2.59-.062.75-.174 1.912-.91 2.23-1.58.332-.68.332-1.254.214-1.398-.11-.143-.332-.22-.6-.22z" />
        <path d=" M16 .0C7.16 0 0 7.16 0 16s7.16 16 16 16c9.02 0 16-7.16 16-16S24.84 0 16 0zm0 29.5C8.54 29.5 2.5 23.46 2.5 16S8.54 2.5 16 2.5 29.5 8.54 29.5 16 23.46 29.5 16 29.5z" />
    </svg>
  )

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
                  <p className="font-semibold">Inmotec</p>
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="font-semibold">INVEX</p>
              </div>
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-xs text-muted-foreground">CLABE</p>
                      <p className="font-mono font-semibold">059180131136162416</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard('059180131136162416')}>
                      <Copy className="h-4 w-4"/>
                  </Button>
              </div>
               <div className="flex justify-between items-center">
                  <div>
                      <p className="text-xs text-muted-foreground">Tu ID de Usuario (Concepto)</p>
                      <p className="font-mono font-bold text-primary">{user?.publicId}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(user?.publicId || '')}>
                      <Copy className="h-4 w-4"/>
                  </Button>
              </div>
           </div>

            <Button asChild variant="outline" className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">
                <Link href="https://wa.me/message/DGRIYRB2PBZVC1" target="_blank">
                    <WhatsAppIcon />
                    Enviar Comprobante por WhatsApp
                </Link>
            </Button>
            
        </div>

        <DialogFooter>
          <Button onClick={onClose} className='w-full'>Hecho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
