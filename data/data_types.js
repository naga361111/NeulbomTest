/**
 * Data & Types Manager
 * 프로젝트 전반에서 사용되는 데이터 구조(구조체)와 타입(Enum 등)을 중앙에서 관리합니다.
 */

export const UserType = Object.freeze({
    STUDENT: "학부생",
    TEACHER: "선생님"
});

export const ContractType = Object.freeze({
    MONTHLY: "monthly",
    DAILY: "daily"
});

export const TeachingField = Object.freeze({
    ARTS_SPORTS: "예체능 (미술/음악)",
    IT_CODING: "IT / 기초 코딩",
    READING_ESSAY: "독서 / 논술",
    BASIC_SUBJECT: "기본 교과 보조"
});

export const DaysOfWeek = Object.freeze({
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일"
});

export const DayOrder = Object.freeze({
    [DaysOfWeek.MON]: 1,
    [DaysOfWeek.TUE]: 2,
    [DaysOfWeek.WED]: 3,
    [DaysOfWeek.THU]: 4,
    [DaysOfWeek.FRI]: 5,
    [DaysOfWeek.SAT]: 6,
    [DaysOfWeek.SUN]: 7
});

/**
 * 기본 유저 데이터 구조(템플릿)를 반환하는 팩토리 함수
 * @param {Object} data 초기화할 데이터
 * @returns {Object} 정규화된 유저 객체
 */
export function createUserTemplate(data = {}) {
    return {
        email: data.email || "",
        password: data.password || "",
        name: data.name || "",
        school: data.school || "",
        userType: data.userType || UserType.STUDENT,
        initial: data.initial || (data.name ? data.name.charAt(0) : ""),
        freeTimes: data.freeTimes || [], // [{ day: '월', startTime: 780, endTime: 900 }]
        contractType: data.contractType || ContractType.MONTHLY,
        teachingFields: data.teachingFields || []
    };
}

/**
 * 분 단위 시간을 HH:MM 문자열로 변환합니다.
 * @param {number} minutes 
 * @returns {string}
 */
export function formatMinutesToTime(minutes) {
    if (minutes == null || isNaN(minutes)) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 늘봄 긴급 수요 카드 데이터 구조(템플릿)
 * @param {Object} data 
 * @returns {Object} 정규화된 수요 카드 객체
 */
export function createNeulbomRequestTemplate(data = {}) {
    return {
        id: data.id || `req-${Date.now()}`,
        schoolName: data.schoolName || "",
        contractType: data.contractType || "",
        teachingFields: data.teachingFields || [],
        monthlyTimes: data.monthlyTimes || [],
        dailyTime: data.dailyTime || null,
        distance: data.distance || null,
        travelTime: data.travelTime || null,
        matchScore: data.matchScore || "0%"
    };
}

// 전역 객체에 노출
if (typeof window !== 'undefined') {
    window.UserType = UserType;
    window.ContractType = ContractType;
    window.TeachingField = TeachingField;
    window.DaysOfWeek = DaysOfWeek;
    window.DayOrder = DayOrder;
    window.createUserTemplate = createUserTemplate;
    window.formatMinutesToTime = formatMinutesToTime;
    window.createNeulbomRequestTemplate = createNeulbomRequestTemplate;
}
