/**
 * Push notifications and browser notification manager
 */
import { soundManager } from './audio';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

export function showPushNotification(title: string, body: string, icon = '/favicon.ico') {
  soundManager.playReceived();

  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted' && document.hidden) {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: false,
      });
    } catch {
      // Fallback if ServiceWorkerRegistration needed
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body,
            icon,
          });
        });
      }
    }
  }
}
