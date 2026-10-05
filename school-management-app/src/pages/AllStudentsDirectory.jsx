import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AllStudentsDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedShift, setSelectedShift] = useState('All');

  const classes = ['Kachi', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  useEffect(() => {
    fetchAllStudents();
  }, []);

  async function fetchAllStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('gr_number', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      String(student.gr_number).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.full_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.father_name).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = selectedClass === 'All' || student.class_name === selectedClass;
    const matchesShift = selectedShift === 'All' || student.shift === selectedShift;

    return matchesSearch && matchesClass && matchesShift;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">All Students Directory</h2>
          <p className="text-xs sm:text-sm text-slate-500">Complete institutional database across all classes, shifts, and sections.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="border border-slate-300 bg-white px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>

          <select
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
            className="border border-slate-300 bg-white px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>

          <input 
            type="text"
            placeholder="🔍 Search GR, Name, Father..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border border-slate-300 bg-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-60"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
              <th className="p-3 font-semibold">GR #</th>
              <th className="p-3 font-semibold">Student Name</th>
              <th className="p-3 font-semibold">Father's Name</th>
              <th className="p-3 font-semibold">Class</th>
              <th className="p-3 font-semibold">Section</th>
              <th className="p-3 font-semibold">Shift</th>
              <th className="p-3 font-semibold">Gender</th>
              <th className="p-3 font-semibold">Contact</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {loading ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-500">Loading student directory...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-500">No student records found matching your filters.</td>
              </tr>
            ) : (
              filteredStudents.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-semibold text-slate-600">{student.gr_number}</td>
                  <td className="p-3 font-bold text-slate-800">{student.full_name}</td>
                  <td className="p-3 text-slate-600">{student.father_name}</td>
                  <td className="p-3 font-semibold text-indigo-600">{student.class_name}</td>
                  <td className="p-3 text-slate-600">{student.section || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${student.shift === 'Evening' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {student.shift || 'Morning'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{student.gender || '-'}</td>
                  <td className="p-3 text-slate-600">{student.contact || '-'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] rounded-md font-medium">
                      {student.status || 'Active'}
                    </span>
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