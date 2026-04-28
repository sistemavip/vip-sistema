import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setAdminStatus(false);
        setLoading(false);
        return;
      }
      
      try {
        const result = await isAdmin();
        setAdminStatus(result);
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        setAdminStatus(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading, isAdmin]);

  return { isAdmin: adminStatus, loading: loading || authLoading };
}
