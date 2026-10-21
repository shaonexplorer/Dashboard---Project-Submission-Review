"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value`.
 *
 * The value only updates once it has been stable for `delay` milliseconds, so
 * a search box does not fire a request for every intermediate keystroke.
 *
 * @param value - The value to debounce
 * @param delay - How long the value must stay unchanged before it is applied
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // Clearing the timer cancels a pending update, so only the last value of
    // a burst of changes is ever applied.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
