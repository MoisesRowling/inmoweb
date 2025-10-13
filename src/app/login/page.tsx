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
import { useToast } from '@/hooks/use-toast';

// Dummy login function for demonstration purposes
const fakeLogin = (email: string) => {
  // In a real app, you would have a function that returns the user's name
  if (email.includes('@')) {
    return email.split('@')[0];
  }
  return "Usuario";
}

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor ingresa un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function LoginPage() {
  const { toast } = useToast();
  // We need to simulate the login functionality now
  const { registerAndCreateUser } = useApp(); // We'll reuse this to show a success message

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // This is a temporary login handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: "Inicio de sesión simulado",
      description: "¡Bienvenido de nuevo! Redirigiendo a tu dashboard."
    });
    // A real login implementation would be here.
    // For now, we'll just redirect. The AppContext doesn't handle auth anymore.
    window.location.href = '/dashboard';
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
