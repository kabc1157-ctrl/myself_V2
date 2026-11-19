# 이음새 V2

이음새는 일상 기록과 일정, 습관, 건강·재정 정보를 한곳에서 관리하고 분석하는 개인용 웹 앱입니다.

## 주요 기능

- 메모와 체크리스트 기록
- 일기, 루틴, 일정 관리
- 독서 문장, 운동, 월급, 투자 기록
- 마이페이지에서 닉네임·주 시작 요일·AI 성향·기상/취침 시간 설정
- AI 분석 및 기록 요약
- Google Calendar 연결과 일정 조회·관리

## 기술 스택

- Next.js 15 · React 19 · TypeScript
- Supabase Auth, PostgreSQL
- Google Calendar OAuth
- Vitest · Playwright

## 로컬 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 환경변수

로컬 환경과 Vercel 프로젝트에 다음 환경변수를 설정해야 합니다. 값은 저장소에 커밋하지 않습니다.

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
GOOGLE_CALENDAR_REDIRECT_URI
INTEGRATION_TOKEN_ENCRYPTION_KEY
```

Google Calendar를 사용할 때는 `GOOGLE_CALENDAR_REDIRECT_URI`가 Supabase Auth 설정과 Google Cloud OAuth 클라이언트의 승인된 리디렉션 URI에 등록된 주소와 정확히 일치해야 합니다.

## 검증 명령

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

브라우저 시나리오 테스트가 필요한 경우:

```bash
npm run test:e2e
```

## 브랜치와 배포

- `preview/v2-initial`: V2 Preview 검증용 브랜치
- `main`: Production 배포 브랜치

`main`에 변경사항을 병합하면 Vercel Production 배포가 시작될 수 있으므로, Preview 검증과 승인을 먼저 완료합니다.

## 데이터 보호 원칙

- V1 코드와 데이터는 변경하지 않습니다.
- 기존 V2 사용자 데이터는 삭제하거나 초기화하지 않습니다.
- Supabase의 기존 기록을 보존하며 필요한 변경만 적용합니다.
- 비밀키와 OAuth 토큰은 저장소에 포함하지 않습니다.

## 프로젝트 구조

```text
src/app       Next.js 페이지와 API 라우트
src/components 공통 UI 컴포넌트
src/core      인증, Supabase, 도메인 로직
supabase/     데이터베이스 마이그레이션
tests/        단위·통합 테스트
```
