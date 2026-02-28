import { format } from "date-fns";
import { getSectionColor } from "./ShiftTile";

interface PrintShift {
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  section: string | null;
  hours: number;
}

interface PrintEmployee {
  user_id: string;
  full_name: string;
  classification: string;
  employment_type: string;
  section_tags: string[];
}

interface RosterPrintViewProps {
  weekDates: Date[];
  employees: PrintEmployee[];
  shifts: PrintShift[];
  periodLabel: string;
  showCostings: boolean;
  shiftCosts?: Map<string, number>;
  dailyTotals?: { hours: number; cost: number }[];
  totalHours: number;
  totalCost: number;
}

const SECTIONS = ["KITCHEN", "BAR", "FOH", "OTHER"];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m ? `${hour}:${String(m).padStart(2, "0")}${ampm}` : `${hour}${ampm}`;
}

export default function RosterPrintView({
  weekDates,
  employees,
  shifts,
  periodLabel,
  showCostings,
  dailyTotals,
  totalHours,
  totalCost,
}: RosterPrintViewProps) {
  const employeesBySection: Record<string, PrintEmployee[]> = {};
  SECTIONS.forEach(s => { employeesBySection[s] = []; });

  employees.forEach(emp => {
    const tags = Array.isArray(emp.section_tags) ? emp.section_tags.map(String) : [];
    const section = SECTIONS.find(s => tags.includes(s)) || "OTHER";
    employeesBySection[section].push(emp);
  });

  const shiftMap = new Map<string, PrintShift[]>();
  shifts.forEach(s => {
    const key = `${s.user_id}_${s.date}`;
    if (!shiftMap.has(key)) shiftMap.set(key, []);
    shiftMap.get(key)!.push(s);
  });

  return (
    <div className="print-roster p-6 bg-white text-black" id="roster-print">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #roster-print, #roster-print * { visibility: visible; }
          #roster-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .print-roster table { border-collapse: collapse; width: 100%; font-size: 11px; }
        .print-roster th, .print-roster td { border: 1px solid #ddd; padding: 4px 6px; }
        .print-roster th { background: #f5f5f5; font-weight: 600; }
        .print-roster .section-row { background: #e8e8e8; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        .print-roster .totals-row { background: #f0f0f0; font-weight: 700; border-top: 2px solid #333; }
      `}</style>

      <div className="mb-4">
        <h1 className="text-xl font-bold">Staff Roster</h1>
        <p className="text-sm text-gray-600">{periodLabel}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th className="text-left" style={{ width: 140 }}>Staff</th>
            {weekDates.map(d => (
              <th key={format(d, "yyyy-MM-dd")} className="text-center" style={{ minWidth: 80 }}>
                <div>{format(d, "EEE")}</div>
                <div style={{ fontSize: 10 }}>{format(d, "d MMM")}</div>
              </th>
            ))}
            <th className="text-center" style={{ width: 50 }}>Hrs</th>
          </tr>
        </thead>
        <tbody>
          {SECTIONS.map(section => {
            const sectionEmps = employeesBySection[section];
            if (!sectionEmps?.length) return null;

            return (
              <tbody key={section}>
                <tr className="section-row">
                  <td colSpan={weekDates.length + 2}>{section}</td>
                </tr>
                {sectionEmps.map(emp => {
                  let weekHours = 0;
                  return (
                    <tr key={emp.user_id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 11 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 9, color: "#888" }}>{emp.classification}</div>
                      </td>
                      {weekDates.map(d => {
                        const dateStr = format(d, "yyyy-MM-dd");
                        const cellShifts = shiftMap.get(`${emp.user_id}_${dateStr}`) || [];

                        if (!cellShifts.length) {
                          return <td key={dateStr} className="text-center" style={{ color: "#ccc" }}>—</td>;
                        }

                        return (
                          <td key={dateStr} className="text-center">
                            {cellShifts.map((s, i) => {
                              weekHours += s.hours;
                              return (
                                <div key={i}>
                                  <div style={{ fontWeight: 500 }}>{formatTime(s.start_time)}–{formatTime(s.end_time)}</div>
                                  {s.break_minutes > 0 && <div style={{ fontSize: 9, color: "#888" }}>{s.break_minutes}m break</div>}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                      <td className="text-center" style={{ fontWeight: 600 }}>
                        {weekHours > 0 ? weekHours.toFixed(1) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}

          {/* Totals */}
          <tr className="totals-row">
            <td>TOTALS</td>
            {dailyTotals?.map((dt, i) => (
              <td key={i} className="text-center">
                <div>{dt.hours > 0 ? `${dt.hours}h` : "—"}</div>
                {showCostings && dt.cost > 0 && <div style={{ fontSize: 9 }}>${dt.cost.toFixed(0)}</div>}
              </td>
            ))}
            <td className="text-center">{totalHours.toFixed(1)}</td>
          </tr>
          {showCostings && (
            <tr className="totals-row">
              <td colSpan={weekDates.length + 1} className="text-right">Total Cost:</td>
              <td className="text-center" style={{ fontWeight: 700 }}>${totalCost.toFixed(0)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
