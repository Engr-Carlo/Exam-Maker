import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useExam } from '../context/ExamContext'
import TosComplianceDashboard from '../components/TosComplianceDashboard'

export default function ReviewExport() {
  const { config, questions, tos } = useExam()
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async (format) => {
    setExporting(true)
    setError('')
    try {
      const res = await axios.post(
        '/api/exam/export',
        { config, questions, format },
        { responseType: 'blob' }
      )

      // Download file
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.courseCode || 'Exam'}_${config.examType || 'Exam'}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Export failed. ' + (err.response?.data?.error || err.message))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Step 4: Review & Export</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-3">Exam Summary</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Course:</span>{' '}
                <span className="font-medium">{config.courseCode} — {config.courseTitle}</span>
              </div>
              <div>
                <span className="text-gray-500">Exam Type:</span>{' '}
                <span className="font-medium">{config.examType}</span>
              </div>
              <div>
                <span className="text-gray-500">Semester:</span>{' '}
                <span className="font-medium">{config.semester} Sem, AY {config.academicYear}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Questions:</span>{' '}
                <span className="font-medium">{questions.length}</span>
              </div>
            </div>
          </div>

          {/* Question preview */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-3">Question Preview</h2>
            {questions.length === 0 ? (
              <p className="text-gray-400 text-sm">No questions added yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="border-b pb-2">
                    <p className="text-sm">
                      <strong>{i + 1}.</strong> {q.questionText}
                    </p>
                    <div className="ml-4 mt-1 grid grid-cols-2 gap-x-4 text-xs">
                      {['A', 'B', 'C', 'D'].map((letter) => (
                        <span
                          key={letter}
                          className={
                            q.correctAnswer === letter
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                          }
                        >
                          {letter}) {q[`choice${letter}`]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export buttons */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-3">Export</h2>

            {tos && questions.length !== tos.totals.grandTotal && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                ⚠️ You have <strong>{questions.length}</strong> questions but the TOS requires{' '}
                <strong>{tos.totals.grandTotal}</strong>. You can still export.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting || questions.length === 0}
                className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
              >
                {exporting ? 'Generating...' : '📥 Export as .docx'}
              </button>
            </div>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>

          {/* Nav */}
          <button
            onClick={() => navigate('/questions')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            ← Back to Questions
          </button>
        </div>

        {/* Right: TOS Dashboard */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <TosComplianceDashboard />
        </div>
      </div>
    </div>
  )
}
