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
  LogOut,
  UserCog,
  Wallet,
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const adminMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/check-in', icon: UserCheck, label: 'Check-In System' },
    { path: '/customers', icon: Users, label: 'Customer Management' },
    { path: '/membership-plans', icon: CreditCard, label: 'Membership Plans' },
    { path: '/expenses', icon: Receipt, label: 'Expense List' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/reports/collection', icon: FileBarChart, label: 'Collection Report' },
    { path: '/reports/expense', icon: FileBarChart, label: 'Expense Report' },
    { path: '/users', icon: UserCog, label: 'User Management' },
  ];

  const trainerMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/check-in', icon: UserCheck, label: 'Check-In System' },
    { path: '/customers', icon: Users, label: 'My Customers' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/reports/my-collection', icon: Wallet, label: 'My Collection' },
  ];

  const menuItems = isAdmin ? adminMenuItems : trainerMenuItems;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-dark-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-100">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-dark-800">FitPro Gym</h1>
          <p className="text-xs text-dark-400">{isAdmin ? 'Admin Panel' : 'Trainer Panel'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-dark-100 p-4">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-800 truncate">{user.name}</p>
            <p className="text-xs text-dark-400 capitalize">{user.role}</p>
          </div>
          <button className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
