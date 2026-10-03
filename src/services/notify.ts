import type { VoicePace } from '../types';

// Rider alerts: system notification + vibration + optional spoken announcement.
// NOTE: reliable alerts while the phone is locked need a service worker + Web Push
// from a backend that polls Train Tracker. This handles the in-app / foreground case.

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'unsupported';
  }
}

/**
 * Unlock speech for later, timer-driven announcements.
 *
 * iOS Safari ignores speechSynthesis.speak() unless the first call happens inside a
 * tap. Call this synchronously from the tap that turns an alert on - before any
 * await - and announcements fired later from a timer will be heard.
 */
export function primeSpeech() {
  if (!('speechSynthesis' in window)) return;
  const silent = new SpeechSynthesisUtterance(' ');
  silent.volume = 0;
  speechSynthesis.speak(silent);
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

/**
 * Each channel is independent: one failing (no vibration on iPhone, notifications
 * blocked) must never stop the others from reaching the rider.
 */
export function alertRider(title: string, body: string, opts: { vibrate?: boolean; speak?: boolean; pace?: VoicePace } = {}) {
  if (opts.speak) speakText(`${title}. ${body}`, opts.pace);
  if (opts.vibrate && 'vibrate' in navigator) navigator.vibrate([300, 120, 300, 120, 600]);
  showNotification(title, body);
}

function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const options = { body, tag: 'stepfree-trip' };
  // iOS (and Android Chrome) only allow notifications through the service worker;
  // `new Notification()` throws there.
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options)).catch(() => {});
    return;
  }
  try {
    new Notification(title, options);
  } catch {
    // The in-app banner and speech still carry the alert.
  }
}
