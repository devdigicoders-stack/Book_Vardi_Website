// Safe Storage Abstraction with In-Memory & Session Fallback
// Prevents DOMException "Access is denied for this document" when localStorage
// is blocked by mobile browsers, Incognito/Private tabs, or in-app WebViews.

const memoryCache = new Map();

function isStorageUsable(storageName) {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window[storageName];
    if (!storage) return false;
    const testKey = '__bv_test_' + Math.random().toString(36).substring(2, 7);
    storage.setItem(testKey, '1');
    const val = storage.getItem(testKey);
    storage.removeItem(testKey);
    return val === '1';
  } catch (e) {
    return false;
  }
}

let localUsable = isStorageUsable('localStorage');
let sessionUsable = isStorageUsable('sessionStorage');

export const safeStorage = {
  getItem: (key) => {
    const k = String(key);
    if (localUsable) {
      try {
        const val = window.localStorage.getItem(k);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        localUsable = false;
      }
    }

    if (sessionUsable) {
      try {
        const val = window.sessionStorage.getItem(k);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        sessionUsable = false;
      }
    }

    return memoryCache.has(k) ? memoryCache.get(k) : null;
  },

  setItem: (key, value) => {
    const k = String(key);
    const v = String(value);

    memoryCache.set(k, v);

    if (localUsable) {
      try {
        window.localStorage.setItem(k, v);
      } catch (e) {
        localUsable = false;
      }
    }

    if (sessionUsable) {
      try {
        window.sessionStorage.setItem(k, v);
      } catch (e) {
        sessionUsable = false;
      }
    }
  },

  removeItem: (key) => {
    const k = String(key);
    memoryCache.delete(k);

    if (localUsable) {
      try {
        window.localStorage.removeItem(k);
      } catch (e) {
        localUsable = false;
      }
    }

    if (sessionUsable) {
      try {
        window.sessionStorage.removeItem(k);
      } catch (e) {
        sessionUsable = false;
      }
    }
  },

  clear: () => {
    memoryCache.clear();

    if (localUsable) {
      try {
        window.localStorage.clear();
      } catch (e) {
        localUsable = false;
      }
    }

    if (sessionUsable) {
      try {
        window.sessionStorage.clear();
      } catch (e) {
        sessionUsable = false;
      }
    }
  },

  key: (index) => {
    if (localUsable) {
      try {
        return window.localStorage.key(index);
      } catch (e) {
        localUsable = false;
      }
    }
    const keys = Array.from(memoryCache.keys());
    return keys[index] || null;
  },

  get length() {
    if (localUsable) {
      try {
        return window.localStorage.length;
      } catch (e) {
        localUsable = false;
      }
    }
    return memoryCache.size;
  }
};

export default safeStorage;

