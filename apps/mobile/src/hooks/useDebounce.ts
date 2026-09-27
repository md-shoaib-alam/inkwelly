import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value changes (e.g., search text, input filters).
 * Helps prevent race conditions and excessive API requests.
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default 350ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}