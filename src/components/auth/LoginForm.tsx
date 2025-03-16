import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LogIn, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type FormValues = {
  email: string;
  password: string;
};

const LoginForm: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log('Attempting to sign in with:', data.email);
      const { error } = await signIn(data.email, data.password);
      if (error) {
        console.log('Authentication error:', error);
        if (error.message === 'Invalid login credentials') {
          setErrorMessage('Invalid email or password. Please try again. For testing, use: test@example.com / password123');
        } else {
          setErrorMessage(error.message || 'An error occurred during sign in');
        }
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-ink-dark mb-2">Welcome Back</h2>
        <p className="font-serif text-ink-light">Sign in to access your Autopen account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block font-serif text-sm text-ink-light mb-1">Email</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              className={`w-full pl-10 pr-4 py-3 font-serif bg-cream border ${errors.email ? 'border-red-500' : 'border-accent-tertiary/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
              placeholder="Your email address"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                }
              })}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block font-serif text-sm text-ink-light mb-1">Password</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
              <Lock size={18} />
            </div>
            <input
              id="password"
              type="password"
              className={`w-full pl-10 pr-4 py-3 font-serif bg-cream border ${errors.password ? 'border-red-500' : 'border-accent-tertiary/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
              placeholder="Your password"
              {...register('password', { required: 'Password is required' })}
            />
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-accent-tertiary/30 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-ink-light font-serif">
              Remember me
            </label>
          </div>
          <a href="#" className="text-sm font-serif text-accent-primary hover:text-accent-primary/80">
            Forgot password?
          </a>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-serif">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 flex justify-center items-center font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="font-serif text-sm text-ink-light">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggle}
              className="text-accent-primary hover:text-accent-primary/80 focus:outline-none"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="text-center pt-4 mt-2 border-t border-accent-tertiary/20">
          <p className="font-serif text-sm text-ink-faded">
            For testing, use: <br />
            <span className="font-semibold">test@example.com / password123</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;