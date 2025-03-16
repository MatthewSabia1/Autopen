import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const SignupForm: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const password = watch("password");

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      console.log('Submitting signup form with email:', data.email);
      const { error, user } = await signUp(data.email, data.password);
      
      if (error) {
        console.log('Signup error:', error);
        setErrorMessage(error.message || 'An error occurred during sign up');
      } else if (user) {
        setSuccessMessage('Account created successfully! You can now sign in.');
        // Automatically switch to login after a brief delay
        setTimeout(() => {
          onToggle();
        }, 3000);
      } else {
        setSuccessMessage('Check your email for the confirmation link.');
      }
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-ink-dark mb-2">Create Account</h2>
        <p className="font-serif text-ink-light">Join Autopen to start creating beautiful e-books</p>
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
              placeholder="Create a password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters long'
                }
              })}
            />
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block font-serif text-sm text-ink-light mb-1">Confirm Password</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
              <Lock size={18} />
            </div>
            <input
              id="confirmPassword"
              type="password"
              className={`w-full pl-10 pr-4 py-3 font-serif bg-cream border ${errors.confirmPassword ? 'border-red-500' : 'border-accent-tertiary/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
              placeholder="Confirm your password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-serif">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-serif">
            {successMessage}
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
              <UserPlus className="w-5 h-5 mr-2" />
              Create Account
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="font-serif text-sm text-ink-light">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggle}
              className="text-accent-primary hover:text-accent-primary/80 focus:outline-none"
            >
              Sign in
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

export default SignupForm;