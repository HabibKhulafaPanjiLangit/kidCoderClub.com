import { MentorLayout } from "@/components/layouts/MentorLayout";
import MentorClasses from "@/components/mentor/MentorClasses";

const MentorClassesPage = () => {
  return (
    <MentorLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Kelas Saya</h1>
          <p className="text-muted-foreground">
            Daftar kelas yang Anda kelola
          </p>
        </div>
        <MentorClasses />
      </div>
    </MentorLayout>
  );
};

export default MentorClassesPage;
