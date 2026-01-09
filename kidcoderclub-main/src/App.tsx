import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Classes from "./pages/Classes";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMentors from "./pages/admin/AdminMentors";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminSalaries from "./pages/admin/AdminSalaries";
import AdminTransactions from "./pages/admin/AdminTransactions";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClasses from "./pages/student/StudentClasses";
import StudentClassDetail from "./pages/student/StudentClassDetail";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentProfile from "./pages/student/StudentProfile";
import StudentEnroll from "./pages/student/StudentEnroll";
import ClassDetail from "./pages/ClassDetail";
import StudentLogin from "./pages/login/StudentLogin";
import MentorLogin from "./pages/login/MentorLogin";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfile from "./pages/mentor/MentorProfile";
import MentorClassesPage from "./pages/mentor/MentorClassesPage";
import MentorStudentsPage from "./pages/mentor/MentorStudentsPage";
import MentorAssignments from "./pages/mentor/MentorAssignments";
import MentorSubmissions from "./pages/mentor/MentorSubmissions";
import MentorModules from "./pages/mentor/MentorModules";
import RegisterChoice from "./pages/register/RegisterChoice";
import StudentRegister from "./pages/register/StudentRegister";
import MentorRegister from "./pages/register/MentorRegister";

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (profile?.role === 'mentor') return <Navigate to="/mentor/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login/siswa" element={<StudentLogin />} />
            <Route path="/login/mentor" element={<MentorLogin />} />
            <Route path="/register" element={<RegisterChoice />} />
            <Route path="/register/siswa" element={<StudentRegister />} />
            <Route path="/register/mentor" element={<MentorRegister />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ClassDetail />} />
            <Route path="/about" element={<About />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/mentors" element={<ProtectedRoute requiredRole="admin"><AdminMentors /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute requiredRole="admin"><AdminClasses /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute requiredRole="admin"><AdminCertificates /></ProtectedRoute>} />
            <Route path="/admin/salaries" element={<ProtectedRoute requiredRole="admin"><AdminSalaries /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute requiredRole="admin"><AdminTransactions /></ProtectedRoute>} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/classes" element={<ProtectedRoute requiredRole="student"><StudentClasses /></ProtectedRoute>} />
            <Route path="/student/class/:id" element={<ProtectedRoute requiredRole="student"><StudentClassDetail /></ProtectedRoute>} />
            <Route path="/student/assignments" element={<ProtectedRoute requiredRole="student"><StudentAssignments /></ProtectedRoute>} />
            <Route path="/student/certificates" element={<ProtectedRoute requiredRole="student"><StudentCertificates /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/enroll/:classId" element={<ProtectedRoute requiredRole="student"><StudentEnroll /></ProtectedRoute>} />
            
            {/* Mentor routes */}
            <Route path="/mentor/dashboard" element={<ProtectedRoute requiredRole="mentor"><MentorDashboard /></ProtectedRoute>} />
            <Route path="/mentor/classes" element={<ProtectedRoute requiredRole="mentor"><MentorClassesPage /></ProtectedRoute>} />
            <Route path="/mentor/students" element={<ProtectedRoute requiredRole="mentor"><MentorStudentsPage /></ProtectedRoute>} />
            <Route path="/mentor/assignments" element={<ProtectedRoute requiredRole="mentor"><MentorAssignments /></ProtectedRoute>} />
            <Route path="/mentor/submissions" element={<ProtectedRoute requiredRole="mentor"><MentorSubmissions /></ProtectedRoute>} />
            <Route path="/mentor/class/:classId/modules" element={<ProtectedRoute requiredRole="mentor"><MentorModules /></ProtectedRoute>} />
            <Route path="/mentor/profile" element={<ProtectedRoute requiredRole="mentor"><MentorProfile /></ProtectedRoute>} />
            
            {/* Dashboard redirect based on role */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
