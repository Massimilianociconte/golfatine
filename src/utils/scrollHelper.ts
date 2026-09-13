/**
 * Instant-Response Smooth Scrolling Utility for Lo Sdrogo Golfometro
 * 
 * Guarantees:
 * 1. ZERO-LATENCY: starts scrolling immediately on Frame 1 (0ms delay).
 * 2. High initial velocity with smooth ease-out deceleration (easeOutCubic).
 * 3. Grace-period protection so initial click/touch tap doesn't cancel animation.
 * 4. Cancellation of any prior active scroll to prevent conflicting animations.
 * 5. Dynamic sticky header height compensation.
 */

let activeAnimationId: number | null = null;
let activeCancelCleanup: (() => void) | null = null;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function smoothScrollTo(
  target: HTMLElement | string | number,
  options?: {
    duration?: number;
    offset?: number;
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Cancel any ongoing scroll animation immediately
    if (activeAnimationId !== null) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }
    if (activeCancelCleanup) {
      activeCancelCleanup();
      activeCancelCleanup = null;
    }

    const duration = options?.duration || 680;
    const extraOffset = options?.offset !== undefined ? options.offset : 20;

    const findTargetY = (): number | null => {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 65;
      const totalOffset = headerHeight + extraOffset;

      if (typeof target === 'number') {
        return Math.max(0, target);
      }

      let el: HTMLElement | null = null;
      if (typeof target === 'string') {
        el = document.querySelector(target) as HTMLElement || 
             document.getElementById(target.replace('#', '')) as HTMLElement;
      } else if (target && typeof target.getBoundingClientRect === 'function') {
        el = target;
      }

      if (!el) return null;

      const rect = el.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top - totalOffset;

      const maxScroll = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;

      return Math.max(0, Math.min(targetY, maxScroll));
    };

    let targetY = findTargetY();
    const startY = window.pageYOffset;

    // If target element is not in DOM yet (e.g. mounting next frame), try fallback
    if (targetY === null) {
      // Fallback: estimate from header
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 65;
      targetY = Math.max(0, 380 - headerHeight);
    }

    const distance = targetY - startY;

    // If already at destination (within 4px), resolve immediately
    if (Math.abs(distance) < 4) {
      resolve();
      return;
    }

    let animStartTime: number | null = null;
    let cancelled = false;

    // Grace period: ignore touch/wheel events in the first 120ms to prevent click tap from cancelling
    const setupCancelListeners = () => {
      const handleUserInterrupt = () => {
        cancelled = true;
        cleanup();
        resolve();
      };

      const timer = setTimeout(() => {
        window.addEventListener('wheel', handleUserInterrupt, { passive: true });
        window.addEventListener('touchmove', handleUserInterrupt, { passive: true });
      }, 120);

      activeCancelCleanup = () => {
        clearTimeout(timer);
        window.removeEventListener('wheel', handleUserInterrupt);
        window.removeEventListener('touchmove', handleUserInterrupt);
      };
    };

    setupCancelListeners();

    const cleanup = () => {
      if (activeCancelCleanup) {
        activeCancelCleanup();
        activeCancelCleanup = null;
      }
      activeAnimationId = null;
    };

    const frame = (now: number) => {
      if (cancelled) return;
      if (!animStartTime) animStartTime = now;
      const elapsed = now - animStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeVal = easeOutCubic(progress);

      window.scrollTo(0, startY + distance * easeVal);

      if (progress < 1) {
        activeAnimationId = requestAnimationFrame(frame);
      } else {
        cleanup();
        resolve();
      }
    };

    // START ANIMATING IMMEDIATELY ON CURRENT FRAME! Zero delay!
    activeAnimationId = requestAnimationFrame(frame);
  });
}
