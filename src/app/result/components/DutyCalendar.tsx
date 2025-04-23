'use client';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import DutyPieChart from './DutyPieChart'; // 경로는 실제 위치에 맞게 수정!
import { useState, useEffect } from 'react';
import { exportScheduleToWord } from "@/lib/exportToWord";

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type DutyType = '오전 당직 1' | '오전 당직 2' | '오후 당직 1' | '오후 당직 2' | '합계';

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

export function generateSchedule(
  duties: Duty[],
  teachers: Teacher[],
  month: number
): { schedule: AssignedDuty; leaveMap: LeaveMap; stats: Record<string, Record<DutyType, number>> } {
  const year = 2025;
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedule: AssignedDuty = {};
  const leaveMap: LeaveMap = {};
  const stats: Record<string, Record<DutyType, number>> = {};

  for (const teacher of teachers) {
    stats[teacher.name] = {
      '오전 당직 1': 0,
      '오전 당직 2': 0,
      '오후 당직 1': 0,
      '오후 당직 2': 0,
      '합계': 0,
    };
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dateKey = dateObj.toLocaleDateString('sv-SE');

    if (isWeekend(dateObj) || isHoliday(dateObj)) continue;

    schedule[dateKey] = {};
    leaveMap[dateKey] = teachers.filter(t => isOnLeave(t, dateObj)).map(t => t.name);
    const assignedToday = new Set<string>();

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

      const assignedTeachers: string[] = [];

      const sortedTeachers = shuffleArray(
        [...teachers]
          .filter(t => !leaveMap[dateKey].includes(t.name) && !assignedToday.has(t.name))
      ).sort((a, b) => stats[a.name][dutyType] - stats[b.name][dutyType]);

      for (let i = 0; i < duty.count && i < sortedTeachers.length; i++) {
        const teacher = sortedTeachers[i];
        assignedTeachers.push(teacher.name);
        assignedToday.add(teacher.name);
        stats[teacher.name][dutyType]++;
        stats[teacher.name]['합계']++;
      }

      console.log(`[${dateKey}] ${dutyType} 배정:`, assignedTeachers);
      schedule[dateKey][dutyType] = assignedTeachers;
    }
  }

  return { schedule, leaveMap, stats };
}

export default function DutyCalendar() {
  const [value, setValue] = useState<Date | null>(null);
  const [schedule, setSchedule] = useState<AssignedDuty>({});
  const [leaveMap, setLeaveMap] = useState<LeaveMap>({});
  const [stats, setStats] = useState<Record<string, Record<DutyType, number>>>({});
  const [isClient, setIsClient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

    const { schedule, leaveMap, stats } = generateSchedule(duties, teachers, month);
    setSchedule(schedule);
    setLeaveMap(leaveMap);
    setStats(stats);
    setValue(new Date(2025, month - 1, 1));
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    setIsClient(true);
    regenerateSchedule();
  }, []);

  if (!isClient || !value) return null;

  return (
    <div className="flex flex-col items-center p-8">
      <div className="flex items-center justify-between w-full mb-8">
      <h1 className="text-3xl font-bold w-full text-left text-[#5a3d1e]">
  {value?.getMonth() + 1}월 당직표
</h1>

<button  
  onClick={() => exportScheduleToWord(schedule, stats, leaveMap)} 
  className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#fbc4ab] text-[#5a3d1e] font-semibold shadow-sm hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 whitespace-nowrap"
>
  📄 Word
</button>
</div>
<div className="w-full bg-white rounded-2xl shadow-md p-6 mb-12 overflow-hidden">
  <div className="max-w-5xl mx-auto">
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
      if (!dutiesToday && !leavesToday?.length) return null;
      return (
        <div className="mt-1 text-[10px] leading-3 space-y-1">
          {dutiesToday && Object.entries(dutiesToday).map(([dutyType, teacherNames], idx) => {
            const bgColor = getDutyColorClass(dutyType);
            return (
              <div key={idx} className={`${bgColor} p-1 rounded-md`}>
                <span className="text-[11px] text-black font-semibold">
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
        </div>
      );
    }}
  />
</div> 
</div>
<div className="mt-16 w-full">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold w-full text-left text-[#5a3d1e]">
    </h2>
    <div className="flex gap-3">
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
  <div className="w-full flex flex-col md:flex-row gap-8 mt-16 items-start">
          {/* 📊 파이 차트 */}
          <div className="w-full md:w-80 flex-shrink-0">
            <h3 className="text-xl font-bold w-full text-left text-[#5a3d1e]">📊 교사별 총 당직 비율</h3>
            <DutyPieChart stats={stats} />
          </div>

          {/* 📋 표 */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold w-full text-left text-[#5a3d1e]">📋 당직 횟수 요약</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm text-center">
                <thead>
                <tr className="bg-[#fff3e6] text-[#5a3d1e]">
                    <th className="px-4 py-2 font-semibold">교사</th>
                    <th className="px-4 py-2">🔍 오전 당직 1</th>
                    <th className="px-4 py-2">🔍 오전 당직 2</th>
                    <th className="px-4 py-2">🌙 오후 당직 1</th>
                    <th className="px-4 py-2">🌙 오후 당직 2</th>
                    <th className="px-4 py-2 text-amber-600 font-bold">합계</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}