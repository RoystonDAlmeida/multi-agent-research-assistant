import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

/**
 * ResetPassword component for handling the password reset flow.
 * This page is accessed via a link sent to the user's email. It verifies the link,
 * allows the user to set a new password, and provides feedback on the process.
 */
const ResetPassword = () => {
  // State to store the new password entered by the user.
  const [password, setPassword] = useState('');
  // State to manage the loading status during form submission.
  const [loading, setLoading] = useState(false);
  // State to confirm that the Supabase session has been successfully set from the recovery link.
  const [sessionSet, setSessionSet] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Effect hook to handle the password recovery token from the URL.
   * It runs on component mount and when the location changes.
   * It checks for errors in the URL hash and listens for the PASSWORD_RECOVERY event
   * from Supabase to verify the user's identity.
   */
  useEffect(() => {
    // First, check if the URL contains an explicit error from Supabase in the hash.
    const hash = location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (errorCode) {
      toast.error(errorDescription?.replace(/\+/g, ' ') || 'Invalid or expired reset link.');
      setSessionSet(false);
      return;
    }

    // If no immediate error is found in the URL, set up a listener for the PASSWORD_RECOVERY event.
    // This event is triggered by Supabase when it processes the recovery token from the URL fragment.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This confirms the link is valid and the user can proceed to set a new password.
        setSessionSet(true);
        toast.info('Link verified. Please enter your new password.');
      }
    });

    return () => {
      // Cleanup: Unsubscribe from the auth state change listener when the component unmounts.
      subscription.unsubscribe();
    };
  }, [location]);

  /**
   * Handles the form submission for resetting the password.
   * It validates the input, ensures the session is set, and calls Supabase to update the user's password.
   * @param e The form event.
   */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!password) {
      toast.error('Please enter a new password.');
      setLoading(false);
      return;
    }
    // Ensures the password reset can only be attempted after the recovery link is verified.
    if (!sessionSet) {
      toast.error('Invalid or expired reset link. Please request a new one.');
      setLoading(false);
      return;
    }

    // Update the user's password in Supabase.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to reset password.');
    } else {
      // It's good practice to sign out to invalidate any existing sessions after a password change.
      await supabase.auth.signOut();
      toast.success('Password updated successfully! Please sign in with your new password.');
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Set a New Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter your new password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading || !sessionSet}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;