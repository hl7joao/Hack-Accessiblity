// Rider alerts: system notification + vibration + optional spoken announcement.
// NOTE: reliable alerts while the phone is locked need a service worker + Web Push
// from a backend that polls Train Tracker. This handles the in-app / foreground case.

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function alertRider(title: string, body: string, opts: { vibrate?: boolean; speak?: boolean } = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'stepfree-trip' });
  }
  if (opts.vibrate && 'vibrate' in navigator) navigator.vibrate([300, 120, 300, 120, 600]);
  if (opts.speak && 'speechSynthesis' in window) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(`${title}. ${body}`));
  }
}
