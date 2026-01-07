import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Badge } from '../components/common';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Check,
  Clock,
  DollarSign,
  User,
  Calendar,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/notificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [preferences, setPreferences] = useState({
    membership_expiry_enabled: true,
    payment_alerts_enabled: true,
    new_registrations_enabled: true,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications(1, 20);
    loadPreferences();
  }, [fetchNotifications]);

  // Load preferences from API
  const loadPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Handle toggle change
  const handleToggleChange = async (key) => {
    try {
      setSavingPreferences(true);
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key],
      };

      // Optimistically update UI
      setPreferences(newPreferences);

      // Save to API
      await notificationService.updatePreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Revert on error
      loadPreferences();
    } finally {
      setSavingPreferences(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.customer_id) {
      navigate(`/members/${notification.data.customer_id}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'membership_expiring':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'payment_received':
        return <DollarSign className="w-5 h-5 text-success-500" />;
      case 'customer_registered':
        return <User className="w-5 h-5 text-primary-500" />;
      default:
        return <Info className="w-5 h-5 text-primary-500" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'membership_expiring':
        return 'bg-warning-100';
      case 'payment_received':
        return 'bg-success-100';
      case 'customer_registered':
        return 'bg-primary-100';
      default:
        return 'bg-primary-100';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'membership_expiring':
        return 'Membership Alert';
      case 'payment_received':
        return 'Payment';
      case 'customer_registered':
        return 'New Customer';
      default:
        return 'Notification';
    }
  };

  return (
    <Layout title="Notifications" subtitle="Stay updated with important alerts and messages">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total</p>
              <p className="text-3xl font-bold mt-1">{notifications.length}</p>
            </div>
            <Bell className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm">Unread</p>
              <p className="text-3xl font-bold mt-1">{unreadCount}</p>
            </div>
            <Bell className="w-10 h-10 text-danger-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Alerts</p>
              <p className="text-3xl font-bold mt-1">
                {notifications.filter((n) => n.type === 'membership_expiring').length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-warning-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-dark-800">
                All Notifications
              </h3>
              {unreadCount > 0 && (
                <Badge variant="danger">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-dark-700 border border-dark-500 rounded-lg focus:border-primary-800 outline-none"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="membership_expiring">Membership Alerts</option>
                <option value="payment_received">Payments</option>
                <option value="customer_registered">New Customers</option>
              </select>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-2 text-sm text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {isLoading && notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-dark-400 mt-4">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <>
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${!notification.isRead ? 'bg-dark-700 border-l-4 border-primary-500' : 'bg-dark-800'
                      } hover:bg-dark-600`}
                  >
                    <div className={`p-2 rounded-lg ${getIconBg(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-dark-500 font-medium">
                          {getTypeLabel(notification.type)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </div>
                      <h4 className={`font-medium text-dark-800 ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-dark-500 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-dark-400 mt-2">
                        <Clock className="w-3.5 h-3.5" />
                        {notification.timeAgo}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-2 text-dark-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {pagination && pagination.current_page < pagination.last_page && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-dark-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-600">
                No notifications
              </h3>
              <p className="text-dark-400 mt-1">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning-500" />
                  <div>
                    <p className="font-medium text-dark-800">Membership Expiry</p>
                    <p className="text-xs text-dark-500">
                      Alert when memberships are expiring
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.membership_expiry_enabled}
                    onChange={() => handleToggleChange('membership_expiry_enabled')}
                    disabled={savingPreferences}
                  />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-success-500" />
                  <div>
                    <p className="font-medium text-dark-800">Payment Alerts</p>
                    <p className="text-xs text-dark-500">
                      Notify on new payments
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.payment_alerts_enabled}
                    onChange={() => handleToggleChange('payment_alerts_enabled')}
                    disabled={savingPreferences}
                  />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-accent-500" />
                  <div>
                    <p className="font-medium text-dark-800">New Registrations</p>
                    <p className="text-xs text-dark-500">
                      Alert on new member sign-ups
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.new_registrations_enabled}
                    onChange={() => handleToggleChange('new_registrations_enabled')}
                    disabled={savingPreferences}
                  />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
