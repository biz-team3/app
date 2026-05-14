const DEFAULT_HIDDEN_WORDS = [
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
];

export function normalizeHiddenWords(words = DEFAULT_HIDDEN_WORDS) {
  return words
    .map((word) => String(word || "").trim().toLowerCase())
    .filter(Boolean);
}

export function containsHiddenWord(text = "", words = DEFAULT_HIDDEN_WORDS) {
  const normalizedText = String(text || "").toLowerCase();
  if (!normalizedText) return false;

  return normalizeHiddenWords(words).some((word) => normalizedText.includes(word));
}
