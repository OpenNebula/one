import { useEffect, useRef } from 'react';

function getItem(storage, key) {
  const value = storage.getItem(key);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function setItem(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

/**
 * A wrapper for useState that retrieves the initial state from a
 * WebStorage object and saves the state there as it changes.
 */
export default function useStorage(storage, key, [state, setState]) {
  const checkStorageRef = useRef(true);

  // Check for an existing value on the initial render...
  if (checkStorageRef.current) {
    checkStorageRef.current = false;
    const storedState = getItem(storage, key);
    if (storedState) setState(storedState);
  }

  useEffect(() => {
    setItem(storage, key, state);
  }, [storage, key, state]);

  return [state, setState];
}

function createMemoryStorage() {
  const storage = {};
  return {
    getItem(key) {
      return storage[key];
    },
    setItem(key, value) {
      storage[key] = value;
    }
  };
}

function getStorage(name) {
  return typeof window === 'object' && window[name]
    ? window[name]
    : createMemoryStorage();
}

/**
 * A convenient wrapper for useStorage(window.localStorage, ...)
 */
export function useLocalStorage(key, state) {
  return useStorage(getStorage('localStorage'), key, state);
}

/**
 * A convenient wrapper for useStorage(window.sessionStorage, ...)
 */
export function useSessionStorage(key, state) {
  return useStorage(getStorage('sessionStorage'), key, state);
}
