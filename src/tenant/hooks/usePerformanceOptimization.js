import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * Helps prevent excessive API calls and improves performance
 */
export const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [debouncedCallback, cancel];
};

/**
 * Custom hook for throttling function calls
 * Ensures function is called at most once per specified interval
 */
export const useThrottle = (callback, delay = 300) => {
  const timeoutRef = useRef(null);
  const lastExecutionRef = useRef(0);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;

    if (timeSinceLastExecution >= delay) {
      lastExecutionRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecutionRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastExecution);
    }
  }, [callback, delay]);

  return throttledCallback;
};

/**
 * Custom hook for request deduplication
 * Prevents duplicate API calls with same parameters
 */
export const useRequestDeduplication = () => {
  const pendingRequests = useRef(new Map());

  const deduplicate = useCallback(async (key, requestFunction) => {
    // If request is already pending, return the existing promise
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key);
    }

    // Create new request promise
    const requestPromise = requestFunction()
      .finally(() => {
        // Remove from pending requests when completed
        pendingRequests.current.delete(key);
      });

    // Store the promise
    pendingRequests.current.set(key, requestPromise);

    return requestPromise;
  }, []);

  const clearPending = useCallback(() => {
    pendingRequests.current.clear();
  }, []);

  return [deduplicate, clearPending];
};

export default { useDebounce, useThrottle, useRequestDeduplication };
