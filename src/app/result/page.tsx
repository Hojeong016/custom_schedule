import DutyCalendar from './components/DutyCalendar';
import DutyPieChart from './components/DutyPieChart'; 

export default function SchedulerPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-10 py-16 space-y-10">
      <DutyCalendar />
    </div>
  );
}
