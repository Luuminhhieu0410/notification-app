import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { LocalUser } from '@/databases/repositories/user.repository';
import { syncCurrentUser } from '@/services/app-bootstrap';

interface UserContextValue {
  user: LocalUser | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setUser(await syncCurrentUser());
    } catch (refreshError: unknown) {
      setError(
        refreshError instanceof Error
          ? refreshError
          : new Error('Failed to synchronize user'),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, isLoading, error, refresh }),
    [error, isLoading, refresh, user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
