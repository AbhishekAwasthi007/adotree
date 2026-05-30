import { useEffect } from 'react';

type TimeOfDay = 'sunrise' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) return 'sunrise';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return 'night';
}

function applyTimeOfDay(timeOfDay: TimeOfDay) {
  const body = document.body;
  
  // Remove all time-of-day classes
  body.classList.remove('sunrise', 'afternoon', 'evening', 'night');
  
  // Add current time-of-day class
  body.classList.add(timeOfDay);
}

export function useTimeOfDayEngine() {
  useEffect(() => {
    // Apply immediately on mount
    const currentTime = getTimeOfDay();
    applyTimeOfDay(currentTime);

    // Check every 60 seconds for time changes
    const interval = setInterval(() => {
      const newTime = getTimeOfDay();
      applyTimeOfDay(newTime);
    }, 60000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);
}
