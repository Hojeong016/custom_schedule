'use client';

import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { useMediaQuery } from 'react-responsive';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import DutyPieChart from './DutyPieChart'; 
import { useState, useEffect } from 'react';
import { exportScheduleToWord } from "@/lib/exportToWord";
import { ChevronDown, List } from 'lucide-react';

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type DutyType = '오전 당직 1' | '오전 당직 2' | '오후 당직 1' | '오후 당직 2' | '합계';
type AversionCategory = '월요일_오전' | '금요일_오후';


interface Duty {
  name: string;
  count: number;
}

interface Teacher {
  name: string;
  leaveDateStart?: string;
  leaveDateEnd?: string;
}

interface AssignedDuty {
  [date: string]: {
    [dutyType in DutyType]?: string[];
  };
}

interface LeaveMap {
  [date: string]: string[];
}

function getSpecialEventDates(events: { startDate: string; endDate: string }[]): Set<string> {
  const dateSet = new Set<string>();
  for (const event of events) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = new Date(d).toLocaleDateString('sv-SE');
      dateSet.add(dateKey);
    }
  }
  return dateSet;
}

function getTeacherScore(
  name: string,
  stats: Record<string, Record<DutyType, number>>,
  aversionStats: Record<string, Record<AversionCategory, number>>
): number {
  return (
    (aversionStats[name]['월요일_오전'] ?? 0) * 2 +
    (aversionStats[name]['금요일_오후'] ?? 0) * 1.5 +
    (stats[name]['합계'] ?? 0) * 0.5
  );
}

function isOnLeave(teacher: Teacher, date: Date) {
  if (!teacher.leaveDateStart || !teacher.leaveDateEnd) return false;
  const dateKey = date.toLocaleDateString('sv-SE');
  const startKey = new Date(teacher.leaveDateStart).toLocaleDateString('sv-SE');
  const endKey = new Date(teacher.leaveDateEnd).toLocaleDateString('sv-SE');
  return startKey <= dateKey && dateKey <= endKey;
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date: Date) {
  const holidays = [
    new Date(2025, 0, 1),
    new Date(2025, 4, 5),
  ];
  return holidays.some((holiday) => holiday.toLocaleDateString('sv-SE') === date.toLocaleDateString('sv-SE'));
}


function calculateUnfairness(stats: Record<string, Record<DutyType, number>>): Record<string, number> {
  const scores: Record<string, number> = {};

  // 교사별 합계 구하기
  const allValues = Object.values(stats).map(stat => stat['합계']);
  const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

  // 표준편차 계산
  for (const [name, stat] of Object.entries(stats)) {
    const diff = stat['합계'] - mean;
    scores[name] = parseFloat((diff * diff).toFixed(2)); // 제곱차를 점수화
  }

  return scores;
}

// 기피 카테고리 구분 함수
function getAversionCategory(date: Date, dutyType: DutyType): AversionCategory | null {
  const day = date.getDay(); // 1 = Monday, 5 = Friday
  if (day === 1 && dutyType.includes('오전')) return '월요일_오전';
  if (day === 5 && dutyType.includes('오후')) return '금요일_오후';
  return null;
}
function getScoreColor(score: number): string {
  if (score <= 1) return 'text-green-600';
  if (score <= 3) return 'text-orange-500';
  return 'text-red-600 font-bold';
}
// 3. generateSchedule 함수 내 통합
export function generateSchedule(
  duties: Duty[],
  teachers: Teacher[],
  month: number
): {
  schedule: AssignedDuty;
  leaveMap: LeaveMap;
  stats: Record<string, Record<DutyType, number>>;
  aversionStats: Record<string, Record<AversionCategory, number>>;
} {
  const year = 2025;
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedule: AssignedDuty = {};
  const leaveMap: LeaveMap = {};
  const stats: Record<string, Record<DutyType, number>> = {};
  const aversionStats: Record<string, Record<AversionCategory, number>> = {};

  // 🔥 1. 고정당직 먼저 세션에서 읽어오기
  const fixedDutiesStr = typeof window !== 'undefined' ? sessionStorage.getItem('fixedDuties') : null;
  const fixedDuties: { date: string; dutyName: string; teacherName: string }[] = fixedDutiesStr ? JSON.parse(fixedDutiesStr) : [];

  // 🔥 2. 특별 일정도 세션에서 읽어오기
  let excludedDates: Set<string> = new Set();
  if (typeof window !== 'undefined') {
    const eventsStr = sessionStorage.getItem('specialEvents');
    const specialEvents: { title: string; startDate: string; endDate: string }[] = eventsStr ? JSON.parse(eventsStr) : [];
    excludedDates = getSpecialEventDates(specialEvents);
  }

  // 🔥 3. 교사별 초기화
  for (const teacher of teachers) {
    stats[teacher.name] = {
      '오전 당직 1': 0,
      '오전 당직 2': 0,
      '오후 당직 1': 0,
      '오후 당직 2': 0,
      '합계': 0,
    };
    aversionStats[teacher.name] = {
      '월요일_오전': 0,
      '금요일_오후': 0,
    };
  }

  // 🔥 4. 고정 당직 먼저 schedule에 반영
  for (const fd of fixedDuties) {
    const dateKey = fd.date;
    const dutyName = fd.dutyName as DutyType;
    const teacherName = fd.teacherName;

    if (!schedule[dateKey]) {
      schedule[dateKey] = {};
    }
    if (!schedule[dateKey][dutyName]) {
      schedule[dateKey][dutyName] = [];
    }
    schedule[dateKey][dutyName]?.push(teacherName);

    // 통계 반영
    stats[teacherName][dutyName]++;
    stats[teacherName]['합계']++;
  }

  // 🔥 5. 매일매일 배정
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dateKey = dateObj.toLocaleDateString('sv-SE');

    if (excludedDates.has(dateKey) || isWeekend(dateObj) || isHoliday(dateObj)) continue;

    // 스케줄, 연차 초기화
    schedule[dateKey] = schedule[dateKey] || {};
    leaveMap[dateKey] = teachers.filter(t => isOnLeave(t, dateObj)).map(t => t.name);

    // 🔥 이 날짜에 이미 배정된 사람 (고정당직 포함) 세팅
    const assignedToday = new Set<string>();
    Object.values(schedule[dateKey]).forEach(names => {
      names?.forEach(name => {
        if (name) assignedToday.add(name);
      });
    });

    // 🔥 duties에 따라 나머지 배정
    for (const duty of duties) {
      if (duty.count <= 0) continue;

      let dutyType: DutyType;
      if (duty.name.includes('오전') && duty.name.includes('1')) {
        dutyType = '오전 당직 1';
      } else if (duty.name.includes('오전') && duty.name.includes('2')) {
        dutyType = '오전 당직 2';
      } else if (duty.name.includes('오후') && duty.name.includes('1')) {
        dutyType = '오후 당직 1';
      } else {
        dutyType = '오후 당직 2';
      }

      // 이미 고정당직으로 채워진 dutyType이면 skip
      if (schedule[dateKey][dutyType]) continue;

      const assignedTeachers: string[] = [];
      const aversionCategory = getAversionCategory(dateObj, dutyType);

      // 🔥 필터: 연차X, 이미 배정X, 기피횟수 미달
      let sortedTeachers = shuffleArray(
        teachers.filter(t => {
          const notOnLeave = !leaveMap[dateKey].includes(t.name);
          const notAlreadyAssigned = !assignedToday.has(t.name);
          const underAversionLimit =
            !aversionCategory || aversionStats[t.name][aversionCategory] < 2;
          return notOnLeave && notAlreadyAssigned && underAversionLimit;
        })
      );

      // 🔥 정렬: 기피요일이면 점수 기반, 아니면 통계 기반
      if (aversionCategory) {
        sortedTeachers.sort((a, b) =>
          getTeacherScore(a.name, stats, aversionStats) -
          getTeacherScore(b.name, stats, aversionStats)
        );
      } else {
        sortedTeachers.sort((a, b) =>
          stats[a.name][dutyType] - stats[b.name][dutyType]
        );
      }

      // 🔥 실제 배정
      for (let i = 0; i < duty.count && i < sortedTeachers.length; i++) {
        const teacher = sortedTeachers[i];
        assignedTeachers.push(teacher.name);
        assignedToday.add(teacher.name);

        stats[teacher.name][dutyType]++;
        stats[teacher.name]['합계']++;
        if (aversionCategory) {
          aversionStats[teacher.name][aversionCategory]++;
        }
      }

      schedule[dateKey][dutyType] = assignedTeachers;
    }
  }

  return { schedule, leaveMap, stats, aversionStats };
}


export default function DutyCalendar() {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const getSortedDateKeys = () => {
    return Object.keys(schedule).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  };
  const [showList, setShowList] = useState(false);
  const [value, setValue] = useState<Date | null>(null);
  const [schedule, setSchedule] = useState<AssignedDuty>({});
  const [leaveMap, setLeaveMap] = useState<LeaveMap>({});
  const [stats, setStats] = useState<Record<string, Record<DutyType, number>>>({});
  const [aversionStats, setAversionStats] = useState<Record<string, Record<AversionCategory, number>>>({});
  const [isClient, setIsClient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unfairness, setUnfairness] = useState<Record<string, number>>({});
  const [fixedDuties, setFixedDuties] = useState<{ date: string; dutyName: string; teacherName: string }[]>([]);

  const getDutyColorClass = (dutyType: string) => {
    switch (dutyType) {
      case '오전 당직 1': return 'bg-rose-100';
      case '오전 당직 2': return 'bg-amber-100';
      case '오후 당직 1': return 'bg-lime-100';
      case '오후 당직 2': return 'bg-teal-100';
      default: return 'bg-gray-100';
    }
  };

  const regenerateSchedule = () => {
    const dutiesStr = sessionStorage.getItem('duties');
    const teachersStr = sessionStorage.getItem('teachers');
    const monthStr = sessionStorage.getItem('month');
    


    if (!dutiesStr || !teachersStr || !monthStr) return;

    const duties: Duty[] = JSON.parse(dutiesStr);
    const teachers: Teacher[] = JSON.parse(teachersStr);
    const month = parseInt(monthStr, 10);

    const { schedule, leaveMap, stats: newStats, aversionStats: newAversion } = generateSchedule(duties, teachers, month);
    const newUnfairness = calculateUnfairness(newStats);

    setSchedule(schedule);
    setLeaveMap(leaveMap);
    // setStats(stats);
    setStats(newStats);
    setAversionStats(newAversion);
    setValue(new Date(2025, month - 1, 1));
    setRefreshKey(prev => prev + 1);
    setUnfairness(newUnfairness);
  };

  const [excludedDates, setExcludedDates] = useState<Set<string>>(new Set());
  const [specialEvents, setSpecialEvents] = useState<{ title: string; startDate: string; endDate: string }[]>([]);
  
  useEffect(() => {
    setIsClient(true);
    regenerateSchedule();

    const eventsStr = sessionStorage.getItem('specialEvents');
    const specialEvents = eventsStr ? JSON.parse(eventsStr) : [];
    const dates = getSpecialEventDates(specialEvents);
    setExcludedDates(dates);
    setSpecialEvents(specialEvents);

   
  const fixedDutiesStr = sessionStorage.getItem('fixedDuties');
  const fixed = fixedDutiesStr ? JSON.parse(fixedDutiesStr) : [];
  setFixedDuties(fixed);
  }, []);

  if (!isClient || !value) return null;

  return (
    <div className="flex flex-col items-center p-8  dark:text-white">
      <div className="flex items-center justify-between w-full mb-8">
      <h1 className="text-3xl font-bold w-full text-left text-[#5a3d1e] dark:text-white">
  {value?.getMonth() + 1}월 당직표
</h1>

<button  
  onClick={() => exportScheduleToWord(schedule, stats, leaveMap)} 
  className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#fbc4ab] text-[#5a3d1e] font-semibold shadow-sm hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 whitespace-nowrap"
>
  📄 Word
</button>
</div>
<div className="w-full bg-white rounded-2xl shadow-md p-6 mb-12 overflow-hidden  ">
  <div className="max-w-5xl mx-auto dark:hover:bg-[#2a2a2a] transition-colors  dark:text-black">
  <Calendar
    key={refreshKey}
    onChange={(nextValue) => {
      if (nextValue instanceof Date) setValue(nextValue);
      else if (Array.isArray(nextValue)) setValue(nextValue[0]);
    }}
    value={value}
    calendarType="gregory"
    tileContent={({ date, view }) => {
      if (view !== 'month') return null;
      const dateKey = date.toLocaleDateString('sv-SE');
      
      const dutiesToday = schedule[dateKey];
      const leavesToday = leaveMap[dateKey];
      
      const matchingEvent = specialEvents.find(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const current = new Date(dateKey);
        return start <= current && current <= end;
      });
      
      // 전역 excludedDates 사용
      const hasSpecialEvent = excludedDates.has(dateKey);
      const fixedToday = fixedDuties.filter(fd => fd.date === dateKey);

      
      const hasContent =
      (dutiesToday && Object.keys(dutiesToday).length > 0) ||
      (leavesToday && leavesToday.length > 0) ||
      (fixedToday.length > 0) ||   // 🧡 이 부분 추가
      matchingEvent;
    
      if (!hasContent) return null;

      console.log(`특별 일정 확인: ${dateKey}`, excludedDates.has(dateKey));
      if (isMobile) {
        return (
          <div className="mt-1 text-[10px] leading-3 space-y-1">
          {fixedToday.map((fd) => (   
            <div key={`${fd.date}-${fd.teacherName}-${fd.dutyName}`}>
              📌 고정: {fd.teacherName} ({fd.dutyName})
            </div>
          ))}

            {matchingEvent && (
              <div className="bg-yellow-100 text-yellow-800 rounded p-1 font-medium">
                📅 {matchingEvent.title}
              </div>
            )}
            {leavesToday?.length > 0 && (
              <div className="bg-red-50 text-red-500 rounded p-1 font-medium">
                📌 연차: {leavesToday.join(', ')}
              </div>
            )}
          </div>
        );
      }
  

      if (!dutiesToday && !leavesToday?.length && !hasSpecialEvent) return null;
      return (
        <div className="mt-1 text-[10px] leading-3 space-y-1">
          {fixedToday.map((fd, idx) => (   // 🧡 추가된 부분
            <div> 📌 고정: {fd.teacherName} ({fd.dutyName}) </div>
          ))}
          {dutiesToday && Object.entries(dutiesToday).map(([dutyType, teacherNames], idx) => {
            const bgColor = getDutyColorClass(dutyType);
            return (
              <div key={dutyType} className={`${bgColor} p-1 rounded-md`}>
                <span className="text-[11px] text-black font-semibold dark:text-black">
                  {dutyType}: <span className="font-normal text-black-900">{teacherNames.join(', ')}</span>
                </span>
              </div>
            );
          })}

          {leavesToday?.length > 0 && (
            <div className="bg-red-50 text-red-500 rounded p-1 text-[10px] font-medium">
              📌 연차: {leavesToday.join(', ')}
            </div>
          )}
        {matchingEvent && (
  <div className="bg-yellow-100 text-yellow-800 rounded p-1 text-[10px] font-medium">
    📅 {matchingEvent.title}
  </div>
)}
    </div>
      );
    }}
  />
</div> 
</div>

{isMobile && (
        <div className="w-full">
         <button
  onClick={() => setShowList(prev => !prev)}
  className="flex items-center gap-2 mx-auto mb-6 px-4 py-2 rounded-full bg-[#fbc4ab] text-[#5a3d1e] font-semibold shadow-sm hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 "
>
  {showList ? (
    <>
      <ChevronDown className="w-4 h-4" />
      <span>리스트 닫기</span>
    </>
  ) : (
    <>
      <List className="w-4 h-4" />
      <span>📋 리스트로 보기</span>
    </>
  )}
</button>
          {showList && (
            <div className="w-full bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-md p-6 space-y-4">
              {getSortedDateKeys().map((dateKey) => {
                const duties = schedule[dateKey];
                const leaves = leaveMap[dateKey];
                const date = new Date(dateKey);
                const label = `${date.getMonth() + 1}월 ${date.getDate()}일`;

                return (
                  <div key={dateKey} className="border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
                    <p className="font-semibold text-gray-800 dark:text-white">{label}</p>
                    {Object.entries(duties || {}).map(([dutyType, names], idx) => (
                      <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-2">
                        • {dutyType}: {names.join(', ')}
                      </p>
                    ))}
                    {leaves?.length > 0 && (
                      <p className="text-sm text-red-500 pl-2">📌 연차: {leaves.join(', ')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )} </div>
        )}

<div className="mt-16 w-full">
<div className="w-full flex flex-col items-center gap-3 mb-6 md:flex-row md:justify-between">
  <h2 className="text-xl font-bold w-full text-left text-[#5a3d1e] md:w-auto">
  </h2>

  <div className="flex flex-col items-center gap-3 md:flex-row md:justify-end md:items-start">
    <button
      onClick={regenerateSchedule}
      className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#fbc4ab] text-[#5a3d1e] font-semibold shadow-sm hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 whitespace-nowrap"
    >
      다시 배정하기
    </button>

    <button
      onClick={() => window.location.href = '/'}
      className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#fbc4ab] text-[#5a3d1e] font-semibold shadow-sm hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 whitespace-nowrap"
    >
      첫 화면으로
    </button>
  </div>
</div>
<Tab.Group>
  <Tab.List className="flex gap-2 mb-4">
    <Tab
      className={({ selected }) =>
        `px-4 py-2 rounded-full font-semibold transition-colors duration-200
        ${selected ? 'bg-[#fbc4ab] text-[#5a3d1e]' : 'bg-gray-100 text-gray-500'}
        hover:bg-[#fde2d4] hover:text-[#5a3d1e]
        focus:outline-none`
      }
    >
      📋 당직 통계
    </Tab>
    <Tab
      className={({ selected }) =>
        `px-4 py-2 rounded-full font-semibold transition-colors duration-200
        ${selected ? 'bg-[#fbc4ab] text-[#5a3d1e]' : 'bg-gray-100 text-gray-500'}
        hover:bg-[#fde2d4] hover:text-[#5a3d1e]
        focus:outline-none`
      }
    >
      📌 월요일 / 금요일 당직 통계
    </Tab>
  </Tab.List>

  <Tab.Panels>
    {/* 📋 당직 통계 탭 */}
    <Tab.Panel>
      <div className="w-full flex flex-col md:flex-row gap-8 mt-16 items-start dark:text-white">
        {/* 📊 파이 차트 */}
        <div className="w-full md:w-80 flex-shrink-0">
          <h3 className="text-xl font-bold w-full text-left text-[#5a3d1e] dark:text-white">
            📊 교사별 총 당직 비율
          </h3>
          <DutyPieChart stats={stats} />
        </div>

        {/* 📋 당직 횟수 요약 테이블 */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold w-full text-left text-[#5a3d1e]">📋 당직 횟수 요약</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-center dark:text-black">
              <thead>
                <tr className="bg-[#fff3e6] text-[#5a3d1e]">
                  <th className="px-4 py-2 font-semibold">교사</th>
                  <th className="px-4 py-2">🔍 오전 당직 1</th>
                  <th className="px-4 py-2">🔍 오전 당직 2</th>
                  <th className="px-4 py-2">🌙 오후 당직 1</th>
                  <th className="px-4 py-2">🌙 오후 당직 2</th>
                  <th className="px-4 py-2 text-amber-600 font-bold">합계</th>
                  <th className="px-4 py-2 text-red-500 font-bold">불균형 점수</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats).map(([name, dutyStats], idx) => (
                  <tr key={idx} className="hover:bg-[#fff7ed] transition-colors">
                    <td className="px-4 py-2 text-gray-700">{name}</td>
                    <td className="px-4 py-2 text-gray-600">{dutyStats['오전 당직 1']}</td>
                    <td className="px-4 py-2 text-gray-600">{dutyStats['오전 당직 2']}</td>
                    <td className="px-4 py-2 text-gray-600">{dutyStats['오후 당직 1']}</td>
                    <td className="px-4 py-2 text-gray-600">{dutyStats['오후 당직 2']}</td>
                    <td className="px-4 py-2 font-bold text-amber-600">{dutyStats['합계']}</td>
                    <td className={`px-4 py-2 ${getScoreColor(unfairness[name] ?? 0)}`}>
                        {unfairness[name]?.toFixed(2) ?? '-'}
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Tab.Panel>

    {/* 📌 기피 시간대 탭 */}
    <Tab.Panel>
      <div className="mt-8 w-full bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold w-full text-left text-[#5a3d1e]">
          📌 월요일/금요일 당직 통계
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-center dark:text-black">
          <thead>
            <tr className="bg-[#fff3e6] text-[#5a3d1e]">
              <th className="px-4 py-2 font-semibold">교사</th>
              <th className="px-4 py-2">📅 월요일 오전</th>
              <th className="px-4 py-2">📅 금요일 오후</th>
              <th className="px-4 py-2 text-red-600 font-bold">합계</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(aversionStats).map(([name, aversion]) => {
              const totalAversion =
                (aversion['월요일_오전'] ?? 0) + (aversion['금요일_오후'] ?? 0);
              return (
                <tr key={name} className="hover:bg-[#fff7ed] transition-colors">
                  <td className="px-4 py-2 text-gray-700">{name}</td>
                  <td className="px-4 py-2 text-gray-600">{aversion['월요일_오전']}</td>
                  <td className="px-4 py-2 text-gray-600">{aversion['금요일_오후']}</td>
                  <td className="px-4 py-2 font-semibold text-red-600">{totalAversion}</td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </Tab.Panel>
  </Tab.Panels>
</Tab.Group>
</div>
 </div>
 ); 
  
}