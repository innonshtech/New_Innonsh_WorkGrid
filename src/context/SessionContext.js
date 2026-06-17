'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const safeJson = async (response) => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (e) {
        console.error('Failed to parse JSON despite content-type:', e);
        return { error: 'JSON Parse Error', details: 'The server returned an invalid JSON response', status: response.status };
      }
    }
    const text = await response.text();
    console.warn(`Received non-JSON response (${response.status}):`, text.substring(0, 100));

    // Provide more specific error for 404 which often happens on cold starts
    if (response.status === 404) {
      return {
        error: 'Route not found (404)',
        message: 'The server is still starting up. Please wait up to a minute on the very first run...',
        isRetryable: true,
        details: text.substring(0, 50)
      };
    }

    return { error: 'Invalid server response', details: text.substring(0, 50), status: response.status };
  };

  const fetchSession = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/v1/session', {
        credentials: 'include',
        cache: 'no-store'
      });

      const data = await safeJson(response);
      console.log(`[SessionCheck] Attempt ${retryCount + 1} status: ${response.status}`, data);

      if (response.ok && data.user) {
        setUser(data.user);
        setLoading(false);
      } else if ((response.status >= 500 || response.status === 404) && retryCount < 12) {
        // Retry if server is warming up (404) or experiencing issues (500+)
        // Increase retries to 12 (approx 1 minute total) for reliability after laptop restarts
        const nextRetry = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000); // Exponential backoff
        console.log(`Retrying session check (${nextRetry}/12) in ${delay}ms...`);
        setTimeout(() => fetchSession(nextRetry), delay);
      } else {
        setUser(null);
        setLoading(false);
        // Only redirect to login if we explicitly get a 401 or after retries fail
        if (response.status === 401 || retryCount >= 12) {
          if (window.location.pathname !== '/login') {
            router.push('/login');
          }
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      if (retryCount < 5) {
        const nextRetry = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
        setTimeout(() => fetchSession(nextRetry), delay);
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (username, password, role, retryCount = 0) => {
    try {
      const endpoint = '/api/v1/login';
      const payload = { username, password, role };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(response);
      console.log(`[Login] Attempt ${retryCount + 1} status: ${response.status}`, data);

      if (response.ok) {
        await fetchSession();
        return { success: true, user: data.user || data.employee };
      } else {
        // Retry logic for 404 or 5xx errors during startup
        const isRetryableStatus = response.status === 404 || response.status >= 500;
        if (isRetryableStatus && retryCount < 12) {
          const nextRetry = retryCount + 1;
          const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
          console.log(`Retrying login (${nextRetry}/12) in ${delay}ms...`);

          await new Promise(resolve => setTimeout(resolve, delay));
          return login(username, password, role, nextRetry);
        }

        return {
          success: false,
          message: data.message || data.error || `Login failed (${response.status})`
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      if (retryCount < 12) {
        const nextRetry = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return login(username, password, role, nextRetry);
      }
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SessionContext.Provider value={{ user, loading: loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};