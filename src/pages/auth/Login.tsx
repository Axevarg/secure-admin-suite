import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgxMHYtMmgtNHpNNiAzNHYtNEg0djRIMHYyaDEwdi0ySDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground font-semibold text-lg tracking-tight">NexusAdmin</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground leading-tight mb-4">
              Enterprise Security,<br />Built for Scale
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Manage users, roles, and permissions with complete audit trails across your organization.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Role-Based Access", icon: Shield },
              { label: "Audit Logging", icon: ShieldCheck },
              { label: "Secure Sessions", icon: Lock },
              { label: "99.9% Uptime", icon: ShieldCheck },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-primary-foreground/80">
                <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-primary-foreground/50 text-sm">
          © 2024 NexusAdmin. SOC 2 Type II Certified.
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 animate-fade-in">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">NexusAdmin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your admin account</p>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-2 bg-success-muted border border-success/20 rounded-lg px-3 py-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-xs text-success font-medium">Secured with 256-bit TLS encryption</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Keep me signed in for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary border-0 hover:opacity-90 transition-opacity font-medium h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : "Sign in to Dashboard"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                All systems operational
              </div>
              <span>·</span>
              <span>v2.4.1</span>
              <span>·</span>
              <span>SOC 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
