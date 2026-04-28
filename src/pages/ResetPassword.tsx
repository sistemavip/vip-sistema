import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Mail, Info } from 'lucide-react';
import vipLogo from '@/assets/vip-logo.png';

type PageState = 'loading' | 'ready' | 'expired' | 'success';

export function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Check URL for tokens (recovery link format)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    // Check for error parameters (expired/invalid link)
    const queryParams = new URLSearchParams(window.location.search);
    const error = hashParams.get('error') || queryParams.get('error');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
    
    if (error || errorDescription?.includes('expired') || errorDescription?.includes('invalid')) {
      setPageState('expired');
      cleanUrl();
      return;
    }

    // If we have tokens in URL, set the session manually
    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
          setPageState('expired');
        } else {
          setPageState('ready');
        }
        cleanUrl();
      });
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
        cleanUrl();
      } else if (event === 'SIGNED_IN' && session) {
        // Check if this is from a recovery flow
        setPageState('ready');
        cleanUrl();
      }
    });

    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setPageState('ready');
      } else {
        // Wait longer for the auth event to fire (increased from 2s to 5s)
        timeoutId = setTimeout(() => {
          setPageState((current) => current === 'loading' ? 'expired' : current);
        }, 5000);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Clean URL to remove tokens (security best practice)
  const cleanUrl = () => {
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'As senhas digitadas são diferentes.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: error.message || 'Não foi possível redefinir sua senha. Tente novamente.',
        variant: 'destructive'
      });
    } else {
      setPageState('success');
      // Sign out after password change to force re-login
      await supabase.auth.signOut();
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi alterada com sucesso.'
      });
    }

    setLoading(false);
  };

  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Digite seu email para receber um novo link.',
        variant: 'destructive'
      });
      return;
    }

    setResendLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o email. Verifique o endereço e tente novamente.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para o novo link de recuperação.'
      });
    }

    setResendLoading(false);
  };

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verificando link de recuperação...</p>
                <p className="text-xs text-muted-foreground text-center">
                  Aguarde enquanto validamos seu link
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'expired':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Link expirado ou inválido</CardTitle>
              </div>
              <CardDescription>
                O link de recuperação expirou ou já foi utilizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong>Importante:</strong> Os links de recuperação são de uso único e expiram após alguns minutos. 
                    Se você já clicou no link antes, ele não funcionará novamente.
                  </p>
                </div>
              </div>
              <form onSubmit={handleResendLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Seu email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resendLoading}>
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Solicitar novo link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Senha redefinida!</CardTitle>
              <CardDescription>
                Sua senha foi alterada com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Você já pode fazer login com sua nova senha.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/login')}
                >
                  Ir para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'ready':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Nova senha</CardTitle>
              <CardDescription>
                Digite sua nova senha abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 6 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : 'Redefinir senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Login
        </Link>

        {/* Logo */}
        <div className="text-center">
          <img src={vipLogo} alt="VIP Manuseios" className="h-24 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Portal VIP</h1>
          <p className="text-muted-foreground">Redefinir senha</p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
