import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MentorLayout } from "@/components/layouts/MentorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Plus, Edit, Trash2, Upload, FileText, Calendar, ClipboardList } from "lucide-react";

interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  due_date: string | null;
  created_at: string;
  class_title?: string;
}

interface MentorClass {
  id: string;
  title: string;
}

const MentorAssignments = () => {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<MentorClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    class_id: "",
    title: "",
    description: "",
    due_date: "",
  });
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Check approval status
  const isApproved = profile?.approval_status === 'approved';

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch mentor's classes via class_mentors junction table
    const { data: classMentorData } = await supabase
      .from("class_mentors")
      .select("class_id, classes(id, title)")
      .eq("mentor_id", user.id);

    const classesData = classMentorData
      ?.map((cm) => cm.classes as any)
      .filter(Boolean) || [];
    
    setClasses(classesData);

    // Fetch assignments
    const { data: assignmentsData, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("mentor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assignments:", error);
      setLoading(false);
      return;
    }

    // Map class titles
    const assignmentsWithClass = (assignmentsData || []).map((assignment) => {
      const cls = classesData?.find((c: any) => c.id === assignment.class_id);
      return {
        ...assignment,
        class_title: cls?.title || "Unknown",
      };
    });

    setAssignments(assignmentsWithClass);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: "Ukuran file maksimal 10MB",
          variant: "destructive",
        });
        return;
      }
      setAssignmentFile(file);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!assignmentFile || !user) return null;

    const fileExt = assignmentFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(fileName, assignmentFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleAdd = async () => {
    if (!user || !formData.class_id || !formData.title) {
      toast({
        title: "Error",
        description: "Kelas dan judul harus diisi",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let fileUrl = null;

    if (assignmentFile) {
      fileUrl = await uploadFile();
    }

    const { error } = await supabase.from("assignments").insert({
      class_id: formData.class_id,
      mentor_id: user.id,
      title: formData.title,
      description: formData.description || null,
      file_url: fileUrl,
      due_date: formData.due_date || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menambah tugas",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    toast({
      title: "Berhasil",
      description: "Tugas berhasil ditambahkan",
    });

    setIsAddOpen(false);
    resetForm();
    setUploading(false);
    fetchData();
  };

  const handleEdit = async () => {
    if (!selectedAssignment || !formData.title) {
      toast({
        title: "Error",
        description: "Judul harus diisi",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let fileUrl = selectedAssignment.file_url;

    if (assignmentFile) {
      fileUrl = await uploadFile();
    }

    const { error } = await supabase
      .from("assignments")
      .update({
        title: formData.title,
        description: formData.description || null,
        file_url: fileUrl,
        due_date: formData.due_date || null,
      })
      .eq("id", selectedAssignment.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui tugas",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    toast({
      title: "Berhasil",
      description: "Tugas berhasil diperbarui",
    });

    setIsEditOpen(false);
    resetForm();
    setUploading(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus tugas ini?")) return;

    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus tugas",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Tugas berhasil dihapus",
    });

    fetchData();
  };

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      class_id: assignment.class_id,
      title: assignment.title,
      description: assignment.description || "",
      due_date: assignment.due_date ? assignment.due_date.split('T')[0] : "",
    });
    setAssignmentFile(null);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({ class_id: "", title: "", description: "", due_date: "" });
    setAssignmentFile(null);
    setSelectedAssignment(null);
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.class_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isApproved) {
    return (
      <MentorLayout>
        <div className="p-6">
          <Card className="max-w-md mx-auto mt-12">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl font-bold mb-2">Akun Belum Disetujui</h2>
              <p className="text-muted-foreground">
                Akun Anda masih menunggu persetujuan dari admin. Anda akan dapat mengakses fitur ini setelah disetujui.
              </p>
            </CardContent>
          </Card>
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Kelola Tugas</h1>
            <p className="text-muted-foreground">Buat dan kelola tugas untuk siswa</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Muat Ulang
            </Button>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tugas
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Total Tugas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Calendar className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => a.due_date && new Date(a.due_date) > new Date()).length}
                </p>
                <p className="text-sm text-muted-foreground">Deadline Aktif</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          {assignment.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{assignment.class_title}</Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.due_date ? (
                          <span className={new Date(assignment.due_date) < new Date() ? "text-red-500" : ""}>
                            {new Date(assignment.due_date).toLocaleDateString("id-ID")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment.file_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              Lihat
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada tugas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Tugas Baru</DialogTitle>
              <DialogDescription>
                Buat tugas baru untuk siswa di kelas Anda
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kelas *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Judul Tugas *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul tugas"
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi tugas..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload File (opsional)</Label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {assignmentFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-5 h-5 text-primary" />
                      <span>{assignmentFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Klik untuk upload</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAdd} disabled={uploading}>
                {uploading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tugas</DialogTitle>
              <DialogDescription>
                Perbarui informasi tugas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Judul Tugas *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload File Baru (opsional)</Label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-edit"
                />
                <label
                  htmlFor="file-upload-edit"
                  className="flex items-center justify-center w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {assignmentFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-5 h-5 text-primary" />
                      <span>{assignmentFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Klik untuk upload file baru</span>
                    </div>
                  )}
                </label>
                {selectedAssignment?.file_url && !assignmentFile && (
                  <p className="text-xs text-muted-foreground">
                    File saat ini akan dipertahankan jika tidak upload baru
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEdit} disabled={uploading}>
                {uploading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MentorLayout>
  );
};

export default MentorAssignments;
