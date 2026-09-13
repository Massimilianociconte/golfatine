import confetti from 'canvas-confetti';

export const triggerVictoryConfetti = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // Gold, Emerald, Purple, Orange
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#10b981', '#fbbf24', '#8b5cf6', '#f97316', '#4ade80']
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#10b981', '#fbbf24', '#8b5cf6', '#f97316', '#4ade80']
    });
  }, 250);
};

export const triggerHIOBurst = (event?: React.MouseEvent) => {
  let x = 0.5;
  let y = 0.5;
  if (event) {
    x = event.clientX / window.innerWidth;
    y = event.clientY / window.innerHeight;
  }
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { x, y },
    colors: ['#fbbf24', '#f59e0b', '#fef08a', '#10b981'],
    zIndex: 9999
  });
};

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
