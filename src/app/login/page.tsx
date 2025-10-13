'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/context/AppContext';
import AuthFormWrapper from '@/components/auth/AuthFormWrapper';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';


const formSchema = z.object({
  email: z.string().email({ message: 'Por favor ingresa un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    initiateEmailSignIn(
      auth, 
      values.email, 
      values.password,
      () => {
        // Success is handled by the global onAuthStateChanged listener in AppContext
      },
      (error) => {
        let description = 'El correo electrónico o la contraseña son incorrectos.';
        if (error.code === 'auth/user-not-found') {
          description = 'No se encontró una cuenta con este correo electrónico.';
        } else if (error.code === 'auth/wrong-password') {
          description = 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.';
        } else if (error.code === 'auth/too-many-requests') {
          description = 'Has intentado iniciar sesión demasiadas veces. Intenta más tarde.';
        }
        
        toast({
          title: 'Error de autenticación',
          description: description,
          variant: 'destructive',
        });
      }
    );
  }

  return (
    <AuthFormWrapper
      title="Iniciar Sesión"
      description="Accede a tu cuenta para continuar."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-semibold" disabled={form.formState.isSubmitting}>
            Iniciar Sesión
          </Button>
        </form>
      </Form>
       <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Button variant="link" asChild className="p-0 h-auto font-semibold">
             <Link href="/register">Crea una aquí</Link>
          </Button>
        </p>
      </div>
    </AuthFormWrapper>
  );
}
