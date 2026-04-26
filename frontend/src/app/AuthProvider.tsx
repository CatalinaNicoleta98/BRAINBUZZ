import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { fetchMe, login, register } from "../shared/api/auth";
import type { AuthUser } from "../shared/types/auth";
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from "../shared/utils/authStorage";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  loginWithPassword: (payload: { email: string; password: string }) => Promise<void>;
  registerWithPassword: (payload: { displayName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getAuthToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const profile = await fetchMe(storedToken);
        setToken(storedToken);
        setUser(profile);
        saveAuthSession(storedToken, profile);
      } catch {
        clearAuthSession();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loginWithPassword(payload: { email: string; password: string }) {
    const response = await login(payload);
    setToken(response.token);
    setUser(response.user);
    saveAuthSession(response.token, response.user);
  }

  async function registerWithPassword(payload: { displayName: string; email: string; password: string }) {
    const response = await register(payload);
    setToken(response.token);
    setUser(response.user);
    saveAuthSession(response.token, response.user);
  }

  function logout() {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, loginWithPassword, registerWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
