// Shared haptic feedback utility
// Uses native Vibration API — safe no-op if unsupported (iOS, desktop)

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function hapticCorrect(): void {
  vibrate(40);
}

export function hapticWrong(): void {
  vibrate([50, 30, 50]);
}

export function hapticTimerWarn(): void {
  vibrate(25);
}

export function hapticCelebrate(): void {
  vibrate([100, 50, 100, 50, 200]);
}

export function hapticTap(): void {
  vibrate(15);
}
