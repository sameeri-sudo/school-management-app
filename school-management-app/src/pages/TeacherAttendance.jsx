import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TeacherAttendance({ lockedClass }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Use the locked class passed down from login, fallback to Class 1 if undefined
  const currentClass = lockedClass || 'Class 1';

  useEffect(() => {
    fetchStudentsAndStatus();
  }, [currentClass, selectedDate]);

  async function fetchStudentsAndStatus() {
    setLoading(true);
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('class_name', currentClass);

    const { data: existingAttendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('class_name', currentClass)
      .eq('attendance_date', selectedDate);

    setStudents(studentData || []);

    const statusMap = {};
    (studentData || []).forEach(s => {
      const found = (existingAttendance || []).find(a => a.gr_number === s.gr_number);
      statusMap[s.gr_number] = found ? (found.status === 'Leave' ? 'Absent' : found.status) : 'Present';
    });
    setAttendanceStatus(statusMap);
    setLoading(false);
  }

  const handleStatusChange = (grNumber, status) => {
    setAttendanceStatus(prev => ({ ...prev, [grNumber]: status }));
  };

  const markAllAs = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.gr_number] = status;
    });
    setAttendanceStatus(updated);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const records = students.map(s => ({
      gr_number: s.gr_number,
      class_name: currentClass,
      attendance_date: selectedDate,
      status: attendanceStatus[s.gr_number] || 'Present',
      is_approved: false
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(records, { onConflict: ['gr_number', 'attendance_date'] });

    if (error) {
      console.error('Error saving attendance:', error);
      setMessage('Failed to send attendance to HM.');
    } else {
      setMessage('Attendance successfully sent to HM for review and approval!');
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header section with responsive stacking */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Teacher Portal ({currentClass})</h2>
          <p className="text-xs sm:text-sm text-slate-500">Mark student attendance for your assigned class.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
            <label className="text-xs sm:text-sm font-medium text-slate-600">Date:</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-slate-300 bg-white px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium shadow-xs flex items-center gap-2">
          <span>✅</span> {message}
        </div>
      )}

      {students.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-slate-500 mr-2">Quick Actions:</span>
          <button type="button" onClick={() => markAllAs('Present')} className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors">Mark All Present</button>
          <button type="button" onClick={() => markAllAs('Absent')} className="px-3 py-1.5 bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-200 transition-colors">Mark All Absent</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Horizontal scroll container for responsiveness on small screens */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs mb-6 bg-white">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
                <th className="p-3 sm:p-4 font-semibold">GR Number</th>
                <th className="p-3 sm:p-4 font-semibold">Student Name</th>
                <th className="p-3 sm:p-4 font-semibold">Father's Name</th>
                <th className="p-3 sm:p-4 font-semibold">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    No students found in {currentClass}.
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.gr_number} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 sm:p-4 font-mono text-slate-600">{student.gr_number}</td>
                    <td className="p-3 sm:p-4 font-semibold text-slate-800">{student.full_name}</td>
                    <td className="p-3 sm:p-4 text-slate-600">{student.father_name}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-1.5 sm:gap-2">
                        {['Present', 'Absent'].map(st => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => handleStatusChange(student.gr_number, st)}
                            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                              attendanceStatus[student.gr_number] === st
                                ? st === 'Present' 
                                  ? 'bg-emerald-600 text-white shadow-emerald-100' 
                                  : 'bg-rose-600 text-white shadow-rose-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {students.length > 0 && (
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Send Attendance to HM for Approval'}
          </button>
        )}
      </form>
    </div>
  );
}