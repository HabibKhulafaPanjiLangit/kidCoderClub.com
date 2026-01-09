import { motion } from "framer-motion";
import { Gamepad2, Users, Trophy, Video, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Gamepad2,
    title: "Belajar Sambil Bermain",
    description: "Game dan proyek interaktif membuat coding terasa seperti bermain.",
    color: "bg-primary",
  },
  {
    icon: Users,
    title: "Mentor Ahli",
    description: "Guru-guru ramah membimbing anak Anda di setiap langkah.",
    color: "bg-secondary",
  },
  {
    icon: Trophy,
    title: "Raih Badge",
    description: "Rayakan pencapaian dengan hadiah dan sertifikat seru.",
    color: "bg-accent",
  },
  {
    icon: Video,
    title: "Video Pelajaran",
    description: "Tutorial video HD yang bisa ditonton anak sesuai kecepatan mereka.",
    color: "bg-success",
  },
  {
    icon: Clock,
    title: "Jadwal Fleksibel",
    description: "Belajar kapan saja, di mana saja. Tanpa jadwal kelas tetap.",
    color: "bg-primary",
  },
  {
    icon: Shield,
    title: "Lingkungan Aman",
    description: "Platform ramah anak dengan kontrol dan pengawasan orang tua.",
    color: "bg-secondary",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mengapa Anak-Anak <span className="text-gradient">Menyukai Kami</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Kami telah merancang setiap aspek KidCoderClub untuk membuat belajar 
            coding menjadi petualangan yang menyenangkan untuk anak Anda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
