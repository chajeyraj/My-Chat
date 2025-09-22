import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  country?: string;
  phone_number?: string;
  profile_picture?: string;
  profession?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile"
      });
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      setProfile(prev => prev ? { ...prev, profile_picture: data.publicUrl } : null);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been uploaded successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload profile picture"
      });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profile.display_name,
          country: profile.country,
          phone_number: profile.phone_number,
          profile_picture: profile.profile_picture,
          profession: profile.profession
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Failed to update profile"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.profile_picture || ''} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.[0] || profile.email[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="relative">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="avatar-upload">
                  <Button variant="outline" disabled={uploading} asChild>
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Change Picture'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed from here
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ''}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={profile.profession || ''}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  placeholder="Enter your profession"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter your country"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={profile.phone_number || ''}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}