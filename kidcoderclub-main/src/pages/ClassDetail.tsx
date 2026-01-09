import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Users, 
  Clock, 
  ChevronRight, 
  Loader2,
  GraduationCap,
  Star,
  CheckCircle
} from "lucide-react";

// Import thumbnails
import scratchThumbnail from "@/assets/thumbnails/scratch-pemula.jpg";
import pythonThumbnail from "@/assets/thumbnails/petualangan-python.jpg";
import websiteThumbnail from "@/assets/thumbnails/website-pertama.jpg";
import unityThumbnail from "@/assets/thumbnails/game-unity.jpg";

const thumbnailMap: Record<string, string> = {
  "Scratch untuk Pemula": scratchThumbnail,
  "Petualangan Python": pythonThumbnail,
  "Buat Website Pertamamu": websiteThumbnail,
  "Pengembangan Game dengan Unity": unityThumbnail,
};

interface ClassData {
  id: string;
  title: string;
  description: string | null;
  level: string;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
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
    bio: string | null;
  };
}

const levelLabels: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [mentors, setMentors] = useState<MentorData[]>([]);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      // Fetch class data
      const { data: classResult, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (classError || !classResult) {
        console.error("Error fetching class:", classError);
        setLoading(false);
        return;
      }

      setClassData(classResult);

      // Fetch modules (preview - just titles)
      const { data: modulesData } = await supabase
        .from("modules")
        .select("id, title, order_index")
        .eq("class_id", id)
        .order("order_index", { ascending: true });

      setModules(modulesData || []);

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
        .eq("class_id", id)
        .eq("is_available", true);

      // Fetch mentor profiles separately
      if (mentorsData && mentorsData.length > 0) {
        const mentorIds = mentorsData.map(m => m.mentor_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, expertise, bio")
          .in("user_id", mentorIds);

        const mentorsWithProfiles = mentorsData.map(m => ({
          ...m,
          mentor: profilesData?.find(p => p.user_id === m.mentor_id) || {
            full_name: "Mentor",
            avatar_url: null,
            expertise: null,
            bio: null
          }
        }));

        setMentors(mentorsWithProfiles);
      }

      // Fetch enrollment count
      const { count } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("class_id", id);

      setEnrollmentCount(count || 0);

      // Check if current user is enrolled
      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("class_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsEnrolled(!!enrollment);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  const handleEnroll = () => {
    if (!user) {
      navigate("/login/siswa", { state: { from: `/classes/${id}` } });
      return;
    }
    
    if (profile?.role !== "student") {
      return;
    }

    navigate(`/student/enroll/${id}`);
  };

  const getEmoji = (level: string) => {
    switch (level) {
      case "beginner": return "🎮";
      case "intermediate": return "🐍";
      case "advanced": return "🚀";
      default: return "📚";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Memuat detail kelas...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">Kelas tidak ditemukan</h1>
          <Link to="/classes">
            <Button>Kembali ke Katalog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Thumbnail */}
              <div className="w-full md:w-64 h-40 rounded-2xl bg-white/10 flex items-center justify-center text-6xl overflow-hidden shrink-0">
                {classData.thumbnail_url || thumbnailMap[classData.title] ? (
                  <img 
                    src={classData.thumbnail_url || thumbnailMap[classData.title]} 
                    alt={classData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getEmoji(classData.level)
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <Badge className="mb-3 bg-white/20 text-white hover:bg-white/30">
                  {levelLabels[classData.level] || classData.level}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  {classData.title}
                </h1>
                <p className="text-primary-foreground/80 mb-6">
                  {classData.description || "Deskripsi belum tersedia"}
                </p>
                
                <div className="flex flex-wrap gap-4 text-primary-foreground/80">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {enrollmentCount} siswa terdaftar
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {modules.length} modul
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Modules Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Materi Kelas ({modules.length} Modul)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {modules.length === 0 ? (
                    <p className="text-muted-foreground">Modul belum tersedia</p>
                  ) : (
                    <ul className="space-y-3">
                      {modules.map((module, index) => (
                        <li key={module.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="flex-1">{module.title}</span>
                          <CheckCircle className="w-5 h-5 text-muted-foreground/40" />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Available Mentors */}
              {mentors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Mentor Tersedia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mentors.map((mentorData) => (
                        <div 
                          key={mentorData.id} 
                          className="flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={mentorData.mentor.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {mentorData.mentor.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{mentorData.mentor.full_name}</h4>
                            {mentorData.mentor.expertise && (
                              <p className="text-sm text-primary">{mentorData.mentor.expertise}</p>
                            )}
                            {mentorData.mentor.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {mentorData.mentor.bio}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {mentorData.current_students}/{mentorData.max_students} siswa
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Price & CTA */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {classData.price === 0 ? (
                      <div className="text-3xl font-bold text-success">Gratis</div>
                    ) : (
                      <div className="text-3xl font-bold">
                        Rp {classData.price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-3">
                      <Badge className="w-full justify-center py-2 bg-success/20 text-success hover:bg-success/30">
                        ✓ Sudah Terdaftar
                      </Badge>
                      <Link to={`/student/class/${id}`} className="block">
                        <Button className="w-full" size="lg">
                          Lanjut Belajar
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={profile?.role !== "student" && !!user}
                    >
                      {!user ? "Masuk untuk Daftar" : "Daftar Sekarang"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {user && profile?.role !== "student" && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Hanya siswa yang dapat mendaftar kelas
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Akses materi selamanya
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Bimbingan langsung dari mentor
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Sertifikat kelulusan
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ClassDetail;