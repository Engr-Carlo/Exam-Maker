import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useExam } from '../context/ExamContext'

const steps = [
  { path: '/tos', label: '1. Upload TOS', icon: '📋' },
  { path: '/config', label: '2. Exam Config', icon: '⚙️' },
  { path: '/questions', label: '3. Questions', icon: '❓' },
  { path: '/export', label: '4. Export', icon: '📄' },
]

export default function Layout() {
  const { resetAll } = useExam()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header bar */}
      <header className="bg-green-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">Exam Maker</span>
          <span className="text-green-200 text-sm">— University of Cabuyao</span>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Reset all data? This cannot be undone.')) {
              resetAll()
              window.location.href = '/tos'
            }
          }}
          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
        >
          Reset All
        </button>
      </header>

      {/* Step navigation */}
      <nav className="bg-white border-b shadow-sm px-6 py-2">
        <div className="flex gap-1">
          {steps.map((step) => {
            const isActive = location.pathname === step.path
            return (
              <NavLink
                key={step.path}
                to={step.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-green-100 text-green-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{step.icon}</span>
                {step.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
