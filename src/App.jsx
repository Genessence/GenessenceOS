import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { ScreenLoader } from './components/Loader';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import DocumentUploads from './pages/DocumentUploads';
import UserManagement from './pages/UserManagement';
import { Menu } from 'lucide-react';

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  return user && isAdmin() ? children : <Navigate to="/" replace />;
};

// App Layout Shell Component
const AppLayout = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header navbar */}
      <Navbar />

      <div className="flex flex-1 relative">
        {/* Mobile menu trigger floating button */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-30 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        {/* Left sidebar nav panel */}
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen} 
          setIsMobileOpen={setIsMobileSidebarOpen} 
        />

        {/* Central main page viewport */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>

    </div>
  );
};

// Main Routing and Context setup
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* Authenticated Application Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProjectManagement />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <AppLayout>
              <DocumentUploads />
            </AppLayout>
          </PrivateRoute>
        }
      />
      
      {/* Admin specific route */}
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AppLayout>
              <UserManagement />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
