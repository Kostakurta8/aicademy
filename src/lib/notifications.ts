// Local notification scheduling via the Notification API
// For a full push notification system, you'd use web-push with a backend.
// This uses the browser Notification API for client-side reminders.

const NOTIFICATION_STORAGE_KEY = "aicademy-notifications";

interface NotificationPrefs {
  enabled: boolean;
  streakReminder: boolean;
  dailyReward: boolean;
  lastPermissionCheck: string;
}

function getPrefs(): NotificationPrefs {
  if (typeof window === "undefined")
    return {
      enabled: false,
      streakReminder: true,
      dailyReward: true,
      lastPermissionCheck: "",
    };
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return {
    enabled: false,
    streakReminder: true,
    dailyReward: true,
    lastPermissionCheck: "",
  };
}

function savePrefs(prefs: NotificationPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window))
    return false;

  if (Notification.permission === "granted") {
    savePrefs({ ...getPrefs(), enabled: true });
    return true;
  }

  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  const granted = result === "granted";
  savePrefs({
    ...getPrefs(),
    enabled: granted,
    lastPermissionCheck: new Date().toISOString(),
  });
  return granted;
}

export function isNotificationEnabled(): boolean {
  if (typeof window === "undefined" || !("Notification" in window))
    return false;
  return Notification.permission === "granted";
}

export function getNotificationPrefs(): NotificationPrefs {
  return getPrefs();
}

export function updateNotificationPrefs(updates: Partial<NotificationPrefs>) {
  savePrefs({ ...getPrefs(), ...updates });
}

export function sendLocalNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    url?: string;
  },
) {
  if (!isNotificationEnabled()) return;

  const reg = navigator.serviceWorker?.controller;
  if (reg) {
    // Use service worker for better reliability
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body: options?.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag: options?.tag || "aicademy-local",
        data: { url: options?.url || "/" },
      } as NotificationOptions);
    });
  } else {
    // Fallback to basic Notification API
    new Notification(title, {
      body: options?.body,
      icon: "/icons/icon-192.png",
      tag: options?.tag || "aicademy-local",
    });
  }
}

// Schedule streak reminder — call this when user opens the app
export function scheduleStreakReminder(currentStreak: number) {
  const prefs = getPrefs();
  if (!prefs.enabled || !prefs.streakReminder) return;
  if (!isNotificationEnabled()) return;

  // Schedule a reminder ~20 hours from now (gives user a window to keep streak)
  const REMINDER_MS = 20 * 60 * 60 * 1000;

  // Store the timeout ID so we don't double-schedule
  const existingId = sessionStorage.getItem("streak-reminder-id");
  if (existingId) clearTimeout(Number(existingId));

  const timeoutId = setTimeout(() => {
    sendLocalNotification(`Don't lose your ${currentStreak}-day streak! 🔥`, {
      body: "Open AIcademy and complete a quick lesson to keep your streak alive!",
      tag: "streak-reminder",
      url: "/dashboard",
    });
  }, REMINDER_MS);

  sessionStorage.setItem("streak-reminder-id", String(timeoutId));
}

// Schedule daily reward reminder
export function scheduleDailyRewardReminder() {
  const prefs = getPrefs();
  if (!prefs.enabled || !prefs.dailyReward) return;
  if (!isNotificationEnabled()) return;

  // Remind at 9 AM next day if they haven't claimed
  const now = new Date();
  const tomorrow9AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    9,
    0,
    0,
  );
  const msUntil = tomorrow9AM.getTime() - now.getTime();

  if (msUntil <= 0 || msUntil > 86400000) return;

  const existingId = sessionStorage.getItem("reward-reminder-id");
  if (existingId) clearTimeout(Number(existingId));

  const timeoutId = setTimeout(() => {
    sendLocalNotification("Your daily reward is waiting! 🎁", {
      body: "Claim your XP bonus and keep your streak going!",
      tag: "daily-reward",
      url: "/dashboard",
    });
  }, msUntil);

  sessionStorage.setItem("reward-reminder-id", String(timeoutId));
}
