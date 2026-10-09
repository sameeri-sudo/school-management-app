import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const classSubjects = {
  'Class 5': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 6': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 7': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 8': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 9': ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics'],
  'Class 10': ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics']
};

export default function ClassResultManager() {
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [term, setTerm] = useState('Mid-Term 2026');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);

  const classesList = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  const currentSubjects = classSubjects[selectedClass] || [];

  useEffect(() => {
    fetchClassData();
  }, [selectedClass, term]);

  const fetchClassData = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const { data: studentList, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('class_name', selectedClass)
        .order('gr_number', { ascending: true });

      if (studentError) throw studentError;

      const { data: resultList, error: resultError } = await supabase
        .from('student_results')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('term', term);

      if (resultError) throw resultError;

      const marksMap = {};
      const subjects = classSubjects[selectedClass] || [];

      resultList?.forEach((res) => {
        const savedMarks = res.marks || {};
        marksMap[res.student_id] = {
          ...savedMarks,
          remarks: res.remarks || 'Passed',
        };
      });

      studentList?.forEach((st) => {
        if (!marksMap[st.gr_number]) {
          const defaultSubMarks = {};
          subjects.forEach(sub => { defaultSubMarks[sub] = 0; });
          defaultSubMarks.remarks = 'Passed';
          marksMap[st.gr_number] = defaultSubMarks;
        } else {
          // Ensure all current subjects exist
          subjects.forEach(sub => {
            if (marksMap[st.gr_number][sub] === undefined) {
              marksMap[st.gr_number][sub] = 0;
            }
          });
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

  const calculateTotal = (studentMarks) => {
    return currentSubjects.reduce((sum, sub) => sum + (Number(studentMarks?.[sub]) || 0), 0);
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
      const maxScore = currentSubjects.length * 100;

      const recordsToUpsert = students.map((st) => {
        const m = marksData[st.gr_number] || {};
        const total = calculateTotal(m);
        const percentage = (total / maxScore) * 100;
        const grade = calculateGrade(percentage);

        // Extract only subject marks into an object
        const subjectMarksObj = {};
        currentSubjects.forEach(sub => {
          subjectMarksObj[sub] = m[sub] || 0;
        });

        return {
          student_id: st.gr_number,
          class_name: selectedClass,
          term: term,
          marks: subjectMarksObj,
          total_obtained: total,
          total_max: maxScore,
          percentage: Number(percentage.toFixed(2)),
          grade: grade,
          remarks: m.remarks || 'Passed',
        };
      });

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

  const printReportCard = (student) => {
    setSelectedStudentForCard(student);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Class-Wise Result & Report Cards</h1>
            <p className="text-sm text-gray-500">Al-Madni Secondary School B.A.B. Matiari (Evening Shift)</p>
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
                    {currentSubjects.map((sub) => (
                      <th key={sub} className="p-3 text-center">{sub} (100)</th>
                    ))}
                    <th className="p-3 text-center">Total ({currentSubjects.length * 100})</th>
                    <th className="p-3 text-center">%</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {students.map((st) => {
                    const m = marksData[st.gr_number] || {};
                    const total = calculateTotal(m);
                    const maxScore = currentSubjects.length * 100;
                    const percentage = (total / maxScore) * 100;
                    const grade = calculateGrade(percentage);

                    return (
                      <tr key={st.gr_number} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                          <div>{st.full_name}</div>
                          <div className="text-xs text-gray-400">GR: {st.gr_number} | S/o: {st.father_name}</div>
                        </td>
                        {currentSubjects.map((sub) => (
                          <td key={sub} className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={m[sub] ?? 0}
                              onChange={(e) => handleMarkChange(st.gr_number, sub, e.target.value)}
                              className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white"
                            />
                          </td>
                        ))}
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
                            value={m.remarks ?? 'Passed'}
                            onChange={(e) => handleRemarkChange(st.gr_number, e.target.value)}
                            className="w-32 border rounded p-1 text-xs bg-gray-50 focus:bg-white"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => printReportCard(st)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-semibold border border-indigo-200 transition whitespace-nowrap"
                          >
                            🖨️ Print
                          </button>
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

      {/* Printable Report Card Template (Single-page optimized) */}
      {selectedStudentForCard && (
        <div className="hidden print:block p-4 bg-white text-black font-sans max-w-2xl mx-auto border border-slate-800 rounded-lg my-0">
          <div className="text-center border-b border-slate-800 pb-2 mb-3">
            <h1 className="text-xl font-bold uppercase tracking-wider">Al-Madni Secondary School B.A.B. Matiari</h1>
            <p className="text-xs font-medium text-slate-600">Official Student Academic Report Card (Evening Shift)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Term: {term}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
            <div><strong>Student Name:</strong> {selectedStudentForCard.full_name}</div>
            <div><strong>GR Number:</strong> {selectedStudentForCard.gr_number}</div>
            <div><strong>Father's Name:</strong> {selectedStudentForCard.father_name}</div>
            <div><strong>Class:</strong> {selectedStudentForCard.class_name}</div>
          </div>

          <table className="w-full border-collapse border border-slate-800 mb-3 text-xs">
            <thead>
              <tr className="bg-slate-200 text-slate-900">
                <th className="border border-slate-800 p-1.5 text-left">Subject</th>
                <th className="border border-slate-800 p-1.5 text-center">Max Marks</th>
                <th className="border border-slate-800 p-1.5 text-center">Obtained Marks</th>
              </tr>
            </thead>
            <tbody>
              {currentSubjects.map((sub) => (
                <tr key={sub}>
                  <td className="border border-slate-800 p-1.5">{sub}</td>
                  <td className="border border-slate-800 p-1.5 text-center">100</td>
                  <td className="border border-slate-800 p-1.5 text-center">{marksData[selectedStudentForCard.gr_number]?.[sub] || 0}</td>
                </tr>
              ))}
              <tr className="font-bold bg-slate-100">
                <td className="border border-slate-800 p-1.5">Total</td>
                <td className="border border-slate-800 p-1.5 text-center">{currentSubjects.length * 100}</td>
                <td className="border border-slate-800 p-1.5 text-center">{calculateTotal(marksData[selectedStudentForCard.gr_number])}</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-semibold">
            <div className="border border-slate-800 p-2 rounded">
              <div>Percentage</div>
              <div className="text-sm text-blue-700 mt-0.5">
                {((calculateTotal(marksData[selectedStudentForCard.gr_number]) / (currentSubjects.length * 100)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="border border-slate-800 p-2 rounded">
              <div>Grade</div>
              <div className="text-sm text-green-700 mt-0.5">
                {calculateGrade((calculateTotal(marksData[selectedStudentForCard.gr_number]) / (currentSubjects.length * 100)) * 100)}
              </div>
            </div>
            <div className="border border-slate-800 p-2 rounded">
              <div>Remarks</div>
              <div className="text-xs text-slate-700 mt-0.5 truncate">
                {marksData[selectedStudentForCard.gr_number]?.remarks || 'Passed'}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8 pt-4 border-t border-slate-400 text-xs font-semibold">
            <div className="text-center">
              <div className="mb-4">______________________</div>
              <div>Class Teacher Signature</div>
            </div>
            <div className="text-center">
              <div className="mb-4">______________________</div>
              <div>Headmaster Signature & Stamp</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}