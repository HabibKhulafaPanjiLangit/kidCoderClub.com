import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Mail, Lock, User, Eye, EyeOff, GraduationCap, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StudentRegister = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Kata sandi tidak cocok.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        fullName,
        role: 'student',
        age: age ? parseInt(age) : undefined,
      });
      
      if (error) {
        toast({
          title: "Registrasi Gagal",
          description: error.message || "Terjadi kesalahan saat mendaftar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Akun berhasil dibuat! 🎉",
          description: "Selamat datang di KidCoderClub! Ayo mulai ngoding.",
        });
        navigate("/student/dashboard");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-primary-foreground relative z-10"
        >
          <div className="text-8xl mb-6">🚀</div>
          <h2 className="text-3xl font-bold mb-4">Mulai Petualanganmu</h2>
          <p className="text-primary-foreground/80 max-w-sm">
            Bergabung dengan ribuan coder muda yang membangun hal-hal menakjubkan setiap hari!
          </p>
          
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">50+</p>
              <p className="text-sm text-primary-foreground/70">Kursus</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-sm text-primary-foreground/70">Siswa</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">100+</p>
              <p className="text-sm text-primary-foreground/70">Proyek</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Code2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">KidCoderClub</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-primary">Daftar sebagai Siswa</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Buat Akun Siswa</h1>
          <p className="text-muted-foreground mb-6">
            Bergabung dan mulai petualangan coding!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nama lengkapmu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Usia</Label>
              <Select value={age} onValueChange={setAge} required>
                <SelectTrigger className="h-12 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <SelectValue placeholder="Pilih usia" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i + 6).map((ageNum) => (
                    <SelectItem key={ageNum} value={ageNum.toString()}>
                      {ageNum} tahun
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="kamu@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Konfirmasi kata sandimu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Membuat akun..." : "Daftar Sekarang"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Dengan mendaftar, kamu menyetujui{" "}
            <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a> dan{" "}
            <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>
          </p>

          <p className="mt-4 text-center text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login/siswa" className="text-primary font-medium hover:underline">
              Masuk
            </Link>
          </p>
          
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Ingin menjadi mentor?{" "}
            <Link to="/register/mentor" className="text-primary hover:underline">
              Daftar sebagai Mentor
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentRegister;
