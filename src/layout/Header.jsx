import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { getFileUrl } from '../shared/services/storageService';
import NotificationBell from '../components/NotificationBell';
import SearchableClientInput from '../components/common/SearchableClientInput';
import {
  ChevronDown,
  User,
  LogOut,
  QrCode,
  Palette,
  ClipboardList,
} from 'lucide-react';

const Header = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Only treat a real uploaded photo as an avatar image; the ui-avatars
  // fallback keeps the theme-colored initials badge below. Reset the error
  // whenever the source changes so a freshly uploaded avatar gets retried.
  const hasCustomAvatar = !!user?.avatar && !user.avatar.includes('ui-avatars.com');
  const avatarUrl = hasCustomAvatar ? getFileUrl(user.avatar) : null;
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const handleMyProfile = () => {
    setShowUserMenu(false);
    navigate('/my-account');
  };

  const handleAppearance = () => {
    setShowUserMenu(false);
    navigate('/appearance');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const handleCustomerSelect = (customer) => {
    navigate(`/members/${customer.id}`);
  };

  return (
    <header className="sticky top-0 z-[41] bg-dark-800/80 backdrop-blur-md border-b border-dark-700">
      <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-6">
        {/* Title — desktop only; mr-auto pushes the right section to the far right.
            min-w-0 (not shrink-0) so the row can reclaim space at 1024px, where an
            expanded sidebar leaves only ~720px for the whole header. The subtitle is
            the long part, so it waits for xl. */}
        <div className="hidden min-w-0 lg:block mr-auto">
          <h1 className="truncate text-2xl font-bold text-dark-50">{title}</h1>
          {subtitle && <p className="mt-0.5 hidden truncate text-sm text-dark-400 xl:block">{subtitle}</p>}
        </div>

        {/* Search — mobile/tablet: fills the empty left space; hidden on desktop where the
            right-section version takes over */}
        <div className="flex-1 min-w-0 lg:hidden">
          <SearchableClientInput
            placeholder="Search client by name"
            onSelect={handleCustomerSelect}
            label=""
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search — desktop only */}
          <div className="hidden lg:block">
            <SearchableClientInput
              placeholder="Search client by name"
              className="w-48 xl:w-64"
              onSelect={handleCustomerSelect}
              label=""
            />
          </div>

          {/* QR Scanner — tablet (md) and up, hidden on mobile */}
          <button
            onClick={() => navigate('/kiosk/qr-scanner')}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700 text-dark-100 hover:bg-dark-600 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden xl:inline text-sm font-medium">QR Scanner</span>
          </button>

          {/* Notifications — always visible */}
          <NotificationBell />

          {/* User Menu — always visible */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 hover:bg-dark-700 rounded-xl transition-colors"
            >
              {/* Uploaded avatar when present; otherwise a theme-aware initials
                  badge that follows the active primary color. */}
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={user?.fullname || 'User'}
                  onError={() => setAvatarError(true)}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <span className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none">
                  {(user?.fullname || user?.firstname || 'U')
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </button>

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
                  <button
                    onClick={handleAppearance}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    Themes & Appearance
                  </button>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLScB0qnY6EdOTsvf1YSEkqSt4bv1CCzhQlKcUgRyZKVauRDwzw/viewform?usp=publish-editor"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Give Feedback
                  </a>
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
