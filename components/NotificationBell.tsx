import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../services/NotificationService';
import BellIcon from './icons/BellIcon';

const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToNotifications(currentUser.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser) await markAllNotificationsAsRead(currentUser.uid);
  };

  const handleClearAll = async () => {
    if (currentUser) await clearAllNotifications(currentUser.uid);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-tighter"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                  className="text-[10px] font-black text-red-500 dark:text-red-400 hover:underline uppercase tracking-tighter"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm italic">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-4 border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${!notif.read ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      notif.type === 'EmergencyUpdate' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {notif.type.replace('Update', '')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold text-gray-800 dark:text-gray-100 ${!notif.read ? 'pr-3' : ''}`}>
                    {notif.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-700/50">
              <button className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                View All Notifications (Coming Soon)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
