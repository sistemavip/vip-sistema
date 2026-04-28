import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Package, LogOut, Home, Eye } from 'lucide-react';
import vipLogo from '@/assets/vip-logo.png';
import { motion } from 'framer-motion';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Início', url: '/portal', icon: Home },
    { name: 'Meus Pedidos', url: '/portal/pedidos', icon: Package },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/portal" className="flex items-center gap-3">
              <img src={vipLogo} alt="VIP Manuseios" className="h-10" />
              <div className="hidden sm:block">
                <p className="font-semibold text-sm">Portal do Cliente</p>
                <p className="text-xs text-muted-foreground">Acompanhe seus pedidos</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link key={item.name} to={item.url}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className="gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:block text-right">
                <p className="text-xs text-muted-foreground">Logado como</p>
                <p className="text-sm font-medium truncate max-w-[150px]">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VIP Manuseios - Portal do Cliente</p>
        </div>
      </footer>
    </div>
  );
}
