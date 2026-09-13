import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AttendanceAnalytics() {
  const [filterType, setFilterType] = useState('monthly'); // 'weekly', 'monthly', 'yearly'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const classes = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    fetchAnalytics();
  }, [filterType, selectedYear, selectedMonth, selectedWeekDate]);

  async function fetchAnalytics() {
    setLoading(true);
    // Fetch all students and all attendance records
    const { data: students } = await supabase.from('students').select('*');
    const { data: attendance } = await supabase.from('attendance_records').select('*');

    if (!students || !attendance) {
      setLoading(false);
      return;
    }

    // Filter attendance based on selected timeframe
    const filteredAttendance = attendance.filter(record => {
      const recordDate = new Date(record.attendance_date);
      const recordYear = recordDate.getFullYear().toString();
      const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0');

      if (filterType === 'yearly') {
        return recordYear === selectedYear;
      } else if (filterType === 'monthly') {
        return recordYear === selectedYear && recordMonth === selectedMonth;
      } else if (filterType === 'weekly') {
        // Calculate week range (Mon-Sun) based on selectedWeekDate
        const curr = new Date(selectedWeekDate);
        const firstDayOfWeek = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

        const recDateOnly = new Date(record.attendance_date);
        return recDateOnly >= firstDayOfWeek && recDateOnly <= lastDayOfWeek;
      }
      return true;
    });

    const result = classes.map(cls => {
      const classStudents = students.filter(s => s.class_name === cls);
      const totalEnrolled = classStudents.length;

      const classAttendance = filteredAttendance.filter(a => a.class_name === cls);
      const totalPresent = classAttendance.filter(a => a.status === 'Present').length;
      const totalAbsent = classAttendance.filter(a => a.status === 'Absent').length;
      const totalRecordedEntries = classAttendance.length;

      // To find total possible expected entries: total students * unique dates recorded in this range
      const uniqueDates = [...new Set(classAttendance.map(a => a.attendance_date))].length;
      const totalExpected = totalEnrolled * uniqueDates;

      const percentage = totalExpected > 0 
        ? ((totalPresent / totalExpected) * 100).toFixed(1) 
        : '0.0';

      return {
        className: cls,
        totalEnrolled,
        totalRecordedEntries,
        uniqueDates,
        totalPresent,
        totalAbsent,
        percentage
      };
    });

    setAnalyticsData(result);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance Reports & Analytics</h2>
          <p className="text-sm text-slate-500">View aggregate attendance metrics and percentages weekly, monthly, or yearly.</p>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterType('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'weekly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setFilterType('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterType('yearly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'yearly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Yearly
          </button>

          {/* Conditional Date Pickers */}
          {filterType === 'weekly' && (
            <input 
              type="date"
              value={selectedWeekDate}
              onChange={e => setSelectedWeekDate(e.target.value)}
              className="border border-slate-300 bg-white px-2.5 py-1 rounded-lg text-xs shadow-sm"
            />
          )}

          {filterType === 'monthly' && (
            <div className="flex gap-1">
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="border border-slate-300 bg-white px-2 py-1 rounded-lg text-xs shadow-sm"
              >
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
                className="border border-slate-300 bg-white px-2 py-1 rounded-lg text-xs shadow-sm"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          )}

          {filterType === 'yearly' && (
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
              className="border border-slate-300 bg-white px-2.5 py-1 rounded-lg text-xs shadow-sm"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
              <th className="p-4 font-semibold">Class Level</th>
              <th className="p-4 font-semibold">Enrolled Students</th>
              <th className="p-4 font-semibold">Days Recorded</th>
              <th className="p-4 font-semibold text-emerald-700">Total Present</th>
              <th className="p-4 font-semibold text-rose-700">Total Absent</th>
              <th className="p-4 font-semibold text-indigo-700">Attendance Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {analyticsData.map(row => (
              <tr key={row.className} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 font-bold text-slate-800">{row.className}</td>
                <td className="p-4 font-medium text-slate-600">{row.totalEnrolled}</td>
                <td className="p-4 text-slate-600">{row.uniqueDates} Days</td>
                <td className="p-4 font-semibold text-emerald-600">{row.totalPresent}</td>
                <td className="p-4 font-semibold text-rose-600">{row.totalAbsent}</td>
                <td className="p-4 font-bold text-indigo-600">
                  <div className="flex items-center gap-3">
                    <span>{row.percentage}%</span>
                    <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}