import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BackButton({ 
  variant = "outline", 
  size = "sm" 
}: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate(-1)}
      className="gap-2 bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300 hover:border-sky-400 border-2"
      title="Kembali ke halaman sebelumnya"
    >
      <ArrowLeft className="w-4 h-4" />
      Kembali
    </Button>
  );
}
