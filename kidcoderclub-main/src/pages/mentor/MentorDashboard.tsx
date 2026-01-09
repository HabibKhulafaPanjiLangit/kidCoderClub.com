import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MentorLayout } from "@/components/layouts/MentorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, BarChart3, ClipboardList, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MentorStats {
  totalStudents: number;
  activeClasses: number;
  avgProgress: number;
  totalAssignments: number;
}

const MentorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<MentorStats>({ totalStudents: 0, activeClasses: 0, avgProgress: 0, totalAssignments: 0 });
  const [loading, setLoading] = useState(true);

  const isApproved = profile?.approval_status === 'approved';
  const isPending = !profile?.approval_status || profile?.approval_status === 'pending';
  const isRejected = profile?.approval_status === 'rejected';

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch classes via class_mentors junction table
      const { data: classMentorData } = await supabase
        .from("class_mentors")
        .select("class_id, classes(id, is_active)")
        .eq("mentor_id", user.id);

      const classIds = classMentorData?.map((cm) => cm.class_id) || [];
      const activeClasses = classMentorData?.filter((cm) => (cm.classes as any)?.is_active).length || 0;

      if (classIds.length === 0) {
        setStats({ totalStudents: 0, activeClasses: 0, avgProgress: 0, totalAssignments: 0 });
        setLoading(false);
        return;
      }

      // Fetch enrollments where this mentor is assigned
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, progress")
        .eq("mentor_id", user.id);

      const uniqueStudents = new Set(enrollments?.map((e) => e.user_id) || []);
      const avgProgress = enrollments?.length ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length) : 0;

      const { count: assignmentCount } = await supabase
        .from("assignments")
        .select("id", { count: "exact", head: true })
        .eq("mentor_id", user.id);

      setStats({ 
        totalStudents: uniqueStudents.size, 
        activeClasses, 
        avgProgress,
        totalAssignments: assignmentCount || 0
      });
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const getApprovalBanner = () => {
    if (isPending) {
      return (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Akun Menunggu Persetujuan</h3>
              <p className="text-sm text-yellow-700">
                Akun Anda sedang direview oleh admin. Anda akan dapat mengakses semua fitur setelah disetujui.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isRejected) {
      return (
        <Card className="mb-6 border-red-500/50 bg-red-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Akun Ditolak</h3>
              <p className="text-sm text-red-700">
                Maaf, pendaftaran Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <MentorLayout>
      <div className="p-6">
        {/* Approval Banner */}
        {getApprovalBanner()}

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">Selamat Datang, {profile?.full_name || 'Mentor'}! 👨‍🏫</h2>
            {isApproved && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Terverifikasi
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Kelola kelas dan pantau perkembangan siswa Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">siswa terdaftar di kelas Anda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kelas Aktif</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.activeClasses}</div>
              <p className="text-xs text-muted-foreground">kelas yang Anda kelola</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Progress</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : `${stats.avgProgress}%`}</div>
              <p className="text-xs text-muted-foreground">progress keseluruhan siswa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tugas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">tugas yang Anda buat</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Mulai kelola kelas dan siswa Anda</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/mentor/classes")}
              disabled={!isApproved}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Lihat Kelas Saya
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/mentor/students")}
              disabled={!isApproved}
            >
              <Users className="w-4 h-4 mr-2" />
              Lihat Daftar Siswa
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/mentor/assignments")}
              disabled={!isApproved}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Kelola Tugas
            </Button>
          </CardContent>
        </Card>

        {!isApproved && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            * Beberapa fitur dinonaktifkan hingga akun Anda disetujui oleh admin
          </p>
        )}
      </div>
    </MentorLayout>
  );
};

export default MentorDashboard;
