/**
 * Match Manager
 * 사용자와 늘봄학교 수요 간의 적합도를 계산합니다.
 */
export class MatchManager {
    /**
     * 거리/소요 시간과 티칭 필드 겹치는 정도를 기반으로 적합도를 계산 (0~100%)
     * @param {Object} request - 늘봄학교 수요 데이터 (distance, travelTime, teachingFields 포함)
     * @param {Object} user - 로그인한 유저 데이터 (teachingFields 포함)
     * @returns {number} 0~100 사이의 적합도 점수 (정수)
     */
    static calculateMatchScore(request, user) {
        if (!user || !request) return 0;

        // -1. 계약 형태(ContractType) 일치 검사 (필수 조건)
        if (request.contractType !== user.contractType) {
            return 0;
        }
        // 0. 시간 호환성 검사 (필수 조건)
        // 수요처(카드)의 요구 시간이 유저의 공강 시간 내에 완전히 포함되는지 확인
        const userFreeTimes = user.freeTimes || [];
        let requiredTimes = [];
        
        if (request.contractType === 'monthly' && request.monthlyTimes) {
            requiredTimes = request.monthlyTimes;
        } else if (request.contractType === 'daily' && request.dailyTime) {
            requiredTimes = [request.dailyTime];
        } else {
            // contractType 정보가 없거나 일치하지 않는 경우의 대비책
            if (request.monthlyTimes && request.monthlyTimes.length > 0) {
                requiredTimes = request.monthlyTimes;
            } else if (request.dailyTime) {
                requiredTimes = [request.dailyTime];
            }
        }

        if (requiredTimes.length > 0) {
            // 모든 요구 시간이 유저의 공강 시간 중 하나에 완전히 포함되는지 확인
            const isTimeCovered = requiredTimes.every(reqTime => {
                return userFreeTimes.some(freeTime => {
                    return freeTime.day === reqTime.day &&
                           freeTime.startTime <= reqTime.startTime &&
                           freeTime.endTime >= reqTime.endTime;
                });
            });

            // 시간 조건이 맞지 않으면 매칭 불가(0점)
            if (!isTimeCovered) {
                return 0;
            }
        }

        let distanceScore = 0; // 50점 만점
        let fieldScore = 0;    // 50점 만점

        // 1. 소요 시간 또는 거리 계산 (50점 만점)
        if (request.travelTime != null) {
            // 소요 시간(분) 기준: 0~10분 50점, 10~60분 점진적 감소, 60분 초과 0점
            const time = request.travelTime;
            if (time <= 10) {
                distanceScore = 50;
            } else if (time <= 60) {
                // 10분일 때 50점, 60분일 때 0점 -> (time - 10) * (50 / 50) = time - 10
                // 50 - (time - 10) = 60 - time
                distanceScore = 50 - (time - 10);
            } else {
                distanceScore = 0;
            }
        } else if (request.distance != null) {
            // 거리(km) 기준: 0~5km 50점, 5~15km 점진적 감소, 15km 초과 0점
            const dist = request.distance;
            if (dist <= 5) {
                distanceScore = 50;
            } else if (dist <= 15) {
                distanceScore = 50 - ((dist - 5) * (50 / 10));
            } else {
                distanceScore = 0;
            }
        } else {
            // 위치 정보가 없는 경우 중립 점수 (25점)
            distanceScore = 25;
        }

        // 2. 티칭 필드 겹치는 정도 계산 (50점 만점)
        const reqFields = request.teachingFields || [];
        const userFields = user.teachingFields || [];

        if (reqFields.length === 0) {
            // 수요에서 요구하는 분야가 없으면 조건 없음으로 간주하여 만점
            fieldScore = 50;
        } else {
            // 띄어쓰기 및 줄바꿈 차이로 인한 매칭 실패를 방지하기 위해 정규화 함수 사용
            const normalize = str => (str || '').replace(/\s+/g, '');
            const normalizedUserFields = userFields.map(normalize);

            // 교집합 개수 기반 점수 산정 (일부만 일치해도 부분 점수 부여)
            const overlapCount = reqFields.filter(f => normalizedUserFields.includes(normalize(f))).length;
            fieldScore = (overlapCount / reqFields.length) * 50;
        }

        // 3. 총점 합산 후 반올림하여 반환
        return Math.max(0, Math.min(100, Math.round(distanceScore + fieldScore)));
    }
}

if (typeof window !== 'undefined') {
    window.MatchManager = MatchManager;
}
