
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers } from '@/lib/firebase/firestore';
import { Loader2, Star, Users, FileSpreadsheet, Facebook, Twitter, Instagram } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Link from 'next/link';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  points: number;
  profilePicture?: string | null;
  address?: string;
  city?: string;
  pharmacy?: string;
  birthday?: Date;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersData = await getUsers();
        // @ts-ignore
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleDownloadExcel = () => {
    if (users.length === 0) {
        toast({
            variant: "destructive",
            title: "No hay datos para exportar",
            description: "No hay usuarios registrados para descargar.",
        });
        return;
    }

    try {
        const dataToExport = users.map(user => ({
            "Nombre": user.firstName || '',
            "Apellido": user.lastName || '',
            "Email": user.email || '',
            "Teléfono": user.phone || '',
            "Puntos": user.points,
            "Dirección": user.address || '',
            "Ciudad": user.city || '',
            "Punto de Venta": user.pharmacy || '',
            "Fecha de Nacimiento": user.birthday ? (user.birthday instanceof Date ? user.birthday.toLocaleDateString('es-EC') : new Date(user.birthday).toLocaleDateString('es-EC')) : '',
            "Facebook": user.facebook || '',
            "Twitter": user.twitter || '',
            "Instagram": user.instagram || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

        const fileName = `starcart_usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

         toast({
            title: "Descarga Iniciada",
            description: `Se ha comenzado a descargar el archivo ${fileName}.`,
        });

    } catch(error) {
        console.error("Error generating Excel file:", error);
        toast({
            variant: "destructive",
            title: "Error al generar Excel",
            description: "No se pudo generar el archivo. Inténtalo de nuevo.",
        });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <Users className="w-6 h-6" />
            Clientes Registrados
          </CardTitle>
          <CardDescription>
            Esta es una lista de todos los usuarios registrados en el programa StarCart Recompensas.
          </CardDescription>
        </div>
        <Button onClick={handleDownloadExcel} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Descargar Excel
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Redes Sociales</TableHead>
              <TableHead className="text-right">Estrellas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <Avatar className="h-9 w-9">
                        <AvatarImage src={user.profilePicture || "https://images.unsplash.com/photo-1518183214770-9cffbec72538?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNnx8ZGluZXJvfGVufDB8fHx8MTc1MzgxNTIxM3ww&ixlib=rb-4.1.0&q=80&w=1080"} alt="User avatar" data-ai-hint="user avatar" />
                        <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.facebook && (
                        <Link href={user.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-5 w-5 text-blue-600 hover:opacity-80" />
                        </Link>
                      )}
                      {user.twitter && (
                        <Link href={user.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-5 w-5 text-sky-500 hover:opacity-80" />
                        </Link>
                      )}
                      {user.instagram && (
                        <Link href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-5 w-5 text-pink-600 hover:opacity-80" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 font-semibold text-primary">
                        <Star className="w-4 h-4" />
                        {user.points}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No hay usuarios registrados todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    