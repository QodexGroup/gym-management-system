import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import EmailVerificationBanner from '../EmailVerificationBanner';

const Layout = ({ children, title, subtitle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <EmailVerificationBanner />
        <Header title={title} subtitle={subtitle} />
        <main className="p-6 bg-dark-900">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
