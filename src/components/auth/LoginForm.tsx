import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { PenTool, LogIn } from "lucide-react";

export default function LoginForm({ onToggle }: { onToggle?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalone = location.pathname === "/login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const LoginFormContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-slate-300 focus-visible:ring-accent-primary"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-xs text-accent-primary hover:text-accent-primary/80"
          >
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
          className="border-slate-300 focus-visible:ring-accent-primary"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        type="submit"
        className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );

  // If called from the modal, just return the form content
  if (!isStandalone) {
    return LoginFormContent;
  }

  // Otherwise, return the full standalone form with layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenTool className="w-7 h-7 text-accent-yellow" />
            <span className="font-display text-2xl ml-2.5 text-slate-800 tracking-tight">Autopen</span>
          </div>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </div>

        <Card className="shadow-medium border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" /> Sign in
            </CardTitle>
          </CardHeader>
          <CardContent>
            {LoginFormContent}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-slate-200 pt-4">
            <div className="text-sm text-center text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-accent-primary hover:text-accent-primary/80 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-sm text-slate-500">
          By signing in, you agree to our{" "}
          <a href="#" className="text-accent-primary hover:text-accent-primary/80">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-accent-primary hover:text-accent-primary/80">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
