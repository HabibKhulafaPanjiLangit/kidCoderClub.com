import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Save,
  Loader2,
  Camera
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    age: profile?.age?.toString() || '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File terlalu besar',
        description: 'Ukuran maksimal file adalah 2MB',
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Format tidak didukung',
        description: 'Gunakan format JPG, PNG, GIF, atau WebP',
        variant: 'destructive'
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: 'Foto profil diperbarui! 📸',
        description: 'Foto profil kamu berhasil diupload',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Gagal upload foto',
        description: error.message || 'Terjadi kesalahan saat upload foto',
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        age: formData.age ? parseInt(formData.age) : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Gagal menyimpan',
        description: 'Terjadi kesalahan saat menyimpan profil',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Profil disimpan! ✅',
        description: 'Data profil kamu berhasil diperbarui',
      });
    }

    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <StudentLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Profil Saya 👤</h1>
          <p className="text-muted-foreground">Kelola informasi profil dan akunmu</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {profile?.full_name ? getInitials(profile.full_name) : 'S'}
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
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold">{profile?.full_name || 'Student'}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Siswa KidCoderClub
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Nama lengkap kamu"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email || ''}
                      className="pl-10 bg-muted"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="08xxxxxxxxxx"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Usia</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Usia kamu"
                      className="pl-10"
                      min="5"
                      max="100"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{profile?.role || 'student'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status Akun</span>
                <span className="font-medium text-success">Aktif</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
