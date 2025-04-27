'use client';

import { motion } from 'framer-motion';
import { useState ,useRef} from "react";
import { useRouter } from "next/navigation";
import MobileDatePicker from '../components/MobileDatePicker';
import { useMediaQuery } from 'react-responsive';

type FixedDuty = {
  date: string;  // yyyy-mm-dd
  dutyName: string;
  teacherName: string;  // 오전 당직 1 같은 이름
};

type Duty = { name: string; count: number };
type Teacher = {
  name: string;
  leaveDateStart?: string;
  leaveDateEnd?: string;
  hasError?: boolean; 
  fixedDuties?: FixedDuty[]; 
  isEditingLeave?: boolean;     
  isEditingFixedDuty?: boolean;  
};

export default function CreateForm() {
  const router = useRouter();

// 고정 당직 입력 상태
const [fixedDutyInputs, setFixedDutyInputs] = useState<{ [key: number]: FixedDuty }>({});
const [leaveInputs, setLeaveInputs] = useState<{ [key: number]: { start?: string; end?: string } }>({});
const isAdding = useRef(false); 
const isMobile: boolean = useMediaQuery({ maxWidth: 768 });
 /** ✨ 수정 포인트: 교사 추가 핸들러를 분리 */

 const handleAddTeacher = () => {
  if (isAdding.current) return;  // ✅ 이미 추가 중이면 무시

  if (teacherName.trim() === "") return;
  
  isAdding.current = true; // ✅ 추가 시작
  setTeachers(prev => [...prev, {
    name: teacherName.trim(),
    leaveDateStart: "",
    leaveDateEnd: "",
    fixedDuties: [],
  }]);
  setTeacherName("");

  setTimeout(() => {
    isAdding.current = false;  // ✅ 아주 잠깐 후 다시 추가 가능하게
  }, 100); 
};
// 고정 당직 입력 변경
const updateFixedDutyInput = (teacherIndex: number, field: "date" | "dutyName", value: string) => {
  setFixedDutyInputs(prev => ({
    ...prev,
    [teacherIndex]: {
      ...prev[teacherIndex],
      [field]: value,
    }
  }));
};

// 고정 당직 추가
const addFixedDuty = (teacherIndex: number) => {
  const input = fixedDutyInputs[teacherIndex];
  if (!input?.date || !input?.dutyName) return;

  setTeachers(prev => {
    const updated = [...prev];
    const teacher = updated[teacherIndex];
    if (!teacher) {
      alert('교사를 먼저 등록한 후 고정 당직을 설정할 수 있습니다.');
      return prev;
    }
    const alreadyExists = teacher.fixedDuties?.some(
      fd => fd.date === input.date && fd.dutyName === input.dutyName
    );
    if (!alreadyExists) {
      teacher.fixedDuties = [
        ...(teacher.fixedDuties || []),
        {
          ...input,
          teacherName: teacher.name,   // 🔥 여기 teacherName 강제 추가!!!
        }
      ];
    }
    return updated;
  });

  setFixedDutyInputs(prev => ({
    ...prev,
    [teacherIndex]: { date: "", dutyName: "", teacherName: "" }
  }));

  const teacher = teachers[teacherIndex];
  const existNow = teacher.fixedDuties?.some(fd => fd.date === input.date && fd.dutyName === input.dutyName);

  if (existNow) {
    alert('이미 같은 날짜에 같은 당직 유형이 등록되어 있습니다.');
  }
};



// 고정 당직 삭제
const removeFixedDuty = (teacherIndex: number, fixedDutyIndex: number) => {
  setTeachers(prev => {
    const updated = [...prev];
    updated[teacherIndex].fixedDuties = (updated[teacherIndex].fixedDuties || []).filter((_, idx) => idx !== fixedDutyIndex);
    return updated;
  });
};

  const dutyOptions = [
    { name: "오전 당직 1", emoji: "🌞", type: "morning1" },
    { name: "오전 당직 2", emoji: "🌞", type: "morning2" },
    { name: "오후 당직 1", emoji: "🌙", type: "evening1" },
    { name: "오후 당직 2", emoji: "🌙", type: "evening2" },
  ];

  const [selectedDuties, setSelectedDuties] = useState<Duty[]>([]);
  const [step, setStep] = useState(1);
  const [teacherName, setTeacherName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [teachers, setTeachers] = useState<Teacher[]>([]);

const toggleEditingLeave = (teacherIndex: number) => {
  setTeachers(prev => {
    const updated = [...prev];
    updated[teacherIndex] = {
      ...updated[teacherIndex],
      isEditingLeave: !(updated[teacherIndex].isEditingLeave ?? false),
     // isEditingFixedDuty: false,
    };
    return updated;
  });
};

const toggleEditingFixedDuty = (teacherIndex: number) => {
  setTeachers(prev => {
    const updated = [...prev];
    updated[teacherIndex] = {
      ...updated[teacherIndex],
      isEditingFixedDuty: !(updated[teacherIndex].isEditingFixedDuty ?? false),
      //isEditingLeave: false,
    };
    return updated;
  });
};

  type SpecialEvent = {
    title: string;
    startDate: string;
    endDate: string;
    hasError?: boolean;
  };
  
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [eventInput, setEventInput] = useState({ title: "", startDate: "", endDate: "" });

  const addSpecialEvent = () => {
    const { title, startDate, endDate } = eventInput;
    if (!title.trim() || !startDate || !endDate) return;
  
    setSpecialEvents([...specialEvents, { ...eventInput }]);
    setEventInput({ title: "", startDate: "", endDate: "" });
  };
  
  const removeSpecialEvent = (index: number) => {
    const updated = [...specialEvents];
    updated.splice(index, 1);
    setSpecialEvents(updated);
  };
  
  const getMonthRange = (month: number) => {
    const year = 2025;
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);
    return { start, end, default: start };
  };

  const toggleDuty = (dutyName: string) => {
    const baseName = dutyName.split(' ')[0];
    if (dutyName.includes('2')) {
      const first = `${baseName} 당직 1`;
      const firstSelected = selectedDuties.find(d => d.name === first);
      if (!firstSelected) {
        alert(`${first}을 먼저 선택해주세요.`);
        return;
      }
    }
    const exists = selectedDuties.find(duty => duty.name === dutyName);
    if (exists) {
      setSelectedDuties(selectedDuties.filter(duty => duty.name !== dutyName));
    } else {
      setSelectedDuties([...selectedDuties, { name: dutyName, count: 0 }]);
    }
  };

  const adjustDutyCount = (dutyName: string, delta: number) => {
    const updated = selectedDuties.map(duty =>
      duty.name === dutyName ? { ...duty, count: Math.max(0, duty.count + delta) } : duty
    );
    setSelectedDuties(updated);
  };

  const removeTeacher = (index: number) => {
    const updated = [...teachers];
    updated.splice(index, 1);
    setTeachers(updated);
  };

  const updateLeaveDate = (index: number, type: "start" | "end", newDate: string) => {
    setTeachers(prev => {
      const updated = [...prev];
      if (type === "start") updated[index].leaveDateStart = newDate;
      else updated[index].leaveDateEnd = newDate;
      return updated;
    });
  };

  const handleGenerateDuty = () => {
    let hasError = false;

      // ✅ 새로 추가: "아직 추가 안한 연차" 검증
      const hasUnsubmittedLeave = Object.entries(leaveInputs).some(([idxStr, input]) => {
        const idx = Number(idxStr);
        const teacher = teachers[idx];
        if (!teacher) return false; // 교사가 없으면 무시
        const alreadySaved = teacher.leaveDateStart && teacher.leaveDateEnd;
        if (alreadySaved) return false; // 이미 저장된 교사는 무시
        return input?.start || input?.end; // 입력창에 값이 남아있으면 문제
      });

      // ✅ 새로 추가: "아직 추가 안한 고정당직" 검증
      const hasUnsubmittedFixedDuty = Object.values(fixedDutyInputs).some(input => input?.date || input?.dutyName);
      if (hasUnsubmittedFixedDuty) {
        alert("입력 중인 고정 당직이 있습니다. 추가 버튼을 눌러 저장해 주세요.");
        return;
      }
    // ✅ 새로 추가: 교사 수 체크
    if (teachers.length === 0) {
      alert("최소 1명 이상의 교사를 등록해주세요.");
      return;
    }
  
    // ✅ 새로 추가: 총 당직 인원 수가 0이면 막기
    const totalDutyCount = selectedDuties.reduce((sum, duty) => sum + duty.count, 0);
    if (totalDutyCount === 0) {
      alert("당직 인원을 1명 이상으로 설정해주세요.");
      return;
    }
  
    const updatedTeachers = teachers.map((teacher) => {
      const onlyOneSet =
        (teacher.leaveDateStart && !teacher.leaveDateEnd) ||
        (!teacher.leaveDateStart && teacher.leaveDateEnd);
  
      if (onlyOneSet) {
        hasError = true;
        return { ...teacher, hasError: true };
      }
  
      return { ...teacher, hasError: false };
    });
  
    setTeachers(updatedTeachers);
  
    if (hasError) {
      const firstInvalid = updatedTeachers.find((t) => t.hasError);
      alert(`${firstInvalid?.name ?? ''} 선생님의 휴가 시작일과 종료일을 모두 설정해주세요.`);
      return;
    }
  
    // ✅ 교사 수보다 당직 인원이 많은 경우
   
    // 세션 저장 및 이동
    if (typeof window !== "undefined") {
      const allFixedDuties = teachers.flatMap(teacher => teacher.fixedDuties || []);
     
      // ✅ 1. 고정당직 등록한 선생님 이름들
      const fixedTeacherNames = new Set(allFixedDuties.map(fd => fd.teacherName));

      // ✅ 2. 기존 등록된 교사 이름들
      const teacherNamesSet = new Set(teachers.map(t => t.name));

      // ✅ 3. teachers 배열에 없는 고정당직 선생님 추가
      const missingTeachers = Array.from(fixedTeacherNames).filter(name => !teacherNamesSet.has(name));

      const allTeachers = [
        ...teachers,
        ...missingTeachers.map(name => ({
          name,
          leaveDateStart: "",
          leaveDateEnd: "",
          fixedDuties: [],
        }))

      ];
      if (totalDutyCount > allTeachers.length) {
        alert(`설정한 당직 인원이 전체 교사 수보다 많습니다. (${totalDutyCount}명 설정 / 교사 ${allTeachers.length}명)`);
        return;
      }
      // ✅ 4. 세션 저장
      sessionStorage.setItem('duties', JSON.stringify(selectedDuties));
      sessionStorage.setItem('teachers', JSON.stringify(allTeachers));
      sessionStorage.setItem('month', selectedMonth.toString());
      sessionStorage.setItem('specialEvents', JSON.stringify(specialEvents));
      sessionStorage.setItem('fixedDuties', JSON.stringify(allFixedDuties));
    }
  
    setIsLoading(true);
    setTimeout(() => router.push('/result'), 1500);
  };
  const handleNextStep = () => {
    if (selectedDuties.length === 0) {
      alert("최소 하나 이상의 당직 유형을 선택해주세요.");
      return;
    }
  
    const anyZero = selectedDuties.some(duty => duty.count < 1);
    if (anyZero) {
      alert("선택한 모든 당직 유형에 대해 1명 이상의 인원을 설정해주세요.");
      return;
    }
  
    setStep(2); 
  };

  return (
    <div className="flex flex-col items-center space-y-15 w-full max-w-2xl">
    <div className="w-full flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
  <label className="text-base md:text-lg font-semibold text-[#5a3d1e] drop-shadow-sm  dark:text-white">
  몇 월의 당직표를 만들까요?
  </label>

  <select
    value={selectedMonth}
    onChange={(e) => {
      const newMonth = parseInt(e.target.value);
      setSelectedMonth(newMonth);
      const { start } = getMonthRange(newMonth);
      setTeachers(prev =>
        prev.map(teacher => ({
          ...teacher,
          leaveDateStart: "",
          leaveDateEnd: "",
        }))
      );
    }}
    className="border border-[#c5a880] bg-white rounded-lg px-4 py-2 text-[#5a3d1e] shadow-sm hover:shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#e5c59f]"
  >
    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
      <option key={month} value={month}>
        {month}월
      </option>
    ))}
  </select>
</div>

      {step >= 1 && (
        <div className="flex flex-col items-center space-y-6 w-full">
          <h2 className="text-xl font-bold w-full text-left text-[#5a3d1e]  dark:text-white">1. 당직 유형을 선택하고 인원을 설정해주세요.</h2>
          <p className="text-sm w-full text-left text-[#5a3d1e] dark:text-gray-300 mb-1">
            원하는 당직 유형을 클릭하면 활성화되고, 인원 수를 설정할 수 있어요. <br className="hidden md:block" />
            한 번 더 클릭하면 해제돼요!
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 w-full">
            {dutyOptions.map((duty, idx) => {
              const isSelected = selectedDuties.some(d => d.name === duty.name);
              const selectedDuty = selectedDuties.find(d => d.name === duty.name);
              const selectedStyle = duty.type.includes('morning')
                ? 'bg-amber-200 text-black border-amber-300'
                : 'bg-gray-800 text-white border-gray-700';
              return (
                <div
                  key={idx}
                  onClick={() => toggleDuty(duty.name)}
                  className={`cursor-pointer transition-all duration-300 p-5 rounded-2xl shadow-sm border
                    ${isSelected
                      ? duty.type.includes('morning')
                        ? 'bg-amber-100 border-amber-300 text-black shadow-md'
                        : 'bg-gray-800 border-gray-700 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:shadow-md hover:bg-gray-50'}
                  `}
                >
                   <div className="flex flex-col items-center justify-center space-y-2">
                   <span className="text-lg font-bold">{duty.emoji} {duty.name}</span>
                    {isSelected && (
                      <div className="flex items-center space-x-2 mt-3">
                        <button onClick={(e) => { e.stopPropagation(); adjustDutyCount(duty.name, -1); }}
                          className="px-2 bg-gray-300 rounded hover:bg-gray-400">-</button>
                        <span>{selectedDuty?.count ?? 0}명</span>
                        <button onClick={(e) => { e.stopPropagation(); adjustDutyCount(duty.name, 1); }}
                          className="px-2 bg-gray-300 rounded hover:bg-gray-400">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
        onClick={handleNextStep}
       className="mt-4 text-[#5a3d1e] text-lg font-semibold px-4 py-2 rounded transition-all duration-300 ease-in-out hover:bg-white/30 hover:backdrop-blur-sm dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300"
      >
       다음
      </button>
        </div>
      )}

      {step >= 2 && (
           <motion.div
           className="flex flex-col items-center space-y-15 w-full"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, ease: 'easeOut' }}
         >
        <div className="flex flex-col items-center space-y-15 w-full">
          <h2 className="text-xl font-bold w-full text-left text-[#5a3d1e]  dark:text-white">2. 교사 이름을 등록해주세요.</h2>
          <div className="w-full flex gap-3 items-center">
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 폼 기본 제출 막기
                  handleAddTeacher(); // 핸들러 호출
                }
              }}
              placeholder="교사 이름 입력"
              className="flex-1 px-4 py-2 rounded-2xl border border-gray-300 shadow-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
            />
            
            <button
               type="button"  // ✅ 버튼 타입 명시!
               onClick={handleAddTeacher}
            className="px-5 py-2 rounded-2xl bg-[#fbc4ab] text-[#5a3d1e] font-medium hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300"
            >추가</button>
          </div>

          <div className="w-full space-y-4 mt-4">
  {teachers.map((teacher, idx) => (
   <div key={idx} className="relative p-5 rounded-2xl shadow-md bg-white space-y-2">
  
   {/* 🧑 교사 이름 + 등록 버튼 + 삭제 버튼 */}
   <div className="flex items-center justify-between">
     <span className="text-lg font-semibold dark:text-black">{teacher.name}</span>
     <div className="flex items-center gap-2">
       <button
         type="button"
         onClick={() => toggleEditingLeave(idx)}
         className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold 
            bg-[#fbc4ab] text-[#5a3d1e] hover:bg-[#f6a28c] 
            dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300"
        >
         <span className="text-sm ml-1">
        {teacher.isEditingLeave ? '▽' : '▷'}
        </span>
         연차 등록하기
       </button>
       <button
         type="button"
         onClick={() => toggleEditingFixedDuty(idx)}
         className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold 
         bg-[#fbc4ab] text-[#5a3d1e] hover:bg-[#f6a28c] 
         dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300"
     >
         <span className="text-sm ml-1">
         {teacher.isEditingFixedDuty ? '▽' : '▷'}
        </span>
         고정 당직일 등록하기
       </button>
       <button
         onClick={() => removeTeacher(idx)}
         className="text-gray-400 hover:text-red-500 text-xl font-bold"
         title="삭제"
       >
         ×
       </button>
     </div>
   </div>
 
   {/* 📅 연차 입력폼 (버튼 아래에 위치) */}
   {/* 📅 연차 입력폼 (버튼 아래에 위치) */}
{teacher.isEditingLeave && (
  <div className="flex gap-2 mt-2">
    <span className="text-sm font-semibold text-[#5a3d1e]">연차</span>

    {/* 🧡 시작일 */}
    {isMobile ? (
      <MobileDatePicker
        id={`leave-start-${idx}`} 
        value={leaveInputs[idx]?.start || ""}
        onChange={(newValue) =>
          setLeaveInputs((prev) => ({
            ...prev,
            [idx]: { ...prev[idx], start: newValue },
          }))
        }
      />
    ) : (
      <input
        type="date"
        value={leaveInputs[idx]?.start || ""}
        min={getMonthRange(selectedMonth).start}
        max={getMonthRange(selectedMonth).end}
        onChange={(e) =>
          setLeaveInputs((prev) => ({
            ...prev,
            [idx]: { ...prev[idx], start: e.target.value },
          }))
        }
        className="border px-2 py-1 rounded text-sm dark:text-black"
      />
    )}

    {/* 🧡 종료일 */}
    {isMobile ? (
      <MobileDatePicker
        id={`leave-start-${idx}`} 
        value={leaveInputs[idx]?.end || ""}
        onChange={(newValue) =>
          setLeaveInputs((prev) => ({
            ...prev,
            [idx]: { ...prev[idx], end: newValue },
          }))
        }
      />
    ) : (
      <input
        type="date"
        value={leaveInputs[idx]?.end || ""}
        min={getMonthRange(selectedMonth).start}
        max={getMonthRange(selectedMonth).end}
        onChange={(e) =>
          setLeaveInputs((prev) => ({
            ...prev,
            [idx]: { ...prev[idx], end: e.target.value },
          }))
        }
        className="border px-2 py-1 rounded text-sm dark:text-black"
      />
    )}

    {/* 추가 버튼은 그대로 */}
    <button
      type="button"
      className="px-3 py-1 bg-gray-200 rounded text-sm font-semibold hover:bg-gray-300 dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300"
      onClick={() => {
        const input = leaveInputs[idx];
        if (input?.start && input?.end) {
          updateLeaveDate(idx, "start", input.start);
          updateLeaveDate(idx, "end", input.end);
        }
        toggleEditingLeave(idx); // 폼 닫기
      }}
    >
      추가
    </button>
  </div>
)}

 
   {/* 📌 연차 문자열 출력 */}
   {teacher.leaveDateStart && teacher.leaveDateEnd && (
     <div className="flex items-center gap-2 text-sm text-gray-700">
     <div>
       연차: {teacher.leaveDateStart} ~ {teacher.leaveDateEnd}
     </div>
     <button
       type="button"
       className="text-gray-400 hover:text-red-500 text-xl font-bold"
       onClick={() => {
         updateLeaveDate(idx, "start", "");
         updateLeaveDate(idx, "end", "");
       }}
     >
       ×
     </button>
   </div>
   )}
 
   {/* 📅 고정 당직 등록폼 (버튼 아래에 위치) */}
   {teacher.isEditingFixedDuty && (
  <div className="flex flex-wrap gap-2 mt-2">
    <span className="text-sm font-semibold text-[#5a3d1e]">고정 당직</span>

    <MobileDatePicker
      id={`fixed-duty-${idx}`}
      value={fixedDutyInputs[idx]?.date || ""}
      min={getMonthRange(selectedMonth).start}
      max={getMonthRange(selectedMonth).end}
      onChange={(newValue) => updateFixedDutyInput(idx, "date", newValue)}
    />

    <select
      value={fixedDutyInputs[idx]?.dutyName || ""}
      onChange={(e) => updateFixedDutyInput(idx, "dutyName", e.target.value)}
      className="border px-2 py-1 rounded text-sm dark:text-black"
    >
      <option value="">당직 유형 선택</option>
      {selectedDuties.map((duty, dutyIdx) => (
        <option key={dutyIdx} value={duty.name}>
          {duty.name}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={() => {
        addFixedDuty(idx);
        toggleEditingFixedDuty(idx);
      }}
      disabled={!fixedDutyInputs[idx]?.date || !fixedDutyInputs[idx]?.dutyName}
      className={`px-3 py-1 rounded text-sm font-semibold transition-all duration-300 ${
        fixedDutyInputs[idx]?.date && fixedDutyInputs[idx]?.dutyName
          ? 'bg-[#fbc4ab] hover:bg-[#f6a28c] text-[#5a3d1e]'
          : 'bg-gray-300 text-gray-400 cursor-not-allowed'
      }`}
    >
      추가
    </button>
  </div>
)}
 
   {/* 📝 고정 당직 문자열 리스트 */}
   {teacher.fixedDuties && teacher.fixedDuties.length > 0 && (
     <div className="flex flex-col gap-1 text-sm text-gray-700">
       {teacher.fixedDuties
         .sort((a, b) => a.date.localeCompare(b.date))
         .map((fd, fdIdx) => (
          <div key={fdIdx} className="flex items-center gap-2 text-sm text-gray-700">
          <span>고정 당직 : {fd.date} - {fd.dutyName}</span>
          <button
            onClick={() => removeFixedDuty(idx, fdIdx)}
            className="text-gray-400 hover:text-red-500 text-base font-bold"
            title="고정 당직 삭제"
          >
            ×
          </button>
        </div>
         ))}
        </div>
      )}
    </div>
  ))}


            {/* 교사 등록 섹션 아래에 추가 */}
<h3 className="text-lg font-semibold text-left w-full text-[#5a3d1e] dark:text-white mt-8">3. 기관의 특별한 일정을 등록해주세요.</h3>
<p className="text-sm w-full text-left text-[#5a3d1e] dark:text-gray-300 mb-1">
            대체 공휴일, 신학기 준비 기간등 기관의 특별한 일정을 등록해주세요.
            <br></br>
            등록된 일자에는 당직 교사가 배정되지 않습니다.
          </p>

<div className="mt-6 w-full flex flex-col md:flex-row gap-3 items-center">
<input
  type="text"
  value={eventInput.title}
  onChange={(e) => setEventInput({ ...eventInput, title: e.target.value })}
  placeholder="일정 이름"
  className="flex-1 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400"
/>

<div className="flex flex-row gap-2 w-full md:w-auto">
  <div className="flex-1">
    <MobileDatePicker
      id="event-start"
      value={eventInput.startDate}
      min={getMonthRange(selectedMonth).start}
      max={getMonthRange(selectedMonth).end}
      placeholder="시작일 선택"
      onChange={(newValue) => setEventInput(prev => ({ ...prev, startDate: newValue }))}
    />
  </div>

  <div className="flex-1">
    <MobileDatePicker
      id="event-end"
      value={eventInput.endDate}
      min={getMonthRange(selectedMonth).start}
      max={getMonthRange(selectedMonth).end}
      placeholder="종료일 선택"
      onChange={(newValue) => setEventInput(prev => ({ ...prev, endDate: newValue }))}
    />
  </div>
</div>
  <button
    onClick={addSpecialEvent}
    className="px-4 py-2 bg-[#fbc4ab] rounded-2xl text-[#5a3d1e] hover:bg-[#f6a28c]  dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300"
  >
    추가
  </button>
</div>

{/* 일정 목록 */}
<div className="w-full mt-4 space-y-3">
  {specialEvents.map((event, idx) => (
   <div
   key={idx}
   className={`relative p-5 rounded-2xl shadow-md bg-white border flex justify-between items-center ${
    event.hasError ? 'border-red-400 bg-red-50 dark:bg-red-50' : 'border-gray-200'
  }`}
 >
      <div>
        <div className="font-semibold text-gray-800">{event.title}</div>
        <div className="text-sm text-gray-600">{event.startDate} ~ {event.endDate}</div>
      </div>
      <button
      onClick={() => removeSpecialEvent(idx)}
      className="text-gray-400 hover:text-red-500 text-3xl font-bold"
      >
        ×
      </button>
    </div>
  ))}
</div>

          </div>

          {!isLoading ? (
            <button onClick={handleGenerateDuty} className=
            "mt-4 text-[#5a3d1e] text-lg font-semibold px-4 py-2 rounded transition-all duration-300 ease-in-out hover:bg-white/30 hover:backdrop-blur-sm dark:bg-amber-300 dark:text-gray-900 dark:hover:bg-amber-200 transition-all duration-300">
              당직표 생성하기 
            </button>
          ) : (
            <div className="flex flex-col items-center space-y-2 mt-6">
              <div className="loader"></div>
              <span className="text-gray-600 text-sm">당직표를 생성하는 중...</span>
            </div>
          )}
        </div>
        </motion.div>
      )}

    </div>
  );
}
