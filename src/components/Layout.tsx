
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AvatarImage, Avatar, AvatarFallback } from '@/components/ui/avatar';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl bg-gradient-to-r from-brand-500 to-teal-500 bg-clip-text text-transparent">
              Career.AI
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link 
              to="/jobs" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/jobs' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Job Roles
            </Link>
            {user && (
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Dashboard
              </Link>
            )}
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </div>
              <Button variant="ghost" onClick={logout}>Sign Out</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="border-t bg-muted/40">
    <div className="container flex flex-col md:flex-row items-center justify-between py-10">
      <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
        <span className="font-bold text-xl bg-gradient-to-r from-brand-500 to-teal-500 bg-clip-text text-transparent">
          Career.AI
        </span>
        <p className="text-sm text-muted-foreground mt-2">
          Get certified. Stand out.
        </p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Terms & Conditions
        </Link>
        <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Contact Us
        </Link>
      </div>
      <div className="flex items-center gap-4 mt-6 md:mt-0">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Career.AI
        </p>
      </div>
    </div>
  </footer>
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
