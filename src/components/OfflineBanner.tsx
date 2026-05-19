import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline && !showReconnected) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      padding: '10px 16px',
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--amex-font-family, system-ui, sans-serif)',
      background: offline ? '#fef2f2' : '#f0fdf4',
      color: offline ? '#dc2626' : '#16a34a',
      borderBottom: offline ? '1px solid #fecaca' : '1px solid #bbf7d0',
      transition: 'all 300ms ease',
      animation: 'slideDown 250ms ease',
    }}>
      {offline
        ? '📡 You\u2019re offline — changes won\u2019t save until you reconnect'
        : '✓ Back online'}
    </div>
  );
}
