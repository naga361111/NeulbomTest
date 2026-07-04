import { DefaultUsersData } from '../data/default_users.js';
import { DayOrder } from '../data/data_types.js';
import { MOCK_SCHEDULES } from '../data/mock_schedules.js';

/**
 * AuthManager
 * 로컬 스토리지를 활용하여 서버 없이 계정을 관리(회원가입, 로그인 등)하는 모듈입니다.
 * UI 코드와 완전히 분리되어 있어, 어떤 뷰/UI에서도 재사용할 수 있습니다.
 */
export class AuthManager {
    static STORAGE_KEY = 'eduBridgeUsers';

    static DEFAULT_USERS = typeof DefaultUsersData !== 'undefined' ? DefaultUsersData : [];

    /**
     * DB 초기화: 저장된 계정 정보가 없거나 구형 데이터(강원대 학생회 또는 role 속성 존재)가 남아있을 경우 기본 사용자 목록으로 초기화합니다.
     */
    static init() {
        let users = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        if (!users || users.some(u => u.name === '강원대 학생회' || u.role !== undefined)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.DEFAULT_USERS));
        }
    }

    /**
     * 전체 유저 목록을 반환합니다.
     * @returns {Array} 사용자 객체 배열
     */
    static getUsers() {
        this.init();
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    }

    /**
     * 새로운 사용자를 등록합니다. (회원가입)
     * @param {Object} newUser - { email, password, name, school, userType, initial }
     * @returns {boolean} 가입 성공 여부 (이메일 중복 시 false 반환)
     */
    static registerUser(newUser) {
        const users = this.getUsers();
        if (users.some(u => u.email === newUser.email)) {
            return false; // 이메일 중복
        }
        users.push(newUser);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        return true;
    }

    /**
     * 이메일과 비밀번호로 로그인합니다.
     * @param {string} email
     * @param {string} password
     * @returns {Object|null} 성공 시 사용자 객체, 실패 시 null
     */
    static login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        return user || null;
    }

    /**
     * 현재 로그인된 사용자 정보를 세션에 저장합니다.
     * @param {Object} user 
     */
    static setSession(user) {
        sessionStorage.setItem('eduBridgeCurrentUser', JSON.stringify(user));
    }

    /**
     * 현재 로그인된 사용자 정보를 가져옵니다.
     * @returns {Object|null}
     */
    static getCurrentUser() {
        const data = sessionStorage.getItem('eduBridgeCurrentUser');
        return data ? JSON.parse(data) : null;
    }

    /**
     * 로그아웃 (세션 삭제)
     */
    static logout() {
        sessionStorage.removeItem('eduBridgeCurrentUser');
    }

    /**
     * 사용자 정보를 업데이트합니다.
     * @param {string} email
     * @param {Object} newData 업데이트할 데이터
     * @returns {Object|null} 업데이트된 사용자 객체
     */
    static updateUser(email, newData) {
        let users = this.getUsers();
        let userIndex = users.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...newData };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
            
            // 만약 현재 세션 유저와 같다면 세션도 업데이트
            let currentUser = this.getCurrentUser();
            if (currentUser && currentUser.email === email) {
                this.setSession(users[userIndex]);
            }
            return users[userIndex];
        }
        return null;
    }

    /**
     * 특정 이름을 가진 이미지를 업로드하면 JSON 설정 파일에서 매칭되는 공강 시간을 유저 정보에 등록합니다.
     * @param {File} file 업로드된 파일
     * @returns {Promise<Array|null>} 생성된 공강 시간 배열 (매칭되는 파일명이 없으면 null)
     */
    static async processScheduleImage(file) {
        if (!file) return null;
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        const fileName = file.name;

        try {
            const schedules = typeof MOCK_SCHEDULES !== 'undefined' ? MOCK_SCHEDULES : {};
            const freeTimes = schedules[fileName];

            if (freeTimes) {
                // 요일, 시간 순으로 정렬
                freeTimes.sort((a, b) => {
                    if (DayOrder[a.day] !== DayOrder[b.day]) return DayOrder[a.day] - DayOrder[b.day];
                    return a.startTime - b.startTime;
                });

                // 유저 정보에 공강 시간 업데이트
                this.updateUser(currentUser.email, { freeTimes: freeTimes });
                return freeTimes;
            }
        } catch (error) {
            console.error('설정 파일을 읽는 중 오류 발생:', error);
        }

        return null;
    }
}

// 모듈 로드 시 자동 초기화
AuthManager.init();

if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}
