import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

interface StudentEnrollment {
  id: string;
  student_name: string;
  class_title: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
}

const MentorStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    if (!user) return;

    // Fetch classes via class_mentors junction table
    const { data: classMentorData } = await supabase
      .from("class_mentors")
      .select("class_id, classes(id, title)")
      .eq("mentor_id", user.id);

    if (!classMentorData || classMentorData.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const classMap = new Map(
      classMentorData.map((cm) => [cm.class_id, (cm.classes as any)?.title || "Unknown"])
    );

    // Get enrollments where this mentor is assigned
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, class_id, progress, enrolled_at, completed_at")
      .eq("mentor_id", user.id);

    if (error) {
      console.error("Error fetching enrollments:", error);
      setLoading(false);
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // Get student profiles
    const userIds = [...new Set(enrollments.map((e) => e.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

    const studentData: StudentEnrollment[] = enrollments.map((enrollment) => ({
      id: enrollment.id,
      student_name: profileMap.get(enrollment.user_id) || "Unknown",
      class_title: classMap.get(enrollment.class_id) || "Unknown",
      progress: enrollment.progress,
      enrolled_at: enrollment.enrolled_at,
      completed_at: enrollment.completed_at,
    }));

    setStudents(studentData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Realtime subscription for enrollments
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mentor-students-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `mentor_id=eq.${user.id}`
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStudents]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Belum ada siswa</h3>
          <p className="text-muted-foreground">
            Belum ada siswa yang terdaftar di kelas Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (progress: number, completed_at: string | null) => {
    if (completed_at) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Selesai</Badge>;
    }
    if (progress >= 50) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Dalam Progress</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Baru Mulai</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Siswa</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Daftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.student_name}</TableCell>
                <TableCell>{student.class_title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={student.progress} className="w-20 h-2" />
                    <span className="text-sm text-muted-foreground">{student.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(student.progress, student.completed_at)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(student.enrolled_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MentorStudents;
