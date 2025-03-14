import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

// Admin Pages
import AdminDashboard from '@/pages/admin/dashboard';
import AdminRequests from '@/pages/admin/requests';
import AdminUsers from '@/pages/admin/users';
import AdminSchema from '@/pages/admin/schema';

// User Pages
import MyAccess from '@/pages/user/my-access';
import RequestAccess from '@/pages/user/request-access';
import MyRequests from '@/pages/user/my-requests';

type AdminView = 'dashboard' | 'requests' | 'users' | 'schema';
type UserView = 'myAccess' | 'requestAccess' | 'myRequests';

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // View state
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [userView, setUserView] = useState<UserView>('myAccess');
  const [viewAsUser, setViewAsUser] = useState(!isAdmin);

  // Handle admin tab change
  const handleAdminTabChange = (tab: AdminView) => {
    setAdminView(tab);
  };

  // Handle user tab change
  const handleUserTabChange = (tab: UserView) => {
    setUserView(tab);
  };

  // Toggle view (for admins who can switch views)
  const handleViewToggle = (view: 'admin' | 'user') => {
    setViewAsUser(view === 'user');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onViewToggle={isAdmin ? handleViewToggle : undefined} 
        viewAsUser={viewAsUser}
      />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {viewAsUser ? (
          <div className="user-view">
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    userView === 'myAccess' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleUserTabChange('myAccess')}
                >
                  My Access
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    userView === 'requestAccess' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleUserTabChange('requestAccess')}
                >
                  Request Access
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    userView === 'myRequests' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleUserTabChange('myRequests')}
                >
                  My Requests
                </button>
              </nav>
            </div>
            
            {userView === 'myAccess' && <MyAccess />}
            {userView === 'requestAccess' && <RequestAccess />}
            {userView === 'myRequests' && <MyRequests />}
          </div>
        ) : (
          <div className="admin-view">
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    adminView === 'dashboard' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleAdminTabChange('dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    adminView === 'requests' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleAdminTabChange('requests')}
                >
                  Pending Requests
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    adminView === 'users' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleAdminTabChange('users')}
                >
                  User Management
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    adminView === 'schema' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleAdminTabChange('schema')}
                >
                  Schema Management
                </button>
              </nav>
            </div>
            
            {adminView === 'dashboard' && <AdminDashboard onTabChange={handleAdminTabChange} />}
            {adminView === 'requests' && <AdminRequests />}
            {adminView === 'users' && <AdminUsers />}
            {adminView === 'schema' && <AdminSchema />}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
