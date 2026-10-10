import React, { useState } from 'react';
import HmAttendance from './pages/HmAttendance';
import ClassSummary from './pages/ClassSummary';
import AttendanceAnalytics from './pages/AttendanceAnalytics';
import AllStudentsDirectory from './pages/AllStudentsDirectory';
import ClassStudentManager from './pages/ClassStudentManager';
import ClassResultManager from './pages/ClassResultManager';

// Define subjects mapping for teacher view
const classSubjects = {
  'Class 5': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 6': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 7': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 8': ['English', 'Islamiyat', 'Math', 'Social Studies', 'Science', 'Sindhi', 'Salees Urdu'],
  'Class 9': ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics'],
  'Class 10': ['English', 'Islamiyat', 'Math', 'Biology', 'Chemistry', 'Salees Urdu', 'Physics']
};

// Dedicated Teacher Portal Component for viewing assigned class & subjects
function TeacherPortal({ lockedClass }) {
  const subjects = classSubjects[lockedClass] || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold">Welcome, Teacher Portal</h2>
        <p className="text-sm opacity-90 mt-1">Assigned Class: <span className="font-semibold underline">{lockedClass}</span></p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Curriculum & Subjects</h3>
        <p className="text-sm text-slate-500 mb-4">You are responsible for grading and assessment for the following subjects in {lockedClass}:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((sub, idx) => (
            <div key={sub} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </span>
              <div>
                <div className="font-semibold text-slate-800 text-sm">{sub}</div>
                <div className="text-xs text-slate-400">Max Marks: 100</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs sm:text-sm">
        ℹ️ <strong>Note:</strong> Daily attendance management is restricted to the Headmaster portal. You can navigate to the <strong>Exam Results</strong> tab to enter and manage term marks for your students.
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(null); // 'hm', 'teacher', or null
  const [lockedClass, setLockedClass] = useState(null); // e.g. 'Class 5'
  const [activeTab, setActiveTab] = useState('entry'); // active navigation tab
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanId = userId.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanId === 'hm' && cleanPass === 'hm') {
      setRole('hm');
      setLockedClass(null);
      setActiveTab('entry');
    } else if (cleanId.startsWith('class') && cleanPass === cleanId) {
      const classNum = cleanId.replace('class', '');
      const formattedClass = `Class ${classNum}`;
      setRole('teacher');
      setLockedClass(formattedClass);
      setActiveTab('portal');
    } else {
      setError('Invalid credentials. Use hm/hm or class5/class5 through class10/class10.');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setLockedClass(null);
    setUserId('');
    setPassword('');
    setActiveTab('entry');
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
                placeholder="e.g. hm or class5"
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

  // Navigation items based on role (Teachers don't get HM attendance/approval)
  const navItems = role === 'hm' ? [
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
          {role === 'hm' ? 'HM' : lockedClass}
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
                {role === 'hm' ? 'Headmaster Portal' : `Teacher (${lockedClass})`}
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
          {activeTab === 'entry' && role === 'hm' && <HmAttendance />}
          {activeTab === 'portal' && role === 'teacher' && <TeacherPortal lockedClass={lockedClass} />}
          {activeTab === 'manage_students' && role === 'hm' && <ClassStudentManager />}
          {activeTab === 'directory' && <AllStudentsDirectory />}
          {activeTab === 'results' && <ClassResultManager />}
          {activeTab === 'summary' && role === 'hm' && <ClassSummary />}
          {activeTab === 'analytics' && role === 'hm' && <AttendanceAnalytics />}
        </div>
      </main>
    </div>
  );
}