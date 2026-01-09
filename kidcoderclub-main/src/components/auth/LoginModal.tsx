import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Pilih Jenis Akun</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="outline"
            size="lg"
            className="h-20 flex items-center justify-start gap-4 px-6"
            asChild
          >
            <Link to="/login/siswa" onClick={onClose}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Masuk sebagai Siswa</div>
                <div className="text-sm text-muted-foreground">Akses kelas dan lanjutkan belajar</div>
              </div>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="h-20 flex items-center justify-start gap-4 px-6"
            asChild
          >
            <Link to="/login/mentor" onClick={onClose}>
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Masuk sebagai Mentor</div>
                <div className="text-sm text-muted-foreground">Kelola kelas dan bimbing siswa</div>
              </div>
            </Link>
          </Button>
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">atau</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/admin/login" onClick={onClose}>
              <Shield className="w-4 h-4 mr-2" />
              Login sebagai Admin
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
