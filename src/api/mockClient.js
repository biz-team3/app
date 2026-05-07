export const AUTH_TOKEN_KEY = "auth.accessToken";
export const AUTH_USER_KEY = "auth.user";
export const PREFERENCES_KEY = "app.preferences";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) return null;
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  return text ? { message: text } : null;
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    const message = data?.detail || data?.message || `API request failed: ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status, data });
  }

  return data;
}

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
