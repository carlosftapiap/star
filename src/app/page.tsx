import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Gift, Users, QrCode } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <Star className="w-8 h-8 text-primary" />
      <span className="text-xl font-bold font-headline">StarCart Recompensas</span>
    </div>
  );
}

function Header() {
  return (
    <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-white shadow-sm">
      <AppLogo />
      <nav className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/signup">Empezar</Link>
        </Button>
      </nav>
    </header>
  );
}

export default function Home() {
  const features = [
    {
      icon: <Star className="w-10 h-10 text-accent" />,
      title: 'Gana Estrellas al Instante',
      description: 'Acumula puntos por cada compra en tus tiendas locales favoritas y mira cómo crecen tus recompensas.',
    },
    {
      icon: <Gift className="w-10 h-10 text-accent" />,
      title: 'Canjea Recompensas Increíbles',
      description: 'Cambia tus estrellas por productos exclusivos, descuentos y ofertas especiales directamente desde la app.',
    },
    {
      icon: <Users className="w-10 h-10 text-accent" />,
      title: 'Refiere y Gana Más',
      description: '¡Comparte con tus amigos! Tanto tú como tus amigos referidos obtienen estrellas de bonificación.',
    },
    {
      icon: <QrCode className="w-10 h-10 text-accent" />,
      title: 'Digital y Sin Complicaciones',
      description: 'No necesitas tarjetas físicas. Usa tu tarjeta digital con un código QR para todas las transacciones.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-white text-center py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tight">
              Convierte Cada Compra en una Recompensa
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              StarCart Recompensas es la forma más fácil de obtener más de tus compras en cafés, farmacias y restaurantes locales. Sin complicaciones, sin tarjetas de plástico, solo puras recompensas.
            </p>
            <div className="mt-10">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/signup">Comienza a Coleccionar Estrellas</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center">
              ¿Cómo Funciona?
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="bg-white py-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image 
                src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxkaW5lcm98ZW58MHx8fHwxNzUzMzA1OTk4fDA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Estante con premios y recompensas" 
                width={600} 
                height={400} 
                className="rounded-lg shadow-2xl"
                data-ai-hint="rewards prizes"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                Tu Billetera, Tus Recompensas
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Añade fácilmente tu tarjeta digital StarCart a Apple Wallet o Google Wallet. Accede a tus puntos y código QR en cualquier momento y lugar, directamente desde la app nativa de billetera de tu teléfono.
              </p>
            </div>
          </div>
        </section>

      </main>
      <footer className="bg-gray-800 text-white text-center p-6">
        <p>&copy; {new Date().getFullYear()} StarCart Recompensas. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
