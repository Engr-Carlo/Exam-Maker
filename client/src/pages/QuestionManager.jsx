import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExam } from '../context/ExamContext'
import QuestionForm from '../components/QuestionForm'
import BulkQuestionPaste from '../components/BulkQuestionPaste'
import QuestionList from '../components/QuestionList'
import TosComplianceDashboard from '../components/TosComplianceDashboard'

export default function QuestionManager() {
  const { questions, tos, config, importExamData } = useExam()
  const navigate = useNavigate()
  const [showDashboard, setShowDashboard] = useState(true)
  const [activeTab, setActiveTab] = useState('single')
  const fileInputRef = useRef(null)

  const totalRequired = tos?.totals?.grandTotal || 0

  const handleDownloadBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tos,
      config,
      questions,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeCourse = (config.courseCode || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_')
    a.href = url
    a.download = `${safeCourse}_question_bank.exam.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleUploadBackup = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      importExamData(parsed)
      window.alert(`Backup loaded: ${parsed.questions?.length || 0} questions restored.`)
      navigate('/questions')
    } catch {
      window.alert('Invalid backup file. Please upload a valid .exam.json file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Questions</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {questions.length} of {totalRequired} questions added
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Download backup before reset, then upload later to restore all questions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.exam.json,application/json"
            onChange={handleUploadBackup}
            className="hidden"
          />
          <button
            onClick={handleDownloadBackup}
            disabled={questions.length === 0}
            className="text-xs px-4 py-2 rounded-xl font-medium transition-all bg-blue-100 text-blue-700 ring-1 ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-4 py-2 rounded-xl font-medium transition-all bg-purple-100 text-purple-700 ring-1 ring-purple-200"
          >
            Upload Backup
          </button>
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
      </div>

      <div className={`grid gap-6 ${showDashboard ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        {/* Left: Form + List */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'single'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Single Question
            </button>
            <button
              onClick={() => setActiveTab('multiple')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'multiple'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Multiple Questions
            </button>
          </div>

          {activeTab === 'single' ? <QuestionForm /> : <BulkQuestionPaste />}
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
