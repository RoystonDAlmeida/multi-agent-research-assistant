import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';

// Settings page for user profile and research preferences
const Settings = () => {
  const { user } = useAuth();
  // State for display name and loading status
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);

  // Fetch profile preferences from DB on mount or when user changes
  React.useEffect(() => {
    setDisplayName(user?.user_metadata?.full_name || '');
    // Fetch profile preferences from DB
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, default_depth, default_format')
        .eq('id', user.id)
        .single();
      setLoading(false);
      if (error) {
        toast.error('Failed to load profile preferences: ' + error.message);
        return;
      }
      if (data) {
        setDisplayName(data.full_name || '');
      }
    };
    fetchProfile();
  }, [user]);

  // Save profile changes to DB and update Supabase Auth metadata
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    // Update profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: displayName,
      })
      .eq('id', user.id);
    // Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: displayName }
    });
    setLoading(false);
    if (error || authError) {
      toast.error('Failed to update profile: ' + (error?.message || authError?.message));
    } else {
      toast.success('Settings saved successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Multi Agent Research Assistant | Settings</title>
      </Helmet>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  {/* User email (read-only) */}
                  <Input id="email" value={user?.email || ''} disabled name="email" autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  {/* Editable display name */}
                  <Input
                    id="name"
                    value={displayName}
                    name="displayName"
                    autoComplete="name"
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Research Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Research Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="depth">Default Research Depth</Label>
                  {/* Default research depth (not yet wired to DB) */}
                  <Select name="defaultDepth" value="comprehensive">
                    <SelectTrigger id="depth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="format">Default Export Format</Label>
                  {/* Default export format (currently only Markdown, disabled) */}
                  <Select name="defaultFormat" value="markdown" disabled>
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Save button for settings */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
