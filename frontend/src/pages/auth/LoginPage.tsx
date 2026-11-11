import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const registeredSuccess = queryParams.get('registered') === 'true';
  const sessionExpired = queryParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-navy text-white shadow-subtle mb-1">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            DisasterReady
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise Disaster Preparedness & Simulation Training
          </p>
        </div>

        {/* Notices */}
        {registeredSuccess && (
          <div className="p-3 bg-semantic-success-subtle border border-[#C5DDD2] rounded-md text-xs text-semantic-success">
            Registration successful. Please log in with your credentials.
          </div>
        )}

        {sessionExpired && (
          <div className="p-3 bg-semantic-warning-subtle border border-[#E9DCBE] rounded-md text-xs text-semantic-warning">
            Your session has expired. Please sign in again.
          </div>
        )}

        {error && (
          <div className="p-3 bg-semantic-danger-subtle border border-[#ECCECE] rounded-md text-xs text-semantic-danger flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Training Portal
            </Button>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="text-center text-xs text-slate-500">
          New trainee?{' '}
          <Link
            to="/register"
            className="font-medium text-accent-blue hover:text-accent-blue-hover underline underline-offset-2"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

