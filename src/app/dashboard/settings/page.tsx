
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Webhook } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { addProduct, deleteProduct, addReward, deleteReward, getWebhookUrl, saveWebhookUrl, deleteWebhookUrl } from "@/lib/firebase/firestore";
import type { Product, Reward } from '../page';
import { useAppData } from "../layout";


export default function SettingsPage() {
  const { products: initialProducts, rewards: initialRewards, handleDataUpdate } = useAppData();
  const { toast } = useToast();
  
  // Separate loading states
  const [isProductUploading, setIsProductUploading] = useState(false);
  const [isRewardUploading, setIsRewardUploading] = useState(false);
  const [isWebhookSaving, setIsWebhookSaving] = useState(false);
  const [isWebhookLoading, setIsWebhookLoading] = useState(true);

  // State for Participating Products
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [newProductName, setNewProductName] = useState('');
  const [newProductStars, setNewProductStars] = useState('');
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  // State for Redeemable Rewards
  const [rewards, setRewards] = useState<Reward[]>(initialRewards || []);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState('');
  const [newRewardImage, setNewRewardImage] = useState<File | null>(null);
  const [rewardImagePreview, setRewardImagePreview] = useState<string | null>(null);

  // State for Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState('');

  useEffect(() => {
    setProducts(initialProducts || []);
    setRewards(initialRewards || []);
  }, [initialProducts, initialRewards]);

  useEffect(() => {
    async function fetchWebhook() {
      setIsWebhookLoading(true);
      const url = await getWebhookUrl();
      if (url) {
        setWebhookUrl(url);
        setCurrentWebhookUrl(url);
      }
      setIsWebhookLoading(false);
    }
    fetchWebhook();
  }, []);


  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewProductImage(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newProductStars || !newProductImage) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, completa todos los campos para añadir el producto.',
      });
      return;
    }
    
    setIsProductUploading(true);

    try {
        const storageRef = ref(storage, `products/${Date.now()}_${newProductImage.name}`);
        const snapshot = await uploadBytes(storageRef, newProductImage);
        const imageUrl = await getDownloadURL(snapshot.ref);

        const newProductData = {
          id: Date.now(),
          name: newProductName,
          stars: parseInt(newProductStars, 10),
          image: imageUrl
        };
        
        const docId = await addProduct(newProductData);
        
        const newProductsList = [...products, { ...newProductData, docId }];
        setProducts(newProductsList);
        handleDataUpdate({ products: newProductsList });
        
        toast({
          title: '¡Producto Añadido!',
          description: `El producto "${newProductName}" se ha añadido correctamente.`,
        });

        setNewProductName('');
        setNewProductStars('');
        setNewProductImage(null);
        setProductImagePreview(null);
        const fileInput = document.getElementById('product-image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

    } catch(error) {
        console.error("Error adding product:", error);
         toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo añadir el producto.',
        });
    } finally {
        setIsProductUploading(false);
    }
  };
  
  const handleDeleteProduct = async (productToDelete: Product) => {
    try {
      await deleteProduct(productToDelete.docId);
      const newProductsList = products.filter(p => p.docId !== productToDelete.docId);
      setProducts(newProductsList);
      handleDataUpdate({ products: newProductsList });
      toast({
        title: 'Producto Eliminado',
        description: 'El producto ha sido eliminado de la lista.',
      });
    } catch(error) {
       console.error("Error deleting product:", error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el producto.',
      });
    }
  };

  const handleRewardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewRewardImage(file);
      setRewardImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddReward = async () => {
    if (!newRewardName || !newRewardPoints || !newRewardImage) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, completa todos los campos para añadir el premio.',
      });
      return;
    }
    
    setIsRewardUploading(true);
    try {
        const storageRef = ref(storage, `rewards/${Date.now()}_${newRewardImage.name}`);
        const snapshot = await uploadBytes(storageRef, newRewardImage);
        const imageUrl = await getDownloadURL(snapshot.ref);

        const newRewardData = {
          id: Date.now(),
          name: newRewardName,
          title: newRewardName, // Ensure title is set for consistency
          points: parseInt(newRewardPoints, 10),
          image: imageUrl,
          hint: '',
        };

        const docId = await addReward(newRewardData);

        const newRewardsList = [...rewards, { ...newRewardData, docId }]
        setRewards(newRewardsList);
        handleDataUpdate({ rewards: newRewardsList });


        toast({
          title: '¡Premio Añadido!',
          description: `El premio "${newRewardName}" se ha añadido correctamente.`,
        });

        setNewRewardName('');
        setNewRewardPoints('');
        setNewRewardImage(null);
        setRewardImagePreview(null);
        const fileInput = document.getElementById('reward-image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

    } catch (error) {
         console.error("Error adding reward:", error);
         toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo añadir el premio.',
        });
    } finally {
        setIsRewardUploading(false);
    }
  };

  const handleDeleteReward = async (rewardToDelete: Reward) => {
    try {
        await deleteReward(rewardToDelete.docId);
        const newRewardsList = rewards.filter(r => r.docId !== rewardToDelete.docId)
        setRewards(newRewardsList);
        handleDataUpdate({ rewards: newRewardsList });
        toast({
          title: 'Premio Eliminado',
          description: 'El premio ha sido eliminado de la lista.',
        });
    } catch (error) {
        console.error("Error deleting reward:", error);
        toast({
         variant: 'destructive',
         title: 'Error',
         description: 'No se pudo eliminar el premio.',
       });
    }
  };

  const handleSaveWebhook = async () => {
     if (!webhookUrl) {
      toast({
        variant: 'destructive',
        title: 'URL Requerida',
        description: 'Por favor, introduce una URL para el webhook.',
      });
      return;
    }
    setIsWebhookSaving(true);
    try {
        await saveWebhookUrl(webhookUrl);
        setCurrentWebhookUrl(webhookUrl);
        toast({
          title: '¡Webhook Guardado!',
          description: 'La URL del webhook ha sido guardada correctamente.',
        });
    } catch(error) {
        console.error("Error saving webhook:", error);
        toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No se pudo guardar la URL del webhook.',
        });
    } finally {
        setIsWebhookSaving(false);
    }
  }

  const handleDeleteWebhook = async () => {
    setIsWebhookSaving(true);
     try {
        await deleteWebhookUrl();
        setWebhookUrl('');
        setCurrentWebhookUrl('');
        toast({
          title: '¡Webhook Eliminado!',
          description: 'La URL del webhook ha sido eliminada.',
        });
    } catch(error) {
        console.error("Error deleting webhook:", error);
        toast({
            variant: 'destructive',
            title: 'Error al Eliminar',
            description: 'No se pudo eliminar la URL del webhook.',
        });
    } finally {
        setIsWebhookSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Configuración de Administrador</h1>
        <p className="text-muted-foreground">
          Gestiona los productos, premios y webhooks del programa de lealtad.
        </p>
      </div>
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Productos Participantes</CardTitle>
          <CardDescription>
            Añade o modifica los productos que los clientes pueden escanear en sus facturas para ganar estrellas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Añadir Nuevo Producto</h3>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="product-name">Nombre del Producto</Label>
                <Input id="product-name" placeholder="Ej: ANSIOLIFE" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="product-stars">Estrellas Otorgadas</Label>
                <Input id="product-stars" type="number" placeholder="Ej: 200" value={newProductStars} onChange={(e) => setNewProductStars(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="product-image">Imagen del Producto</Label>
                <Input id="product-image" type="file" accept="image/*" onChange={handleProductImageChange} />
              </div>
               {productImagePreview && (
                <div className="mt-4">
                  <Label>Vista Previa de la Imagen</Label>
                  <Image src={productImagePreview} alt="Vista previa" width={100} height={100} className="rounded-md border mt-2" />
                </div>
              )}
              <Button onClick={handleAddProduct} className="w-full" disabled={isProductUploading}>
                {isProductUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar y Añadir Producto
              </Button>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-medium">Productos Actuales</h3>
               <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                 {products.length > 0 ? products.map(product => (
                  <Card key={product.id} className="flex items-center p-4 gap-4">
                    <Image src={product.image} alt={product.name} width={64} height={64} className="rounded-md border object-cover h-16 w-16" />
                    <div className="flex-grow">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-primary">{product.stars} estrellas</p>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </Card>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay productos añadidos.</p>
                )}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Premios Canjeables</CardTitle>
          <CardDescription>
            Define los premios que los usuarios pueden canjear con sus estrellas.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Añadir Nuevo Premio</h3>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="reward-name">Nombre del Premio</Label>
                <Input id="reward-name" placeholder="Ej: Café Gratis" value={newRewardName} onChange={(e) => setNewRewardName(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="reward-points">Costo en Estrellas</Label>
                <Input id="reward-points" type="number" placeholder="Ej: 100" value={newRewardPoints} onChange={(e) => setNewRewardPoints(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="reward-image">Imagen del Premio</Label>
                <Input id="reward-image" type="file" accept="image/*" onChange={handleRewardImageChange} />
              </div>
               {rewardImagePreview && (
                <div className="mt-4">
                  <Label>Vista Previa de la Imagen</Label>
                  <Image src={rewardImagePreview} alt="Vista previa" width={100} height={100} className="rounded-md border mt-2" />
                </div>
              )}
              <Button onClick={handleAddReward} className="w-full" disabled={isRewardUploading}>
                {isRewardUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar y Añadir Premio
              </Button>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-medium">Premios Actuales</h3>
               <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                 {rewards.length > 0 ? rewards.map(reward => (
                  <Card key={reward.id} className="flex items-center p-4 gap-4">
                    <Image src={reward.image} alt={reward.name} width={64} height={64} className="rounded-md border object-cover h-16 w-16" />
                    <div className="flex-grow">
                      <p className="font-semibold">{reward.name}</p>
                      <p className="text-sm text-primary">{reward.points} estrellas</p>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteReward(reward)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </Card>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay premios añadidos.</p>
                )}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Webhook /> Configuración de Webhook</CardTitle>
          <CardDescription>
            Recibe notificaciones de eventos (como registros o canjes) en tiempo real en la URL que especifiques.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
                <Label htmlFor="webhook-url">URL del Webhook</Label>
                <Input 
                    id="webhook-url" 
                    placeholder="https://tu-endpoint.com/webhook" 
                    value={webhookUrl} 
                    onChange={(e) => setWebhookUrl(e.target.value)} 
                    disabled={isWebhookLoading}
                />
                 {isWebhookLoading && <p className="text-sm text-muted-foreground">Cargando configuración...</p>}
                 {currentWebhookUrl && !isWebhookLoading && (
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md border">
                        URL actual: <span className="font-mono">{currentWebhookUrl}</span>
                    </div>
                 )}
                <div className="flex gap-2">
                    <Button onClick={handleSaveWebhook} disabled={isWebhookSaving || isWebhookLoading}>
                        {isWebhookSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Webhook
                    </Button>
                    {currentWebhookUrl && (
                        <Button variant="destructive" onClick={handleDeleteWebhook} disabled={isWebhookSaving || isWebhookLoading}>
                            {isWebhookSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Eliminar
                        </Button>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
