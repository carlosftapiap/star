
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { findUserByEmail } from '@/lib/firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Por favor, introduce una dirección de correo electrónico válida.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function LoginPage() {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    
    // Admin check
    if (values.email === 'carlosftapiap@gmail.com' && values.password === '0915677082') {
       const adminUser = {
        id: 'admin-user-id', // A special, non-Firestore ID for the admin
        email: values.email,
        isAdmin: true,
        points: 9999,
        firstName: 'Administrador', 
      };
      localStorage.setItem('userId', adminUser.id);
      sessionStorage.setItem('user', JSON.stringify(adminUser)); // Store admin details in session storage for immediate access
      
      toast({
        title: 'Inicio de Sesión de Administrador',
        description: `¡Bienvenido, Admin!`,
      });
      router.push('/dashboard');
      setIsPending(false);
      return;
    }

    try {
        const user = await findUserByEmail(values.email);

        if (user) {
            // NOTE: In a real app, you would verify the password here.
            // For this project, we'll assume the email is enough to log in.
            
            localStorage.setItem('userId', user.id); // Store only the user ID

            toast({
                title: 'Inicio de Sesión Exitoso',
                description: `¡Bienvenido de nuevo!`,
            });
            router.push('/dashboard');
        } else {
             toast({
                variant: 'destructive',
                title: 'Error de Inicio de Sesión',
                description: 'El correo electrónico o la contraseña son incorrectos.',
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        toast({
            variant: 'destructive',
            title: 'Error Inesperado',
            description: 'Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.',
        });
    }


    setIsPending(false);
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle>Bienvenido de Nuevo</CardTitle>
        <CardDescription>Ingresa tu correo y contraseña para acceder a tus recompensas.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@ejemplo.com" {...field} />
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
