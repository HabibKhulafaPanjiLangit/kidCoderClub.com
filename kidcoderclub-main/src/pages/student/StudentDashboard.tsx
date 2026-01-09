import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Play, 
  LogOut, 
  Sparkles,
  Star,
  Flame,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

interface Enrollment {
  id: string;
  progress: number;
  enrolled_at: string;
  classes: {
    id: string;
    title: string;
    description: string;
    level: string;
    thumbnail_url: string | null;
  };
}

interface ClassItem {
  id: string;
  title: string;
  description: string;
  level: string;
  price: number;
  thumbnail_url: string | null;
}

const StudentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendedClasses, setRecommendedClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch enrollments
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          classes (
            id,
            title,
            description,
            level,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id);

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError);
      } else {
        setEnrollments(enrollmentData as unknown as Enrollment[]);
      }

      // Fetch recommended classes (classes not enrolled)
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .limit(4);

      if (classError) {
        console.error('Error fetching classes:', classError);
      } else {
        // Filter out already enrolled classes
        const enrolledClassIds = enrollmentData?.map((e: any) => e.classes?.id) || [];
        const recommended = classData.filter(c => !enrolledClassIds.includes(c.id));
        setRecommendedClasses(recommended.slice(0, 3));
      }

      setLoading(false);
    };

    fetchData();

    // Setup realtime subscription for enrollments
    const channel = supabase
      .channel('enrollment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Sampai jumpa! 👋',
      description: 'Kamu berhasil logout. Jangan lupa kembali ya!',
    });
  };

  const stats = [
    { 
      icon: BookOpen, 
      label: 'Kelas Aktif', 
      value: enrollments.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      icon: Clock, 
      label: 'Jam Belajar', 
      value: enrollments.length * 5,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    { 
      icon: Trophy, 
      label: 'Badge', 
      value: Math.floor(enrollments.filter(e => e.progress >= 100).length),
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    { 
      icon: Flame, 
      label: 'Streak', 
      value: '3 hari',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">KidCoderClub</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Halo, {profile?.full_name || 'Coder'}! 👋
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-6 md:p-8 text-white mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-6 w-6" />
                <span className="text-white/80">Selamat datang kembali!</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {profile?.full_name || 'Coder'} 🚀
              </h1>
              <p className="text-white/80">
                Ayo lanjutkan petualangan coding-mu hari ini!
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
              onClick={() => enrollments.length > 0 && navigate(`/student/class/${enrollments[0].classes.id}`)}
            >
              <Play className="h-5 w-5 mr-2" />
              Lanjutkan Belajar
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* My Courses */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Kelas Saya 📚</h2>
            <Link to="/student/classes" className="text-primary hover:underline text-sm flex items-center gap-1">
              Lihat Semua <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {enrollment.classes.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(enrollment.classes.level)}`}>
                          {enrollment.classes.level}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {enrollment.classes.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                      </div>
                      <Button 
                        className="w-full mt-4"
                        onClick={() => navigate(`/student/class/${enrollment.classes.id}`)}
                      >
                        Lanjutkan <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada kelas</h3>
              <p className="text-muted-foreground mb-4">
                Kamu belum terdaftar di kelas apapun. Yuk mulai belajar!
              </p>
              <Button onClick={() => navigate('/student/classes')}>
                Jelajahi Kelas <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>
          )}
        </section>

        {/* Recommended Classes */}
        {recommendedClasses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-accent fill-accent" />
                Rekomendasi Untukmu
              </h2>
              <Link to="/classes" className="text-primary hover:underline text-sm flex items-center gap-1">
                Lihat Semua <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedClasses.map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                    onClick={() => navigate(`/student/class/${classItem.id}`)}
                  >
                    <div className="h-32 bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-accent/40" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {classItem.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(classItem.level)}`}>
                          {classItem.level}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {classItem.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-primary">
                          {classItem.price === 0 ? 'Gratis' : `Rp ${classItem.price.toLocaleString()}`}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
