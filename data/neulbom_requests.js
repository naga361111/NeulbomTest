import { ContractType, TeachingField, DaysOfWeek } from './data_types.js';

const todayDayStr = ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];

export const NeulbomRequestsData = [
  {
    "id": "card-1",
    "schoolName": "춘천 효제초등학교",
    "contractType": ContractType.MONTHLY,
    "teachingFields": [TeachingField.ARTS_SPORTS, TeachingField.READING_ESSAY],
    "monthlyTimes": [
      { day: DaysOfWeek.WED, startTime: 840, endTime: 960 }
    ],
    "dailyTime": null,
    "distance": null,
    "travelTime": null,
    "matchScore": "98%"
  }
];

if (typeof window !== 'undefined') {
    window.NeulbomRequestsData = NeulbomRequestsData;
}
