import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExam } from '../context/ExamContext'
import QuestionForm from '../components/QuestionForm'
import QuestionList from '../components/QuestionList'
import TosComplianceDashboard from '../components/TosComplianceDashboard'

export default function QuestionManager() {
  const { questions, tos } = useExam()
  const navigate = useNavigate()
  const [showDashboard, setShowDashboard] = useState(true)

  const totalRequired = tos?.totals?.grandTotal || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Questions</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {questions.length} of {totalRequired} questions added
          </p>
        </div>
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
            showDashboard
              ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
        </button>
      </div>

      <div className={`grid gap-6 ${showDashboard ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        {/* Left: Form + List */}
        <div className="space-y-6">
          <QuestionForm />
          <QuestionList />

          {/* Nav buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/config')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate('/export')}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
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
