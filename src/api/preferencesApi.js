import { PREFERENCES_KEY, mockResponse, readStorage, writeStorage } from "./mockClient.js";

const defaults = {
  theme: "light",
  language: "ko",
  location: "South Korea",
  hiddenWordsEnabled: false,
  hiddenWords: [
    "ㅅㅂ",
    "씨발",
    "시발",
    "ㅂㅅ",
    "병신",
    "개새끼",
    "fuck",
    "fucking",
    "shit",
    "bitch",
    "spam",
    "scam",
    "스팸",
    "광고",
    "무료 이벤트",
    "무료 증정",
    "돈 벌기",
    "클릭하세요",
    "click here",
    "free money",
    "giveaway",
    "offensive",
    "misleading",
  ],
};

export async function getPreferences() {
  return mockResponse(readStorage(PREFERENCES_KEY, defaults));
}

export async function savePreferences(payload) {
  return mockResponse(writeStorage(PREFERENCES_KEY, { ...defaults, ...readStorage(PREFERENCES_KEY, defaults), ...payload }));
}
