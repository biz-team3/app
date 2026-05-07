import { currentUserId, findUserById, findUserByUsername } from "../mocks/db.js";
import { toUserSummary } from "./usersApi.js";
import { AUTH_USER_KEY, clearAccessToken, mockResponse, requireToken, setAccessToken, writeStorage } from "./mockClient.js";

const MOCK_PASSWORD = "password";

// TODO API: Spring Boot 연동 시 POST /api/auth/login 로 교체
export async function login({ username, password }) {
  if (!username || !password) {
    throw new Error("username and password are required");
  }
  const user = findUserByUsername(username);
  if (!user || user.userId !== currentUserId || password !== MOCK_PASSWORD) {
    throw new Error("invalid credentials");
  }
  const accessToken = `mock.jwt.${user.userId}.${Date.now()}`;
  const summary = toUserSummary(user);
  setAccessToken(accessToken);
  writeStorage(AUTH_USER_KEY, summary);
  return mockResponse({ accessToken, tokenType: "Bearer", user: summary });
}

// TODO API: Spring Boot 연동 시 POST /api/auth/logout 204 No Content로 교체
export async function logout() {
  clearAccessToken();
  localStorage.removeItem(AUTH_USER_KEY);
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 GET /api/auth/me 로 교체. Authorization: Bearer {accessToken} 포함.
export async function getMe() {
  requireToken();
  const user = findUserById(currentUserId);
  return mockResponse(toUserSummary(user));
}
