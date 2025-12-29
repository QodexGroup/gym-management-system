import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import {
  Search,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';

const Header = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMyProfile = () => {
    setShowUserMenu(false);
    navigate('/my-account');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-dark-800/80 backdrop-blur-md border-b border-dark-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-dark-50">{title}</h1>
          {subtitle && <p className="text-sm text-dark-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search members, trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-xl focus:bg-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
            />
          </div>

          {/* Role Switcher (Demo) */}
          {/* <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-dark-100 rounded-lg">
            <span className="text-xs text-dark-500">View as:</span>
            <button
              onClick={() => switchRole('admin')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                isAdmin
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-600 hover:bg-dark-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchRole('trainer')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                !isAdmin
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-600 hover:bg-dark-200'
              }`}
            >
              Trainer
            </button>
          </div> */}

          {/* Notifications - Using our new NotificationBell component */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 hover:bg-dark-700 rounded-xl transition-colors"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullname || 'User')}&background=random`}
                alt={user?.fullname || 'User'}
                className="w-9 h-9 rounded-lg object-cover"
              />
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-xl shadow-lg border border-dark-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-dark-700">
                  <p className="font-semibold text-dark-50">{user?.fullname || user?.firstname || 'User'}</p>
                  <p className="text-xs text-dark-400">{user?.email || ''}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleMyProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                </div>
                <div className="border-t border-dark-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
