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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Search, RefreshCw, Award, Upload, Eye, GraduationCap, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GraduatedStudent {
  enrollment_id: string;
  user_id: string;
  class_id: string;
  progress: number;
  completed_at: string | null;
  student_name: string;
  student_avatar: string | null;
  class_title: string;
  has_certificate: boolean;
  certificate_url?: string;
  certificate_id?: string;
}

const AdminCertificates = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<GraduatedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<GraduatedStudent | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchGraduatedStudents = async () => {
    setLoading(true);

    // Get all enrollments with 100% progress
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("id, user_id, class_id, progress, completed_at")
      .eq("progress", 100);

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      setLoading(false);
      return;
    }

    // Get student profiles and class titles
    const studentsData = await Promise.all(
      (enrollments || []).map(async (enrollment) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", enrollment.user_id)
          .single();

        const { data: classData } = await supabase
          .from("classes")
          .select("title")
          .eq("id", enrollment.class_id)
          .single();

        const { data: certificate } = await supabase
          .from("student_certificates")
          .select("id, certificate_url")
          .eq("user_id", enrollment.user_id)
          .eq("class_id", enrollment.class_id)
          .single();

        return {
          enrollment_id: enrollment.id,
          user_id: enrollment.user_id,
          class_id: enrollment.class_id,
          progress: enrollment.progress,
          completed_at: enrollment.completed_at,
          student_name: profile?.full_name || "Unknown",
          student_avatar: profile?.avatar_url,
          class_title: classData?.title || "Unknown Class",
          has_certificate: !!certificate,
          certificate_url: certificate?.certificate_url,
          certificate_id: certificate?.id,
        };
      })
    );

    setStudents(studentsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchGraduatedStudents();
  }, []);

  const handleUploadClick = (student: GraduatedStudent) => {
    setSelectedStudent(student);
    setCertificateFile(null);
    setIsUploadOpen(true);
  };

  const handleViewCertificate = (student: GraduatedStudent) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };

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
      setCertificateFile(file);
    }
  };

  const handleUploadCertificate = async () => {
    if (!selectedStudent || !certificateFile || !user) return;

    setUploading(true);

    const fileExt = certificateFile.name.split('.').pop();
    const fileName = `student-certificates/${selectedStudent.user_id}/${selectedStudent.class_id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, certificateFile);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Gagal mengupload sertifikat",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    // Insert or update certificate record
    const { error: dbError } = await supabase
      .from('student_certificates')
      .upsert({
        user_id: selectedStudent.user_id,
        class_id: selectedStudent.class_id,
        certificate_url: publicUrl,
        issued_by: user.id,
        issued_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,class_id'
      });

    if (dbError) {
      // If upsert fails, try insert
      const { error: insertError } = await supabase
        .from('student_certificates')
        .insert({
          user_id: selectedStudent.user_id,
          class_id: selectedStudent.class_id,
          certificate_url: publicUrl,
          issued_by: user.id,
        });

      if (insertError) {
        toast({
          title: "Error",
          description: "Gagal menyimpan data sertifikat",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }
    }

    toast({
      title: "Berhasil",
      description: "Sertifikat berhasil diberikan",
    });

    setIsUploadOpen(false);
    setUploading(false);
    fetchGraduatedStudents();
  };

  const filteredStudents = students.filter((student) =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const withCertificates = students.filter(s => s.has_certificate).length;
  const withoutCertificates = students.filter(s => !s.has_certificate).length;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sertifikat Kelulusan</h1>
            <p className="text-slate-500">Kelola sertifikat untuk siswa yang telah lulus</p>
          </div>
          <Button onClick={fetchGraduatedStudents} variant="outline" disabled={loading}>
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
                <p className="text-sm text-muted-foreground">Siswa Lulus</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{withCertificates}</p>
                <p className="text-sm text-muted-foreground">Sudah Dapat Sertifikat</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Upload className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{withoutCertificates}</p>
                <p className="text-sm text-muted-foreground">Belum Dapat Sertifikat</p>
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
                placeholder="Cari siswa atau kelas..."
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
            <CardTitle>Siswa yang Lulus (Progress 100%)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.enrollment_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.student_avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(student.student_name)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium">{student.student_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{student.class_title}</TableCell>
                      <TableCell>
                        {student.completed_at
                          ? new Date(student.completed_at).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {student.has_certificate ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sudah Ada
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Belum Ada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {student.has_certificate ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCertificate(student)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>
                          ) : null}
                          <Button
                            variant={student.has_certificate ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleUploadClick(student)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {student.has_certificate ? "Ganti" : "Upload"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada siswa yang telah lulus
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Sertifikat</DialogTitle>
              <DialogDescription>
                Upload sertifikat untuk {selectedStudent?.student_name} - {selectedStudent?.class_title}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <input
                id="certificate-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="certificate-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                {certificateFile ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-medium">{certificateFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Klik untuk upload (PDF, JPG, PNG)</span>
                    <span className="text-xs">Maksimal 10MB</span>
                  </div>
                )}
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleUploadCertificate} disabled={!certificateFile || uploading}>
                {uploading ? "Mengupload..." : "Upload Sertifikat"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sertifikat - {selectedStudent?.student_name}</DialogTitle>
              <DialogDescription>
                Kelas: {selectedStudent?.class_title}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedStudent?.certificate_url && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedStudent.certificate_url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={selectedStudent.certificate_url}
                      className="w-full h-96"
                      title="Certificate PDF"
                    />
                  ) : (
                    <img
                      src={selectedStudent.certificate_url}
                      alt="Certificate"
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Tutup
              </Button>
              {selectedStudent?.certificate_url && (
                <Button asChild>
                  <a href={selectedStudent.certificate_url} target="_blank" rel="noopener noreferrer">
                    Buka di Tab Baru
                  </a>
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCertificates;
