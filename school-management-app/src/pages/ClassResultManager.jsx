import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Complete Teacher Workload Mapping for Subject Filtering
const teacherWorkloadMap = {
  'alihaider': {
    name: 'Sir Ali Haider',
    assignments: {
      'Class 7': ['English'],
      'Class 8': ['English', 'Social Studies'],
      'Class 9': ['English'],
      'Class 10': ['English']
    }
  },
  'sameer': {
    name: 'Sir Sameer',
    assignments: {
      'Class 5': ['English', 'Math'],
      'Class 9': ['Chemistry'],
      'Class 10': ['Chemistry', 'Pakistan Studies', 'Salees Urdu']
    }
  },
  'aligul': {
    name: 'Sir Ali Gul Shah',
    assignments: {
      'Class 5': ['Islamiyat', 'Salees Urdu'],
      'Class 6': ['English'],
      'Class 7': ['Islamiyat'],
      'Class 8': ['Salees Urdu'],
      'Class 9': ['Sindhi']
    }
  },
  'faizan': {
    name: 'Sir Faizan',
    assignments: {
      'Class 5': ['Social Studies'],
      'Class 6': ['Social Studies'],
      'Class 7': ['Social Studies'],
      'Class 8': ['Islamiyat', 'Sindhi'],
      'Class 9': ['Islamiyat']
    }
  },
  'qadir': {
    name: 'Sir Qadir',
    assignments: {
      'Class 6': ['Math'],
      'Class 7': ['Math'],
      'Class 8': ['Math'],
      'Class 9': ['Math', 'Physics'],
      'Class 10': ['Math', 'Physics']
    }
  },
  'muhammadkhan': {
    name: 'Sir Muhammad Khan',
    assignments: {
      'Class 5': ['Science'],
      'Class 6': ['Science'],
      'Class 7': ['Science'],
      'Class 8': ['Science'],
      'Class 9': ['Biology'],
      'Class 10': ['Biology']
    }
  },
  'zubair': {
    name: 'Sir Zubair',
    assignments: {
      'Class 5': ['Sindhi'],
      'Class 6': ['Sindhi', 'Salees Urdu', 'Islamiyat'],
      'Class 7': ['Sindhi', 'Salees Urdu']
    }
  }
};

export default function ClassResultManager({ currentUser }) {
  const isHm = currentUser === 'hm';
  const teacherInfo = !isHm ? teacherWorkloadMap[currentUser] : null;

  // Determine allowed classes for this teacher
  const allowedClasses = isHm 
    ? ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
    : Object.keys(teacherInfo?.assignments || {});

  const [selectedClass, setSelectedClass] = useState(allowedClasses[0] || 'Class 5');
  const [term, setTerm] = useState('Mid-Term 2026');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Get subjects visible to this user for the selected class
  const getSubjectsForClass = (cls) => {
    if (isHm) {
      // HM sees all standard subjects for that class
      return cls === 'Class 9' || cls === 'Class 10'
        ? ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics']
        : ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'];
    }
    return teacherInfo?.assignments[cls] || [];
  };

  const currentSubjects = getSubjectsForClass(selectedClass);

  useEffect(() => {
    if (allowedClasses.length > 0 && !allowedClasses.includes(selectedClass)) {
      setSelectedClass(allowedClasses[0]);
    }
  }, [currentUser]);

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
          currentSubjects.forEach(sub => { defaultSubMarks[sub] = 0; });
          defaultSubMarks.remarks = 'Passed';
          marksMap[st.gr_number] = defaultSubMarks;
        } else {
          currentSubjects.forEach(sub => {
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

  const handleSaveMarks = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      // Fetch existing results for these students so we merge teacher updates without overwriting other subjects
      for (const st of students) {
        const gr = st.gr_number;
        const m = marksData[gr] || {};

        // Fetch existing record
        const { data: existing } = await supabase
          .from('student_results')
          .select('*')
          .eq('student_id', gr)
          .eq('term', term)
          .maybeSingle();

        const mergedMarks = existing?.marks ? { ...existing.marks } : {};
        currentSubjects.forEach(sub => {
          mergedMarks[sub] = m[sub] || 0;
        });

        // Calculate total across all standard subjects if HM, or save partial if teacher
        const allPossibleSubs = selectedClass === 'Class 9' || selectedClass === 'Class 10'
          ? ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics']
          : ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'];

        let totalObtained = 0;
        allPossibleSubs.forEach(sub => {
          totalObtained += Number(mergedMarks[sub]) || 0;
        });

        const maxScore = allPossibleSubs.length * 100;
        const percentage = (totalObtained / maxScore) * 100;

        const grade = percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';

        await supabase
          .from('student_results')
          .upsert({
            student_id: gr,
            class_name: selectedClass,
            term: term,
            marks: mergedMarks,
            total_obtained: totalObtained,
            total_max: maxScore,
            percentage: Number(percentage.toFixed(2)),
            grade: grade,
            remarks: m.remarks || existing?.remarks || 'Passed'
          }, { onConflict: 'student_id, term' });
      }

      setSuccessMsg(isHm ? 'All results saved successfully!' : `Marks for your assigned subjects in ${selectedClass} saved successfully!`);
    } catch (err) {
      console.error('Error saving marks:', err.message);
      alert('Error saving marks: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isHm ? 'Exam Results Management' : `${teacherInfo?.name} - Subject Grading`}
          </h1>
          <p className="text-sm text-gray-500">
            {isHm ? 'Al-Madni Secondary School B.A.B. Matiari' : `Assigned Subjects: ${currentSubjects.join(', ') || 'None for this class'}`}
          </p>
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
              {allowedClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveMarks}
            disabled={saving || students.length === 0 || currentSubjects.length === 0}
            className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Marks'}
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
      ) : currentSubjects.length === 0 ? (
        <div className="text-center py-12 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-amber-800">
          You do not have any assigned subjects to grade in {selectedClass}. Please select another class from your assigned list.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b">
                  <th className="p-3">GR # & Name</th>
                  {currentSubjects.map((sub) => (
                    <th key={sub} className="p-3 text-center text-indigo-700 font-bold">{sub} (100)</th>
                  ))}
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map((st) => {
                  const m = marksData[st.gr_number] || {};

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
                            className="w-20 text-center border rounded p-1.5 text-sm bg-gray-50 focus:bg-white font-semibold"
                          />
                        </td>
                      ))}
                      <td className="p-3">
                        <input
                          type="text"
                          value={m.remarks ?? 'Passed'}
                          onChange={(e) => handleRemarkChange(st.gr_number, e.target.value)}
                          className="w-36 border rounded p-1.5 text-xs bg-gray-50 focus:bg-white"
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