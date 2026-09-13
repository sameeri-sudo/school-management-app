import React, { useState } from 'react';
import TeacherAttendance from './pages/TeacherAttendance';
import HmAttendance from './pages/HmAttendance';
import ClassSummary from './pages/ClassSummary';
import AttendanceAnalytics from './pages/AttendanceAnalytics';

export default function App() {
  const [role, setRole] = useState(null); // 'hm', 'teacher', or null
  const [lockedClass, setLockedClass] = useState(null); // e.g. 'Class 3'
  const [activeTab, setActiveTab] = useState('entry'); // 'entry', 'summary', 'analytics'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      // e.g. user types 'class3' / 'class3' -> maps to 'Class 3'
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Responsive Navbar */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:h-16 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏫</span>
              <div>
                <h1 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">Al-Madni School</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  {role === 'hm' ? 'Headmaster Portal' : `Teacher Mode (${lockedClass})`}
                </p>
              </div>
            </div>
            {/* Mobile Logout Button */}
            <button 
              onClick={handleLogout}
              className="sm:hidden px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold border border-rose-200"
            >
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'entry' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {role === 'hm' ? 'HM Approval' : `${lockedClass} Entry`}
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'summary' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview Summary
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics
            </button>
          </nav>

          {/* Desktop Logout Button */}
          <div className="hidden sm:block">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200 transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-grow">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          {activeTab === 'entry' && (
            role === 'hm' ? <HmAttendance /> : <TeacherAttendance lockedClass={lockedClass} />
          )}
          {activeTab === 'summary' && <ClassSummary />}
          {activeTab === 'analytics' && <AttendanceAnalytics />}
        </div>
      </main>
    </div>
  );
}