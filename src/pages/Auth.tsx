import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

/**
 * Auth component handles all user authentication processes, including sign-in,
 * sign-up, and password reset. It provides a tabbed interface for users to
 * switch between sign-in and sign-up forms, and a separate view for password reset.
 */
const Auth = () => {
  // State for form inputs.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // State for loading indicators on buttons.
  const [loading, setLoading] = useState(false);
  
  // State to toggle the visibility of the forgot password form.
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // State for the password reset email input.
  const [resetEmail, setResetEmail] = useState('');
  
  // Authentication context hooks.
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  
  // State to track the last user action to conditionally redirect upon authentication.
  const [lastAction, setLastAction] = useState<'signin' | 'signup' | null>(null);

  /**
   * Effect hook to redirect the user to the dashboard after a successful sign-in.
   * It only navigates if the last action was 'signin' to prevent redirection
   * after a sign-up, which requires email verification first.
   */
  useEffect(() => {
    if (user && lastAction === 'signin') {
      navigate('/dashboard');
    }
  }, [user, navigate, lastAction]);

  /**
   * Handles the user sign-in form submission.
   * It provides specific feedback to the user based on the type of error returned from Supabase.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLastAction('signin');
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Provide more user-friendly error messages based on the Supabase error.
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('User not found')) {
          toast.error('No account found with this email. Please sign up first.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Successfully signed in!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the user sign-up form submission.
   * It includes a pre-flight check to see if the user already exists to provide
   * a better user experience and more accurate error messages.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLastAction('signup');

    try {
      // Pre-flight check: Attempt to sign in to see if an account already exists.
      // This provides more specific feedback than the generic signUp error.
      const { error: signInError } = await signIn(email, password);
      
      // If sign in succeeds, user is already registered and confirmed
      if (!signInError) {
        toast.error('An account with this email already exists. Please sign in instead.');
      } else if (signInError.message.includes('Email not confirmed')) {
        toast.error('This email is already registered but not confirmed. Please check your email for the confirmation link or resend it.');
      } else {
        // For any other sign-in error (including 'User not found' and 'Invalid login credentials'), proceed with sign up
        const { error } = await signUp(email, password, fullName);
        if (error) {
          // Check for Supabase error codes for already registered users
          const code = error.code || error.status || '';
          if (
            code === 'user_already_exists' ||
            code === 'email_exists' ||
            code === 'email_conflict' ||
            (error.message && error.message.toLowerCase().includes('already registered'))
          ) {
            toast.error('An account with this email already exists. Please sign in instead.');
          } else if (error.message && error.message.includes('Password should be at least 6 characters')) {
            toast.error('Password should be at least 6 characters long.');
          } else if (error.message && error.message.includes('Invalid email')) {
            toast.error('Please enter a valid email address.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully! Please check your email to verify your account.');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the forgot password form submission.
   * Sends a password reset link to the user's email.
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset email sent! Please check your inbox.');
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Renders the "Forgot Password" view if `showForgotPassword` is true.
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Helmet>
          <title>Multi Agent Research Assistant | Auth</title>
        </Helmet>
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Reset Password
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  name="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renders the main Sign In / Sign Up tabs view.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Helmet>
        <title>Multi Agent Research Assistant | Auth</title>
      </Helmet>
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Multi-Agent Research Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Sign In Form */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button 
                  type="button" 
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            
            {/* Sign Up Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
