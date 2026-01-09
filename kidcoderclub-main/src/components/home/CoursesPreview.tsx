import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Import thumbnails
import scratchThumbnail from "@/assets/thumbnails/scratch-pemula.jpg";
import pythonThumbnail from "@/assets/thumbnails/petualangan-python.jpg";
import websiteThumbnail from "@/assets/thumbnails/website-pertama.jpg";
import unityThumbnail from "@/assets/thumbnails/game-unity.jpg";

// Thumbnail mapping based on class title
const thumbnailMap: Record<string, string> = {
  "Scratch untuk Pemula": scratchThumbnail,
  "Petualangan Python": pythonThumbnail,
  "Buat Website Pertamamu": websiteThumbnail,
  "Pengembangan Game dengan Unity": unityThumbnail,
};

// Level labels mapping
const levelLabels: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

interface ClassItem {
  id: string;
  title: string;
  level: string;
  price: number;
  thumbnail_url: string | null;
  enrollmentCount: number;
}

const CoursesPreview = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // Fetch 4 latest active classes
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, title, level, price, thumbnail_url")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(4);

        if (classesError) throw classesError;

        if (classesData) {
          // Fetch enrollment counts for each class
          const classesWithEnrollments = await Promise.all(
            classesData.map(async (cls) => {
              const { count } = await supabase
                .from("enrollments")
                .select("*", { count: "exact", head: true })
                .eq("class_id", cls.id);

              return {
                ...cls,
                enrollmentCount: count || 0,
              };
            })
          );

          setClasses(classesWithEnrollments);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const getLevelStyle = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-success/20 text-success";
      case "intermediate":
        return "bg-accent/20 text-accent-foreground";
      case "advanced":
        return "bg-secondary/20 text-secondary";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kelas <span className="text-gradient">Populer</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Mulai dengan kelas untuk pemula atau tantang dirimu dengan proyek tingkat lanjut.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/classes">
              Lihat Semua Kelas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-card rounded-2xl overflow-hidden shadow-lg">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5">
                  <Skeleton className="h-6 w-20 mb-3" />
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            classes.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/classes/${course.id}`}>
                  <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    {/* Thumbnail */}
                    <div className="aspect-video gradient-primary flex items-center justify-center text-6xl overflow-hidden">
                      <img 
                        src={course.thumbnail_url || thumbnailMap[course.title] || "/placeholder.svg"} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      {/* Level Badge */}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getLevelStyle(course.level)}`}>
                        {levelLabels[course.level] || course.level}
                      </span>

                      <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          4.8
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrollmentCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          4 minggu
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        {course.price === 0 ? (
                          <span className="text-lg font-bold text-success">Gratis</span>
                        ) : (
                          <span className="text-lg font-bold">Rp {Number(course.price).toLocaleString()}</span>
                        )}
                        <Button size="sm" variant="default">
                          Daftar Sekarang
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CoursesPreview;
