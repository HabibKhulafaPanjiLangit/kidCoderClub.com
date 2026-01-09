import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MentorLayout } from "@/components/layouts/MentorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, User, Camera, Loader2 } from "lucide-react";

const expertiseOptions = [
  "Scratch & Visual Programming",
  "Python",
  "JavaScript & Web Development",
  "Game Development",
  "Mobile App Development",
  "Robotika & IoT",
];

const experienceOptions = [
  { value: "0-1", label: "Kurang dari 1 tahun" },
  { value: "1-3", label: "1-3 tahun" },
  { value: "3-5", label: "3-5 tahun" },
  { value: "5+", label: "Lebih dari 5 tahun" },
];

const MentorProfile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    expertise: profile?.expertise || "",
    experience: profile?.experience || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran maksimal file adalah 2MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format tidak didukung",
        description: "Gunakan format JPG, PNG, GIF, atau WebP",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Foto profil diperbarui! 📸",
        description: "Foto profil Anda berhasil diupload",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Gagal upload foto",
        description: error.message || "Terjadi kesalahan saat upload foto",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile({
      full_name: formData.full_name,
      expertise: formData.expertise || null,
      experience: formData.experience || null,
      bio: formData.bio || null,
      phone: formData.phone || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan profil",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });
    }

    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MentorLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Profil Saya</h1>
          <p className="text-muted-foreground">
            Kelola informasi profil Anda sebagai mentor
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview Profil</CardTitle>
              <CardDescription>
                Ini adalah tampilan profil Anda untuk siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {profile?.full_name ? getInitials(profile.full_name) : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{formData.full_name || "Nama Mentor"}</h3>
                  <p className="text-primary font-medium">
                    {formData.expertise || "Keahlian belum diisi"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pengalaman: {experienceOptions.find(e => e.value === formData.experience)?.label || "Belum diisi"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.bio || "Bio belum diisi"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Edit Profil</CardTitle>
              <CardDescription>
                Perbarui informasi profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertise">Bidang Keahlian</Label>
                  <Select
                    value={formData.expertise}
                    onValueChange={(v) => setFormData({ ...formData, expertise: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bidang keahlian" />
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
                  <Select
                    value={formData.experience}
                    onValueChange={(v) => setFormData({ ...formData, experience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pengalaman" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Tentang Anda</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Ceritakan tentang diri Anda, pengalaman, dan gaya mengajar..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorProfile;
