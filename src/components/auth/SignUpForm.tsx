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
import { UserPlus, PenTool } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SignUpForm({ onToggle }: { onToggle?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const isStandalone = location.pathname === "/signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signUp(email, password, fullName);
      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
        variant: "default",
      });
      navigate("/login");
    } catch (error) {
      setError("Error creating account");
    } finally {
      setIsLoading(false);
    }
  };

  const SignUpFormContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="border-slate-300 focus-visible:ring-accent-primary"
        />
      </div>
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-slate-300 focus-visible:ring-accent-primary"
        />
        <p className="text-xs text-slate-500">
          Password must be at least 8 characters long
        </p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        type="submit"
        className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );

  // If called from the modal, just return the form content
  if (!isStandalone) {
    return SignUpFormContent;
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
          <p className="text-slate-600">Create an account to get started</p>
        </div>

        <Card className="shadow-medium border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" /> Create an account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {SignUpFormContent}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-slate-200 pt-4">
            <div className="text-sm text-center text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-accent-primary hover:text-accent-primary/80 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-sm text-slate-500">
          By creating an account, you agree to our{" "}
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
