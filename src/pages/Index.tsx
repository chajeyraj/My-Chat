import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">MyTolk</h1>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Simple. Clean. Messaging.</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            MyTolk is a minimalist messaging platform that focuses on what matters most - your conversations.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Messaging Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose MyTolk?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 mb-4" />
                <CardTitle>Real-time Chat</CardTitle>
                <CardDescription>
                  Instant messaging with live updates and message status
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-4" />
                <CardTitle>User Search</CardTitle>
                <CardDescription>
                  Find and connect with people by email or display name
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-4" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your messages are private with user authentication
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 mb-4" />
                <CardTitle>Clean Design</CardTitle>
                <CardDescription>
                  Minimalist interface that works on all devices
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 MyTolk. Simple messaging for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
