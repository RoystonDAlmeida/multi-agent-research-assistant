import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, History as HistoryIcon, Settings as SettingsIcon, MessageCircle } from 'lucide-react';

/**
 * Header component for the application.
 * Displays the app logo, navigation links, user information, and authentication buttons.
 * It features a responsive design with a collapsible mobile menu.
 */
const Header = () => {
  // Retrieves user authentication state and sign-out function from the AuthContext.
  const { user, signOut } = useAuth();
  // React Router hooks for navigation and getting the current location.
  const navigate = useNavigate();
  const location = useLocation();
  // State to control the visibility of the mobile navigation menu.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Handles the user sign-out process.
   * It calls the signOut function from the AuthContext, navigates to the auth page,
   * and closes the mobile menu if it's open.
   */
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    setIsMobileMenuOpen(false);
  };
  
  /**
   * Navigates to a specified path and closes the mobile menu.
   * @param path The path to navigate to.
   */
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }


  return (
    <header className="border-b border-white/20 bg-white/10 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Application Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">Research Assistant</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => handleNavigate('/dashboard')}
              className={`text-gray-600 hover:text-gray-800 transition-colors${location.pathname === '/dashboard' ? ' font-semibold underline underline-offset-4 text-blue-700' : ''}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavigate('/history')}
              className={`text-gray-600 hover:text-gray-800 transition-colors${location.pathname === '/history' ? ' font-semibold underline underline-offset-4 text-blue-700' : ''}`}
            >
              History
            </button>
            <button 
              onClick={() => handleNavigate('/settings')}
              className={`text-gray-600 hover:text-gray-800 transition-colors${location.pathname === '/settings' ? ' font-semibold underline underline-offset-4 text-blue-700' : ''}`}
            >
              Settings
            </button>
          </nav>
          
          <div className="flex items-center space-x-3">
            {/* Desktop User Info and Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {user.user_metadata?.full_name || user.email.split('@')[0]}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleNavigate('/auth')}>
                    Sign In
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={() => handleNavigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
            
            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                {/* Mobile Menu Content */}
                <SheetContent side="right">
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navigation and user actions</SheetDescription>
                  {/* Mobile User Welcome Card */}
                  {user && (
                    <div className="flex flex-col items-center justify-center rounded-xl mb-4 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V19.5z" />
                        </svg>
                      </div>
                      <div className="text-lg font-semibold">Welcome, {user.user_metadata?.full_name || user.email.split('@')[0]}!</div>
                      <div className="text-xs text-white/80">Glad to see you back 🎉</div>
                    </div>
                  )}
                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4 mt-6">
                    <button
                      onClick={() => handleNavigate('/dashboard')}
                      className={`flex items-center gap-2 text-left w-full p-2 rounded group transition-colors hover:bg-gray-100 focus:bg-blue-50 ${location.pathname === '/dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
                    >
                      <LayoutDashboard className={`w-5 h-5 ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'} group-hover:text-blue-600 group-focus:text-blue-600 transition-colors`} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNavigate('/history')}
                      className={`flex items-center gap-2 text-left w-full p-2 rounded group transition-colors hover:bg-gray-100 focus:bg-blue-50 ${location.pathname === '/history' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
                    >
                      <HistoryIcon className={`w-5 h-5 ${location.pathname === '/history' ? 'text-blue-600' : 'text-gray-500'} group-hover:text-blue-600 group-focus:text-blue-600 transition-colors`} />
                      History
                    </button>
                    <button
                      onClick={() => handleNavigate('/settings')}
                      className={`flex items-center gap-2 text-left w-full p-2 rounded group transition-colors hover:bg-gray-100 focus:bg-blue-50 ${location.pathname === '/settings' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
                    >
                      <SettingsIcon className={`w-5 h-5 ${location.pathname === '/settings' ? 'text-blue-600' : 'text-gray-500'} group-hover:text-blue-600 group-focus:text-blue-600 transition-colors`} />
                      Settings
                    </button>
                    <hr className="my-2"/>
                    {/* Mobile Authentication Buttons */}
                    {user ? (
                        <Button variant="outline" onClick={handleSignOut}>
                          Sign Out
                        </Button>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" onClick={() => handleNavigate('/auth')}>
                          Sign In
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => handleNavigate('/auth')}>
                          Get Started
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
