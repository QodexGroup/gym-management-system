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
      <div className={`transition-all duration-300 ${marginLeft} h-full overflow-y-auto`}>
        <EmailVerificationBanner />
        <Header title={title} subtitle={subtitle} />
        <main className="p-6 bg-dark-900">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
