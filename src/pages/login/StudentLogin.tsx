import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, profile, loading } = useAuth();

  // Handle navigation after profile is loaded
  useEffect(() => {
    if (isSubmitted && !loading && profile) {
      toast({
        title: "Selamat datang kembali! 🎉",
        description: "Kamu berhasil masuk.",
      });
      
      // Redirect based on role
      if (profile.role === 'student') {
        navigate("/student/dashboard");
      } else if (profile.role === 'admin') {
        navigate("/admin/dashboard");
      } else if (profile.role === 'mentor') {
        navigate("/mentor/dashboard");
      }
      
      setIsSubmitted(false);
      setIsLoading(false);
    }
  }, [profile, loading, isSubmitted, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login Gagal",
          description: error.message || "Email atau kata sandi salah.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300 hover:border-sky-400 border-2"
              title="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/logo-kidcoderclub.png" alt="KidCoderClub" className="w-10 h-10 rounded-md object-contain bg-white p-1" />
            <span className="text-xl font-bold text-gradient">KidCoderClub</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-primary">Login Siswa</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Selamat Datang Kembali!</h1>
          <p className="text-muted-foreground mb-8">
            Masuk untuk melanjutkan petualangan coding-mu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  required
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

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Sedang masuk..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Daftar gratis
            </Link>
          </p>
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login/mentor" className="hover:underline">
              Login sebagai Mentor
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-primary-foreground relative z-10"
        >
          <div className="text-8xl mb-6">🎓</div>
          <h2 className="text-3xl font-bold mb-4">Siap Ngoding?</h2>
          <p className="text-primary-foreground/80 max-w-sm">
            Lanjutkan perjalanan belajarmu dan buat proyek keren bersama temanmu!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLogin;
