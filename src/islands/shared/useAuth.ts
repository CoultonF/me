import { useState, useEffect } from 'react';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/check')
      .then((res) => res.ok ? res.json() as Promise<{ authenticated: boolean }> : null)
      .then((data) => {
        if (data?.authenticated) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  return authenticated;
}
