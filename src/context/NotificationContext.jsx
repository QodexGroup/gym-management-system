import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    /**
     * Fetch notifications
     */
    const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
        setIsLoading(true);
        try {
            const result = await notificationService.getNotifications(page, limit);
            setNotifications(result.notifications);
            setPagination(result.pagination);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Fetch unread count
     */
    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, []);

    /**
     * Mark notification as read
     */
    const markAsRead = useCallback(async (id) => {
        try {
            await notificationService.markAsRead(id);

            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
                )
            );

            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }, []);

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const markedCount = await notificationService.markAllAsRead();

            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
            );

            // Reset unread count
            setUnreadCount(0);

            return markedCount;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }, []);

    /**
     * Refresh notifications (fetch latest)
     */
    const refreshNotifications = useCallback(async () => {
        await Promise.all([
            fetchNotifications(currentPage),
            fetchUnreadCount(),
        ]);
    }, [currentPage, fetchNotifications, fetchUnreadCount]);

    /**
     * Load more notifications (pagination)
     */
    const loadMore = useCallback(async () => {
        if (pagination && currentPage < pagination.last_page) {
            await fetchNotifications(currentPage + 1);
        }
    }, [currentPage, pagination, fetchNotifications]);

    /**
     * Initial load and polling setup
     */
    useEffect(() => {
        // Initial fetch
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const pollInterval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // 30 seconds

        return () => clearInterval(pollInterval);
    }, [fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        isLoading,
        pagination,
        currentPage,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        loadMore,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
