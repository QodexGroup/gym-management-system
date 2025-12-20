import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const { unreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

    // Fetch recent notifications when dropdown opens
    useEffect(() => {
        if (showDropdown && notifications.length === 0) {
            fetchNotifications(1, 5); // Fetch 5 most recent
        }
    }, [showDropdown, notifications.length, fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Navigate based on notification type
        if (notification.data?.customer_id) {
            navigate(`/members/${notification.data.customer_id}`);
        }

        setShowDropdown(false);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleViewAll = () => {
        setShowDropdown(false);
        navigate('/notifications');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'membership_expiring':
                return '⏰';
            case 'payment_received':
                return '💰';
            case 'customer_registered':
                return '👤';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2.5 hover:bg-dark-700 rounded-xl transition-colors"
            >
                <Bell className="w-5 h-5 text-dark-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-danger-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-dark-800 rounded-xl shadow-lg border border-dark-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                        <div>
                            <h3 className="font-semibold text-dark-50">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-dark-400">{unreadCount} unread</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-dark-400">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 5).map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-dark-700 transition-colors border-b border-dark-700/50 ${!notification.isRead ? 'bg-dark-700/30' : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0 text-2xl">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 text-left">
                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-dark-50' : 'text-dark-200'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-dark-500 mt-1">
                                            {notification.timeAgo}
                                        </p>
                                    </div>

                                    {/* Unread Indicator */}
                                    {!notification.isRead && (
                                        <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-dark-700">
                            <button
                                onClick={handleViewAll}
                                className="w-full text-sm text-primary-500 hover:text-primary-400 transition-colors font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
