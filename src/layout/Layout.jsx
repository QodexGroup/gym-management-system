import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

const Layout = ({ children, title, subtitle }) => {
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const handleSetCollapsed = (val) => {
    setIsCollapsed(val);
    localStorage.setItem('sidebarCollapsed', val);
  };
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const marginLeft = isMobile ? 'ml-16' : isCollapsed ? 'ml-20' : 'ml-64';

  return (
    <div className="h-screen overflow-hidden bg-dark-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleSetCollapsed} isMobile={isMobile} />
      <div className={`transition-all duration-300 ${marginLeft} h-full flex flex-col`}>
        <EmailVerificationBanner />
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <Header title={title} subtitle={subtitle} />
          <main className="flex-1 p-6 bg-dark-900">{children}</main>
        </div>
        <footer className="flex-shrink-0 bg-dark-800 border-t border-dark-700 text-dark-400 text-xs px-6 py-3 flex items-center justify-between">
          <span>&copy; 2026 GymHubPH. All rights reserved.</span>
          <span className="hidden sm:inline">Powered by Qodex Group</span>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
