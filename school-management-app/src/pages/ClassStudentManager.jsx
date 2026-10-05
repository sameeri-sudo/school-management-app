import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ClassStudentManager() {
  const [selectedClass, setSelectedClass] = useState('Class 1');
  const [selectedShift, setSelectedShift] = useState('All');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state for adding/editing students
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    gr_number: '',
    full_name: '',
    father_name: '',
    class_name: 'Class 1',
    section: 'A',
    shift: 'Morning'
  });

  const classes = ['Kachi', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedShift]);

  async function fetchStudents() {
    setLoading(true);
    let query = supabase
      .from('students')
      .select('*')
      .eq('class_name', selectedClass)
      .order('gr_number', { ascending: true });

    if (selectedShift !== 'All') {
      query = query.eq('shift', selectedShift);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      gr_number: '',
      full_name: '',
      father_name: '',
      class_name: selectedClass,
      section: 'A',
      shift: selectedShift === 'All' ? 'Morning' : selectedShift
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      gr_number: student.gr_number,
      full_name: student.full_name,
      father_name: student.father_name || '',
      class_name: student.class_name,
      section: student.section || 'A',
      shift: student.shift || 'Morning'
    });
    setIsModalOpen(true);
  };

  async function handleSaveStudent(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (editingStudent) {
      // Update existing student
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          father_name: formData.father_name,
          class_name: formData.class_name,
          section: formData.section,
          shift: formData.shift
        })
        .eq('gr_number', editingStudent.gr_number);

      if (error) {
        setMessage('❌ Error updating student: ' + error.message);
      } else {
        setMessage('✅ Student updated successfully!');
        setIsModalOpen(false);
        fetchStudents();
      }
    } else {
      // Insert new student
      const { error } = await supabase
        .from('students')
        .insert([formData]);

      if (error) {
        setMessage('❌ Error adding student: ' + error.message);
      } else {
        setMessage('✅ Student added successfully!');
        setIsModalOpen(false);
        fetchStudents();
      }
    }
    setLoading(false);
  }

  async function handleDeleteStudent(grNumber) {
    if (!window.confirm(`Are you sure you want to delete student GR #${grNumber}?`)) return;

    setLoading(true);
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('gr_number', grNumber);

    if (error) {
      setMessage('❌ Error deleting student: ' + error.message);
    } else {
      setMessage('✅ Student removed successfully.');
      fetchStudents();
    }
    setLoading(false);
  }

  const filteredStudents = students.filter(s =>
    String(s.gr_number).toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(s.full_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(s.father_name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Class-Wise Student Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Manage enrollment, update details, or add new students by class.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
        >
          <span>➕</span> Add New Student
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-medium shadow-xs flex items-center gap-2">
          {message}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Class:</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-slate-300 bg-white px-3 py-2 rounded-xl text-xs sm:text-sm shadow-xs focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Shift:</label>
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="border border-slate-300 bg-white px-3 py-2 rounded-xl text-xs sm:text-sm shadow-xs focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
            >
              <option value="All">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
            </select>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Quick Search:</label>
          <input
            type="text"
            placeholder="🔍 Search GR, Name, Father..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 bg-white px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white mb-6">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
              <th className="p-3 sm:p-4 font-semibold">GR Number</th>
              <th className="p-3 sm:p-4 font-semibold">Student Name</th>
              <th className="p-3 sm:p-4 font-semibold">Father's Name</th>
              <th className="p-3 sm:p-4 font-semibold">Section</th>
              <th className="p-3 sm:p-4 font-semibold">Shift</th>
              <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">Loading student records...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">No students found in {selectedClass} ({selectedShift} Shift).</td>
              </tr>
            ) : (
              filteredStudents.map(student => (
                <tr key={student.gr_number} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 sm:p-4 font-mono font-semibold text-slate-600">{student.gr_number}</td>
                  <td className="p-3 sm:p-4 font-bold text-slate-800">{student.full_name}</td>
                  <td className="p-3 sm:p-4 text-slate-600">{student.father_name || '-'}</td>
                  <td className="p-3 sm:p-4 font-semibold text-indigo-600">{student.section || 'A'}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${student.shift === 'Evening' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {student.shift || 'Morning'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(student)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.gr_number)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {editingStudent ? `Edit Student (GR #${editingStudent.gr_number})` : 'Add New Student'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">GR Number</label>
                <input
                  type="text"
                  disabled={editingStudent}
                  value={formData.gr_number}
                  onChange={e => setFormData({ ...formData, gr_number: e.target.value })}
                  placeholder="e.g. 1599"
                  className="w-full border border-slate-300 px-3.5 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Ali Ahmed"
                  className="w-full border border-slate-300 px-3.5 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={formData.father_name}
                  onChange={e => setFormData({ ...formData, father_name: e.target.value })}
                  placeholder="e.g. Muhammad Khan"
                  className="w-full border border-slate-300 px-3.5 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Class</label>
                  <select
                    value={formData.class_name}
                    onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={e => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}