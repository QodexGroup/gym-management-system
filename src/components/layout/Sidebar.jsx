import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  CreditCard,
  CalendarDays,
  Receipt,
  FileBarChart,
  Dumbbell,
  UserCog,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState(['reports']);

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) =>
      prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]
    );
  };

  const adminMenuItems = [
    // Main Section
    {
      section: 'MAIN',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/check-in', icon: UserCheck, label: 'Check-In System' },
        { path: '/customers', icon: Users, label: 'Customer Management' },
        { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
        { path: '/expenses', icon: Receipt, label: 'Expense List' },
      ],
    },
    // Account Section
    {
      section: 'ACCOUNT',
      items: [
        { path: '/membership-plans', icon: CreditCard, label: 'Membership Plans' },
        { path: '/users', icon: UserCog, label: 'User Management' },
        {
          label: 'Reports',
          icon: FileBarChart,
          key: 'reports',
          children: [
            { path: '/reports/collection', label: 'Collection Report' },
            { path: '/reports/expense', label: 'Expense Report' },
          ],
        },
        { path: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const trainerMenuItems = [
    // Main Section
    {
      section: 'MAIN',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/check-in', icon: UserCheck, label: 'Check-In System' },
        { path: '/customers', icon: Users, label: 'My Customers' },
        { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
      ],
    },
    // Account Section
    {
      section: 'ACCOUNT',
      items: [
        { path: '/reports/my-collection', icon: Wallet, label: 'My Collection' },
        { path: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const menuSections = isAdmin ? adminMenuItems : trainerMenuItems;

  const isMenuActive = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return false;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-dark-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-dark-100">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-dark-800">FitPro Gym</h1>
              <p className="text-xs text-dark-400">{isAdmin ? 'Admin Panel' : 'Trainer Panel'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-dark-200 rounded-full flex items-center justify-center text-dark-400 hover:text-dark-600 hover:bg-dark-50 transition-colors shadow-sm"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.section} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {/* Section Header */}
            {!isCollapsed && (
              <p className="px-4 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                {section.section}
              </p>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <div className="border-t border-dark-100 mb-4 mx-2" />
            )}

            <ul className="space-y-1">
              {section.items.map((item, index) => (
                <li key={index}>
                  {item.path ? (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'active' : ''} ${
                          isCollapsed ? 'justify-center px-2' : ''
                        }`
                      }
                      title={isCollapsed ? item.label : ''}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </NavLink>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleMenu(item.key)}
                        className={`sidebar-item w-full ${
                          isMenuActive(item) ? 'text-primary-600 bg-primary-50' : ''
                        } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                        title={isCollapsed ? item.label : ''}
                      >
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          expandedMenus.includes(item.key) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )
                        )}
                      </button>
                      {!isCollapsed && expandedMenus.includes(item.key) && (
                        <ul className="mt-1 ml-4 pl-4 border-l border-dark-200 space-y-1">
                          {item.children.map((child, childIndex) => (
                            <li key={childIndex}>
                              <NavLink
                                to={child.path}
                                className={({ isActive }) =>
                                  `sidebar-item text-sm ${isActive ? 'active' : ''}`
                                }
                              >
                                <span>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Collapsed submenu - show as tooltip/popup */}
                      {isCollapsed && expandedMenus.includes(item.key) && (
                        <div className="absolute left-full ml-2 bg-white rounded-lg shadow-lg border border-dark-100 py-2 min-w-[180px] z-50">
                          <p className="px-4 py-1 text-xs font-semibold text-dark-400 uppercase">
                            {item.label}
                          </p>
                          {item.children.map((child, childIndex) => (
                            <NavLink
                              key={childIndex}
                              to={child.path}
                              className={({ isActive }) =>
                                `block px-4 py-2 text-sm ${
                                  isActive
                                    ? 'text-primary-600 bg-primary-50'
                                    : 'text-dark-600 hover:bg-dark-50'
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
