import type { VoicePace } from '../types';

// Rider alerts: system notification + vibration + optional spoken announcement.
// NOTE: reliable alerts while the phone is locked need a service worker + Web Push
// from a backend that polls Train Tracker. This handles the in-app / foreground case.

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function speakText(text: string, pace: VoicePace = 'normal') {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = { slow: 0.8, normal: 1, fast: 1.2 }[pace];
  speechSynthesis.speak(utterance);
}

export function alertRider(title: string, body: string, opts: { vibrate?: boolean; speak?: boolean; pace?: VoicePace } = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'stepfree-trip' });
  }
  if (opts.vibrate && 'vibrate' in navigator) navigator.vibrate([300, 120, 300, 120, 600]);
  if (opts.speak) speakText(`${title}. ${body}`, opts.pace);
}
