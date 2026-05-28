import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { usePermissions } from '../shared/hooks/usePermissions';
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
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile = false }) => {
  const { isAdmin, isTrainer, isPlatformAdmin } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState([]);

  // Flyout state for icon-only mode (collapsed desktop + all mobile)
  // { key, top } — `top` is viewport-relative so we use position:fixed
  const [flyout, setFlyout] = useState(null);
  const flyoutRef = useRef(null);

  // Keep Reports open when on any report route (desktop expanded only)
  useEffect(() => {
    if (location.pathname.startsWith('/reports')) {
      setExpandedMenus((prev) => (prev.includes('reports') ? prev : [...prev, 'reports']));
    }
    // Close flyout on navigation
    setFlyout(null);
  }, [location.pathname]);

  // Close flyout when clicking outside
  useEffect(() => {
    if (!flyout) return;
    const handler = (e) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
        setFlyout(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [flyout]);

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) =>
      prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]
    );
  };

  // On mobile always icon-only; on desktop respects isCollapsed
  const collapsed = isMobile || isCollapsed;

  // Sidebar pixel width — used to position the fixed flyout
  const sidebarWidth = isMobile ? 64 : isCollapsed ? 80 : 256;

  const handleSubMenuClick = useCallback((e, item) => {
    if (collapsed) {
      // Flyout mode: use fixed positioning based on button's viewport position
      if (flyout?.key === item.key) {
        setFlyout(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        setFlyout({ key: item.key, top: rect.top, item });
      }
    } else {
      toggleMenu(item.key);
    }
  }, [collapsed, flyout]);

  const allMenuItems = [
    {
      section: 'MAIN',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/check-in', icon: ClipboardClock, label: 'Walkin' },
        { path: '/members', icon: Users, label: 'Clients' },
        { path: '/sessions', icon: CalendarDays, label: 'Calendar' },
        { path: '/classes', icon: ClipboardClock, label: 'Class Schedules' },
        { path: '/expenses', icon: Receipt, label: 'Expense List' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { path: '/membership-plans', icon: CreditCard, label: 'Membership Plans', adminOnly: true },
        { path: '/pt-packages', icon: Dumbbell, label: 'PT Packages', adminOnly: true },
        {
          label: 'Reports',
          icon: FileBarChart,
          key: 'reports',
          adminOrCoach: true,
          children: [
            { path: '/reports/summary', label: 'Summary Report', adminOnly: true },
            { path: '/reports/collection', label: 'Collection Report', adminOnly: true },
            { path: '/reports/expense', label: 'Expense Report', adminOnly: true },
            { path: '/reports/my-collection', label: 'My Collection', coachOnly: true },
          ],
        },
        { path: '/users', icon: UserCog, label: 'User Management', adminOnly: true },
      ],
    },
  ];

  const menuSections = useMemo(() => {
    return allMenuItems
      .filter((section) => {
        if (section.section === 'ACCOUNT' && !isAdmin && !isTrainer) return false;
        return true;
      })
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => {
            if (item.platformAdminOnly) return isPlatformAdmin;
            if (item.adminOnly) return isAdmin;
            if (item.adminOrCoach) return isAdmin || isTrainer;
            if (isAdmin) return item.permission ? hasPermission(item.permission) : true;
            if (item.permission) return hasPermission(item.permission);
            return true;
          })
          .map((item) => {
            if (item.children) {
              return {
                ...item,
                children: item.children.filter((child) => {
                  if (child.adminOnly) return isAdmin;
                  if (child.coachOnly) return isTrainer;
                  if (isAdmin) return child.permission ? hasPermission(child.permission) : true;
                  if (child.adminOrCoach && isTrainer) return true;
                  return child.permission ? hasPermission(child.permission) : false;
                }),
              };
            }
            return item;
          }),
      }));
  }, [isAdmin, isTrainer, isPlatformAdmin, hasPermission]);

  const isMenuActive = (item) => {
    if (item.path) return location.pathname === item.path;
    if (item.children) return item.children.some((child) => location.pathname === child.path);
    return false;
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 h-full bg-chrome border-r border-chrome-border flex flex-col transition-all duration-300 ${
          isMobile ? 'w-16' : isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-chrome-border ${
            collapsed ? 'px-2 py-4 justify-center' : 'px-4 py-5 justify-center'
          }`}
        >
          <div className="flex items-center justify-center w-full">
            <div
              className={`overflow-hidden flex items-center justify-center flex-shrink-0 bg-transparent ${
                collapsed ? 'w-10 h-10 rounded-xl' : 'w-40 h-20 rounded-2xl'
              }`}
            >
              <img src="/img/gymhubph.png" alt="GymHubPH Logo" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Collapse Toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 w-6 h-6 bg-chrome-elevated border border-chrome-border rounded-full flex items-center justify-center text-chrome-muted hover:text-chrome-text hover:bg-chrome-hover transition-colors shadow-sm"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.section} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!collapsed && (
                <p className="px-4 mb-2 text-xs font-semibold text-chrome-muted uppercase tracking-wider">
                  {section.section}
                </p>
              )}
              {collapsed && sectionIndex > 0 && <div className="border-t border-chrome-border mb-4 mx-2" />}

              <ul className="space-y-1">
                {section.items.map((item, index) => (
                  <li key={index}>
                    {item.path ? (
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                        }
                        title={item.label}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.label}</span>}
                      </NavLink>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleSubMenuClick(e, item)}
                          className={`sidebar-item w-full ${
                            isMenuActive(item) ? 'text-chrome-text bg-chrome-hover' : ''
                          } ${collapsed ? 'justify-center px-2' : 'justify-between'}`}
                          title={item.label}
                        >
                          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                          </div>
                          {!collapsed && (
                            expandedMenus.includes(item.key)
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        {/* Expanded desktop submenu (inline) */}
                        {!collapsed && expandedMenus.includes(item.key) && (
                          <ul className="mt-1 ml-4 pl-4 border-l border-chrome-border space-y-1">
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
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Flyout — rendered outside aside to escape overflow clipping */}
      {flyout && (
        <div
          ref={flyoutRef}
          className="fixed z-50 bg-chrome-elevated rounded-lg shadow-xl border border-chrome-border py-2 min-w-[190px]"
          style={{ left: sidebarWidth + 8, top: flyout.top }}
        >
          <p className="px-4 py-1 text-xs font-semibold text-chrome-muted uppercase tracking-wider">
            {flyout.item.label}
          </p>
          {flyout.item.children.map((child, i) => (
            <NavLink
              key={i}
              to={child.path}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive ? 'text-white bg-chrome-active' : 'text-chrome-muted hover:bg-chrome-hover hover:text-chrome-text'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
};

export default Sidebar;
