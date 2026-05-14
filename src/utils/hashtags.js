const HASHTAG_PATTERN = /#[^\s#]+/g;

export function extractHashtags(text = "") {
  return Array.from(new Set(text.match(HASHTAG_PATTERN) || []));
}

export function stripHashtags(text = "") {
  return text.replace(HASHTAG_PATTERN, "").trim();
}

export function splitCaptionTokens(caption = "") {
  const tokens = [];
  let lastIndex = 0;

  // 해시태그를 별도 토큰으로 분리해서 렌더링 시 중간 줄바꿈을 막기 위함임
  caption.replace(HASHTAG_PATTERN, (match, offset) => {
    if (offset > lastIndex) {
      tokens.push({ type: "text", text: caption.slice(lastIndex, offset) });
    }

    tokens.push({ type: "hashtag", text: match });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < caption.length) {
    tokens.push({ type: "text", text: caption.slice(lastIndex) });
  }

  return tokens;
}
