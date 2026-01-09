import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClassWithEnrollments {
  id: string;
  title: string;
  description: string | null;
  level: string;
  is_active: boolean;
  enrollment_count: number;
  avg_progress: number;
}

const MentorClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithEnrollments[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassWithEnrollments | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "beginner",
    is_active: true,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchClasses = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch classes via class_mentors junction table
    const { data: classMentorData, error: classesError } = await supabase
      .from("class_mentors")
      .select(`
        class_id,
        is_available,
        max_students,
        current_students,
        classes (
          id, title, description, level, is_active
        )
      `)
      .eq("mentor_id", user.id);

    if (classesError) {
      console.error("Error fetching classes:", classesError);
      setLoading(false);
      return;
    }

    // Transform and get enrollment stats for each class
    const classesWithStats = await Promise.all(
      (classMentorData || []).map(async (cm) => {
        const cls = cm.classes as any;
        if (!cls) return null;

        // Get enrollments where this mentor is assigned
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("progress")
          .eq("class_id", cls.id)
          .eq("mentor_id", user.id);

        const enrollment_count = enrollments?.length || 0;
        const avg_progress = enrollment_count > 0
          ? Math.round(enrollments!.reduce((sum, e) => sum + e.progress, 0) / enrollment_count)
          : 0;

        return {
          id: cls.id,
          title: cls.title,
          description: cls.description,
          level: cls.level,
          is_active: cls.is_active,
          enrollment_count,
          avg_progress,
        };
      })
    );

    setClasses(classesWithStats.filter(Boolean) as ClassWithEnrollments[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const handleEditClick = (cls: ClassWithEnrollments) => {
    setSelectedClass(cls);
    setFormData({
      title: cls.title,
      description: cls.description || "",
      level: cls.level,
      is_active: cls.is_active,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClass) return;

    const { error } = await supabase
      .from("classes")
      .update({
        title: formData.title,
        description: formData.description || null,
        level: formData.level,
        is_active: formData.is_active,
      })
      .eq("id", selectedClass.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan perubahan",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data kelas berhasil diperbarui",
    });

    setIsEditOpen(false);
    fetchClasses();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Belum ada kelas</h3>
          <p className="text-muted-foreground">
            Anda belum memiliki kelas yang ditugaskan. Hubungi admin untuk menambahkan kelas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "advanced":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1">{cls.title}</CardTitle>
                <Badge variant={cls.is_active ? "default" : "secondary"}>
                  {cls.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <Badge variant="outline" className={getLevelColor(cls.level)}>
                {cls.level.charAt(0).toUpperCase() + cls.level.slice(1)}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {cls.description || "Tidak ada deskripsi"}
              </p>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{cls.enrollment_count} siswa</span>
                </div>
                <div className="text-muted-foreground">
                  Progress: <span className="font-medium text-foreground">{cls.avg_progress}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/mentor/class/${cls.id}/modules`)}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Modul
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditClick(cls)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
            <DialogDescription>Perbarui informasi kelas Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Kelas</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(v) => setFormData({ ...formData, level: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Pemula</SelectItem>
                  <SelectItem value="intermediate">Menengah</SelectItem>
                  <SelectItem value="advanced">Lanjutan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Status Aktif</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MentorClasses;
