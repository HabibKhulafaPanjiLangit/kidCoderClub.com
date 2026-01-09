import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layouts/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

const StudentClasses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;

      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching enrollments:', error);
      } else {
        setEnrollments(data as unknown as Enrollment[]);
      }
      setLoading(false);
    };

    fetchEnrollments();
  }, [user]);

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.classes.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <StudentLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Kelas Saya 📚</h1>
          <p className="text-muted-foreground">Daftar semua kelas yang kamu ikuti</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
        ) : filteredEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnrollments.map((enrollment, index) => (
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {enrollment.classes.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3" />
                      <span>Bergabung {formatDate(enrollment.enrolled_at)}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                    <Button 
                      className="w-full"
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
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Kelas tidak ditemukan' : 'Belum ada kelas'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Coba kata kunci lain' 
                : 'Kamu belum terdaftar di kelas apapun. Yuk mulai belajar!'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/classes')}>
                Jelajahi Kelas <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentClasses;
