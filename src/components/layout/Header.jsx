import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';
import { mockNotifications } from '../../data/mockData';

const Header = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { user, switchRole, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/notifications');
  };

  const handleMyProfile = () => {
    setShowUserMenu(false);
    navigate('/my-account');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-dark-100">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-dark-800">{title}</h1>
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
              className="w-64 pl-10 pr-4 py-2.5 bg-dark-50 border border-dark-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
            />
          </div>

          {/* Role Switcher (Demo) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-dark-100 rounded-lg">
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
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-dark-500 hover:text-dark-700 hover:bg-dark-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-dark-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-dark-100 flex items-center justify-between">
                  <h3 className="font-semibold text-dark-800">Notifications</h3>
                  <span className="text-xs text-primary-500 hover:text-primary-600 cursor-pointer">
                    Mark all read
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-dark-50 hover:bg-dark-50 cursor-pointer ${
                        !notification.read ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'warning'
                              ? 'bg-warning-500'
                              : notification.type === 'success'
                              ? 'bg-success-500'
                              : 'bg-primary-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-800">
                            {notification.title}
                          </p>
                          <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-dark-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-dark-50 text-center">
                  <button
                    onClick={handleViewAllNotifications}
                    className="text-sm text-primary-500 hover:text-primary-600 cursor-pointer font-medium"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 hover:bg-dark-100 rounded-xl transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-lg object-cover"
              />
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-dark-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-dark-100">
                  <p className="font-semibold text-dark-800">{user.name}</p>
                  <p className="text-xs text-dark-400">{user.email}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleMyProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-600 hover:bg-dark-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                </div>
                <div className="border-t border-dark-100 py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50 transition-colors">
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
