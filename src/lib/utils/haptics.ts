export type HapticStyle =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning";

/**
 * Web Haptics utility using Vibration API on supported devices (iOS PWA / Android)
 */
export function triggerHaptic(style: HapticStyle = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (style) {
      case "selection":
        navigator.vibrate(4);
        break;
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate(35);
        break;
      case "success":
        navigator.vibrate([12, 35, 15]);
        break;
      case "warning":
        navigator.vibrate([25, 40, 25]);
        break;
    }
  } catch {
    // Graceful degradation when restricted by browser permissions
  }
}
