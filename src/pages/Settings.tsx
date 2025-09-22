import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Trash2, RotateCcw, Mail, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user, signOut, updatePassword, updateEmail, deleteAccount, resetAccount } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) return;
    
    setLoading(true);
    await updatePassword(newPassword);
    setNewPassword('');
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    
    setLoading(true);
    await updateEmail(newEmail);
    setNewEmail('');
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    await deleteAccount();
    setLoading(false);
  };

  const handleResetAccount = async () => {
    setLoading(true);
    await resetAccount();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Account Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your current account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security
              </CardTitle>
              <CardDescription>
                Update your password and email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="flex space-x-2">
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button onClick={handleUpdatePassword} disabled={loading || !newPassword.trim()}>
                    Update
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="new-email">New Email</Label>
                <div className="flex space-x-2">
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                  />
                  <Button onClick={handleUpdateEmail} disabled={loading || !newEmail.trim()}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  A confirmation email will be sent to your new email address
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={signOut} className="w-full" variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your messages and reset your profile information. 
                      Your account will remain active but all data will be cleared. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAccount} disabled={loading}>
                      Reset Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-destructive">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all associated data including messages, 
                      profile information, and chat history. This action cannot be undone and you will need 
                      to create a new account to use MyTolk again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount} 
                      disabled={loading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/profile">
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}