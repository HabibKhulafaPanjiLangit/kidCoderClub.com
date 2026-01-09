import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layouts/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ClipboardList, 
  Clock, 
  Download, 
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  file_url: string | null;
  class_id: string;
  class_title: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  file_url: string;
  status: string;
  submitted_at: string;
  feedback: string | null;
  grade: number | null;
}

interface EnrolledClass {
  id: string;
  title: string;
}

const StudentAssignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    // Fetch enrolled classes
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        classes (
          id,
          title
        )
      `)
      .eq('user_id', user.id);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      setLoading(false);
      return;
    }

    const classes = enrollmentData
      .map((e: any) => e.classes)
      .filter((c: any) => c !== null) as EnrolledClass[];
    
    setEnrolledClasses(classes);

    if (classes.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch assignments for enrolled classes
    const classIds = classes.map(c => c.id);
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
    } else {
      const assignmentsWithClass = assignmentData.map(assignment => ({
        ...assignment,
        class_title: classes.find(c => c.id === assignment.class_id)?.title || 'Unknown'
      }));
      setAssignments(assignmentsWithClass);
    }

    // Fetch student submissions
    const { data: submissionData } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('user_id', user.id);

    setSubmissions(submissionData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredAssignments = filterClass === 'all' 
    ? assignments 
    : assignments.filter(a => a.class_id === filterClass);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSubmission = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const getDueStatus = (dueDate: string | null, submission?: Submission) => {
    if (submission) {
      if (submission.status === 'graded') {
        return { 
          label: `Nilai: ${submission.grade}`, 
          variant: 'default' as const, 
          icon: CheckCircle2 
        };
      }
      return { 
        label: 'Sudah Dikumpulkan', 
        variant: 'secondary' as const, 
        icon: CheckCircle2 
      };
    }

    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Terlambat', variant: 'destructive' as const, icon: AlertCircle };
    } else if (diffDays <= 3) {
      return { label: `${diffDays} hari lagi`, variant: 'secondary' as const, icon: Clock };
    } else {
      return { label: formatDate(dueDate), variant: 'outline' as const, icon: Clock };
    }
  };

  const handleSubmitClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setUploadFile(null);
    setIsSubmitOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !uploadFile || !user) return;

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${selectedAssignment.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName);

      // Create submission record
      const { error: insertError } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: selectedAssignment.id,
          user_id: user.id,
          file_url: urlData.publicUrl,
          status: 'submitted'
        }, {
          onConflict: 'assignment_id,user_id'
        });

      if (insertError) throw insertError;

      toast({
        title: "Berhasil",
        description: "Tugas berhasil dikumpulkan",
      });

      setIsSubmitOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Gagal",
        description: error.message || "Gagal mengumpulkan tugas",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Tugas Saya 📝</h1>
          <p className="text-muted-foreground">Daftar semua tugas dari kelas yang kamu ikuti</p>
        </div>

        {/* Filter */}
        {enrolledClasses.length > 0 && (
          <div className="mb-6">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter berdasarkan kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {enrolledClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="space-y-4">
            {filteredAssignments.map((assignment, index) => {
              const submission = getSubmission(assignment.id);
              const dueStatus = getDueStatus(assignment.due_date, submission);
              
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{assignment.title}</h3>
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {assignment.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <BookOpen className="h-3 w-3" />
                              {assignment.class_title}
                            </Badge>
                            {dueStatus && (
                              <Badge variant={dueStatus.variant} className="gap-1">
                                <dueStatus.icon className="h-3 w-3" />
                                {dueStatus.label}
                              </Badge>
                            )}
                          </div>
                          {submission?.feedback && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">Feedback Mentor:</p>
                              <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {assignment.file_url && (
                            <Button size="sm" variant="outline" className="gap-2" asChild>
                              <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          )}
                          {submission ? (
                            <Button size="sm" variant="secondary" className="gap-2" asChild>
                              <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4" />
                                Lihat Jawaban
                              </a>
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="gap-2"
                              onClick={() => handleSubmitClick(assignment)}
                            >
                              <Upload className="h-4 w-4" />
                              Kumpulkan
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {enrolledClasses.length === 0 ? 'Belum ada kelas' : 'Belum ada tugas'}
            </h3>
            <p className="text-muted-foreground">
              {enrolledClasses.length === 0 
                ? 'Kamu belum terdaftar di kelas apapun'
                : filterClass !== 'all'
                  ? 'Tidak ada tugas untuk kelas ini'
                  : 'Belum ada tugas dari mentor'}
            </p>
          </Card>
        )}

        {/* Submit Assignment Dialog */}
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kumpulkan Tugas</DialogTitle>
              <DialogDescription>
                Upload file jawaban untuk tugas "{selectedAssignment?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">File Jawaban</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground">
                  Format: PDF, DOC, DOCX, ZIP, RAR, JPG, PNG
                </p>
              </div>
              {uploadFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{uploadFile.name}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleSubmitAssignment} 
                disabled={!uploadFile || uploading}
              >
                {uploading ? "Mengupload..." : "Kumpulkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
};

export default StudentAssignments;