import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, signIn, signUp, resetPassword } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        await signUp(email, password);
      } else if (mode === 'forgot') {
        await resetPassword(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">MyTolk</CardTitle>
          <CardDescription>
            {mode === 'signin' && 'Welcome back! Sign in to your account.'}
            {mode === 'signup' && 'Create a new account to get started.'}
            {mode === 'forgot' && 'Enter your email to reset your password.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Sign Up' :
                'Send Reset Link'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          
          <div className="flex flex-col space-y-2 w-full">
            {mode === 'signin' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => switchMode('signup')}
                  className="w-full"
                >
                  Need an account? Sign Up
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => switchMode('forgot')}
                  className="w-full"
                >
                  Forgot Password?
                </Button>
              </>
            )}

            {mode === 'signup' && (
              <Button
                variant="outline"
                onClick={() => switchMode('signin')}
                className="w-full"
              >
                Already have an account? Sign In
              </Button>
            )}

            {mode === 'forgot' && (
              <Button
                variant="outline"
                onClick={() => switchMode('signin')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}