import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Users, Clock, Search, Filter, Loader2 } from "lucide-react";

// Import thumbnails
import scratchThumbnail from "@/assets/thumbnails/scratch-pemula.jpg";
import pythonThumbnail from "@/assets/thumbnails/petualangan-python.jpg";
import websiteThumbnail from "@/assets/thumbnails/website-pertama.jpg";
import unityThumbnail from "@/assets/thumbnails/game-unity.jpg";

// Thumbnail mapping by class title
const thumbnailMap: Record<string, string> = {
  "Scratch untuk Pemula": scratchThumbnail,
  "Petualangan Python": pythonThumbnail,
  "Buat Website Pertamamu": websiteThumbnail,
  "Pengembangan Game dengan Unity": unityThumbnail,
};

interface ClassItem {
  id: string;
  title: string;
  description: string | null;
  level: string;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  mentor?: {
    full_name: string;
  };
  enrollmentCount?: number;
}

const levelLabels: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

const levels = ["Semua Level", "Pemula", "Menengah", "Lanjutan"];
const levelMap: Record<string, string> = {
  "Pemula": "beginner",
  "Menengah": "intermediate",
  "Lanjutan": "advanced",
};

const Classes = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Semua Level");

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      
      const { data: classData, error } = await supabase
        .from("classes")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching classes:", error);
        setLoading(false);
        return;
      }

      // Get enrollment counts
      const classesWithStats = await Promise.all(
        (classData || []).map(async (classItem) => {
          const { count } = await supabase
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("class_id", classItem.id);

          return {
            ...classItem,
            enrollmentCount: count || 0,
          };
        })
      );

      setClasses(classesWithStats);
      setLoading(false);
    };

    fetchClasses();
  }, []);

  const filteredCourses = classes.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesLevel = selectedLevel === "Semua Level" || course.level === levelMap[selectedLevel];
    return matchesSearch && matchesLevel;
  });

  const getEmoji = (level: string) => {
    switch (level) {
      case "beginner": return "🎮";
      case "intermediate": return "🐍";
      case "advanced": return "🚀";
      default: return "📚";
    }
  };

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
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Jelajahi Kelas Kami
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Temukan kelas yang sempurna untuk perjalanan coding anak Anda
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-border sticky top-16 bg-background/95 backdrop-blur-lg z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-5 h-5 text-muted-foreground hidden md:block" />
              {levels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className="whitespace-nowrap"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat kelas...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-muted-foreground">Kelas tidak ditemukan.</p>
              <p className="text-muted-foreground mt-2">Coba sesuaikan filter Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link to={`/classes/${course.id}`}>
                    <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                      {/* Thumbnail */}
                      <div className="aspect-video gradient-primary flex items-center justify-center text-6xl overflow-hidden">
                        {course.thumbnail_url || thumbnailMap[course.title] ? (
                          <img 
                            src={course.thumbnail_url || thumbnailMap[course.title]} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getEmoji(course.level)
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Level Badge */}
                        <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                          course.level === "beginner" 
                            ? "bg-success/20 text-success" 
                            : course.level === "intermediate"
                            ? "bg-accent/20 text-accent-foreground"
                            : "bg-secondary/20 text-secondary"
                        }`}>
                          {levelLabels[course.level] || course.level}
                        </span>

                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                          {course.description || "Deskripsi belum tersedia"}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {(course.enrollmentCount || 0).toLocaleString()} siswa
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          {course.price === 0 ? (
                            <span className="text-lg font-bold text-success">Gratis</span>
                          ) : (
                            <span className="text-lg font-bold">Rp {course.price.toLocaleString()}</span>
                          )}
                          <Button size="sm" variant="default">
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Classes;