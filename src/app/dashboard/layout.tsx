
'use client';

import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Star, User, Loader2, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserById, getProducts, getRewards } from '@/lib/firebase/firestore';
import type { UserDetails, Product, Reward } from './page';

interface AppContextType {
  user: UserDetails | null;
  products: Product[];
  rewards: Reward[];
  handleDataUpdate: (data: { products?: Product[], rewards?: Reward[], user?: UserDetails }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData must be used within an AppProvider');
    }
    return context;
};


function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Star className="w-8 h-8 text-primary" />
      <span className="text-xl font-bold font-headline text-gray-800">StarCart Recompensas</span>
    </Link>
  );
}

function UserNav({ user, onLogout }: { user: UserDetails; onLogout: () => void }) {
  const showAdminFeatures = user.isAdmin;
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profilePicture || "https://images.unsplash.com/photo-1518183214770-9cffbec72538?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNnx8ZGluZXJvfGVufDB8fHx8MTc1MzgxNTIxM3ww&ixlib=rb-4.1.0&q=80&w=1080"} alt="Avatar de usuario" data-ai-hint="user avatar" />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.isAdmin ? 'Administrador' : user.firstName || 'Tu Cuenta'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email || user.phone}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {showAdminFeatures && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/users" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  <span>Clientes Registrados</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <button onClick={onLogout} className="w-full flex items-center gap-2 cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAllData = async () => {
      // This logic now runs only on the client-side
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      try {
        let userFromDb: UserDetails | null = null;
        if (userId === 'admin-user-id') {
           const sessionUser = sessionStorage.getItem('user');
           if (sessionUser) {
              userFromDb = JSON.parse(sessionUser);
           } else {
             // Fallback for admin if session is missing
             userFromDb = {
                id: 'admin-user-id',
                email: 'carlosftapiap@gmail.com',
                isAdmin: true,
                points: 9999,
                firstName: 'Administrador', 
              };
           }
        } else {
          userFromDb = await getUserById(userId);
        }

        if (userFromDb) {
          setUser(userFromDb);
          const [productsData, rewardsData] = await Promise.all([
            getProducts(),
            getRewards()
          ]);
          setProducts(productsData);
          setRewards(rewardsData.map((r:any) => ({...r, title: r.name}))); // Keep title for compatibility
        } else {
          // If user not found in DB, log them out.
          localStorage.removeItem('userId');
          sessionStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Clear auth state and redirect on error
        localStorage.removeItem('userId');
        sessionStorage.removeItem('user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
  
  const handleDataUpdate = (newData: { products?: Product[], rewards?: Reward[], user?: UserDetails }) => {
    if (newData.products) {
      setProducts(newData.products);
    }
    if (newData.rewards) {
      setRewards(newData.rewards.map((r:any) => ({...r, title: r.name}))); // Also update here
    }
    if (newData.user) {
        setUser(newData.user);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // The redirect is already happening in useEffect
  }

  return (
    <AppContext.Provider value={{ user, products, rewards, handleDataUpdate }}>
      <div className="flex flex-col min-h-screen">
        <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
          <AppLogo />
          <UserNav user={user} onLogout={handleLogout} />
        </header>
        <main className="flex-grow p-6 md:p-12 bg-muted/40">
          {children}
        </main>
      </div>
    </AppContext.Provider>
  );
}


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppProvider>{children}</AppProvider>
}
