import { PREFERENCES_KEY, readStorage, writeStorage } from "./apiClient.js";
import { DEFAULT_HIDDEN_WORDS } from "../utils/hiddenWords.js";

const defaults = {
  theme: "light",
  language: "ko",
  location: "South Korea",
  hiddenWordsEnabled: false,
  hiddenWords: DEFAULT_HIDDEN_WORDS,
};

export async function getPreferences() {
  return Promise.resolve(readStorage(PREFERENCES_KEY, defaults));
}

export async function savePreferences(payload) {
  return Promise.resolve(writeStorage(PREFERENCES_KEY, { ...defaults, ...readStorage(PREFERENCES_KEY, defaults), ...payload }));
}
