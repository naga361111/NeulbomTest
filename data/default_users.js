import { createUserTemplate, UserType, ContractType, TeachingField } from './data_types.js';

export const DefaultUsersData = [
    createUserTemplate({
        email: 'admin@bridge.com',
        password: 'admin1234',
        name: '장동연',
        school: '강원대학교',
        userType: UserType.STUDENT,
        contractType: ContractType.MONTHLY,
        teachingFields: [TeachingField.IT_CODING, TeachingField.BASIC_SUBJECT],
        freeTimes: [
            { day: '월', startTime: 780, endTime: 1020 },
            { day: '수', startTime: 780, endTime: 1020 },
            { day: '금', startTime: 540, endTime: 1080 }
        ]
    })
];

if (typeof window !== 'undefined') {
    window.DefaultUsersData = DefaultUsersData;
}
