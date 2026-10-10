import React, { useState } from 'react';
import HmAttendance from './pages/HmAttendance';
import ClassSummary from './pages/ClassSummary';
import AttendanceAnalytics from './pages/AttendanceAnalytics';
import AllStudentsDirectory from './pages/AllStudentsDirectory';
import ClassStudentManager from './pages/ClassStudentManager';
import ClassResultManager from './pages/ClassResultManager';

const teacherWorkload = [
  { name: 'Sir Ali Haider', subjects: ['English (Class 7, 8, 9, 10)', 'Social Studies (Class 8)'] },
  { name: 'Sir Sameer', subjects: ['Chemistry (Class 9, 10)', 'English (Class 5)', 'Math (Class 5)', 'Pakistan Studies (Class 10)', 'Salees Urdu (Class 10)'] },
  { name: 'Sir Ali Gul Shah', subjects: ['Islamiyat (Class 5, 7)', 'Salees Urdu (Class 5, 8)', 'English (Class 6)', 'Sindhi (Class 9)'] },
  { name: 'Sir Faizan', subjects: ['Islamiyat (Class 8, 9)', 'Social Studies (Class 5, 6, 7)', 'Sindhi (Class 8)'] },
  { name: 'Sir Qadir', subjects: ['Math (Class 6, 7, 8, 9, 10)', 'Physics (Class 9, 10)'] },
  { name: 'Sir Muhammad Khan', subjects: ['Biology (Class 9, 10)', 'Science (Class 5, 6, 7, 8)'] },
  { name: 'Sir Zubair', subjects: ['Sindhi (Class 5, 6, 7)', 'Salees Urdu (Class 6, 7)', 'Islamiyat (Class 6)'] }
];

function TeacherPortal({ teacherName }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold">Welcome, {teacherName}</h2>
        <p className="text-sm opacity-90 mt-1">Al-Madni Secondary School B.A.B. Matiari (Evening Shift)</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Faculty Teaching Workload Directory</h3>
        <p className="text-sm text-slate-500 mb-6">Review assigned subjects across the evening shift faculty:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teacherWorkload.map((teacher, idx) => (
            <div key={teacher.name} className={`border rounded-xl p-4 shadow-xs flex flex-col justify-between ${teacher.name === teacherName ? 'bg-indigo-50/50 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-indigo-700 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    {teacher.name} {teacher.name === teacherName && '(You)'}
                  </h4>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {teacher.subjects.length} Assignments
                  </span>
                </div>
                <ul className="space-y-1.5 mt-2">
                  {teacher.subjects.map((sub, sIdx) => (
                    <li key={sIdx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs sm:text-sm">
        ℹ️ <strong>Tip:</strong> Click on the <strong>Exam Results</strong> tab in the sidebar to enter and update marks for your assigned subjects.
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(null); // 'hm' or teacher username
  const [activeTab, setActiveTab] = useState('portal');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const teacherCredentials = {
    'alihaider': { pass: 'haider123', name: 'Sir Ali Haider' },
    'sameer': { pass: 'sameer123', name: 'Sir Sameer' },
    'aligul': { pass: 'gul123', name: 'Sir Ali Gul Shah' },
    'faizan': { pass: 'faizan123', name: 'Sir Faizan' },
    'qadir': { pass: 'qadir123', name: 'Sir Qadir' },
    'muhammadkhan': { pass: 'khan123', name: 'Sir Muhammad Khan' },
    'zubair': { pass: 'zubair123', name: 'Sir Zubair' }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanId = userId.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanId === 'hm' && cleanPass === 'hm') {
      setRole('hm');
      setActiveTab('entry');
    } else if (teacherCredentials[cleanId] && teacherCredentials[cleanId].pass === cleanPass) {
      setRole(cleanId); // stores teacher username e.g. 'sameer'
      setActiveTab('portal');
    } else {
      setError('Invalid credentials. Use hm/hm or your teacher username and password.');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setUserId('');
    setPassword('');
    setActiveTab('portal');
    setIsSidebarOpen(false);
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-indigo-100">
              🏫
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Al-Madni School Portal</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Sign in as Headmaster or Teacher</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Username / ID</label>
              <input 
                type="text" 
                placeholder="e.g. hm or sameer"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="w-full border border-slate-300 px-4 py-3 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-300 px-4 py-3 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isHm = role === 'hm';
  const currentTeacherName = !isHm ? teacherCredentials[role]?.name : 'Headmaster';

  const navItems = isHm ? [
    { id: 'entry', label: 'HM Attendance', icon: '📋' },
    { id: 'manage_students', label: 'Manage Students', icon: '👥' },
    { id: 'directory', label: 'Students Directory', icon: '📖' },
    { id: 'results', label: 'Exam Results', icon: '📝' },
    { id: 'summary', label: 'Overview Summary', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ] : [
    { id: 'portal', label: 'Teacher Portal', icon: '🏫' },
    { id: 'results', label: 'Exam Results', icon: '📝' },
    { id: 'directory', label: 'Students Directory', icon: '📖' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏫</span>
            <h1 className="font-bold text-slate-800 text-sm">Al-Madni School</h1>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          {isHm ? 'HM' : currentTeacherName}
        </span>
      </header>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-100">
              🏫
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-tight">Al-Madni School</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isHm ? 'Headmaster Portal' : currentTeacherName}
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs sm:text-sm font-semibold border border-rose-200 transition-colors shadow-xs"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 min-h-[80vh]">
          {activeTab === 'entry' && isHm && <HmAttendance />}
          {activeTab === 'portal' && !isHm && <TeacherPortal teacherName={currentTeacherName} />}
          {activeTab === 'manage_students' && isHm && <ClassStudentManager />}
          {activeTab === 'directory' && <AllStudentsDirectory />}
          {activeTab === 'results' && <ClassResultManager currentUser={role} />}
          {activeTab === 'summary' && isHm && <ClassSummary />}
          {activeTab === 'analytics' && isHm && <AttendanceAnalytics />}
        </div>
      </main>
    </div>
  );
}