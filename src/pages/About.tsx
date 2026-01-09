import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Target, Users, Lightbulb, ArrowRight } from "lucide-react";

const team = [
  { name: "Sarah Chen", role: "Pendiri & CEO", emoji: "👩‍💻" },
  { name: "David Park", role: "Kepala Kurikulum", emoji: "👨‍🏫" },
  { name: "Maya Johnson", role: "Lead Developer", emoji: "👩‍🔬" },
  { name: "Alex Kim", role: "Manajer Komunitas", emoji: "🧑‍🤝‍🧑" },
];

const values = [
  {
    icon: Heart,
    title: "Semangat Belajar",
    description: "Kami percaya setiap anak memiliki potensi menjadi kreator, bukan hanya konsumen teknologi.",
  },
  {
    icon: Target,
    title: "Pendidikan Terjangkau",
    description: "Pendidikan coding berkualitas harus tersedia untuk setiap anak, tanpa memandang latar belakang.",
  },
  {
    icon: Users,
    title: "Komunitas Utama",
    description: "Belajar lebih baik jika bersama. Kami membangun komunitas coder muda yang saling mendukung.",
  },
  {
    icon: Lightbulb,
    title: "Berpikir Kreatif",
    description: "Kami mendorong eksperimen, kreativitas, dan belajar dari kesalahan.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Memberdayakan Generasi Penerus{" "}
              <span className="text-gradient">Kreator Teknologi</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              KidCoderClub didirikan dengan misi sederhana: membuat coding menjadi 
              menyenangkan, mudah diakses, dan menarik untuk setiap anak. Kami percaya 
              belajar coding sama pentingnya dengan belajar membaca dan menulis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">Cerita Kami</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Semuanya dimulai pada tahun 2020 ketika pendiri kami, Sarah, melihat 
                  keponakannya kesulitan menemukan sumber belajar coding yang menarik. 
                  Kebanyakan platform terlalu membosankan atau terlalu rumit untuk anak-anak.
                </p>
                <p>
                  Jadi dia mengumpulkan tim pendidik dan developer yang bersemangat 
                  untuk menciptakan sesuatu yang berbeda—platform di mana belajar 
                  coding terasa seperti bermain game.
                </p>
                <p>
                  Hari ini, KidCoderClub telah membantu lebih dari 10.000 coder muda dari 
                  50+ negara menemukan kegembiraan pemrograman. Dan kami baru saja memulai!
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="gradient-primary rounded-3xl p-8 text-primary-foreground"
            >
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-4xl font-bold mb-2">10K+</p>
                  <p className="text-primary-foreground/80">Siswa Bahagia</p>
                </div>
                <div>
                  <p className="text-4xl font-bold mb-2">50+</p>
                  <p className="text-primary-foreground/80">Negara</p>
                </div>
                <div>
                  <p className="text-4xl font-bold mb-2">100+</p>
                  <p className="text-primary-foreground/80">Kursus</p>
                </div>
                <div>
                  <p className="text-4xl font-bold mb-2">4.9★</p>
                  <p className="text-primary-foreground/80">Rating Rata-rata</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Nilai-Nilai Kami</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Nilai-nilai inti ini memandu semua yang kami lakukan di KidCoderClub.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-lg text-center"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Tim Kami</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Pendidik dan developer yang bersemangat, berdedikasi untuk kesuksesan anak Anda.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-card shadow-lg flex items-center justify-center text-5xl mx-auto mb-4">
                  {member.emoji}
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Siap Bergabung dengan Klub?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Mulai perjalanan coding anak Anda hari ini. Kursus pertama gratis!
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Mulai Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
