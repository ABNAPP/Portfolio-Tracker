import { useState, useEffect, useCallback } from 'react';

/**
 * Safe JSON parse with fallback
 * @param {string} key - localStorage key
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed value or fallback
 */
export function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Could not parse localStorage key "${key}":`, e);
    return fallback;
  }
}

/**
 * Hook for persisting state in localStorage
 * 
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value if nothing in storage
 * @returns {[any, function, function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from storage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Persist to localStorage whenever value changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  // Wrapper for setValue with optional merge for objects
  const setValue = useCallback((value) => {
    setStoredValue(prevValue => {
      // Allow function updates
      const valueToStore = value instanceof Function ? value(prevValue) : value;
      return valueToStore;
    });
  }, []);
  
  // Remove value from storage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);
  
  return [storedValue, setValue, removeValue];
}

/**
 * Hook for multiple localStorage keys
 * Useful for settings or configuration objects
 * 
 * @param {object} keysWithDefaults - Object with keys and their default values
 * @returns {[object, function]} - [values, setValues]
 */
export function useMultipleLocalStorage(keysWithDefaults) {
  const [values, setValues] = useState(() => {
    const initialValues = {};
    
    for (const [key, defaultValue] of Object.entries(keysWithDefaults)) {
      try {
        const item = window.localStorage.getItem(key);
        initialValues[key] = item ? JSON.parse(item) : defaultValue;
      } catch {
        initialValues[key] = defaultValue;
      }
    }
    
    return initialValues;
  });
  
  // Update single key
  const updateValue = useCallback((key, value) => {
    setValues(prev => {
      const newValues = { ...prev, [key]: value };
      
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
      
      return newValues;
    });
  }, []);
  
  // Update multiple keys at once
  const updateValues = useCallback((updates) => {
    setValues(prev => {
      const newValues = { ...prev, ...updates };
      
      for (const [key, value] of Object.entries(updates)) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
      }
      
      return newValues;
    });
  }, []);
  
  return [values, updateValue, updateValues];
}

export default useLocalStorage;












