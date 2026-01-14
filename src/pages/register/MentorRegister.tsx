import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Lock, User, Eye, EyeOff, Users, Briefcase, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MentorRegister = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const expertiseOptions = [
    "Scratch & Visual Programming",
    "Python",
    "JavaScript & Web Development",
    "Game Development",
    "Mobile App Development",
    "Robotika & IoT",
  ];

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive",
        });
        return;
      }
      setCertificateFile(file);
    }
  };

  const uploadCertificate = async (userId: string): Promise<string | null> => {
    if (!certificateFile) return null;

    setUploadingCertificate(true);
    const fileExt = certificateFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, certificateFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setUploadingCertificate(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    setUploadingCertificate(false);
    return publicUrl;
  };

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

    if (!certificateFile) {
      toast({
        title: "Error",
        description: "Silakan upload sertifikat keahlian Anda.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp(email, password, {
        fullName,
        role: 'mentor',
        expertise,
        experience,
        bio,
      });
      
      if (error) {
        toast({
          title: "Registrasi Gagal",
          description: error.message || "Terjadi kesalahan saat mendaftar.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Upload certificate after successful signup
      if (data?.user) {
        const certificateUrl = await uploadCertificate(data.user.id);
        
        if (certificateUrl) {
          // Update profile with certificate URL and set approval_status to pending
          await supabase
            .from('profiles')
            .update({ 
              certificate_url: certificateUrl,
              approval_status: 'pending'
            })
            .eq('user_id', data.user.id);
        }
      }

      toast({
        title: "Pendaftaran Berhasil! 👨‍🏫",
        description: "Akun Anda sedang menunggu persetujuan admin. Kami akan menghubungi Anda setelah disetujui.",
      });
      navigate("/login/mentor");
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
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary to-muted items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-foreground relative z-10"
        >
          <div className="text-8xl mb-6">👨‍🏫</div>
          <h2 className="text-3xl font-bold mb-4">Bergabung sebagai Mentor</h2>
          <p className="text-muted-foreground max-w-sm">
            Bagikan keahlian Anda dan inspirasi generasi coder masa depan!
          </p>
          
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">Fleksibel</p>
              <p className="text-sm text-muted-foreground">Jadwal</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">Support</p>
              <p className="text-sm text-muted-foreground">Tim</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">Dampak</p>
              <p className="text-sm text-muted-foreground">Nyata</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-6">
            <img src="/logo-kidcoderclub.png" alt="KidCoderClub" className="w-10 h-10 rounded-md object-contain bg-white p-1" />
            <span className="text-xl font-bold text-gradient">KidCoderClub</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-secondary-foreground" />
            <span className="text-sm font-medium text-secondary-foreground">Daftar sebagai Mentor</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Jadi Mentor</h1>
          <p className="text-muted-foreground mb-6">
            Lengkapi data diri untuk bergabung sebagai mentor.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nama lengkap Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise">Bidang Keahlian</Label>
              <Select value={expertise} onValueChange={setExpertise} required>
                <SelectTrigger className="h-12 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <SelectValue placeholder="Pilih bidang keahlian" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {expertiseOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Pengalaman Mengajar</Label>
              <Select value={experience} onValueChange={setExperience} required>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pilih pengalaman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">Kurang dari 1 tahun</SelectItem>
                  <SelectItem value="1-3">1-3 tahun</SelectItem>
                  <SelectItem value="3-5">3-5 tahun</SelectItem>
                  <SelectItem value="5+">Lebih dari 5 tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Tentang Anda</Label>
              <Textarea
                id="bio"
                placeholder="Ceritakan sedikit tentang diri Anda dan mengapa ingin menjadi mentor..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px] rounded-xl resize-none"
                required
              />
            </div>

            {/* Certificate Upload */}
            <div className="space-y-2">
              <Label htmlFor="certificate">Upload Sertifikat Keahlian *</Label>
              <div className="relative">
                <input
                  id="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateChange}
                  className="hidden"
                />
                <label
                  htmlFor="certificate"
                  className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  {certificateFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{certificateFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Klik untuk upload (PDF, JPG, PNG, max 5MB)</span>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Sertifikat ini akan direview oleh admin untuk verifikasi
              </p>
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
                  placeholder="Konfirmasi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || uploadingCertificate}>
              {isLoading || uploadingCertificate ? "Memproses..." : "Daftar sebagai Mentor"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Dengan mendaftar, Anda menyetujui{" "}
            <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a> dan{" "}
            <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>
          </p>

          <p className="mt-4 text-center text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login/mentor" className="text-primary font-medium hover:underline">
              Masuk
            </Link>
          </p>
          
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Ingin mendaftar sebagai siswa?{" "}
            <Link to="/register/siswa" className="text-primary hover:underline">
              Daftar sebagai Siswa
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MentorRegister;
