import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';

function formatRelativeTime(dateString) {
  const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res && res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await apiFetch('/api/notifications/read-all', { method: 'PUT' });
  };

  const handleAcceptInvite = async (e, workspaceId, notificationId) => {
    e.stopPropagation();
    await apiFetch(`/api/workspaces/${workspaceId}/accept-invite`, { method: 'POST' });
    handleMarkAsRead(notificationId);
    window.location.reload(); 
  };

  const handleDeclineInvite = async (e, workspaceId, notificationId) => {
    e.stopPropagation();
    await apiFetch(`/api/workspaces/${workspaceId}/decline-invite`, { method: 'POST' });
    handleMarkAsRead(notificationId);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 transition-all rounded-full bg-white/50 border border-black/5 hover:bg-white dark:bg-black/50 dark:border-white/10 dark:hover:bg-black/80 shadow-sm hover:shadow hover:scale-105 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-80 mt-2 overflow-hidden border shadow-xl bg-popover text-popover-foreground rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold tracking-tight text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[350px]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`p-4 border-b last:border-0 transition-colors hover:bg-muted/50 cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                  onClick={() => {
                    if (!notif.isRead) handleMarkAsRead(notif._id);
                    if (notif.type === 'meeting_invite' || notif.type === 'new_reply') {
                      window.location.href = `/meetings/${notif.linkId}`;
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{formatRelativeTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{notif.message}</p>
                  
                  {notif.type === 'workspace_invite' && !notif.isRead && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={(e) => handleAcceptInvite(e, notif.linkId, notif._id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={(e) => handleDeclineInvite(e, notif.linkId, notif._id)}
                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
