import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

const allClassStandardSubjects = {
  'Class 5': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 6': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 7': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 8': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 9': ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Sindhi', 'Physics'],
  'Class 10': ['English', 'Pakistan Studies', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics']
};

export default function ClassResultManager({ currentUser }) {
  const isHm = currentUser === 'hm';
  const teacherInfo = !isHm ? teacherWorkloadMap[currentUser] : null;

  const allowedClasses = isHm 
    ? ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
    : Object.keys(teacherInfo?.assignments || {});

  const [selectedClass, setSelectedClass] = useState(allowedClasses[0] || 'Class 5');
  const [shiftFilter, setShiftFilter] = useState('Evening');
  const [term, setTerm] = useState('Mid-Term 2026');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [maxMarksConfig, setMaxMarksConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);

  const standardSubjects = allClassStandardSubjects[selectedClass] || [];
  const activeEditableSubjects = isHm ? standardSubjects : (teacherInfo?.assignments[selectedClass] || []);

  useEffect(() => {
    if (allowedClasses.length > 0 && !allowedClasses.includes(selectedClass)) {
      setSelectedClass(allowedClasses[0]);
    }
  }, [currentUser]);

  useEffect(() => {
    const initialMax = {};
    allClassStandardSubjects[selectedClass]?.forEach(sub => {
      initialMax[sub] = 100;
    });
    setMaxMarksConfig(initialMax);
    fetchClassData();
  }, [selectedClass, term, shiftFilter]);

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

      const filteredStudents = (studentList || []).filter(st => {
        const studentShift = (st.shift || '').trim().toLowerCase();
        const targetShift = isHm ? shiftFilter.toLowerCase() : 'evening';

        if (studentShift !== targetShift) return false;

        if (!isHm) {
          const gender = (st.gender || '').trim().toLowerCase();
          if (gender.includes('female') || gender === 'f') return false;
        }

        return true;
      });

      const { data: resultList, error: resultError } = await supabase
        .from('student_results')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('term', term);

      if (resultError) throw resultError;

      const marksMap = {};
      const loadedMaxMarks = { ...maxMarksConfig };

      resultList?.forEach((res) => {
        const savedMarks = res.marks || {};
        marksMap[res.student_id] = {
          ...savedMarks,
          remarks: res.remarks || 'Passed',
        };
        if (res.max_marks_config) {
          Object.assign(loadedMaxMarks, res.max_marks_config);
        }
      });

      filteredStudents.forEach((st) => {
        if (!marksMap[st.gr_number]) {
          const defaultSubMarks = {};
          standardSubjects.forEach(sub => { defaultSubMarks[sub] = 0; });
          defaultSubMarks.remarks = 'Passed';
          marksMap[st.gr_number] = defaultSubMarks;
        } else {
          standardSubjects.forEach(sub => {
            if (marksMap[st.gr_number][sub] === undefined) {
              marksMap[st.gr_number][sub] = 0;
            }
          });
        }
      });

      setMaxMarksConfig(loadedMaxMarks);
      setStudents(filteredStudents);
      setMarksData(marksMap);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (grNumber, subject, value) => {
    const maxAllowed = Number(maxMarksConfig[subject]) || 100;
    const numValue = Math.max(0, Math.min(maxAllowed, Number(value) || 0));
    setMarksData((prev) => ({
      ...prev,
      [grNumber]: {
        ...prev[grNumber],
        [subject]: numValue,
      },
    }));
  };

  const handleMaxMarkChange = (subject, value) => {
    const val = Math.max(1, Number(value) || 100);
    setMaxMarksConfig(prev => ({
      ...prev,
      [subject]: val
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

  const calculateTotalObtained = (studentMarks) => {
    return standardSubjects.reduce((sum, sub) => sum + (Number(studentMarks?.[sub]) || 0), 0);
  };

  const calculateTotalMaxScore = () => {
    return standardSubjects.reduce((sum, sub) => sum + (Number(maxMarksConfig[sub]) || 100), 0);
  };

  const calculateGrade = (percentage) => {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const { data: existingRecords } = await supabase
        .from('student_results')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('term', term);

      const existingMap = {};
      existingRecords?.forEach(rec => {
        existingMap[rec.student_id] = rec;
      });

      const totalMaxScore = calculateTotalMaxScore();

      const recordsToUpsert = students.map((st) => {
        const gr = st.gr_number;
        const m = marksData[gr] || {};
        const existing = existingMap[gr];

        const mergedMarks = existing?.marks ? { ...existing.marks } : {};
        activeEditableSubjects.forEach(sub => {
          mergedMarks[sub] = m[sub] || 0;
        });

        let totalObtained = 0;
        standardSubjects.forEach(sub => {
          totalObtained += Number(mergedMarks[sub]) || 0;
        });

        const percentage = totalMaxScore > 0 ? (totalObtained / totalMaxScore) * 100 : 0;
        const grade = calculateGrade(percentage);

        return {
          student_id: gr,
          class_name: selectedClass,
          term: term,
          marks: mergedMarks,
          max_marks_config: maxMarksConfig,
          total_obtained: totalObtained,
          total_max: totalMaxScore,
          percentage: Number(percentage.toFixed(2)),
          grade: grade,
          remarks: m.remarks || existing?.remarks || 'Passed'
        };
      });

      const { error } = await supabase
        .from('student_results')
        .upsert(recordsToUpsert, { onConflict: 'student_id, term' });

      if (error) throw error;

      setSuccessMsg(isHm ? 'All results saved successfully!' : `Marks for your assigned subjects in ${selectedClass} saved successfully!`);
    } catch (err) {
      console.error('Error saving marks:', err.message);
      alert('Error saving marks: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportClassToExcel = () => {
    if (students.length === 0) {
      alert('No student data available to export.');
      return;
    }

    const totalMaxScore = calculateTotalMaxScore();
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["GR Number", "Student Name", "Father's Name", "Shift", "Gender", ...standardSubjects.map(s => `${s} (Max ${maxMarksConfig[s] || 100})`), "Total Obtained", "Max Marks", "Percentage", "Grade", "Remarks"];
    csvContent += headers.join(",") + "\n";

    students.forEach((st) => {
      const m = marksData[st.gr_number] || {};
      const total = calculateTotalObtained(m);
      const percentage = totalMaxScore > 0 ? ((total / totalMaxScore) * 100).toFixed(2) : 0;
      const grade = calculateGrade(percentage);
      const remarks = m.remarks || 'Passed';

      const row = [
        st.gr_number,
        `"${st.full_name || ''}"`,
        `"${st.father_name || ''}"`,
        st.shift || shiftFilter,
        st.gender || 'Male',
        ...standardSubjects.map(sub => m[sub] ?? 0),
        total,
        totalMaxScore,
        percentage + '%',
        grade,
        `"${remarks}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Al_Madni_${selectedClass}_${shiftFilter}_${term.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReportCard = (student) => {
    setSelectedStudentForCard(student);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const sendWhatsAppToHM = (student) => {
    const m = marksData[student.gr_number] || {};
    const total = calculateTotalObtained(m);
    const totalMaxScore = calculateTotalMaxScore();
    const percentage = totalMaxScore > 0 ? ((total / totalMaxScore) * 100).toFixed(1) : 0;
    const grade = calculateGrade(percentage);
    const remarks = m.remarks || 'Passed';

    let subjectDetails = '';
    standardSubjects.forEach(sub => {
      subjectDetails += `• ${sub}: ${m[sub] || 0}/${maxMarksConfig[sub] || 100}\n`;
    });

    const message = `🏫 *AL-MADNI SECONDARY SCHOOL B.A.B. MATIARI*
*(Result Submission)*
-----------------------------------
👤 *Student Name:* ${student.full_name}
🔢 *GR Number:* ${student.gr_number}
👨‍👦 *Father's Name:* ${student.father_name || '-'}
📚 *Class:* ${student.class_name} (${student.shift || 'Evening Shift'})
📅 *Term:* ${term}
-----------------------------------
*Subject Breakdown:*
${subjectDetails}-----------------------------------
📊 *Total Obtained:* ${total} / ${totalMaxScore}
📈 *Percentage:* ${percentage}%
🏆 *Grade:* ${grade}
📝 *Remarks:* ${remarks}
-----------------------------------
Submitted by: ${isHm ? 'Headmaster' : teacherInfo?.name}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/923123942795?text=${encodedMessage}`, '_blank');
  };

  const totalMaxScore = calculateTotalMaxScore();
  const studentsWithMarksCount = students.filter(st => calculateTotalObtained(marksData[st.gr_number]) > 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isHm ? 'Exam Results Management & Report Cards' : `${teacherInfo?.name} - Subject Grading`}
            </h1>
            <p className="text-sm text-gray-500">
              {isHm ? `Al-Madni Secondary School B.A.B. Matiari (${shiftFilter} Shift) | Grand Total Max: ${totalMaxScore} | Students Graded: ${studentsWithMarksCount}/${students.length}` : `Showing Evening Male Students Only | Grand Total Max: ${totalMaxScore} | Editable Subjects: ${activeEditableSubjects.join(', ') || 'None'}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {isHm && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Shift</label>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-indigo-700"
                >
                  <option value="Evening">Evening Shift</option>
                  <option value="Morning">Morning Shift</option>
                </select>
              </div>
            )}

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
              disabled={saving || students.length === 0}
              className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Marks'}
            </button>

            {isHm && (
              <button
                onClick={exportClassToExcel}
                disabled={students.length === 0}
                className="mt-5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>📊</span> Export Class Excel
              </button>
            )}
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
            No students found in {selectedClass} for {shiftFilter} shift.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b">
                    <th className="p-3">GR # & Name</th>
                    {standardSubjects.map((sub) => {
                      const isEditable = isHm || activeEditableSubjects.includes(sub);
                      return (
                        <th key={sub} className={`p-3 text-center ${isEditable ? 'text-indigo-700 font-bold bg-indigo-50/30' : 'text-gray-400'}`}>
                          <div>{sub}</div>
                          <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                            Max: {isEditable ? (
                              <input
                                type="number"
                                min="1"
                                max="500"
                                value={maxMarksConfig[sub] ?? 100}
                                onChange={(e) => handleMaxMarkChange(sub, e.target.value)}
                                className="w-12 text-center border rounded bg-white text-black font-semibold ml-1 py-0.5 text-xs"
                              />
                            ) : (
                              <span>{maxMarksConfig[sub] ?? 100}</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center">Total ({totalMaxScore})</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {students.map((st) => {
                    const m = marksData[st.gr_number] || {};
                    const total = calculateTotalObtained(m);
                    const percentage = totalMaxScore > 0 ? (total / totalMaxScore) * 100 : 0;
                    const grade = calculateGrade(percentage);

                    return (
                      <tr key={st.gr_number} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                          <div>{st.full_name}</div>
                          <div className="text-xs text-gray-400">GR: {st.gr_number} | S/o: {st.father_name}</div>
                        </td>
                        {standardSubjects.map((sub) => {
                          const isEditable = isHm || activeEditableSubjects.includes(sub);
                          const subjectMax = maxMarksConfig[sub] ?? 100;
                          return (
                            <td key={sub} className="p-3 text-center">
                              {isEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={subjectMax}
                                  value={m[sub] ?? 0}
                                  onChange={(e) => handleMarkChange(st.gr_number, sub, e.target.value)}
                                  className="w-16 text-center border rounded p-1 text-sm bg-gray-50 focus:bg-white font-semibold text-indigo-700"
                                  title={`Max: ${subjectMax}`}
                                />
                              ) : (
                                <span className="text-gray-500 font-medium">{m[sub] ?? 0}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-bold text-gray-700">{total} / {totalMaxScore}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
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
                            disabled={!isHm && activeEditableSubjects.length === 0}
                            onChange={(e) => handleRemarkChange(st.gr_number, e.target.value)}
                            className="w-32 border rounded p-1 text-xs bg-gray-50 focus:bg-white"
                          />
                        </td>
                        <td className="p-3 text-center space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => printReportCard(st)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-semibold border border-indigo-200 transition"
                            title="Print Report Card"
                          >
                            🖨️ Print
                          </button>
                          <button
                            onClick={() => sendWhatsAppToHM(st)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold border border-emerald-200 transition"
                            title="Send to HM WhatsApp"
                          >
                            💬 Send to HM
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

      {/* Printable Report Card Template */}
      {selectedStudentForCard && (
        <div className="hidden print:block p-4 bg-white text-black font-sans max-w-2xl mx-auto border border-slate-800 rounded-lg my-0">
          <div className="text-center border-b border-slate-800 pb-2 mb-3">
            <h1 className="text-xl font-bold uppercase tracking-wider">Al-Madni Secondary School B.A.B. Matiari</h1>
            <p className="text-xs font-medium text-slate-600">Official Student Academic Report Card ({selectedStudentForCard.shift || shiftFilter} Shift)</p>
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
              {standardSubjects.map((sub) => {
                const subjectMax = maxMarksConfig[sub] ?? 100;
                return (
                  <tr key={sub}>
                    <td className="border border-slate-800 p-1.5">{sub}</td>
                    <td className="border border-slate-800 p-1.5 text-center">{subjectMax}</td>
                    <td className="border border-slate-800 p-1.5 text-center">{marksData[selectedStudentForCard.gr_number]?.[sub] || 0}</td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-slate-100">
                <td className="border border-slate-800 p-1.5">Total</td>
                <td className="border border-slate-800 p-1.5 text-center">{totalMaxScore}</td>
                <td className="border border-slate-800 p-1.5 text-center">{calculateTotalObtained(marksData[selectedStudentForCard.gr_number])}</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-semibold">
            <div className="border border-slate-800 p-2 rounded">
              <div>Percentage</div>
              <div className="text-sm text-blue-700 mt-0.5">
                {totalMaxScore > 0 ? ((calculateTotalObtained(marksData[selectedStudentForCard.gr_number]) / totalMaxScore) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="border border-slate-800 p-2 rounded">
              <div>Grade</div>
              <div className="text-sm text-green-700 mt-0.5">
                {calculateGrade(totalMaxScore > 0 ? (calculateTotalObtained(marksData[selectedStudentForCard.gr_number]) / totalMaxScore) * 100 : 0)}
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
              <div>Class Teacher / Subject Teacher Signature</div>
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