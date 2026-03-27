# 카카오톡 입장자 체크봇 패치본

## 이번 패치에 반영한 내용
- 기존 A/B 고정 패널 제거
- 패널 1개 시작 + `패널 추가`로 동일 기능 복제 가능
- 연결 스프레드시트 고정
  - `1qclrbo3_VG-sSNIqMW4j1juzwP3nq_ZaT-y1z6WLafc`
- 선택 탭의 **C열(이름), D열(전화번호)** 를 읽고 **M열**에 `입장` 기록
- 탭 검색 기능 추가
- txt/csv **여러 파일 업로드** 지원
- 로그인 허용 도메인에 `titanz.co.kr` 추가
- 코드 모듈화
  - `config.js`
  - `auth.js`
  - `sheets.js`
  - `parser.js`
  - `matcher.js`
  - `ui.js`
  - `app.js`

## 파일 구조
- `index.html` : 메인 화면
- `styles.css` : 스타일
- `js/` : 기능별 모듈

## 사용 방법
1. `index.html` 을 웹서버 또는 호스팅 주소에서 연다.
2. Google 로그인한다.
3. 탭 목록을 불러온다.
4. 패널별로 탭 선택 + 로그 파일 업로드 후 실행한다.

## titanz.co.kr 계정 추가 시 꼭 해야 하는 것
앱 코드에 도메인을 허용해도, 아래 두 가지를 같이 해야 실제 로그인/접근이 됩니다.

### 1) 스프레드시트 공유
고정 시트를 `@titanz.co.kr` 계정에 편집자 또는 필요한 권한으로 공유해야 합니다.

### 2) Google Cloud OAuth 설정
현재 쓰는 OAuth 클라이언트가 외부 계정을 허용해야 합니다.

- Google Cloud Console > **Google Auth Platform** 으로 이동
- **Branding / Audience / Clients** 쪽 설정 확인
- OAuth 앱이 **Internal** 이면 다른 조직 계정(`titanz.co.kr`)은 로그인 불가
- 이 경우 **External** 로 사용 가능한 프로젝트/앱이어야 함
- 앱이 테스트 상태라면 `titanz` 계정을 **Test users** 에 추가
- 현재 페이지를 여는 주소를 **Authorized JavaScript origins** 에 추가
  - 예: `https://your-domain.vercel.app`
  - 예: `http://localhost:5500`

## 주의
- `file://` 로 직접 열면 OAuth origin 문제로 막힐 수 있습니다.
- 간단한 로컬 테스트라도 `Live Server`, `http-server`, Vercel 등 **http/https 주소** 에서 여는 편이 안전합니다.
