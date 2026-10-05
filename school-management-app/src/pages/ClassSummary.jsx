import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ClassSummary() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const classes = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  async function fetchSummary() {
    setLoading(true);
    const { data: students } = await supabase.from('students').select('*');
    // Only pull records approved by the Headmaster
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('attendance_date', selectedDate)
      .eq('is_approved', true);

    const result = classes.map(cls => {
      const classStudents = (students || []).filter(s => s.class_name === cls);
      const totalEnrolled = classStudents.length;
      
      const classAttendance = (attendance || []).filter(a => a.class_name === cls);
      const presentCount = classAttendance.filter(a => a.status === 'Present').length;
      const absentCount = classAttendance.filter(a => a.status === 'Absent').length;

      const attendancePercentage = totalEnrolled > 0 
        ? ((presentCount / totalEnrolled) * 100).toFixed(1) 
        : '0.0';

      return {
        className: cls,
        totalEnrolled,
        presentCount,
        absentCount,
        attendancePercentage,
        marked: classAttendance.length > 0
      };
    });

    setSummaryData(result);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Responsive header layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">School Attendance Overview Summary</h2>
          <p className="text-xs sm:text-sm text-slate-500">Consolidated metrics approved by the Headmaster.</p>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium text-slate-600">Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-300 bg-white px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Horizontal scrollable container for mobile responsiveness */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
              <th className="p-3 sm:p-4 font-semibold">Class Level</th>
              <th className="p-3 sm:p-4 font-semibold">Total Enrolled</th>
              <th className="p-3 sm:p-4 font-semibold text-emerald-700">Present</th>
              <th className="p-3 sm:p-4 font-semibold text-rose-700">Absent</th>
              <th className="p-3 sm:p-4 font-semibold text-indigo-700">Attendance %</th>
              <th className="p-3 sm:p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  Loading summary data...
                </td>
              </tr>
            ) : summaryData.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No summary records found.
                </td>
              </tr>
            ) : (
              summaryData.map(row => (
                <tr key={row.className} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 sm:p-4 font-bold text-slate-800">{row.className}</td>
                  <td className="p-3 sm:p-4 font-medium text-slate-600">{row.totalEnrolled}</td>
                  <td className="p-3 sm:p-4 font-semibold text-emerald-600">{row.presentCount}</td>
                  <td className="p-3 sm:p-4 font-semibold text-rose-600">{row.absentCount}</td>
                  <td className="p-3 sm:p-4 font-bold text-indigo-600">{row.attendancePercentage}%</td>
                  <td className="p-3 sm:p-4">
                    {row.marked ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs rounded-full font-medium shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] sm:text-xs rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Pending HM
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}