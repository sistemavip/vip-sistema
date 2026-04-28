import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import vipLogo from '@/assets/vip-logo.png';

type ViewType = 'auth' | 'forgot-password';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signOut, resetPassword, user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewType>('auth');
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // If already logged in, show an options screen instead of instant redirect
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sessão Ativa</CardTitle>
              <CardDescription>
                Você já está conectado como <strong>{user.email}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => navigate('/app')}>
                Ir para o Dashboard
              </Button>
              <div className="text-center text-sm text-muted-foreground my-4">ou</div>
              <Button variant="outline" className="w-full" onClick={async () => {
                await signOut();
                window.location.reload();
              }}>
                Sair da conta atual
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getLoginErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Email ou senha incorretos. Verifique suas credenciais.';
    }
    if (message.includes('email not confirmed')) {
      return 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.';
    }
    if (message.includes('too many requests')) {
      return 'Muitas tentativas de login. Aguarde alguns minutos.';
    }
    if (message.includes('user not found')) {
      return 'Usuário não encontrado. Verifique o email ou crie uma conta.';
    }
    return 'Ocorreu um erro ao fazer login. Tente novamente.';
  };

  const getSignupErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('user already registered')) {
      return 'Este email já está cadastrado. Tente fazer login.';
    }
    if (message.includes('password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (message.includes('invalid email')) {
      return 'Por favor, insira um email válido.';
    }
    return 'Ocorreu um erro ao criar conta. Tente novamente.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email.trim() || !loginData.password.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha email e senha para continuar.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      toast({
        title: 'Erro ao fazer login',
        description: getLoginErrorMessage(error),
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.'
      });
      // Redirect will happen via useEffect when user state updates
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupData.email.trim()) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, insira seu email.',
        variant: 'destructive'
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'As senhas digitadas são diferentes.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(signupData.email, signupData.password);

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: getSignupErrorMessage(error),
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode acessar o sistema.'
      });
      // Redirect will happen via useEffect when user state updates
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, insira seu email.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    const { error } = await resetPassword(forgotEmail);

    if (error) {
      toast({
        title: 'Erro ao enviar email',
        description: 'Não foi possível enviar o email de recuperação. Tente novamente.',
        variant: 'destructive'
      });
    } else {
      setEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.'
      });
    }

    setLoading(false);
  };

  const handleBackToLogin = () => {
    setView('auth');
    setEmailSent(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Home
        </Link>

        {/* Logo */}
        <div className="text-center">
          <img src={vipLogo} alt="VIP Manuseios" className="h-24 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Portal VIP</h1>
          <p className="text-muted-foreground">
            {view === 'auth' ? 'Acesse ou crie sua conta' : 'Recuperação de senha'}
          </p>
        </div>

        {/* Forgot Password View */}
        {view === 'forgot-password' && (
          <Card>
            <CardHeader>
              <CardTitle>Esqueci minha senha</CardTitle>
              <CardDescription>
                {emailSent 
                  ? 'Email de recuperação enviado com sucesso!'
                  : 'Digite seu email para receber o link de recuperação'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                    <Mail className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Enviamos um email para <strong>{forgotEmail}</strong> com instruções para redefinir sua senha.
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    Não recebeu? Verifique sua pasta de spam ou tente novamente.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : 'Enviar link de recuperação'}
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full" 
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Login/Signup Forms */}
        {view === 'auth' && (
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo</CardTitle>
              <CardDescription>
                Faça login ou crie uma nova conta para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : 'Entrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => setView('forgot-password')}
                    >
                      Esqueci minha senha
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) =>
                          setSignupData({ ...signupData, confirmPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
