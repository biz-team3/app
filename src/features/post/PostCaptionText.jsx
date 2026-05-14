import { forwardRef } from "react";
import { splitCaptionTokens } from "../../utils/hashtags.js";

export const PostCaptionText = forwardRef(function PostCaptionText(
  { caption = "", authorName = "", collapsed = false, maxHeight, className = "" },
  ref,
) {
  const tokens = splitCaptionTokens(caption);
  // pre-line은 직접 입력한 줄바꿈만 보존하고, text-left 계열은 양끝 정렬식 간격 벌어짐을 막음
  // keep-all은 한글/영문 단어 중간 줄바꿈을 줄임
  const captionClassName = [
    "whitespace-pre-line text-left [text-align-last:left] [word-break:keep-all]",
    collapsed ? "overflow-hidden" : "",
    className,
  ].filter(Boolean).join(" ");
  const captionStyle = collapsed && maxHeight ? { maxHeight } : undefined;

  return (
    <p ref={ref} className={captionClassName} style={captionStyle}>
      {authorName ? <span className="mr-2 font-bold">{authorName}</span> : null}
      {tokens.map((token, index) => (
        <span
          key={`${token.type}-${index}`}
          // 일반 본문은 단어 단위 줄바꿈을 우선하고, 너무 긴 URL/영문만 예외적으로 꺾음
          className={token.type === "hashtag" ? "whitespace-nowrap" : "[overflow-wrap:break-word]"}
        >
          {token.text}
        </span>
      ))}
    </p>
  );
});
