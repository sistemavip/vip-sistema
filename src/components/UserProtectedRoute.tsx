import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

export function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      }
      setChecking(false);
    };

    if (!authLoading) {
      checkRole();
    }
  }, [user, authLoading, isAdmin]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se for admin, redireciona para o painel admin
  if (isUserAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
