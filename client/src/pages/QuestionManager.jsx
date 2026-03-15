import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionForm from '../components/QuestionForm'
import QuestionList from '../components/QuestionList'
import TosComplianceDashboard from '../components/TosComplianceDashboard'

export default function QuestionManager() {
  const navigate = useNavigate()
  const [showDashboard, setShowDashboard] = useState(true)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Step 3: Add Questions</h1>
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          {showDashboard ? 'Hide' : 'Show'} TOS Dashboard
        </button>
      </div>

      <div className={`grid gap-6 ${showDashboard ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
        {/* Left: Form + List */}
        <div className="space-y-6">
          <QuestionForm />
          <QuestionList />

          {/* Nav buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/config')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate('/export')}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
            >
              Next: Review & Export →
            </button>
          </div>
        </div>

        {/* Right: TOS Dashboard */}
        {showDashboard && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <TosComplianceDashboard />
          </div>
        )}
      </div>
    </div>
  )
}
