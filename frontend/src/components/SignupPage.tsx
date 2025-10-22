import { useState } from 'react';
import { Mail, Phone, Lock, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import { Button } from './ui/button';
import { signup } from '../lib/api';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';

interface SignupPageProps {
  onSignup: () => void;
  onNavigateToLogin: () => void;
}

export function SignupPage({ onSignup, onNavigateToLogin }: SignupPageProps) {
  const [activeTab, setActiveTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Email/Password form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Phone OTP form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFullName, setPhoneFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneAgreeToTerms, setPhoneAgreeToTerms] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agreeToTerms) {
      setError("You must agree to the terms");
      return;
    }
    
    try {
      setIsLoading(true);
      await signup({
        name: fullName,
        email,
        password,
        role: "driver", // or "rider", depending on your UI logic
      });
      onSignup();
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneAgreeToTerms) {
      setError("You must agree to the terms");
      return;
    }
    
    setIsLoading(true);
    // Simulate sending OTP (in real app hook into SMS provider)
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // For now, just simulate OTP success and call signup
    try {
      await signup({
        name: phoneFullName,
        email: `${phoneNumber}@phoneuser.fake`, // backend requires unique email
        password: otp,
        role: "driver",
      });
      onSignup();
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="w-12 h-12 bg-primary-foreground rounded-2xl flex items-center justify-center">
              <div className="text-primary text-xl">🚗</div>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Join Hop in</h1>
          <p className="text-muted-foreground">Create your account to start your journey</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-accent/50">
                <TabsTrigger value="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone</span>
                </TabsTrigger>
              </TabsList>

              {/* Email Signup */}
              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-input-background border-0 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-input-background border-0 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-input-background border-0 rounded-xl"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2 p-1 h-auto"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 bg-input-background border-0 rounded-xl"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-2 p-1 h-auto"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={setAgreeToTerms}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      I agree to the{' '}
                      <Button variant="link" className="text-primary p-0 h-auto text-sm">
                        Terms of Service
                      </Button>{' '}
                      and{' '}
                      <Button variant="link" className="text-primary p-0 h-auto text-sm">
                        Privacy Policy
                      </Button>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                    disabled={isLoading || !agreeToTerms || password !== confirmPassword}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Signup stays same */}
              <TabsContent value="phone" className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    {/* Phone Signup UI unchanged */}
                    <div className="space-y-2">
                      <Label htmlFor="phoneFullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phoneFullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={phoneFullName}
                          onChange={(e) => setPhoneFullName(e.target.value)}
                          className="pl-10 bg-input-background border-0 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10 bg-input-background border-0 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="phoneTerms"
                        checked={phoneAgreeToTerms}
                        onCheckedChange={setPhoneAgreeToTerms}
                        className="mt-1"
                      />
                      <label htmlFor="phoneTerms" className="text-sm text-muted-foreground leading-relaxed">
                        I agree to the{' '}
                        <Button variant="link" className="text-primary p-0 h-auto text-sm">
                          Terms of Service
                        </Button>{' '}
                        and{' '}
                        <Button variant="link" className="text-primary p-0 h-auto text-sm">
                          Privacy Policy
                        </Button>
                      </label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                      disabled={isLoading || !phoneAgreeToTerms}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Send OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {/* OTP Verification UI unchanged */}
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Phone className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-foreground">Verify Your Phone</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to<br />
                        <span className="font-medium text-foreground">{phoneNumber}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-lg tracking-widest bg-input-background border-0 rounded-xl"
                        maxLength={6}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button 
                  variant="link" 
                  className="text-primary p-0 h-auto font-medium"
                  onClick={onNavigateToLogin}
                >
                  Sign in here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
