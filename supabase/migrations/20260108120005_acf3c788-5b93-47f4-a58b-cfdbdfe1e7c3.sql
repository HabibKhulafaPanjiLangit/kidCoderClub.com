-- Insert 4 new classes for students to enroll
INSERT INTO public.classes (title, description, level, price, is_active, thumbnail_url)
VALUES 
  ('Scratch untuk Pemula', 'Belajar dasar pemrograman dengan Scratch secara visual dan menyenangkan. Cocok untuk pemula absolut.', 'beginner', 0, true, null),
  ('Petualangan Python', 'Pelajari bahasa pemrograman Python dari dasar hingga membuat proyek menarik.', 'intermediate', 49000, true, null),
  ('Buat Website Pertamamu', 'Mulai perjalanan web development dengan HTML, CSS, dan JavaScript dasar.', 'beginner', 39000, true, null),
  ('Pengembangan Game dengan Unity', 'Kuasai pengembangan game profesional dengan Unity dan C#.', 'advanced', 79000, true, null);