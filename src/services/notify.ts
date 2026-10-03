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
export function primeSpeech(confirmation: string, pace: VoicePace = 'normal') {
  // Safari 17+: play web audio as media, not as an ignorable sound effect.
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = 'playback';
  if (!('speechSynthesis' in window)) return;
  // A real, audible confirmation: iOS doesn't reliably count a silent utterance as
  // unlocking speech, and a screen-reader user benefits from hearing it took.
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(confirmation);
  utterance.rate = { slow: 0.8, normal: 1, fast: 1.2 }[pace];
  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// Held so the browser can't garbage-collect an utterance mid-sentence, which cuts
// speech off in Safari.
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, pace: VoicePace = 'normal') {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = { slow: 0.8, normal: 1, fast: 1.2 }[pace];
  currentUtterance = utterance;
  // Safari drops an utterance queued in the same tick as cancel(), so only cancel when
  // something is actually playing, and give it a moment to clear first.
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
    setTimeout(() => {
      if (currentUtterance === utterance) speechSynthesis.speak(utterance);
    }, 100);
  } else {
    speechSynthesis.speak(utterance);
  }
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
  const fallback = () => {
    try {
      new Notification(title, options);
    } catch {
      // The in-app banner and speech still carry the alert.
    }
  };
  // iOS (and Android Chrome) only allow notifications through the service worker;
  // `new Notification()` throws there. Look the registration up directly: on a
  // Home Screen app's first launch the page isn't controlled yet, but the worker
  // is registered and can still show it.
  if (!('serviceWorker' in navigator)) return fallback();
  navigator.serviceWorker
    .getRegistration()
    .then((reg) => (reg ? reg.showNotification(title, options) : fallback()))
    .catch(fallback);
}
