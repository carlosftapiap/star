import Link from 'next/link';
import { Star } from 'lucide-react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
       <Link href="/" className="flex items-center gap-2 mb-8">
        <Star className="w-10 h-10 text-primary" />
        <span className="text-2xl font-bold font-headline text-gray-800">StarCart Recompensas</span>
      </Link>
      {children}
    </div>
  );
}
