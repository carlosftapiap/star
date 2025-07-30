
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Apple, Star, UploadCloud, Loader2, Award, Camera, Home, Building, MapPin, Gift, Facebook, Twitter, Instagram } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import { processReceipt } from '@/ai/flows/process-receipt-flow';
import QRCode from "react-qr-code";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { updateUser, recordRedemption } from '@/lib/firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAppData } from './layout';
import { storage } from '@/lib/firebase/config';
import ReferralCard from './referral-card';

export interface UserDetails {
  id: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthday?: Date;
  points: number;
  address?: string;
  city?: string;
  pharmacy?: string;
  profilePicture?: string | null;
  isAdmin?: boolean;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export interface Reward {
  id: number;
  docId: string;
  title: string;
  name: string;
  points: number;
  image: string;
  hint: string;
}

export interface Product {
  id: number;
  docId: string;
  name: string;
  stars: number;
  image: string;
}

function RedeemRewardDialog({ 
    isOpen, 
    onClose, 
    reward, 
    user, 
    onConfirm 
} : { 
    isOpen: boolean, 
    onClose: () => void, 
    reward: Reward | null, 
    user: UserDetails,
    onConfirm: (updatedProfile: Partial<UserDetails>, reward: Reward) => void
}) {
    const [address, setAddress] = useState(user.address || '');
    const [city, setCity] = useState(user.city || '');
    const [pharmacy, setPharmacy] = useState(user.pharmacy || '');
    const [facebook, setFacebook] = useState(user.facebook || '');
    const [twitter, setTwitter] = useState(user.twitter || '');
    const [instagram, setInstagram] = useState(user.instagram || '');
    const [profilePicture, setProfilePicture] = useState<string | null>(user.profilePicture || null);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        setAddress(user.address || '');
        setCity(user.city || '');
        setPharmacy(user.pharmacy || '');
        setFacebook(user.facebook || '');
        setTwitter(user.twitter || '');
        setInstagram(user.instagram || '');
        setProfilePicture(user.profilePicture || null);
    }, [user]);

    if (!isOpen || !reward) return null;

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePictureFile(file);
            setProfilePicture(URL.createObjectURL(file));
        }
    };

    const handleConfirmClick = async () => {
        setIsUploading(true);
        let pictureUrl = profilePicture;

        if (profilePictureFile) {
            try {
                const storageRef = ref(storage, `profile-pictures/${user.id}/${profilePictureFile.name}`);
                const snapshot = await uploadBytes(storageRef, profilePictureFile);
                pictureUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading profile picture: ", error);
                toast({
                    variant: "destructive",
                    title: "Error al Subir Imagen",
                    description: "No se pudo subir la imagen de perfil. Por favor, inténtalo de nuevo.",
                });
                setIsUploading(false);
                return;
            }
        }

        const updatedUser: Partial<UserDetails> = {
            address,
            city,
            pharmacy,
            profilePicture: pictureUrl,
            facebook,
            twitter,
            instagram,
        };
        onConfirm(updatedUser, reward);
        setIsUploading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Confirmar Canje de Premio</DialogTitle>
                    <DialogDescription>
                        Casi listo para obtener tu "{reward.title}". Por favor, completa tu información para la entrega.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-4">
                        <div 
                            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary cursor-pointer group"
                            onClick={() => profilePicInputRef.current?.click()}
                        >
                            <Image 
                                src={profilePicture || 'https://images.unsplash.com/photo-1518183214770-9cffbec72538?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNnx8ZGluZXJvfGVufDB8fHx8MTc1MzgxNTIxM3ww&ixlib=rb-4.1.0&q=80&w=1080'} 
                                alt="Foto de perfil"
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint="user avatar"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white"/>
                            </div>
                        </div>
                        <input type="file" accept="image/*" ref={profilePicInputRef} onChange={handlePictureChange} className="hidden" />
                        <div>
                            <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
                            <p className="text-muted-foreground text-sm">{user.email}</p>
                            <Button variant="link" className="p-0 h-auto" onClick={() => profilePicInputRef.current?.click()}>Cambiar foto</Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                           <Label htmlFor="address" className="flex items-center gap-2"><Home className="w-4 h-4"/> Dirección de Entrega</Label>
                           <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Av. Principal 123 y Calle Secundaria" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city" className="flex items-center gap-2"><MapPin className="w-4 h-4"/> Ciudad</Label>
                            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Guayaquil" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pharmacy" className="flex items-center gap-2"><Building className="w-4 h-4"/>Punto de venta de trabajo o nombre de la cadena</Label>
                         <Input id="pharmacy" value={pharmacy} onChange={(e) => setPharmacy(e.target.value)} placeholder="Ej: Farmacia SanaSana" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Label>Perfiles Sociales (Opcional)</Label>
                        <div className="flex items-center gap-2">
                            <Facebook className="w-5 h-5 text-muted-foreground" />
                            <Input id="facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="URL de tu perfil de Facebook" />
                        </div>
                         <div className="flex items-center gap-2">
                            <Twitter className="w-5 h-5 text-muted-foreground" />
                            <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="URL de tu perfil de Twitter" />
                        </div>
                         <div className="flex items-center gap-2">
                            <Instagram className="w-5 h-5 text-muted-foreground" />
                            <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Tu usuario de Instagram" />
                        </div>
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleConfirmClick} disabled={!address || !city || !pharmacy || isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Canje por {reward.points} Estrellas
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function DigitalLoyaltyCard({ user, rewards }: { user: UserDetails; rewards: Reward[] }) {
  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.email || user.phone);
  
  const sortedRewards = [...rewards].sort((a, b) => a.points - b.points);
  const nextReward = sortedRewards.find(reward => reward.points > user.points);
  const pointsNeeded = nextReward ? nextReward.points - user.points : 0;

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-7 h-7" />
          <span className="text-xl font-bold font-headline">StarCart</span>
        </div>
        <p className="font-mono text-sm opacity-90 truncate">{displayName}</p>
      </CardHeader>
      <CardContent className="text-center p-8">
        <p className="text-lg font-semibold uppercase tracking-wider">Tu Saldo</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Star className="w-10 h-10 text-yellow-300" />
          <p className="text-6xl font-bold font-headline">{user.points}</p>
        </div>
        <p className="text-lg font-semibold">Estrellas</p>

        <div className="mt-8 bg-white/20 p-4 rounded-lg">
            {nextReward ? (
                <>
                    <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Próximo Premio</p>
                    <div className="flex items-center justify-center text-left gap-4 mt-2">
                        <div className="w-16 h-16 rounded-lg bg-white/30 p-1 flex-shrink-0">
                           <Image 
                             src={nextReward.image} 
                             alt={nextReward.name}
                             width={64}
                             height={64}
                             className="w-full h-full object-contain rounded-md"
                             data-ai-hint={nextReward.hint || 'reward'}
                           />
                        </div>
                        <div className="flex-grow">
                            <p className="text-lg font-bold text-white">{nextReward.name}</p>
                            <p className="text-sm text-yellow-300 font-semibold">Te faltan {pointsNeeded} estrellas</p>
                        </div>
                    </div>
                </>
            ) : (
                 <p className="text-lg font-bold text-white">¡Felicidades! Puedes canjear todos los premios.</p>
            )}
        </div>
      </CardContent>
      <CardFooter className="bg-black/20 p-4 flex justify-center">
        <span className="font-semibold text-sm tracking-widest uppercase">recompensas</span>
      </CardFooter>
    </Card>
  );
}

function RewardCard({ reward, onRedeem, disabled }: { reward: { id: number; image: string; title: string; points: number; hint?: string; name?: string; }, onRedeem: (reward: any) => void, disabled: boolean }) {
  const title = reward.name || reward.title;
  return (
    <Card className="overflow-hidden transition-transform transform hover:scale-105 duration-300 shadow-lg bg-card flex flex-col">
      <CardHeader className="p-0 aspect-square w-full bg-muted/30 flex items-center justify-center">
        <Image src={reward.image} alt={title} width={200} height={200} className="w-full h-full object-contain" data-ai-hint={reward.hint || 'reward'} />
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <h3 className="font-headline text-sm truncate font-semibold">{title}</h3>
        <div className="flex items-center gap-1 text-primary mt-1">
          <Star className="w-4 h-4" />
          <span className="font-bold text-sm">{reward.points} Estrellas</span>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => onRedeem(reward)} disabled={disabled}>Canjear</Button>
      </CardFooter>
    </Card>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden shadow-lg bg-card flex flex-col">
       <CardHeader className="p-0 aspect-square w-full bg-muted/30 flex items-center justify-center">
         <Image src={product.image} alt={product.name} width={200} height={200} className="w-full h-full object-contain" data-ai-hint="product image" />
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <h3 className="font-headline text-sm truncate font-semibold">{product.name}</h3>
        <div className="flex items-center gap-1 text-amber-500 mt-1">
          <Award className="w-4 h-4" />
          <span className="font-bold text-sm">Gana {product.stars} Estrellas</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoUploadCard({ products, onStarsEarned }: { products: Product[], onStarsEarned: (stars: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      e.currentTarget.classList.remove('border-primary');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-primary');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-primary');
  }, []);

  const resetForm = () => {
    setFile(null);
    setSelectedProductId('');
    setQuantity(1);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleAnalyzeClick = async () => {
    const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

    if (!file || !selectedProduct || quantity < 1) {
      toast({
        variant: 'destructive',
        title: 'Información Incompleta',
        description: 'Por favor, selecciona un producto, una cantidad válida y sube la foto de tu factura.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        try {
          const result = await processReceipt({
            photoDataUri: base64Image,
            productName: selectedProduct.name,
            quantity: quantity,
            starsPerProduct: selectedProduct.stars
          });

          onStarsEarned(result.starsAwarded);

          toast({
            title: result.starsAwarded > 0 ? `¡Has Ganado ${result.starsAwarded} Estrellas!` : 'Análisis Completo',
            description: result.reason,
          });
          
          resetForm();

        } catch (error) {
          console.error("Error processing receipt:", error);
          toast({
            variant: 'destructive',
            title: 'Error de Análisis',
            description: 'No pudimos procesar tu factura. Inténtalo de nuevo.',
          });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = (error) => {
        console.error("File reading error:", error);
        toast({
          variant: 'destructive',
          title: 'Error de Archivo',
          description: 'No se pudo leer el archivo de imagen.',
        });
        setIsProcessing(false);
      }
    } catch (error) {
       console.error("Error setting up file reader:", error);
       setIsProcessing(false);
    }
  };
  
  const isButtonDisabled = !file || !selectedProductId || quantity < 1 || isProcessing;

  return (
    <Card className="w-full max-w-md mx-auto mt-8 shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="font-headline">Gana Más Estrellas</CardTitle>
        <CardDescription>Sube una foto de tu factura para ganar estrellas por productos participantes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="product-select">Producto Participante</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="product-select">
                    <SelectValue placeholder="Selecciona un producto..." />
                </SelectTrigger>
                <SelectContent>
                    {products.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input 
                id="quantity" 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                min="1"
                placeholder="1"
            />
        </div>
      
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
        >
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="w-10 h-10" />
            {file ? (
                <p className="font-semibold text-primary">{file.name}</p>
            ) : (
                <>
                <p className="font-semibold">Arrastra y suelta una factura o haz clic</p>
                <p className="text-xs">PNG, JPG, WEBP hasta 10MB</p>
                </>
            )}
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleAnalyzeClick} disabled={isButtonDisabled}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validando Factura...
            </>
          ) : 'Validar y Ganar Estrellas'}
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function DashboardPage() {
  const { user, products, rewards, handleDataUpdate } = useAppData();
  const [currentUserDetails, setCurrentUserDetails] = useState<UserDetails | null>(user);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
        setCurrentUserDetails(user);
    }
  }, [user]);


  const handleRedeemClick = (reward: Reward) => {
    if (!currentUserDetails) return;

    if (currentUserDetails.points < reward.points) {
       toast({
        variant: 'destructive',
        title: 'Saldo Insuficiente',
        description: `No tienes suficientes estrellas para canjear esta recompensa.`,
      });
      return;
    }
    
    setSelectedReward(reward);
    setIsRedeemDialogOpen(true);
  };

  const handleConfirmRedeem = async (updatedProfile: Partial<UserDetails>, reward: Reward) => {
    if (!currentUserDetails) return;
    
    const newPoints = currentUserDetails.points - reward.points;
    const finalUserDetails: Partial<UserDetails> = { 
        ...updatedProfile,
        points: newPoints
    };

    try {
        await updateUser(currentUserDetails.id, finalUserDetails);
        await recordRedemption({
          userId: currentUserDetails.id,
          userName: `${currentUserDetails.firstName} ${currentUserDetails.lastName}`,
          rewardId: reward.docId,
          rewardName: reward.name,
          pointsRedeemed: reward.points,
          timestamp: new Date(),
        });

        const updatedUser = {...currentUserDetails, ...finalUserDetails};
        setCurrentUserDetails(updatedUser);
        handleDataUpdate({ user: updatedUser })

        setIsRedeemDialogOpen(false);
        toast({
          title: '¡Canje Exitoso!',
          description: `Has canjeado "${reward.name}" por ${reward.points} estrellas. Nos pondremos en contacto contigo para la entrega.`,
        });
    } catch(error) {
        console.error("Error redeeming reward: ", error);
        toast({
            variant: "destructive",
            title: "Error al Canjear",
            description: "No se pudo procesar tu canje. Inténtalo de nuevo.",
        });
    }
  };

  const handleStarsEarned = async (stars: number) => {
    if (!currentUserDetails || stars <= 0) return;
  
    const newPoints = currentUserDetails.points + stars;
    const updatedUser = { ...currentUserDetails, points: newPoints };
  
    if (currentUserDetails.isAdmin) {
      // If admin, only update local state
      setCurrentUserDetails(updatedUser);
      handleDataUpdate({ user: updatedUser });
    } else {
      // If regular user, update Firestore and then local state
      try {
        await updateUser(currentUserDetails.id, { points: newPoints });
        setCurrentUserDetails(updatedUser);
        handleDataUpdate({ user: updatedUser });
      } catch (error) {
        console.error("Error updating points: ", error);
        toast({
          variant: "destructive",
          title: "Error al Actualizar Puntos",
          description: "No se pudieron actualizar tus estrellas. Inténtalo de nuevo.",
        });
      }
    }
  };


  if (!currentUserDetails) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>;
  }

  return (
    <>
      <RedeemRewardDialog
        isOpen={isRedeemDialogOpen}
        onClose={() => setIsRedeemDialogOpen(false)}
        reward={selectedReward}
        user={currentUserDetails}
        onConfirm={handleConfirmRedeem}
      />
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <DigitalLoyaltyCard user={currentUserDetails} rewards={rewards} />
           {!currentUserDetails.isAdmin && <ReferralCard user={currentUserDetails} />}
          <PhotoUploadCard products={products} onStarsEarned={handleStarsEarned} />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 rounded-2xl shadow-lg">
            <CardTitle className="font-headline text-3xl mb-1">¡Gana Estrellas con Estos Productos!</CardTitle>
            <CardDescription className="mb-6">Compra cualquiera de estos productos y sube tu factura para ganar.</CardDescription>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Card>

          <Card className="p-8 rounded-2xl shadow-lg">
            <CardTitle className="font-headline text-3xl mb-1">Canjea Tus Estrellas</CardTitle>
            <CardDescription className="mb-6">Usa tus estrellas acumuladas para reclamar estas increíbles recompensas.</CardDescription>
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} onRedeem={handleRedeemClick} disabled={currentUserDetails.points < reward.points} />
                ))}
              </div>
          </Card>
        </div>
      </div>
    </>
  );
}
