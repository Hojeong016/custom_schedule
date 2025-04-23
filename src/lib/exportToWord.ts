'use client';

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

interface AssignedDuty {
  [date: string]: {
    [dutyType: string]: string[];
  };
}

interface LeaveMap {
  [date: string]: string[];
}

// 📌 동적으로 등장한 dutyType 추출 함수
function getDutyTypesFromSchedule(schedule: AssignedDuty): string[] {
  const typeSet = new Set<string>();
  Object.values(schedule).forEach((dayDuty) => {
    Object.keys(dayDuty).forEach((dutyType) => typeSet.add(dutyType));
  });
  return Array.from(typeSet);
}

const dutyColorMap: Record<string, string> = {
  '오전 당직 1': 'FFFACC',
  '오전 당직 2': 'FFE4B5',
  '오후 당직 1': 'E6E6FA',
  '오후 당직 2': 'CCEEFF',
  '합계': 'DDDDDD',
};

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekKey(date: Date): string {
  const tempDate = new Date(date);
  tempDate.setDate(tempDate.getDate() - tempDate.getDay());
  return tempDate.toISOString().split('T')[0];
}

function groupByWeek(dates: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  dates.forEach((d) => {
    const key = getWeekKey(new Date(d));
    if (!map[key]) map[key] = [];
    map[key].push(d);
  });
  return map;
}

export function exportScheduleToWord(
  schedule: AssignedDuty,
  stats: Record<string, Record<string, number>>,
  leaveMap: LeaveMap
) {
  const dutyTypes = getDutyTypesFromSchedule(schedule);
  const allDates = Object.keys(schedule).sort();
  const grouped = groupByWeek(allDates);
  const tables: Table[] = [];

  Object.entries(grouped).forEach(([weekStartDate, weekDates]) => {
    const weekDatesSorted = weekDates
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: '날짜', bold: true })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: 'D9D9D9', type: ShadingType.CLEAR, color: 'auto' },
        }),
        ...Array.from({ length: 5 }, (_, i) => i + 1).map((weekdayIndex) => {
          const dateObj = weekDatesSorted.find(
            (d) => new Date(d).getDay() === weekdayIndex
          );
          const text = dateObj
            ? `${weekdays[weekdayIndex]} (${new Date(dateObj).getDate()})`
            : `${weekdays[weekdayIndex]}`;
          return new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text, bold: true })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR, color: 'auto' },
          });
        }),
      ],
    });

    const weekRows: TableRow[] = [headerRow];

    // ✅ 당직 유형별 행 추가
    dutyTypes.forEach((dutyType) => {
      const cells: TableCell[] = [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: dutyType , bold: true })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: {
            fill: dutyColorMap[dutyType] ?? 'EEEEEE',
            type: ShadingType.CLEAR,
            color: 'auto',
          },
        }),
      ];

      for (let weekdayIndex = 1; weekdayIndex <= 5; weekdayIndex++) {
        const dateObj = weekDatesSorted.find(
          (d) => new Date(d).getDay() === weekdayIndex
        );
        const dateKey = dateObj?.toISOString().split('T')[0];
        const teachers = dateKey ? schedule[dateKey]?.[dutyType] ?? [] : [];

        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: teachers.join(', ') })],
              }),
            ],
          })
        );
      }

      weekRows.push(new TableRow({ children: cells }));
    });

    // ✅ 연차자 행 추가
    const leaveRowCells: TableCell[] = [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: '연차자', bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: {
          fill: 'FFFFFF', // 연한 붉은 배경
          type: ShadingType.CLEAR,
          color: 'auto',
        },
      }),
    ];

    for (let weekdayIndex = 1; weekdayIndex <= 5; weekdayIndex++) {
      const dateObj = weekDatesSorted.find(
        (d) => new Date(d).getDay() === weekdayIndex
      );
      const dateKey = dateObj?.toISOString().split('T')[0];
      const leaveNames = dateKey ? leaveMap[dateKey] ?? [] : [];

      leaveRowCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: leaveNames.join(', ') })],
            }),
          ],
        })
      );
    }

    weekRows.push(new TableRow({ children: leaveRowCells }));

    const table = new Table({
      rows: weekRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
    });

    tables.push(table);
  });

  const doc = new Document({
    sections: [
      {
        children: tables,
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, '주별_당직표.docx');
  });
}
