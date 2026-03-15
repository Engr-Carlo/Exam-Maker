import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useExam } from '../context/ExamContext'

const steps = [
  { path: '/tos', label: 'Upload TOS', step: 1 },
  { path: '/config', label: 'Exam Config', step: 2 },
  { path: '/questions', label: 'Questions', step: 3 },
  { path: '/export', label: 'Export', step: 4 },
]

export default function Layout() {
  const { resetAll } = useExam()
  const location = useLocation()

  const currentStepIdx = steps.findIndex(s => s.path === location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header bar */}
      <header className="bg-gradient-to-r from-green-800 to-green-700 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">
              E
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Exam Maker</h1>
              <p className="text-green-200 text-xs">University of Cabuyao</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset all data? This cannot be undone.')) {
                resetAll()
                window.location.href = '/tos'
              }
            }}
            className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition font-medium"
          >
            Reset All
          </button>
        </div>
      </header>

      {/* Step navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => {
              const isActive = location.pathname === step.path
              const isPast = idx < currentStepIdx
              return (
                <div key={step.path} className="flex items-center">
                  {idx > 0 && (
                    <div className={`w-8 h-px mx-1 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                  <NavLink
                    to={step.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-green-50 text-green-800 shadow-sm ring-1 ring-green-200'
                        : isPast
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-green-700 text-white'
                        : isPast
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.step}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </NavLink>
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Simple footer */}
      <footer className="bg-white border-t py-3 px-6 text-center text-xs text-gray-400">
        Exam Maker v2.0 — University of Cabuyao
      </footer>
    </div>
  )
}
