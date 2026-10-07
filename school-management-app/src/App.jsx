import React, { useState } from 'react';
import TeacherAttendance from './pages/TeacherAttendance';
import HmAttendance from './pages/HmAttendance';
import ClassSummary from './pages/ClassSummary';
import AttendanceAnalytics from './pages/AttendanceAnalytics';
import AllStudentsDirectory from './pages/AllStudentsDirectory';
import ClassStudentManager from './pages/ClassStudentManager';
import ClassResultManager from './pages/ClassResultManager';

export default function App() {
  const [role, setRole] = useState(null); // 'hm', 'teacher', or null
  const [lockedClass, setLockedClass] = useState(null); // e.g. 'Class 3'
  const [activeTab, setActiveTab] = useState('entry'); // active navigation tab
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile drawer toggle

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
      setActiveTab('entry');
    } else {
      setError('Invalid credentials. Use hm/hm or class1/class1 through class10/class10.');
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
                placeholder="e.g. hm or class3"
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

  // Dynamic Navigation Items based on Role (HM gets student management, teachers get their class views)
  const navItems = role === 'hm' ? [
    { id: 'entry', label: 'HM Approval', icon: '📋' },
    { id: 'manage_students', label: 'Manage Students', icon: '👥' },
    { id: 'directory', label: 'Students Directory', icon: '📖' },
    { id: 'results', label: 'Exam Results', icon: '📝' },
    { id: 'summary', label: 'Overview Summary', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ] : [
    { id: 'entry', label: `${lockedClass} Entry`, icon: '📋' },
    { id: 'directory', label: 'Students Directory', icon: '📖' },
    { id: 'results', label: 'Exam Results', icon: '📝' },
    { id: 'summary', label: 'Overview Summary', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Navbar with Hamburger */}
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

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Logo / Brand Header */}
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

          {/* Navigation Links */}
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

        {/* Sidebar Footer / Logout */}
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 min-h-[80vh]">
          {activeTab === 'entry' && (
            role === 'hm' ? <HmAttendance /> : <TeacherAttendance lockedClass={lockedClass} />
          )}
          {activeTab === 'manage_students' && role === 'hm' && <ClassStudentManager />}
          {activeTab === 'directory' && <AllStudentsDirectory />}
          {activeTab === 'results' && <ClassResultManager />}
          {activeTab === 'summary' && <ClassSummary />}
          {activeTab === 'analytics' && <AttendanceAnalytics />}
        </div>
      </main>
    </div>
  );
}