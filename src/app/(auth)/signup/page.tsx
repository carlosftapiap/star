
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
import { Suspense, useState } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { createUser, findUserByEmail, getUserById, updateUser } from '@/lib/firebase/firestore';

const formSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio.'),
  lastName: z.string().min(1, 'El apellido es obligatorio.'),
  email: z.string().email('Por favor, introduce una dirección de correo electrónico válida.'),
  phone: z.string().regex(/^[0-9]{9,10}$/, 'Debe ser un número de teléfono válido de 9 o 10 dígitos.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  birthday: z.date({
    required_error: 'La fecha de nacimiento es obligatoria.',
  }),
});

function SignupForm() {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const referrerId = searchParams.get('ref');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);

    try {
      const existingUser = await findUserByEmail(values.email);
      if (existingUser) {
        toast({
          variant: 'destructive',
          title: 'Error de Registro',
          description: 'Este correo electrónico ya está registrado.',
        });
        setIsPending(false);
        return;
      }

      // NOTE: Password is not stored in Firestore in this version for simplicity.
      // In a real app, use Firebase Authentication.
      const newUser = {
        email: values.email,
        phone: values.phone,
        firstName: values.firstName,
        lastName: values.lastName,
        birthday: values.birthday,
        points: 200, // Welcome stars!
        address: '',
        city: '',
        pharmacy: '',
        profilePicture: null,
      };

      const newUserId = await createUser(newUser);
      
      localStorage.setItem('userId', newUserId);
      
      // Award points to referrer if one exists
      if (referrerId) {
          const referrer = await getUserById(referrerId);
          if (referrer) {
              const newPoints = (referrer.points || 0) + 100; // Award 100 bonus stars
              await updateUser(referrer.id, { points: newPoints });
              // Optional: Toast to inform the new user about the bonus for their friend
              // This is commented out to avoid confusing the new user.
              // toast({
              //   title: '¡Gracias por unirte!',
              //   description: `Tu amigo ha recibido 100 estrellas de bonificación gracias a ti.`,
              // });
          }
      }


      toast({
        title: '¡Registro Exitoso!',
        description: "¡Bienvenido a StarCart Recompensas! Has ganado 200 estrellas.",
      });
      router.push('/dashboard');

    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: 'destructive',
        title: 'Error de Registro',
        description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      });
    }

    setIsPending(false);
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Crear una Cuenta</CardTitle>
        <CardDescription>Únete a StarCart Recompensas y comienza a ganar hoy. ¡Es gratis!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Teléfono</FormLabel>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                      +593
                    </span>
                    <FormControl>
                      <Input type="tel" placeholder="987654321" {...field} className="rounded-l-none" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="birthday"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown-buttons"
                        fromYear={new Date().getFullYear() - 120}
                        toYear={new Date().getFullYear()}
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Input type="password" placeholder="Al menos 6 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cuenta
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Iniciar Sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
        <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Crear una Cuenta</CardTitle>
                <CardDescription>Cargando formulario...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    }>
      <SignupForm />
    </Suspense>
  );
}
