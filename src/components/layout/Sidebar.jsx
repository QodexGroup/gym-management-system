import { useState, useMemo, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  Receipt,
  UserCog,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  ClipboardClock,
  FileBarChart,
  Wallet,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { isAdmin, isPlatformAdmin } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState([]);

  // Keep Reports open when on any report route (so it doesn't close when switching between report pages)
  useEffect(() => {
    if (location.pathname.startsWith('/reports')) {
      setExpandedMenus((prev) => (prev.includes('reports') ? prev : [...prev, 'reports']));
    }
  }, [location.pathname]);

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) =>
      prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]
    );
  };

  // Menu items with permission requirements
  const allMenuItems = [
    // Main Section
    {
      section: 'MAIN',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'},
        { path: '/check-in', icon: ClipboardClock, label: 'Walkin'},
        { path: '/members', icon: Users, label: 'Clients'},
        { path: '/sessions', icon: CalendarDays, label: 'Calendar'},
        { path: '/classes', icon: ClipboardClock, label: 'Class Schedules'},
        { path: '/expenses', icon: Receipt, label: 'Expense List'}
      ],
    },
    // Account Section
    {
      section: 'ACCOUNT',
      items: [
        { path: '/subscription', icon: Wallet, label: 'Subscription', adminOnly: false },
        { path: '/membership-plans', icon: CreditCard, label: 'Membership Plans', adminOnly: true },
        { path: '/pt-packages', icon: Dumbbell, label: 'PT Packages', adminOnly: true },
        {
          label: 'Reports',
          icon: FileBarChart,
          key: 'reports',
          adminOnly: true,
          children: [
            { path: '/reports/summary', label: 'Summary Report', adminOnly: true },
            { path: '/reports/collection', label: 'Collection Report', adminOnly: true },
            { path: '/reports/expense', label: 'Expense Report', adminOnly: true },
            { path: '/reports/my-collection', label: 'My Collection', adminOnly: true },
          ],
        },
        { path: '/users', icon: UserCog, label: 'User Management', adminOnly: true },
      ],
    },
  ];

  // Filter menu items based on permissions and role
  const menuSections = useMemo(() => {
    return allMenuItems
      .filter((section) => {
        // Hide ACCOUNT section for non-admin users
        if (section.section === 'ACCOUNT' && !isAdmin) {
          return false;
        }
        return true;
      })
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => {
            if (item.platformAdminOnly) {
              return isPlatformAdmin;
            }
            if (item.adminOnly) {
              return isAdmin;
            }

            // Admin can see everything (except items with explicit permission requirements)
            if (isAdmin) {
              // If item has a permission requirement, check it
              if (item.permission) {
                return hasPermission(item.permission);
              }
              return true;
            }

            // Non-admin users: check permissions
            if (item.permission) {
              return hasPermission(item.permission);
            }

            // Items without permission requirements are visible to all authenticated users
            return true;
          })
          .map((item) => {
            // Filter children if item has children
            if (item.children) {
              return {
                ...item,
                children: item.children.filter((child) => {
                  if (isAdmin) {
                    return child.permission ? hasPermission(child.permission) : true;
                  }
                  return child.permission ? hasPermission(child.permission) : true;
                }),
              };
            }
            return item;
          }),
      }));
  }, [isAdmin, isPlatformAdmin, hasPermission]);

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
      className={`fixed left-0 top-0 z-40 h-screen bg-dark-800 border-r border-dark-700 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center border-b border-dark-700 ${
          isCollapsed ? 'px-2 py-4 justify-center' : 'px-4 py-5 justify-center'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-center w-full'}`}>
          <div
            className={`overflow-hidden flex items-center justify-center flex-shrink-0 bg-transparent ${
              isCollapsed ? 'w-16 h-16 rounded-xl' : 'w-40 h-20 rounded-2xl'
            }`}
          >
            <img
              src="/img/kaizen-logo2.png"
              alt="Kaizen Gym Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-dark-800 border border-dark-700 rounded-full flex items-center justify-center text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors shadow-sm"
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
              <p className="px-4 mb-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                {section.section}
              </p>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <div className="border-t border-dark-700 mb-4 mx-2" />
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
                        <ul className="mt-1 ml-4 pl-4 border-l border-dark-700 space-y-1">
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
                        <div className="absolute left-full ml-2 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-2 min-w-[180px] z-50">
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
                                    ? 'text-primary-400 bg-primary-500/20'
                                    : 'text-dark-300 hover:bg-dark-700'
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
