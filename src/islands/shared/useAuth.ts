import { useState, useEffect } from 'react';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Hit a private path — if CF Access blocks it, the response
    // won't be JSON (it'll be a redirect/login page), so we stay false.
    fetch('/private/api/auth-check', { redirect: 'manual' })
      .then((res) => {
        if (res.ok) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  return authenticated;
}
