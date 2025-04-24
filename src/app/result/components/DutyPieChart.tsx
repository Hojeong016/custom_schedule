'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

type DutyType = '오전 당직 1' | '오전 당직 2' | '오후 당직 1' | '오후 당직 2' | '합계';
type Stats = Record<string, Record<DutyType, number>>;

interface DutyPieChartProps {
  stats: Stats;
}

const COLORS = ['#f6e2b3', '#fbc4ab', '#ddb892', '#b08968', '#eec0a4', '#deb887', '#f8d7a3', '#f4a261'];

export default function DutyPieChart({ stats }: DutyPieChartProps) {
  const data = Object.entries(stats)
    .map(([name, duty]) => ({
      name,
      value: duty['합계'],
      ...duty // 모든 당직 항목도 포함시킴
    }))
    .filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow text-sm space-y-1">
          <div className="font-bold text-black">{d.name}</div>
          <div>🍳 오전 당직 1: {d['오전 당직 1']}회</div>
          <div>🍳 오전 당직 2: {d['오전 당직 2']}회</div>
          <div>🌙 오후 당직 1: {d['오후 당직 1']}회</div>
          <div>🌙 오후 당직 2: {d['오후 당직 2']}회</div>
          <div className="font-semibold mt-1 text-amber-600">총합: {d['합계']}회</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-md h-80 mx-auto text-black ">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, cx, cy, midAngle, outerRadius, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 16;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill={document.documentElement.classList.contains('dark') ? '#fff' : '#333'}
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                    className="font-semibold "
                  >
                    {name}
                  </text>
                );
              }}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
