import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/dashboard');
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-48 items-center justify-center">
            <img src="/HCI_Logo_1.png" alt="Harvest International Ministries" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Harvest Connect</h1>
            <p className="text-sm text-muted-foreground">Church Management System</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your church account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@church.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Demo Accounts (click to fill):</p>
              <div className="space-y-1.5">
                <button
                  onClick={() => fillDemo('admin@churchconnect.demo', 'admin12345')}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <span className="font-medium">Super Admin</span>
                  <span className="text-muted-foreground">admin@churchconnect.demo</span>
                </button>
                <button
                  onClick={() => fillDemo('pastor@churchconnect.demo', 'pastor12345')}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <span className="font-medium">Pastor</span>
                  <span className="text-muted-foreground">pastor@churchconnect.demo</span>
                </button>
                <button
                  onClick={() => fillDemo('finance@churchconnect.demo', 'finance12345')}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <span className="font-medium">Accountant</span>
                  <span className="text-muted-foreground">finance@churchconnect.demo</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Harvest Connect for churches in Ghana & Africa
        </p>
      </div>
    </div>
  );
}
