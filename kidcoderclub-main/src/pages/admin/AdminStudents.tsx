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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, GraduationCap, BookOpen, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  age: number | null;
  phone: string | null;
  created_at: string;
  enrollmentCount?: number;
  avgProgress?: number;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    age: "",
    phone: "",
  });
  const { toast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);

    const { data: studentData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
      setLoading(false);
      return;
    }

    // Get enrollment stats for each student
    const studentsWithStats = await Promise.all(
      (studentData || []).map(async (student) => {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("progress")
          .eq("user_id", student.user_id);

        const enrollmentCount = enrollments?.length || 0;
        const avgProgress =
          enrollmentCount > 0
            ? Math.round(
                enrollments!.reduce((sum, e) => sum + e.progress, 0) /
                  enrollmentCount
              )
            : 0;

        return {
          ...student,
          enrollmentCount,
          avgProgress,
        };
      })
    );

    setStudents(studentsWithStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setEditData({
      full_name: student.full_name,
      age: student.age?.toString() || "",
      phone: student.phone || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editData.full_name,
        age: editData.age ? parseInt(editData.age) : null,
        phone: editData.phone || null,
      })
      .eq("id", selectedStudent.id);

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
      description: "Data siswa berhasil diperbarui",
    });

    setIsEditOpen(false);
    fetchStudents();
  };

  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Siswa</h1>
            <p className="text-slate-500">Lihat dan kelola semua siswa terdaftar</p>
          </div>
          <Button onClick={fetchStudents} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Siswa</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <BookOpen className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.reduce((sum, s) => sum + (s.enrollmentCount || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Pendaftaran</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <GraduationCap className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.length > 0
                    ? Math.round(
                        students.reduce((sum, s) => sum + (s.avgProgress || 0), 0) /
                          students.length
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Rata-rata Progress</p>
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
                placeholder="Cari siswa berdasarkan nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Usia</TableHead>
                  <TableHead>Kelas Diikuti</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.phone || "No phone"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.age ? (
                          <Badge variant="outline">{student.age} tahun</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{student.enrollmentCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (student.avgProgress || 0) >= 50 ? "default" : "secondary"
                          }
                        >
                          {student.avgProgress}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada siswa ditemukan
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
              <DialogTitle>Edit Data Siswa</DialogTitle>
              <DialogDescription>
                Perbarui informasi siswa di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nama Lengkap</Label>
                <Input
                  id="edit_name"
                  value={editData.full_name}
                  onChange={(e) =>
                    setEditData({ ...editData, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_age">Usia</Label>
                <Input
                  id="edit_age"
                  type="number"
                  value={editData.age}
                  onChange={(e) =>
                    setEditData({ ...editData, age: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Nomor Telepon</Label>
                <Input
                  id="edit_phone"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
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
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
