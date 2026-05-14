import {apiRequest, AUTH_USER_KEY, clearAccessToken, setAccessToken, writeStorage} from "./apiClient.js";

const MOCK_PASSWORD = "password";

export async function login({ username, password }) {
  if (!username || !password) {
    throw new Error("username and password are required");
  }

  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  setAccessToken(result.accessToken);
  writeStorage(AUTH_USER_KEY, result.user);

  return result;
}

export async function logout() {
  try {
    await apiRequest("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAccessToken();
    localStorage.removeItem(AUTH_USER_KEY);
  }

  return null;
}

export async function getMe() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  });
}
