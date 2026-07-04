import { createUserTemplate, UserType } from './data_types.js';

export const DefaultUsersData = [
    createUserTemplate({
        email: 'admin@bridge.com',
        password: 'admin1234',
        name: '장동연',
        school: '강원대학교',
        userType: UserType.STUDENT
    })
];

if (typeof window !== 'undefined') {
    window.DefaultUsersData = DefaultUsersData;
}
