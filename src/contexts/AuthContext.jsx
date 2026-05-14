import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginApi, logout as logoutApi } from "../api/authApi.js";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, clearAccessToken, getAccessToken, readStorage } from "../api/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [user, setUser] = useState(() => readStorage(AUTH_USER_KEY, null));
  const [loading, setLoading] = useState(Boolean(accessToken));

  const refreshMe = useCallback(async () => {
    const token = getAccessToken();
    setAccessToken(token);
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
      return me;
    } catch (error) {
      clearAccessToken();
      localStorage.removeItem(AUTH_USER_KEY);
      setAccessToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (credentials) => {
    const result = await loginApi(credentials);
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await logoutApi();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAccessToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      authenticated: Boolean(accessToken),
      login,
      logout,
      refreshMe,
    }),
    [accessToken, user, loading, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
