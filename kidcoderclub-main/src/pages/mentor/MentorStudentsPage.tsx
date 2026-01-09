import { MentorLayout } from "@/components/layouts/MentorLayout";
import MentorStudents from "@/components/mentor/MentorStudents";

const MentorStudentsPage = () => {
  return (
    <MentorLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Siswa Saya</h1>
          <p className="text-muted-foreground">
            Daftar siswa yang terdaftar di kelas Anda
          </p>
        </div>
        <MentorStudents />
      </div>
    </MentorLayout>
  );
};

export default MentorStudentsPage;
