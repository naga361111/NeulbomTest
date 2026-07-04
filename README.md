# 에듀-브릿지 (Edu-Bridge) 코어 모듈 가이드

이 문서는 에듀-브릿지 서비스의 **데이터 모델링** 및 **비즈니스 로직(Managers)**을 담당하는 핵심 모듈들의 아키텍처와 사용법을 설명합니다. 

이 프로젝트의 모든 매니저와 데이터 파일들은 다른 HTML 전용 프로젝트에서도 그대로 복사해서 쓸 수 있도록 **독립적인 ES6 모듈 구조**를 가지면서도, 편의를 위해 **전역 객체(`window`)에 노출**되도록 설계되었습니다.

---

## 📌 아키텍처 개요 (Architecture Overview)

- **Pure ES6 Modules**: 모든 `data/` 및 `managers/` 파일은 `export` / `import` 구문을 사용하는 ES6 모듈입니다.
- **Global `window` Binding**: 레거시 HTML/인라인 스크립트 기반 프로젝트에서의 호환성을 위해, 모듈 실행 시 스스로를 `window` 객체에 바인딩합니다 (예: `window.AuthManager = AuthManager`).
- **No DB/Backend**: Firebase나 별도의 백엔드 없이 `localStorage` 및 정적 객체 데이터를 활용하여 완벽히 프론트엔드 단독으로 구동 가능합니다.

---

## 🚀 적용 방법 (Setup in New Project)

다른 프로젝트에서 이 모듈들을 사용하려면 다음 두 가지 스텝만 거치면 됩니다.

### 1. `main.html` (또는 메인 HTML 파일) 스크립트 추가
모듈들은 상호 의존성이 있으므로 아래의 순서대로 `<body>` 또는 `<head>`에 포함시킵니다.

```html
<!-- 1. 환경변수 및 TMAP SDK (순서 매우 중요 - 동기 로딩 방식) -->
<script src="./env.js"></script>
<script>
    // env.js에서 불러온 키로 Tmap SDK를 동기식으로 먼저 로드합니다.
    document.write('<scr' + 'ipt src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=' + window.ENV.TMAP_APP_KEY + '"></scr' + 'ipt>');
</script>

<!-- 2. 코어 매니저 및 데이터 (type="module" 필수) -->
<script type="module" src="./managers/tmap_manager.js"></script>
<script type="module" src="./data/data_types.js"></script>
<script type="module" src="./data/mock_schedules.js"></script>
<script type="module" src="./data/default_users.js"></script>
<script type="module" src="./managers/auth_manager.js"></script>
<script type="module" src="./managers/tmap_cache_manager.js"></script>
<script type="module" src="./data/neulbom_requests.js"></script>
<script type="module" src="./managers/match_manager.js"></script>
```

### 2. JS에서 활용
파일들이 모듈로 로드됨과 동시에 `window` 객체에 자동 등록되므로, 기존처럼 곧바로 전역 변수 형태로 접근할 수 있습니다.
```javascript
// 예: 로그인 후 대시보드 렌더링
function handleLogin() {
    const user = AuthManager.login("test@test.com", "password");
    if (user) {
        // Tmap 렌더링
        const map = TMapManager.render('tmap-container');
    }
}
```

---

## 🗂️ 데이터 레이어 (`/data`)

데이터 타입과 초기 목업(Mock) 데이터를 정의합니다.

### 1. `data_types.js`
- **역할**: 전역으로 사용될 Enum 데이터(상수 객체)들을 정의합니다.
- **주요 객체**:
  - `ContractType`: 계약 유형 (월별/일별)
  - `TeachingField`: 지도 가능 분야 목록
  - `DaysOfWeek`: 요일 매핑용 상수
- **사용법**: `console.log(window.ContractType.MONTHLY); // 'monthly'`

### 2. `default_users.js`
- **역할**: 테스트 및 초기 데모 환경을 위한 기본 유저 데이터를 보유합니다.
- **주요 객체**: `DefaultUsersData` (배열)

### 3. `mock_schedules.js`
- **역할**: 에브리타임 시간표 이미지를 업로드할 때 가상으로 매핑해줄 공강 시간 데이터를 보유합니다.
- **주요 객체**: `MOCK_SCHEDULES` (Key-Value 맵핑 객체)
- **비고**: `AuthManager.processScheduleImage()`에서 내부적으로 참조합니다.

### 4. `neulbom_requests.js`
- **역할**: 실시간 늘봄 긴급 수요 카드 리스트 데이터를 관리합니다.
- **주요 객체**: `NeulbomRequestsData` (배열)
- **비고**: TMAP 경로/시간 계산 및 MatchManager에 의한 적합도 산출에 사용되는 원본 데이터입니다.

---

## 🛠️ 매니저 레이어 (`/managers`)

각 비즈니스 로직을 캡슐화한 클래스입니다. 모든 메서드는 `static`으로 구현되어 있어 인스턴스 생성 없이 바로 사용 가능합니다.

### 1. `AuthManager` (`auth_manager.js`)
사용자 인증 및 로컬 데이터베이스(`localStorage`) 관리.
- `login(email, password)`: 사용자 검증 및 반환
- `registerUser(newUser)`: 신규 유저 생성
- `setSession(user)` / `logout()`: `sessionStorage`를 통한 로그인 세션 관리
- `getCurrentUser()`: 현재 세션 로그인 사용자 획득
- `updateUser(email, newData)`: 유저 정보 업데이트(공강 시간 등)
- `processScheduleImage(file)`: 파일명을 바탕으로 Mock 공강 시간 반환

### 2. `TMapManager` (`tmap_manager.js`)
TMAP API 호출 및 맵 렌더링 엔진.
- `render(containerId, lat, lng)`: 지정한 `div`에 지도를 렌더링하여 Map 객체를 반환합니다.
- `calculateRealDistance(startSchool, endSchool)`: TMAP 도보 경로 API를 호출하여 실제 거리(km)와 소요 시간(분)을 반환합니다.
- `drawRouteBetweenSchools(mapObj, startSchool, endSchool)`: 검색된 경로를 바탕으로 폴리라인(선)과 마커를 맵에 드로잉합니다.
- `clearMapObjects()`: 맵 위에 그려진 기존 마커/경로를 지웁니다.

### 3. `TMapCacheManager` (`tmap_cache_manager.js`)
TMAP API 호출 횟수를 획기적으로 줄이기 위한 인메모리 캐싱 시스템.
- `getCache(startName, endName)`: 기존에 검색한 두 위치간의 거리/시간 결과 캐시 반환
- `setCache(startName, endName, distance, travelTime)`: 새 검색 결과 캐싱
- **작동 원리**: "강원대학교 -> 봄내초" 와 "봄내초 -> 강원대학교"를 동일 경로로 취급하여 양방향 캐싱을 지원합니다.

### 4. `MatchManager` (`match_manager.js`)
수요처(초등학교)와 공급자(대학생)의 조건 적합도를 산출하는 스코어링 엔진.
- `calculateMatchScore(requestCard, user)`: 0~100 사이의 적합도 점수를 반환합니다.
- **채점 기준**:
  - 거리 및 도보 소요 시간 (가까울수록 가점)
  - 계약 유형(일별/월별) 일치 여부
  - 희망 지도 분야 일치 여부
  - 요일 및 시간 매칭 여부 (현재 요일/시간과 공강 시간이 겹치는지 분석)

---

## 💡 개발 시 주의사항
1. **의존성 순서**: `type="module"` 스크립트는 문서 렌더링 이후 순차적으로 실행됩니다. 따라서 인라인 이벤트(예: 버튼 `onclick`) 클릭 시점이나 `DOMContentLoaded` 이벤트 시점에서는 모든 `window` 매니저 객체가 초기화된 상태이므로 안전합니다.
2. **TMAP API Key**: API Key는 하드코딩되지 않고 `env.js`에서 주입됩니다. `env.js`를 `.gitignore`에 등록해 외부에 유출되지 않도록 관리하세요.
3. **Data Persistency**: `AuthManager`를 제외한 늘봄 수요(`neulbom_requests.js`) 등은 현재 데모 목적으로 메모리 기반 변수로 동작합니다. 영구 저장이 필요할 경우 `localStorage`를 활용하는 형태로 리팩토링할 수 있습니다.
