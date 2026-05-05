import { PREFERENCES_KEY, mockResponse, readStorage, writeStorage } from "./mockClient.js";

const defaults = {
  theme: "light",
  language: "ko",
  location: "South Korea",
};

export async function getPreferences() {
  return mockResponse(readStorage(PREFERENCES_KEY, defaults));
}

export async function savePreferences(payload) {
  return mockResponse(writeStorage(PREFERENCES_KEY, { ...defaults, ...readStorage(PREFERENCES_KEY, defaults), ...payload }));
}
