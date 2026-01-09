import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Plus, BookOpen, Users, RefreshCw, UserPlus } from "lucide-react";

interface ClassItem {
  id: string;
  title: string;
  description: string | null;
  level: string;
  price: number;
  is_active: boolean;
  mentor_id: string | null;
  created_at: string;
  mentor?: {
    full_name: string;
  };
  enrollmentCount?: number;
  assignedMentors?: string[];
}

interface Mentor {
  user_id: string;
  full_name: string;
}

const AdminClasses = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignMentorOpen, setIsAssignMentorOpen] = useState(false);
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "beginner",
    price: "0",
    mentor_id: "",
    is_active: true,
  });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);

    // Fetch classes with mentor info
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (classError) {
      console.error("Error fetching classes:", classError);
    }

    // Fetch mentors
    const { data: mentorData } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("role", "mentor");

    setMentors(mentorData || []);

    // Fetch class_mentors assignments
    const { data: classMentorsData } = await supabase
      .from("class_mentors")
      .select("class_id, mentor_id");

    // Get enrollment counts and mentor names
    const classesWithStats = await Promise.all(
      (classData || []).map(async (classItem) => {
        const { count } = await supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("class_id", classItem.id);

        const mentor = mentorData?.find((m) => m.user_id === classItem.mentor_id);
        const assignedMentors = classMentorsData
          ?.filter((cm) => cm.class_id === classItem.id)
          .map((cm) => cm.mentor_id) || [];

        return {
          ...classItem,
          enrollmentCount: count || 0,
          mentor: mentor ? { full_name: mentor.full_name } : undefined,
          assignedMentors,
        };
      })
    );

    setClasses(classesWithStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description || "",
      level: classItem.level,
      price: classItem.price.toString(),
      mentor_id: classItem.mentor_id || "none",
      is_active: classItem.is_active,
    });
    setIsEditOpen(true);
  };

  const handleCreateClick = () => {
    setFormData({
      title: "",
      description: "",
      level: "beginner",
      price: "0",
      mentor_id: "none",
      is_active: true,
    });
    setIsCreateOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClass) return;

    const { error } = await supabase
      .from("classes")
      .update({
        title: formData.title,
        description: formData.description || null,
        level: formData.level,
        price: parseFloat(formData.price),
        mentor_id: formData.mentor_id === "none" ? null : formData.mentor_id,
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
    fetchData();
  };

  const handleCreate = async () => {
    const { error } = await supabase.from("classes").insert({
      title: formData.title,
      description: formData.description || null,
      level: formData.level,
      price: parseFloat(formData.price),
      mentor_id: formData.mentor_id === "none" ? null : formData.mentor_id,
      is_active: formData.is_active,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal membuat kelas baru",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Kelas baru berhasil dibuat",
    });

    setIsCreateOpen(false);
    fetchData();
  };

  const handleAssignMentorClick = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setSelectedMentorIds(classItem.assignedMentors || []);
    setIsAssignMentorOpen(true);
  };

  const handleSaveAssignMentors = async () => {
    if (!selectedClass) return;

    // Delete existing assignments
    await supabase
      .from("class_mentors")
      .delete()
      .eq("class_id", selectedClass.id);

    // Insert new assignments
    if (selectedMentorIds.length > 0) {
      const { error } = await supabase.from("class_mentors").insert(
        selectedMentorIds.map((mentorId) => ({
          class_id: selectedClass.id,
          mentor_id: mentorId,
        }))
      );

      if (error) {
        toast({
          title: "Error",
          description: "Gagal menyimpan penugasan mentor",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Berhasil",
      description: `${selectedMentorIds.length} mentor ditugaskan ke kelas`,
    });

    setIsAssignMentorOpen(false);
    fetchData();
  };

  const toggleMentorSelection = (mentorId: string) => {
    setSelectedMentorIds((prev) =>
      prev.includes(mentorId)
        ? prev.filter((id) => id !== mentorId)
        : [...prev, mentorId]
    );
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mentor?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "beginner":
        return <Badge className="bg-green-100 text-green-800">Pemula</Badge>;
      case "intermediate":
        return <Badge className="bg-yellow-100 text-yellow-800">Menengah</Badge>;
      case "advanced":
        return <Badge className="bg-red-100 text-red-800">Lanjutan</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const formFieldsJSX = (
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
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mentor">Mentor</Label>
        <Select
          value={formData.mentor_id}
          onValueChange={(v) => setFormData({ ...formData, mentor_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih mentor..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tidak ada mentor</SelectItem>
            {mentors.map((mentor) => (
              <SelectItem key={mentor.user_id} value={mentor.user_id}>
                {mentor.full_name}
              </SelectItem>
            ))}
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
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Kelas</h1>
            <p className="text-slate-500">Buat dan kelola semua kelas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Muat Ulang
            </Button>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Kelas
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Total Kelas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.filter((c) => c.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Kelas Aktif</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Pendaftaran</p>
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
                placeholder="Cari kelas atau mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredClasses.length > 0 ? (
                  filteredClasses.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.title}</TableCell>
                      <TableCell>{getLevelBadge(classItem.level)}</TableCell>
                      <TableCell>
                        {classItem.assignedMentors && classItem.assignedMentors.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {classItem.assignedMentors.slice(0, 2).map((mentorId) => {
                              const mentor = mentors.find((m) => m.user_id === mentorId);
                              return mentor ? (
                                <Badge key={mentorId} variant="secondary" className="text-xs">
                                  {mentor.full_name}
                                </Badge>
                              ) : null;
                            })}
                            {classItem.assignedMentors.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{classItem.assignedMentors.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Belum ada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {classItem.price === 0
                          ? "Gratis"
                          : `Rp ${classItem.price.toLocaleString()}`}
                      </TableCell>
                      <TableCell>{classItem.enrollmentCount}</TableCell>
                      <TableCell>
                        <Badge variant={classItem.is_active ? "default" : "secondary"}>
                          {classItem.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignMentorClick(classItem)}
                            title="Assign Mentor"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(classItem)}
                            title="Edit Kelas"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada kelas ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Kelas</DialogTitle>
              <DialogDescription>Perbarui informasi kelas</DialogDescription>
            </DialogHeader>
            {formFieldsJSX}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Kelas Baru</DialogTitle>
              <DialogDescription>Isi informasi untuk kelas baru</DialogDescription>
            </DialogHeader>
            {formFieldsJSX}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate}>Buat Kelas</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Mentor Dialog */}
        <Dialog open={isAssignMentorOpen} onOpenChange={setIsAssignMentorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Mentor ke Kelas</DialogTitle>
              <DialogDescription>
                Pilih mentor yang akan mengajar kelas "{selectedClass?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[400px] overflow-y-auto">
              {mentors.length > 0 ? (
                <div className="space-y-3">
                  {mentors.map((mentor) => (
                    <div
                      key={mentor.user_id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleMentorSelection(mentor.user_id)}
                    >
                      <Checkbox
                        checked={selectedMentorIds.includes(mentor.user_id)}
                        onCheckedChange={() => toggleMentorSelection(mentor.user_id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{mentor.full_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Belum ada mentor terdaftar
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignMentorOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveAssignMentors}>
                Simpan ({selectedMentorIds.length} mentor)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminClasses;
