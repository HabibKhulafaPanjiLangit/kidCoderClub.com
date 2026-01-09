import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layouts/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Download, 
  ExternalLink,
  Calendar,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Certificate {
  id: string;
  certificate_url: string;
  issued_at: string | null;
  class_id: string;
  class_title: string;
}

const StudentCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;

      // Fetch certificates
      const { data: certData, error: certError } = await supabase
        .from('student_certificates')
        .select(`
          id,
          certificate_url,
          issued_at,
          class_id,
          classes (
            title
          )
        `)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (certError) {
        console.error('Error fetching certificates:', certError);
      } else {
        const formattedCerts = certData.map((cert: any) => ({
          id: cert.id,
          certificate_url: cert.certificate_url,
          issued_at: cert.issued_at,
          class_id: cert.class_id,
          class_title: cert.classes?.title || 'Unknown Class'
        }));
        setCertificates(formattedCerts);
      }

      setLoading(false);
    };

    fetchCertificates();
  }, [user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tanggal tidak tersedia';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <StudentLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Sertifikat Saya 🏆</h1>
          <p className="text-muted-foreground">Koleksi sertifikat kelulusan dari kelas yang telah kamu selesaikan</p>
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
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="h-40 bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/30 flex items-center justify-center relative">
                    <Award className="h-20 w-20 text-amber-500" />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 text-white">
                        Sertifikat
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {cert.class_title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(cert.issued_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 gap-2" 
                        size="sm"
                        asChild
                      >
                        <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Lihat
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        asChild
                      >
                        <a href={cert.certificate_url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada sertifikat</h3>
            <p className="text-muted-foreground mb-4">
              Selesaikan kelas untuk mendapatkan sertifikat kelulusan
            </p>
            <Button onClick={() => window.location.href = '/student/classes'}>
              <BookOpen className="h-4 w-4 mr-2" />
              Lihat Kelas Saya
            </Button>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentCertificates;
