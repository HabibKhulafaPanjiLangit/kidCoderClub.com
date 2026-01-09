import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'mentor' | 'student';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Jika sudah ada user dan profile, langsung tampilkan konten tanpa loading
  if (user && profile && !loading) {
    if (requiredRole && profile.role !== requiredRole) {
      let dashboardPath = '/student/dashboard';
      if (profile.role === 'admin') dashboardPath = '/admin/dashboard';
      else if (profile.role === 'mentor') dashboardPath = '/mentor/dashboard';
      return <Navigate to={dashboardPath} replace />;
    }
    return <>{children}</>;
  }

  // Hanya tampilkan loading jika benar-benar perlu (initial load)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tidak ada user, redirect ke login
  if (!user) {
    let loginPath = '/login/siswa';
    if (requiredRole === 'admin') loginPath = '/admin/login';
    else if (requiredRole === 'mentor') loginPath = '/login/mentor';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // User ada tapi profile belum load
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role tidak sesuai
  if (requiredRole && profile.role !== requiredRole) {
    let dashboardPath = '/student/dashboard';
    if (profile.role === 'admin') dashboardPath = '/admin/dashboard';
    else if (profile.role === 'mentor') dashboardPath = '/mentor/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
