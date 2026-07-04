/**
 * TMapCacheManager
 * TMAP API의 불필요한 중복 호출을 막기 위해 학교 간 거리 및 소요 시간을 브라우저 로컬 스토리지에 캐싱합니다.
 * 출발지(로그인한 유저의 소속 학교)와 도착지(수요 카드의 학교) 쌍을 키(key)로 사용하여 캐시를 관리합니다.
 */
export class TMapCacheManager {
    static CACHE_KEY = 'tmap_route_cache';

    /**
     * 로컬 스토리지에서 캐시 데이터를 가져옵니다.
     * @returns {Object} 캐시 딕셔너리
     */
    static _loadCache() {
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error("캐시 로드 실패", e);
            return {};
        }
    }

    /**
     * 캐시 데이터를 로컬 스토리지에 저장합니다.
     * @param {Object} cacheObj 
     */
    static _saveCache(cacheObj) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObj));
        } catch (e) {
            console.error("캐시 저장 실패", e);
        }
    }

    /**
     * 두 학교 간의 캐시된 거리 데이터를 조회합니다.
     * @param {string} startSchool 출발지 학교명 (유저 학교)
     * @param {string} endSchool 도착지 학교명 (카드 학교)
     * @returns {Object|null} { distance, travelTime } 또는 캐시가 없으면 null
     */
    static getCache(startSchool, endSchool) {
        if (!startSchool || !endSchool) return null;
        
        const cache = this._loadCache();
        const key = `${startSchool}_${endSchool}`;
        
        if (cache[key]) {
            console.log(`[TMapCacheManager] 캐시 적중: ${key}`);
            return cache[key];
        }
        return null;
    }

    /**
     * 두 학교 간의 거리 데이터를 캐싱합니다.
     * @param {string} startSchool 출발지 학교명
     * @param {string} endSchool 도착지 학교명
     * @param {number} distance 거리(km)
     * @param {number} travelTime 소요 시간(분)
     */
    static setCache(startSchool, endSchool, distance, travelTime) {
        if (!startSchool || !endSchool || distance === null || travelTime === null) return;

        const cache = this._loadCache();
        const key = `${startSchool}_${endSchool}`;
        
        cache[key] = {
            distance: distance,
            travelTime: travelTime,
            timestamp: Date.now()
        };

        this._saveCache(cache);
        console.log(`[TMapCacheManager] 캐시 저장: ${key}`);
    }

    /**
     * 캐시를 완전히 초기화합니다.
     */
    static clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
    }
}

if (typeof window !== 'undefined') {
    window.TMapCacheManager = TMapCacheManager;
}
