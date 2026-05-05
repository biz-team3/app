export function extractHashtags(caption = "") {
  return caption.match(/#[\wㄱ-ㅎㅏ-ㅣ가-힣]+/g) || [];
}

export function stripHashtags(caption = "") {
  return caption.replace(/#[\wㄱ-ㅎㅏ-ㅣ가-힣]+/g, "").trim();
}
