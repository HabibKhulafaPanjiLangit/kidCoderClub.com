import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  User,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ClassDetail {
  id: string;
  title: string;
  description: string;
  level: string;
  thumbnail_url: string | null;
  mentor_id: string | null;
}

interface Module {
  id: string;
  title: string;
  content: string | null;
  order_index: number;
  video_url: string | null;
}

interface Enrollment {
  id: string;
  progress: number;
  enrolled_at: string;
}

interface MentorProfile {
  full_name: string;
  avatar_url: string | null;
  expertise: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  file_url: string | null;
}

interface ModuleProgress {
  module_id: string;
}

const StudentClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchClassData = async () => {
    if (!id || !user) return;

    // Fetch class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (classError) {
      console.error('Error fetching class:', classError);
      setLoading(false);
      return;
    }

    setClassDetail(classData);

    // Fetch modules
    const { data: moduleData } = await supabase
      .from('modules')
      .select('*')
      .eq('class_id', id)
      .order('order_index', { ascending: true });

    if (moduleData) setModules(moduleData);

    // Fetch enrollment
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', id)
      .eq('user_id', user.id)
      .single();

    if (enrollmentData) setEnrollment(enrollmentData);

    // Fetch module progress
    const { data: progressData } = await supabase
      .from('module_progress')
      .select('module_id')
      .eq('user_id', user.id)
      .eq('class_id', id);

    if (progressData) {
      setCompletedModules(new Set(progressData.map(p => p.module_id)));
    }

    // Fetch mentor profile if mentor_id exists
    if (classData.mentor_id) {
      const { data: mentorData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, expertise')
        .eq('user_id', classData.mentor_id)
        .single();

      if (mentorData) setMentor(mentorData);
    }

    // Fetch assignments for this class
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', id)
      .order('due_date', { ascending: true });

    if (assignmentData) setAssignments(assignmentData);

    setLoading(false);
  };

  useEffect(() => {
    fetchClassData();
  }, [id, user]);

  const toggleModuleComplete = async (moduleId: string) => {
    if (!user || !id) return;

    const isCompleted = completedModules.has(moduleId);

    if (isCompleted) {
      // Remove progress
      const { error } = await supabase
        .from('module_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('module_id', moduleId);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengupdate progress",
          variant: "destructive",
        });
        return;
      }

      setCompletedModules(prev => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    } else {
      // Add progress
      const { error } = await supabase
        .from('module_progress')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          class_id: id,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengupdate progress",
          variant: "destructive",
        });
        return;
      }

      setCompletedModules(prev => new Set([...prev, moduleId]));
    }

    // Update enrollment progress
    const newProgress = Math.round(
      ((completedModules.size + (isCompleted ? -1 : 1)) / modules.length) * 100
    );

    await supabase
      .from('enrollments')
      .update({ progress: newProgress })
      .eq('user_id', user.id)
      .eq('class_id', id);

    // Update local enrollment state
    if (enrollment) {
      setEnrollment({ ...enrollment, progress: newProgress });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-success/10 text-success';
      case 'intermediate':
        return 'bg-accent/10 text-accent-foreground';
      case 'advanced':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const progressPercentage = modules.length > 0 
    ? Math.round((completedModules.size / modules.length) * 100) 
    : 0;

  if (loading) {
    return (
      <StudentLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!classDetail) {
    return (
      <StudentLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Kelas tidak ditemukan</h2>
          <Button onClick={() => navigate('/student/classes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Kelas
          </Button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/student/classes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-2">{classDetail.title}</h1>
              <p className="text-muted-foreground mb-3">{classDetail.description}</p>
              <Badge className={getLevelColor(classDetail.level)}>
                {classDetail.level}
              </Badge>
            </div>
            {enrollment && (
              <Card className="min-w-[200px]">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-2">Progress Kamu</div>
                  <div className="text-2xl font-bold text-primary mb-2">{progressPercentage}%</div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {completedModules.size} dari {modules.length} modul selesai
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Materi Pembelajaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                {modules.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {modules.map((module, index) => {
                      const isCompleted = completedModules.has(module.id);
                      return (
                        <AccordionItem key={module.id} value={module.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 flex-1">
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                  isCompleted 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                                {module.title}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-11">
                            <div className="space-y-4">
                              {module.content && (
                                <p className="text-muted-foreground">{module.content}</p>
                              )}
                              <div className="flex items-center gap-4">
                                {module.video_url && (
                                  <Button size="sm" className="gap-2" asChild>
                                    <a href={module.video_url} target="_blank" rel="noopener noreferrer">
                                      <Play className="h-4 w-4" />
                                      Tonton Video
                                    </a>
                                  </Button>
                                )}
                                <div 
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() => toggleModuleComplete(module.id)}
                                >
                                  <Checkbox 
                                    checked={isCompleted}
                                    onCheckedChange={() => toggleModuleComplete(module.id)}
                                  />
                                  <span className="text-sm">
                                    {isCompleted ? 'Selesai' : 'Tandai selesai'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Belum ada materi untuk kelas ini
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            {assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tugas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div 
                        key={assignment.id}
                        className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          )}
                          {assignment.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              Deadline: {formatDate(assignment.due_date)}
                            </div>
                          )}
                        </div>
                        {assignment.file_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mentor Info */}
            {mentor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mentor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{mentor.full_name}</p>
                      <p className="text-sm text-muted-foreground">{mentor.expertise || 'Mentor'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Kelas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Materi</span>
                  <span className="font-medium">{modules.length} modul</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Selesai</span>
                  <span className="font-medium text-green-600">{completedModules.size} modul</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tugas</span>
                  <span className="font-medium">{assignments.length} tugas</span>
                </div>
                {enrollment && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bergabung</span>
                    <span className="font-medium">{formatDate(enrollment.enrolled_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Continue Learning Button */}
            {modules.length > 0 && completedModules.size < modules.length && (
              <Button className="w-full" size="lg">
                <Play className="h-5 w-5 mr-2" />
                Lanjutkan Belajar
              </Button>
            )}

            {modules.length > 0 && completedModules.size === modules.length && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-700">Semua Modul Selesai!</p>
                  <p className="text-sm text-green-600">Selamat, kamu sudah menyelesaikan semua materi</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentClassDetail;