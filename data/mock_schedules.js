export const MOCK_SCHEDULES = {
    'everytime_sample.png': [
        { day: '월', startTime: 780, endTime: 1020 },
        { day: '수', startTime: 780, endTime: 1020 },
        { day: '금', startTime: 540, endTime: 1080 }
    ]
};

if (typeof window !== 'undefined') {
    window.MOCK_SCHEDULES = MOCK_SCHEDULES;
}
