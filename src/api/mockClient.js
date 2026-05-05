export const AUTH_TOKEN_KEY = "auth.accessToken";
export const AUTH_USER_KEY = "auth.user";
export const PREFERENCES_KEY = "app.preferences";

export function mockResponse(data, options = {}) {
  const { delay = 120 } = options;
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(structuredClone(data)), delay);
  });
}

export function mockError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return Promise.reject(error);
}

export function readStorage(key, fallback = null) {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function requireToken() {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Missing mock JWT token");
  }
  return token;
}
