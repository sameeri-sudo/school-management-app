import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function HmAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('Class 1');
  const [presentCount, setPresentCount] = useState(45);
  const [hasTeacherSubmission, setHasTeacherSubmission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const totalStudents = 45;
  const absentCount = Math.max(0, totalStudents - Number(presentCount));

  const classes = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    fetchClassAttendance();
  }, [selectedClass, selectedDate]);

  async function fetchClassAttendance() {
    setLoading(true);
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('class_name', selectedClass)
      .eq('attendance_date', selectedDate);

    if (attendance && attendance.length > 0) {
      const p = attendance.filter(a => a.status === 'Present').length;
      setPresentCount(p);
      setHasTeacherSubmission(true);
    } else {
      setPresentCount(45);
      setHasTeacherSubmission(false);
    }
    setLoading(false);
  }

  async function handleApprove(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: students } = await supabase
      .from('students')
      .select('gr_number')
      .eq('class_name', selectedClass);

    if (!students || students.length === 0) {
      setMessage('No students found for ' + selectedClass);
      setLoading(false);
      return;
    }

    let records = [];
    let pCount = Number(presentCount);

    students.forEach((s, index) => {
      let status = index < pCount ? 'Present' : 'Absent';
      records.push({
        gr_number: s.gr_number,
        class_name: selectedClass,
        attendance_date: selectedDate,
        status: status,
        is_approved: true // Marks as approved and pushes to final overview summary
      });
    });

    const { error } = await supabase
      .from('attendance_records')
      .upsert(records, { onConflict: ['gr_number', 'attendance_date'] });

    if (error) {
      console.error('Error approving attendance:', error);
      setMessage('Failed to approve attendance.');
    } else {
      setMessage('Attendance successfully approved and published to Summary!');
      setHasTeacherSubmission(true);
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Responsive header layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">HM Approval Portal</h2>
          <p className="text-xs sm:text-sm text-slate-500">Review teacher submissions and publish attendance to the school overview summary.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <label className="text-xs sm:text-sm font-medium text-slate-600">Date:</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-slate-300 bg-white px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <label className="text-xs sm:text-sm font-medium text-slate-600">Class:</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-slate-300 bg-white px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium shadow-sm flex items-center gap-2">
          <span>✅</span> {message}
        </div>
      )}

      {/* Fully responsive approval form card */}
      <div className="w-full max-w-xl mx-auto sm:mx-0 bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">Review {selectedClass} Attendance</h3>
          {hasTeacherSubmission ? (
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-xs rounded-full font-medium">
              Teacher Submitted (Pending HM Approval)
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] sm:text-xs rounded-full font-medium">
              No Submission Yet
            </span>
          )}
        </div>

        <form onSubmit={handleApprove}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-700 mb-1">Confirmed Present Count (Max 45)</label>
              <input 
                type="number" 
                min="0" 
                max="45"
                value={presentCount}
                onChange={e => setPresentCount(e.target.value)}
                className="w-full border border-slate-300 bg-white px-4 py-2.5 rounded-xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-emerald-600"
              />
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Calculated Absent:</span>
              <span className="text-base sm:text-lg font-bold text-rose-600">{absentCount} Students</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {loading ? 'Approving...' : 'Approve & Publish to Summary'}
          </button>
        </form>
      </div>
    </div>
  );
}