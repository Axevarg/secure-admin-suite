import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-card-lg p-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">NexusAdmin</span>
          </div>

          {!sent ? (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Reset your password</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enter the email address associated with your account and we'll send you a secure link to reset your password.
                </p>
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

                <Button
                  type="submit"
                  className="w-full gradient-primary border-0 hover:opacity-90 font-medium h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 animate-scale-in">
              <div className="w-16 h-16 bg-success-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Check your inbox</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>. The link expires in 15 minutes.
              </p>
              <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-primary font-medium hover:underline">
                  try again
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-muted-foreground">
          Having trouble? Contact{" "}
          <a href="mailto:it@company.com" className="text-primary hover:underline">it@company.com</a>
        </div>
      </div>
    </div>
  );
}
