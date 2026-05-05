# app

React + JavaScript + Tailwind CSS 기반 프론트입니다. 현재 데이터는 `src/api/*.js`의 Promise 기반 mock API를 통해 받고 있으며, 실제 Spring Boot API로 교체할 때는 각 API 파일의 TODO 주석을 기준으로 바꿉니다.

## 실행

```bash
npm install
npm run dev
npm run build
```

## Mock API 교체 기준

컴포넌트는 mock 데이터를 직접 import하지 않습니다.

```text
component -> src/api/*.js -> src/mocks/*.js
```

Spring Boot 연동 시에는 `src/api/*.js` 내부의 mock 접근만 HTTP 요청으로 교체합니다. 컴포넌트 props와 화면에서 기대하는 응답 형태는 최대한 유지합니다.

예시:

```js
// TODO API: Spring Boot 연동 시 DELETE /api/follows/{targetUserId} 로 교체
export async function unfollowUser(targetUserId) {
  // mock 구현
}
```

위 주석은 아래처럼 바꾸면 됩니다.

```js
import { apiRequest } from "./mockClient.js";

export async function unfollowUser(targetUserId) {
  return apiRequest(`/api/follows/${targetUserId}`, {
    method: "DELETE",
  });
}
```

## 공통 HTTP 클라이언트 권장 형태

실제 API 연결 시 `src/api/mockClient.js`에 공통 요청 함수를 두고, 모든 API 파일에서 이 함수를 사용합니다.

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("auth.accessToken");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
```

백엔드 주소는 `.env`에 둡니다.

```text
VITE_API_BASE_URL=http://localhost:8080
```

## 백엔드 명세에 맞춰 수정하는 방식

백엔드 응답 필드가 프론트 기대값과 다르면 컴포넌트를 바로 고치기보다 API 파일에서 변환합니다.

예를 들어 백엔드가 아래처럼 응답한다고 가정합니다.

```json
{
  "id": 10,
  "writer": {
    "id": 1,
    "nickname": "oosu.hada",
    "profileImage": "/images/me.jpg"
  },
  "contents": "본문",
  "likes": 24
}
```

프론트가 기대하는 형태는 `postId`, `author.username`, `caption`, `likeCount`입니다. 그러면 `postsApi.js`에서 변환합니다.

```js
function toPost(raw) {
  return {
    postId: raw.id,
    author: {
      userId: raw.writer.id,
      username: raw.writer.nickname,
      profileImageUrl: raw.writer.profileImage,
    },
    caption: raw.contents,
    likeCount: raw.likes,
  };
}
```

이렇게 하면 UI 컴포넌트 수정 범위를 줄일 수 있습니다.

## 값이 수정되는 경우

사용자가 화면에서 값을 수정하면 아래 흐름을 따릅니다.

```text
사용자 입력 -> API 함수 호출 -> 백엔드 PATCH/POST/DELETE -> API 응답을 프론트 형태로 변환 -> 화면 재조회 또는 상태 반영
```

예시: 팔로우 취소

```js
// followsApi.js
export async function unfollowUser(targetUserId) {
  const result = await apiRequest(`/api/follows/${targetUserId}`, {
    method: "DELETE",
  });

  return {
    targetUserId,
    viewerRelation: result.viewerRelation,
    canViewContent: result.canViewContent,
  };
}
```

예시: 프로필 수정

```js
// profileApi.js
export async function updateProfile(userId, payload) {
  const result = await apiRequest(`/api/profiles/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return toProfile(result);
}
```

수정 API는 가능하면 백엔드가 수정 후 최신 리소스를 반환하도록 맞춥니다. 백엔드가 `204 No Content`만 반환한다면, 프론트에서 수정 후 조회 API를 한 번 더 호출합니다.

```js
await apiRequest(`/api/profiles/users/${userId}`, {
  method: "PATCH",
  body: JSON.stringify(payload),
});

return getProfileByUserId(userId);
```

## API 파일별 교체 위치

```text
src/api/authApi.js           로그인, 로그아웃, 현재 사용자 조회
src/api/usersApi.js          사용자 생성/조회/수정/삭제
src/api/profileApi.js        프로필 조회, 프로필 게시물/스토리, 프로필 수정
src/api/postsApi.js          피드, 게시물 상세, 게시물 CRUD, 좋아요
src/api/commentsApi.js       댓글 CRUD
src/api/storiesApi.js        스토리 피드, 스토리 묶음 조회
src/api/followsApi.js        팔로우, 언팔로우
src/api/notificationsApi.js  알림, 팔로우 요청
src/api/preferencesApi.js    프론트 로컬 설정
```

`preferencesApi.js`는 서버 API가 아니라 `localStorage["app.preferences"]`를 쓰는 프론트 로컬 설정입니다. theme, language, location처럼 서버 저장이 필요 없는 값만 둡니다.

## 작업 규칙

- 백엔드 API 명세가 바뀌면 먼저 `src/api/*.js`의 변환 함수를 수정합니다.
- 컴포넌트는 가능하면 기존 응답 형태를 계속 받게 유지합니다.
- id로 수정/삭제 가능한 값은 username이 아니라 id 기준으로 요청합니다.
- `create*()`가 있으면 `get/update/delete` 흐름도 같이 확인합니다.
- JWT는 `localStorage["auth.accessToken"]`에서 읽어 `Authorization: Bearer`로 보냅니다.
- mock 제거 시 `src/mocks/*.js`는 삭제하지 말고 참고 데이터로 남겨둘 수 있습니다.
