import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ClassStudentManager({ currentUser }) {
  const isHm = currentUser === 'hm';

  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedShift, setSelectedShift] = useState('Evening');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    gr_number: '',
    full_name: '',
    father_name: '',
    class_name: 'Class 5',
    section: 'A',
    shift: 'Evening',
    gender: 'Male',
    photo_url: '',
    b_form_url: '',
    other_docs_url: ''
  });

  const [viewingDocsStudent, setViewingDocsStudent] = useState(null);

  const classes = isHm 
    ? ['Kachi', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
    : ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedShift, currentUser]);

  async function fetchStudents() {
    setLoading(true);
    let query = supabase
      .from('students')
      .select('gr_number, full_name, father_name, class_name, section, shift, gender, photo_url, b_form_url, other_docs_url')
      .eq('class_name', selectedClass)
      .order('gr_number', { ascending: true });

    if (selectedShift !== 'All') {
      query = query.eq('shift', selectedShift);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } else {
      let fetchedStudents = data || [];
      if (!isHm) {
        fetchedStudents = fetchedStudents.filter(st => {
          const gender = (st.gender || '').trim().toLowerCase();
          return gender === 'male' || gender === 'm';
        });
      }
      setStudents(fetchedStudents);
    }
    setLoading(false);
  }

  // Automatic Image Compressor & Base64 Converter
  const compressAndConvertImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG (0.7 quality)
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      gr_number: '',
      full_name: '',
      father_name: '',
      class_name: selectedClass,
      section: 'A',
      shift: selectedShift === 'All' ? 'Evening' : selectedShift,
      gender: 'Male',
      photo_url: '',
      b_form_url: '',
      other_docs_url: ''
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
      shift: student.shift || 'Evening',
      gender: student.gender || 'Male',
      photo_url: student.photo_url || '',
      b_form_url: student.b_form_url || '',
      other_docs_url: student.other_docs_url || ''
    });
    setIsModalOpen(true);
  };

  async function handleSaveStudent(e) {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    let photoUrl = formData.photo_url;
    let bFormUrl = formData.b_form_url;
    let otherDocsUrl = formData.other_docs_url;

    const photoInput = document.getElementById('student_photo_file');
    const bFormInput = document.getElementById('b_form_file');
    const otherDocsInput = document.getElementById('other_docs_file');

    try {
      if (photoInput?.files?.[0]) {
        photoUrl = await compressAndConvertImage(photoInput.files[0]);
      }
      if (bFormInput?.files?.[0]) {
        bFormUrl = await convertFileToBase64(bFormInput.files[0]);
      }
      if (otherDocsInput?.files?.[0]) {
        otherDocsUrl = await convertFileToBase64(otherDocsInput.files[0]);
      }
    } catch (err) {
      console.error('Error processing files:', err);
      alert('Error reading files.');
      setUploading(false);
      return;
    }

    const payload = {
      full_name: formData.full_name,
      father_name: formData.father_name,
      class_name: formData.class_name,
      section: formData.section,
      shift: formData.shift,
      gender: formData.gender,
      photo_url: photoUrl,
      b_form_url: bFormUrl,
      other_docs_url: otherDocsUrl
    };

    if (editingStudent) {
      const { error } = await supabase
        .from('students')
        .update(payload)
        .eq('gr_number', editingStudent.gr_number);

      if (error) {
        setMessage('❌ Error updating student: ' + error.message);
      } else {
        setMessage('✅ Student updated successfully!');
        setIsModalOpen(false);
        fetchStudents();
      }
    } else {
      payload.gr_number = formData.gr_number;
      const { error } = await supabase
        .from('students')
        .insert([payload]);

      if (error) {
        setMessage('❌ Error adding student: ' + error.message);
      } else {
        setMessage('✅ Student added successfully!');
        setIsModalOpen(false);
        fetchStudents();
      }
    }
    setUploading(false);
  }

  async function handleDeleteStudent(grNumber) {
    if (!isHm) {
      alert('Only the Headmaster can delete student records.');
      return;
    }

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            {isHm ? 'Class-Wise Student Management & Records' : 'Class Students Directory (Male Only)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {isHm ? 'Upload student photos and confidential documents directly.' : 'View enrolled male students and profile photos for your classes.'}
          </p>
        </div>

        {isHm && (
          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
          >
            <span>➕</span> Add New Student
          </button>
        )}
      </div>

      {message && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-medium shadow-xs flex items-center gap-2">
          {message}
        </div>
      )}

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
              <option value="Evening">Evening Shift</option>
              {isHm && <option value="All">All Shifts</option>}
              {isHm && <option value="Morning">Morning Shift</option>}
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white mb-6">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
              <th className="p-3 sm:p-4 font-semibold">Photo</th>
              <th className="p-3 sm:p-4 font-semibold">GR Number</th>
              <th className="p-3 sm:p-4 font-semibold">Student Name</th>
              <th className="p-3 sm:p-4 font-semibold">Father's Name</th>
              <th className="p-3 sm:p-4 font-semibold">Gender</th>
              <th className="p-3 sm:p-4 font-semibold">Section</th>
              <th className="p-3 sm:p-4 font-semibold">Shift</th>
              {isHm && <th className="p-3 sm:p-4 font-semibold">Documents</th>}
              <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {loading ? (
              <tr>
                <td colSpan={isHm ? 9 : 8} className="p-8 text-center text-slate-500">Loading student records...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={isHm ? 9 : 8} className="p-8 text-center text-slate-500">No students found in {selectedClass}.</td>
              </tr>
            ) : (
              filteredStudents.map(student => (
                <tr key={student.gr_number} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 sm:p-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{student.full_name?.charAt(0) || 'S'}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 font-mono font-semibold text-slate-600">{student.gr_number}</td>
                  <td className="p-3 sm:p-4 font-bold text-slate-800">{student.full_name}</td>
                  <td className="p-3 sm:p-4 text-slate-600">{student.father_name || '-'}</td>
                  <td className="p-3 sm:p-4 font-semibold text-indigo-600">{student.gender || 'Male'}</td>
                  <td className="p-3 sm:p-4 font-semibold text-slate-600">{student.section || 'A'}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${student.shift === 'Evening' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {student.shift || 'Evening'}
                    </span>
                  </td>
                  {isHm && (
                    <td className="p-3 sm:p-4">
                      <button
                        onClick={() => setViewingDocsStudent(student)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        📁 View Docs
                      </button>
                    </td>
                  )}
                  <td className="p-3 sm:p-4 text-right space-x-2">
                    {isHm ? (
                      <>
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
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">View Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingDocsStudent && isHm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Confidential Documents: {viewingDocsStudent.full_name}
              </h3>
              <button 
                onClick={() => setViewingDocsStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-700 mb-1">B-Form Document / Certificate:</p>
                {viewingDocsStudent.b_form_url ? (
                  <a 
                    href={viewingDocsStudent.b_form_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 underline font-medium hover:text-indigo-800 break-all"
                  >
                    🔗 Open B-Form File
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No B-Form uploaded.</span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-700 mb-1">Other Official Documents:</p>
                {viewingDocsStudent.other_docs_url ? (
                  <a 
                    href={viewingDocsStudent.other_docs_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 underline font-medium hover:text-indigo-800 break-all"
                  >
                    🔗 Open Other Documents File
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No other documents uploaded.</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingDocsStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && isHm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Class</label>
                  <select
                    value={formData.class_name}
                    onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {['Kachi', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-2.5 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <option value="Evening">Evening</option>
                    <option value="Morning">Morning</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-indigo-600 mb-1">Upload Student Photo (Auto-Compressed)</label>
                  <input
                    id="student_photo_file"
                    type="file"
                    accept="image/*"
                    className="w-full border border-slate-300 px-3 py-2 rounded-xl text-xs bg-slate-50"
                  />
                  {formData.photo_url && <p className="text-[11px] text-slate-400 mt-1">Current photo already attached.</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-indigo-600 mb-1">Upload B-Form Document (HM Only)</label>
                  <input
                    id="b_form_file"
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full border border-slate-300 px-3 py-2 rounded-xl text-xs bg-slate-50"
                  />
                  {formData.b_form_url && <p className="text-[11px] text-slate-400 mt-1">Current B-Form document already attached.</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-indigo-600 mb-1">Upload Other Official Docs (HM Only)</label>
                  <input
                    id="other_docs_file"
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full border border-slate-300 px-3 py-2 rounded-xl text-xs bg-slate-50"
                  />
                  {formData.other_docs_url && <p className="text-[11px] text-slate-400 mt-1">Current additional documents already attached.</p>}
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
                  disabled={uploading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Processing & Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}