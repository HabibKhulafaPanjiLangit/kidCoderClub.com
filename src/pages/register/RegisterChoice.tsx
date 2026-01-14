import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const RegisterChoice = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo-kidcoderclub.png" alt="KidCoderClub" className="w-12 h-12 rounded-md object-contain bg-white p-1" />
          <span className="text-2xl font-bold text-gradient">KidCoderClub</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Buat Akun Baru</h1>
          <p className="text-muted-foreground">
            Pilih jenis akun yang ingin Anda daftarkan
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-24 flex items-center justify-start gap-4 px-6"
            asChild
          >
            <Link to="/register/siswa">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold">Daftar sebagai Siswa</div>
                <div className="text-sm text-muted-foreground">
                  Untuk anak usia 6-16 tahun yang ingin belajar coding
                </div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-24 flex items-center justify-start gap-4 px-6"
            asChild
          >
            <Link to="/register/mentor">
              <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="w-7 h-7 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold">Daftar sebagai Mentor</div>
                <div className="text-sm text-muted-foreground">
                  Untuk pengajar yang ingin membimbing siswa
                </div>
              </div>
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-center text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login/siswa" className="text-primary font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterChoice;
