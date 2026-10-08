import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ClassResultManager() {
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [term, setTerm] = useState('Mid-Term 2026');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const classesList = ['Kachi', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  // Fetch students and existing results for the selected class
  useEffect(() => {
    fetchClassData();
  }, [selectedClass, term]);

  const fetchClassData = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      // 1. Fetch students for the class
      const { data: studentList, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('class_name', selectedClass)
        .order('gr_number', { ascending: true });

      if (studentError) throw studentError;

      // 2. Fetch existing results for this class and term
      const { data: resultList, error: resultError } = await supabase
        .from('student_results')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('term', term);

      if (resultError) throw resultError;

      // Map existing results into a lookup object keyed by gr_number
      const marksMap = {};
      resultList?.forEach((res) => {
        marksMap[res.student_id] = {
          math_marks: res.math_marks ?? 0,
          english_marks: res.english_marks ?? 0,
          science_marks: res.science_marks ?? 0,
          sindhi_marks: res.sindhi_marks ?? 0,
          social_studies_marks: res.social_studies_marks ?? 0,
          remarks: res.remarks || 'Passed',
        };
      });

      // Default empty marks for students without records
      studentList?.forEach((st) => {
        if (!marksMap[st.gr_number]) {
          marksMap[st.gr_number] = {
            math_marks: 0,
            english_marks: 0,
            science_marks: 0,
            sindhi_marks: 0,
            social_studies_marks: 0,
            remarks: 'Passed',
          };
        }
      });

      setStudents(studentList || []);
      setMarksData(marksMap);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (grNumber, subject, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value) || 0));
    setMarksData((prev) => ({
      ...prev,
      [grNumber]: {
        ...prev[grNumber],
        [subject]: numValue,
      },
    }));
  };

  const handleRemarkChange = (grNumber, value) => {
    setMarksData((prev) => ({
      ...prev,
      [grNumber]: {
        ...prev[grNumber],
        remarks: value,
      },
    }));
  };

  const calculateTotal = (marks) => {
    return (
      (Number(marks?.math_marks) || 0) +
      (Number(marks?.english_marks) || 0) +
      (Number(marks?.science_marks) || 0) +
      (Number(marks?.sindhi_marks) || 0) +
      (Number(marks?.social_studies_marks) || 0)
    );
  };

  const calculateGrade = (percentage) => {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const recordsToUpsert = students.map((st) => {
        const m = marksData[st.gr_number] || {};
        const total = calculateTotal(m);
        const percentage = total / 5;
        const grade = calculateGrade(percentage);

        return {
          student_id: st.gr_number,
          class_name: selectedClass,
          term: term,
          math_marks: m.math_marks,
          english_marks: m.english_marks,
          science_marks: m.science_marks,
          sindhi_marks: m.sindhi_marks,
          social_studies_marks: m.social_studies_marks,
          grade: grade,
          remarks: m.remarks,
        };
      });

      // Upsert into Supabase based on student_id & term
      const { error } = await supabase
        .from('student_results')
        .upsert(recordsToUpsert, { onConflict: 'student_id, term' });

      if (error) throw error;
      setSuccessMsg('All student results saved successfully!');
    } catch (err) {
      console.error('Error saving results:', err.message);
      alert('Error saving results: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class-Wise Result & Report Cards</h1>
          <p className="text-sm text-gray-500">Al-Madni Secondary School B.A.B. Matiari</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Mid-Term 2026">Mid-Term 2026</option>
              <option value="Final Term 2026">Final Term 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving || students.length === 0}
            className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Results'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading student marks...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
          No students found in {selectedClass}.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b">
                  <th className="p-3">GR # & Name</th>
                  <th className="p-3 text-center">Math (100)</th>
                  <th className="p-3 text-center">English (100)</th>
                  <th className="p-3 text-center">Science (100)</th>
                  <th className="p-3 text-center">Sindhi (100)</th>
                  <th className="p-3 text-center">Social St. (100)</th>
                  <th className="p-3 text-center">Total (500)</th>
                  <th className="p-3 text-center">%</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map((st) => {
                  const m = marksData[st.gr_number] || { math_marks: 0, english_marks: 0, science_marks: 0, sindhi_marks: 0, social_studies_marks: 0, remarks: 'Passed' };
                  const total = calculateTotal(m);
                  const percentage = (total / 500) * 100;
                  const grade = calculateGrade(percentage);

                  return (
                    <tr key={st.gr_number} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">
                        <div>{st.full_name}</div>
                        <div className="text-xs text-gray-400">GR: {st.gr_number} | S/o: {st.father_name}</div>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.math_marks}
                          onChange={(e) => handleMarkChange(st.gr_number, 'math_marks', e.target.value)}
                          className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.english_marks}
                          onChange={(e) => handleMarkChange(st.gr_number, 'english_marks', e.target.value)}
                          className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.science_marks}
                          onChange={(e) => handleMarkChange(st.gr_number, 'science_marks', e.target.value)}
                          className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.sindhi_marks}
                          onChange={(e) => handleMarkChange(st.gr_number, 'sindhi_marks', e.target.value)}
                          className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.social_studies_marks}
                          onChange={(e) => handleMarkChange(st.gr_number, 'social_studies_marks', e.target.value)}
                          className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="p-3 text-center font-bold text-gray-700">{total}</td>
                      <td className="p-3 text-center font-semibold text-blue-600">{percentage.toFixed(1)}%</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                          grade === 'B' || grade === 'C' ? 'bg-blue-100 text-blue-800' :
                          grade === 'D' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={m.remarks}
                          onChange={(e) => handleRemarkChange(st.gr_number, e.target.value)}
                          className="w-32 border rounded p-1 text-xs bg-gray-50 focus:bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}