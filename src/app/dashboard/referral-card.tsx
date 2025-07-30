
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Users, Gift, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserDetails } from "./page";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from 'react-share';
import { useEffect, useState } from "react";

export default function ReferralCard({ user }: { user: UserDetails }) {
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.origin;
      setReferralLink(`${currentUrl}/signup?ref=${user.id}`);
    }
  }, [user.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "¡Enlace Copiado!",
      description: "Tu enlace de referido ha sido copiado. ¡Pega el enlace en Instagram!",
    });
  };
  
  const shareTitle = "¡Únete a StarCart y Gana Recompensas!";
  const shareBody = `¡Hola! Te invito a unirte a StarCart Recompensas usando mi enlace para que ambos ganemos estrellas de bonificación. Regístrate aquí: ${referralLink}`;


  if (!referralLink) {
    return null; // Don't render the card until the link is generated
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8 shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Users className="w-6 h-6 text-primary"/> ¡Refiere y Gana!</CardTitle>
        <CardDescription>
          Comparte tu enlace de referido con amigos. ¡Cuando se registren, recibirás 100 estrellas de bonificación!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input value={referralLink} readOnly />
          <Button variant="outline" size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center space-x-3 pt-2">
           <WhatsappShareButton
            url={referralLink}
            title={shareTitle}
            separator=" "
           >
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>

          <FacebookShareButton
            url={referralLink}
            quote={shareBody}
          >
            <FacebookIcon size={40} round />
          </FacebookShareButton>
          
          <TwitterShareButton
            url={referralLink}
            title={shareTitle}
          >
            <TwitterIcon size={40} round />
          </TwitterShareButton>

          <button onClick={copyToClipboard} title="Copiar enlace para Instagram" className="rounded-full w-10 h-10 flex items-center justify-center bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600">
            <Instagram className="w-6 h-6 text-white"/>
          </button>

        </div>
      </CardContent>
    </Card>
  );
}
