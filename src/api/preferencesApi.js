import { PREFERENCES_KEY, readStorage, writeStorage } from "./apiClient.js";
import { DEFAULT_HIDDEN_WORDS } from "../utils/hiddenWords.js";

const PREFERENCES_SCHEMA_VERSION = 2;

const defaults = {
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
  theme: "light",
  language: "ko",
  location: "South Korea",
  hiddenWordsEnabled: false,
  hiddenWords: DEFAULT_HIDDEN_WORDS,
};

function normalizePreferences(storedPreferences = {}) {
  const stored = storedPreferences && typeof storedPreferences === "object" ? storedPreferences : {};
  const hasCurrentSchema = Number(stored.schemaVersion || 0) >= PREFERENCES_SCHEMA_VERSION;
  const hiddenWords = Array.isArray(stored.hiddenWords) && stored.hiddenWords.length > 0
    ? stored.hiddenWords
    : DEFAULT_HIDDEN_WORDS;

  return {
    ...defaults,
    ...stored,
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    hiddenWordsEnabled: hasCurrentSchema ? Boolean(stored.hiddenWordsEnabled) : false,
    hiddenWords,
  };
}

export async function getPreferences() {
  const preferences = normalizePreferences(readStorage(PREFERENCES_KEY, defaults));
  writeStorage(PREFERENCES_KEY, preferences);
  return Promise.resolve(preferences);
}

export async function savePreferences(payload) {
  const currentPreferences = normalizePreferences(readStorage(PREFERENCES_KEY, defaults));
  return Promise.resolve(writeStorage(PREFERENCES_KEY, normalizePreferences({ ...currentPreferences, ...payload })));
}
