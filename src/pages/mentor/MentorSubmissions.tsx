import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MentorLayout } from "@/components/layouts/MentorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ClipboardCheck,
  Users
} from "lucide-react";

interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  file_url: string;
  status: string;
  submitted_at: string;
  feedback: string | null;
  grade: number | null;
  assignment_title: string;
  class_title: string;
  student_name: string;
}

interface MentorClass {
  id: string;
  title: string;
}

const MentorSubmissions = () => {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<MentorClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState({ grade: "", feedback: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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

    if (classesData.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch assignments for mentor's classes
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select("id, title, class_id")
      .eq("mentor_id", user.id);

    if (!assignmentsData || assignmentsData.length === 0) {
      setLoading(false);
      return;
    }

    const assignmentIds = assignmentsData.map(a => a.id);

    // Fetch submissions
    const { data: submissionsData, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .in("assignment_id", assignmentIds)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      setLoading(false);
      return;
    }

    // Get student profiles
    const userIds = [...new Set(submissionsData?.map(s => s.user_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    // Map data
    const submissionsWithInfo = (submissionsData || []).map(submission => {
      const assignment = assignmentsData.find(a => a.id === submission.assignment_id);
      const classInfo = classesData?.find((c: any) => c.id === assignment?.class_id);
      const student = profilesData?.find(p => p.user_id === submission.user_id);

      return {
        ...submission,
        assignment_title: assignment?.title || "Unknown",
        class_title: classInfo?.title || "Unknown",
        student_name: student?.full_name || "Unknown Student",
      };
    });

    setSubmissions(submissionsWithInfo);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleGradeClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      grade: submission.grade?.toString() || "",
      feedback: submission.feedback || "",
    });
    setIsGradeOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !user) return;

    const gradeValue = parseInt(gradeData.grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      toast({
        title: "Error",
        description: "Nilai harus antara 0-100",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        grade: gradeValue,
        feedback: gradeData.feedback || null,
        status: "graded",
        graded_at: new Date().toISOString(),
        graded_by: user.id,
      })
      .eq("id", selectedSubmission.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan nilai",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Berhasil",
      description: "Nilai berhasil disimpan",
    });

    setIsGradeOpen(false);
    setSaving(false);
    fetchData();
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.assignment_title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = filterClass === "all" || 
      classes.find(c => c.title === submission.class_title)?.id === filterClass;
    
    const matchesStatus = filterStatus === "all" || submission.status === filterStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Dinilai</Badge>;
      case "submitted":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isApproved) {
    return (
      <MentorLayout>
        <div className="p-6">
          <Card className="max-w-md mx-auto mt-12">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl font-bold mb-2">Akun Belum Disetujui</h2>
              <p className="text-muted-foreground">
                Akun Anda masih menunggu persetujuan dari admin.
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
            <h1 className="text-2xl font-bold">Review Tugas Siswa</h1>
            <p className="text-muted-foreground">Nilai dan berikan feedback untuk tugas siswa</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submissions.length}</p>
                <p className="text-sm text-muted-foreground">Total Submission</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === "submitted").length}
                </p>
                <p className="text-sm text-muted-foreground">Belum Dinilai</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === "graded").length}
                </p>
                <p className="text-sm text-muted-foreground">Sudah Dinilai</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa atau tugas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="submitted">Belum Dinilai</SelectItem>
                  <SelectItem value="graded">Sudah Dinilai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengumpulan Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Tugas</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nilai</TableHead>
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
                ) : filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.student_name}
                      </TableCell>
                      <TableCell>{submission.assignment_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.class_title}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submitted_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        {submission.grade !== null ? (
                          <span className="font-medium">{submission.grade}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGradeClick(submission)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada pengumpulan tugas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grade Dialog */}
        <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nilai Tugas</DialogTitle>
              <DialogDescription>
                Berikan nilai dan feedback untuk {selectedSubmission?.student_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedSubmission?.assignment_title}</p>
                <p className="text-xs text-muted-foreground">{selectedSubmission?.class_title}</p>
              </div>
              <div className="space-y-2">
                <Label>Nilai (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeData.grade}
                  onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                  placeholder="Masukkan nilai"
                />
              </div>
              <div className="space-y-2">
                <Label>Feedback (Opsional)</Label>
                <Textarea
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  placeholder="Berikan feedback untuk siswa..."
                  rows={4}
                />
              </div>
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={selectedSubmission?.file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat File Jawaban
                </a>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGradeOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveGrade} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Nilai"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MentorLayout>
  );
};

export default MentorSubmissions;