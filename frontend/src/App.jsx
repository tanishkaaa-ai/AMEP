import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { socket } from './services/api';

// Import components
import LandingPage from './components/LandingPage';
import TeacherDashboard from './components/TeacherDashboard';
import LivePolling from './components/LivePolling';
import PBLWorkspace from './components/PBLWorkspace';
import SoftSkillsRubric from './components/SoftSkillsRubric';
import TemplateLibrary from './components/TemplateLibrary';
import AuthCard from './components/AuthCard';
import ProtectedRoute from './components/ProtectedRoute';

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    // Check if user is logged in by checking for token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location.pathname]);
  
  const isActive = (path) => location.pathname === path;
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    // Navigate to home after logout
    window.location.href = '/';
  };
  
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-slate-900/60 backdrop-blur-xl border-b border-white/10 py-4'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" x2="3" y1="12" y2="12"></line>
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AMEP</div>
              <div className="text-[10px] text-indigo-300 font-medium">AI Education Intelligence</div>
            </div>
          </div>

          {isLoggedIn ? (
            <div className="hidden lg:flex items-center gap-1">
              <Link 
                to="/"
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${isActive('/') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
              >
                Home
              </Link>
              <Link 
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${isActive('/dashboard') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/polling"
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${isActive('/polling') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
              >
                Live Polling
              </Link>
              <Link 
                to="/projects"
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${isActive('/projects') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
              >
                Projects
              </Link>
              <Link 
                to="/soft-skills"
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${isActive('/soft-skills') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
              >
                Soft Skills
              </Link>
              <Link 
                to="/templates"
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${isActive('/templates') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
              >
                Templates
              </Link>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-3">
              {!isActive('/login') && !isActive('/register') && (
                <>
                  <Link 
                    to="/login"
                    className="px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white font-semibold transition-all duration-300 text-sm border border-slate-600/50 hover:border-indigo-500/50"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 text-sm shadow-lg shadow-indigo-500/20"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden lg:block text-xs text-slate-400">
              {socket.connected ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Disconnected
                </span>
              )}
            </span>
            {isLoggedIn && user && (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-white">
                    {user.first_name || user.username}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" x2="9" y1="12" y2="12"></line>
                  </svg>
                </button>
              </div>
            )}
            <button className="lg:hidden p-2 rounded-lg bg-slate-800/50 text-white hover:bg-slate-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to AMEP server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <Navigation />
      {/* Add padding to account for fixed navbar */}
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/polling" element={
            <ProtectedRoute>
              <LivePolling />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <PBLWorkspace />
            </ProtectedRoute>
          } />
          <Route path="/soft-skills" element={
            <ProtectedRoute>
              <SoftSkillsRubric />
            </ProtectedRoute>
          } />
          <Route path="/templates" element={
            <ProtectedRoute>
              <TemplateLibrary />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<AuthCard />} />
          <Route path="/register" element={<AuthCard isRegister={true} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
