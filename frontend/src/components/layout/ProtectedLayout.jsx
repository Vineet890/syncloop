import { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import GlobalHeader from './GlobalHeader';

export default function ProtectedLayout({ children, activeWorkspace, setActiveWorkspace, isDarkMode, toggleDarkMode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
      
      <div className="flex flex-col flex-1 overflow-y-auto bg-background">
        <GlobalHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isOnline={isOnline} />

        <div className="flex flex-col flex-1">
            {children}
        </div>
      </div>
    </div>
  );
}
