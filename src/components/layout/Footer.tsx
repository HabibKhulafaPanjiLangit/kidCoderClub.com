import { Link } from "react-router-dom";
import { Code2, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">KidCoderClub</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm">
              Membuat coding menjadi menyenangkan dan mudah diakses untuk anak-anak di seluruh dunia. 
              Mulai perjalanan anak Anda ke dunia teknologi hari ini.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/classes" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Jelajahi Kelas
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Mulai Sekarang
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Bantuan</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Pusat Bantuan
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Panduan Orang Tua
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Syarat Layanan
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4" />
                kidcooder@gmail.com
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4" />
                +62 812-2364-8245
              </li>
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5" />
                Kota Semarang, Jawa Tengah, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} KidCoderClub. Hak cipta dilindungi. Dibuat dengan ❤️ untuk coder muda.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
