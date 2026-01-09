import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MentorLayout } from "@/components/layouts/MentorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  BookOpen,
  Video,
  FileText,
  Loader2
} from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface Module {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
}

interface ClassInfo {
  id: string;
  title: string;
}

const MentorModules = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    video_url: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!classId || !user) return;

      // Verify mentor has access to this class via class_mentors
      const { data: accessData } = await supabase
        .from("class_mentors")
        .select("id, classes(id, title)")
        .eq("class_id", classId)
        .eq("mentor_id", user.id)
        .maybeSingle();

      if (!accessData) {
        toast({
          title: "Akses ditolak",
          description: "Anda tidak memiliki akses ke kelas ini",
          variant: "destructive",
        });
        navigate("/mentor/classes");
        return;
      }

      const classData = accessData.classes as any;
      setClassInfo({ id: classData.id, title: classData.title });

      // Fetch modules
      const { data: moduleData } = await supabase
        .from("modules")
        .select("*")
        .eq("class_id", classId)
        .order("order_index", { ascending: true });

      setModules(moduleData || []);
      setLoading(false);
    };

    fetchData();
  }, [classId, user, navigate, toast]);

  const handleCreateClick = () => {
    setFormData({ title: "", content: "", video_url: "" });
    setIsCreateOpen(true);
  };

  const handleEditClick = (module: Module) => {
    setSelectedModule(module);
    setFormData({
      title: module.title,
      content: module.content || "",
      video_url: module.video_url || "",
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!classId || !formData.title.trim()) return;

    setSaving(true);
    const newOrderIndex = modules.length > 0 
      ? Math.max(...modules.map(m => m.order_index)) + 1 
      : 0;

    const { error } = await supabase.from("modules").insert({
      class_id: classId,
      title: formData.title,
      content: formData.content || null,
      video_url: formData.video_url || null,
      order_index: newOrderIndex,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal membuat modul",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Modul baru berhasil dibuat",
      });
      setIsCreateOpen(false);
      // Refresh modules
      const { data } = await supabase
        .from("modules")
        .select("*")
        .eq("class_id", classId)
        .order("order_index", { ascending: true });
      setModules(data || []);
    }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedModule) return;

    setSaving(true);
    const { error } = await supabase
      .from("modules")
      .update({
        title: formData.title,
        content: formData.content || null,
        video_url: formData.video_url || null,
      })
      .eq("id", selectedModule.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan perubahan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Modul berhasil diperbarui",
      });
      setIsEditOpen(false);
      // Refresh modules
      const { data } = await supabase
        .from("modules")
        .select("*")
        .eq("class_id", classId)
        .order("order_index", { ascending: true });
      setModules(data || []);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedModule) return;

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", selectedModule.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus modul",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Modul berhasil dihapus",
      });
      setModules(modules.filter(m => m.id !== selectedModule.id));
    }
    setIsDeleteOpen(false);
  };

  const handleReorder = async (newOrder: Module[]) => {
    setModules(newOrder);
    
    // Update order_index in database
    const updates = newOrder.map((module, index) => 
      supabase
        .from("modules")
        .update({ order_index: index })
        .eq("id", module.id)
    );

    await Promise.all(updates);
  };

  if (loading) {
    return (
      <MentorLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate("/mentor/classes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Kelas
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kelola Modul</h1>
              <p className="text-muted-foreground">
                {classInfo?.title}
              </p>
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Modul
            </Button>
          </div>
        </div>

        {/* Modules List */}
        {modules.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Daftar Modul ({modules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Drag dan drop untuk mengubah urutan modul
              </p>
              <Reorder.Group 
                axis="y" 
                values={modules} 
                onReorder={handleReorder}
                className="space-y-3"
              >
                {modules.map((module, index) => (
                  <Reorder.Item 
                    key={module.id} 
                    value={module}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{module.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {module.content && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Konten
                            </span>
                          )}
                          {module.video_url && (
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(module)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(module)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada modul</h3>
            <p className="text-muted-foreground mb-4">
              Mulai buat modul pembelajaran untuk kelas ini
            </p>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Modul Pertama
            </Button>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Modul Baru</DialogTitle>
              <DialogDescription>
                Buat modul pembelajaran baru untuk kelas ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Modul *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pengenalan HTML"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Konten / Deskripsi</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tulis materi pembelajaran di sini..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">URL Video (opsional)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={saving || !formData.title.trim()}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Tambah Modul
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Modul</DialogTitle>
              <DialogDescription>
                Perbarui informasi modul pembelajaran
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Judul Modul *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Konten / Deskripsi</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-video_url">URL Video (opsional)</Label>
                <Input
                  id="edit-video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || !formData.title.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Modul?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus modul "{selectedModule?.title}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MentorLayout>
  );
};

export default MentorModules;
