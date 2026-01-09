import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Users, 
  CheckCircle, 
  CreditCard,
  ArrowLeft,
  GraduationCap
} from "lucide-react";

interface ClassData {
  id: string;
  title: string;
  description: string | null;
  level: string;
  price: number;
}

interface MentorData {
  id: string;
  mentor_id: string;
  is_available: boolean;
  max_students: number;
  current_students: number;
  mentor: {
    full_name: string;
    avatar_url: string | null;
    expertise: string | null;
  };
}

const paymentMethods = [
  { id: "transfer", label: "Transfer Bank", icon: "🏦" },
  { id: "ewallet", label: "E-Wallet", icon: "📱" },
  { id: "qris", label: "QRIS", icon: "📷" },
];

const StudentEnroll = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [mentors, setMentors] = useState<MentorData[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("transfer");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!classId || !user) return;
      setLoading(true);

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("class_id", classId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingEnrollment) {
        setIsAlreadyEnrolled(true);
        setLoading(false);
        return;
      }

      // Fetch class data
      const { data: classResult, error: classError } = await supabase
        .from("classes")
        .select("id, title, description, level, price")
        .eq("id", classId)
        .eq("is_active", true)
        .maybeSingle();

      if (classError || !classResult) {
        console.error("Error fetching class:", classError);
        setLoading(false);
        return;
      }

      setClassData(classResult);

      // Fetch available mentors for this class
      const { data: mentorsData } = await supabase
        .from("class_mentors")
        .select(`
          id,
          mentor_id,
          is_available,
          max_students,
          current_students
        `)
        .eq("class_id", classId)
        .eq("is_available", true);

      // Fetch mentor profiles separately
      if (mentorsData && mentorsData.length > 0) {
        const mentorIds = mentorsData.map(m => m.mentor_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, expertise")
          .in("user_id", mentorIds);

        const mentorsWithProfiles = mentorsData
          .filter(m => m.current_students < m.max_students)
          .map(m => ({
            ...m,
            mentor: profilesData?.find(p => p.user_id === m.mentor_id) || {
              full_name: "Mentor",
              avatar_url: null,
              expertise: null
            }
          }));

        setMentors(mentorsWithProfiles);
        
        // Auto-select first available mentor
        if (mentorsWithProfiles.length > 0) {
          setSelectedMentor(mentorsWithProfiles[0].mentor_id);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [classId, user]);

  const handleSubmit = async () => {
    if (!classData || !user) return;

    setSubmitting(true);

    try {
      // Create transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          class_id: classData.id,
          amount: classData.price,
          payment_method: paymentMethod,
          status: classData.price === 0 ? "completed" : "pending",
        });

      if (transactionError) throw transactionError;

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert({
          user_id: user.id,
          class_id: classData.id,
          mentor_id: selectedMentor || null,
          progress: 0,
        });

      if (enrollmentError) throw enrollmentError;

      // Update mentor's current_students count if mentor selected
      if (selectedMentor) {
        const mentor = mentors.find(m => m.mentor_id === selectedMentor);
        if (mentor) {
          await supabase
            .from("class_mentors")
            .update({ current_students: mentor.current_students + 1 })
            .eq("id", mentor.id);
        }
      }

      toast({
        title: "Berhasil!",
        description: classData.price === 0 
          ? "Anda berhasil mendaftar ke kelas" 
          : "Pendaftaran berhasil, silakan lakukan pembayaran",
      });

      navigate(`/student/class/${classData.id}`);
    } catch (error) {
      console.error("Error enrolling:", error);
      toast({
        title: "Error",
        description: "Gagal melakukan pendaftaran",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      </StudentLayout>
    );
  }

  if (isAlreadyEnrolled) {
    return (
      <StudentLayout>
        <div className="p-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Anda Sudah Terdaftar</h2>
              <p className="text-muted-foreground mb-6">
                Anda sudah terdaftar di kelas ini
              </p>
              <Link to={`/student/class/${classId}`}>
                <Button>Lanjut Belajar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  if (!classData) {
    return (
      <StudentLayout>
        <div className="p-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold mb-2">Kelas Tidak Ditemukan</h2>
              <p className="text-muted-foreground mb-6">
                Kelas yang Anda cari tidak tersedia
              </p>
              <Link to="/classes">
                <Button>Kembali ke Katalog</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link to={`/classes/${classId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Detail Kelas
          </Link>

          <h1 className="text-2xl font-bold mb-2">Daftar Kelas</h1>
          <p className="text-muted-foreground mb-8">Lengkapi pendaftaran untuk kelas {classData.title}</p>

          <div className="grid gap-6">
            {/* Class Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Kelas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{classData.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classData.description || "Deskripsi belum tersedia"}
                    </p>
                  </div>
                  <div className="text-right">
                    {classData.price === 0 ? (
                      <span className="text-2xl font-bold text-success">Gratis</span>
                    ) : (
                      <span className="text-2xl font-bold">Rp {classData.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Select Mentor */}
            {mentors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Pilih Mentor
                  </CardTitle>
                  <CardDescription>Pilih mentor yang akan membimbing Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedMentor} onValueChange={setSelectedMentor}>
                    <div className="space-y-3">
                      {mentors.map((mentorData) => (
                        <div key={mentorData.id}>
                          <Label
                            htmlFor={mentorData.mentor_id}
                            className="flex items-center gap-4 p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <RadioGroupItem value={mentorData.mentor_id} id={mentorData.mentor_id} />
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={mentorData.mentor.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {mentorData.mentor.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{mentorData.mentor.full_name}</p>
                              {mentorData.mentor.expertise && (
                                <p className="text-sm text-muted-foreground">{mentorData.mentor.expertise}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {mentorData.current_students}/{mentorData.max_students}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {mentors.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada mentor yang tersedia untuk kelas ini.</p>
                  <p className="text-sm">Anda tetap dapat mendaftar dan mentor akan ditugaskan kemudian.</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            {classData.price > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {paymentMethods.map((method) => (
                        <div key={method.id}>
                          <Label
                            htmlFor={method.id}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                            <span className="text-2xl">{method.icon}</span>
                            <span className="font-medium">{method.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg">Total Pembayaran</span>
                  {classData.price === 0 ? (
                    <span className="text-2xl font-bold text-success">Gratis</span>
                  ) : (
                    <span className="text-2xl font-bold">Rp {classData.price.toLocaleString()}</span>
                  )}
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : classData.price === 0 ? (
                    "Daftar Sekarang"
                  ) : (
                    "Bayar & Daftar"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentEnroll;