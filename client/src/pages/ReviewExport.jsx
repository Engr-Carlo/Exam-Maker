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

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      // Only send the fields the server needs - strip all binary blobs from config
      const cleanConfig = {
        universityName: config.universityName,
        college: config.college,
        address: config.address,
        courseCode: config.courseCode,
        courseTitle: config.courseTitle,
        semester: config.semester,
        academicYear: config.academicYear,
        examType: config.examType,
        instructorName: config.instructorName,
        instructions: config.instructions,
      }

      const payload = {
        config: cleanConfig,
        questions,
        format: 'docx',
      }

      if (config.templateFile) {
        payload.templateFile = config.templateFile
      }

      const res = await axios.post(
        '/api/exam/export',
        payload,
        { responseType: 'blob' }
      )

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
      let msg = err.message
      if (err.response?.data) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          msg = json.error || text
        } catch {
          msg = 'Server error'
        }
      }
      setError('Export failed: ' + msg)
    } finally {
      setExporting(false)
    }
  }

  const totalRequired = tos?.totals?.grandTotal || 0
  const isCompliant = questions.length === totalRequired

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Review & Export</h1>
        <p className="text-gray-500 mt-1">Review your exam before exporting to .docx format.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Exam Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-400 font-medium uppercase">Course</span>
                <p className="font-semibold text-gray-800 mt-0.5">{config.courseCode} — {config.courseTitle}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-400 font-medium uppercase">Exam Type</span>
                <p className="font-semibold text-gray-800 mt-0.5">{config.examType}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-400 font-medium uppercase">Semester</span>
                <p className="font-semibold text-gray-800 mt-0.5">{config.semester} Sem, AY {config.academicYear}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-400 font-medium uppercase">Questions</span>
                <p className={`font-semibold mt-0.5 ${isCompliant ? 'text-green-700' : 'text-amber-700'}`}>
                  {questions.length} {totalRequired > 0 && `/ ${totalRequired}`}
                </p>
              </div>
            </div>
          </div>

          {/* Question preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Question Preview</h2>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-gray-400 text-sm">No questions added yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="border-b border-gray-100 pb-3">
                    <p className="text-sm">
                      <span className="font-bold text-green-700 mr-1">{i + 1}.</span>
                      <span className="font-medium text-gray-800">{q.questionText}</span>
                    </p>
                    <div className="ml-6 mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                      {['A', 'B', 'C', 'D'].map((letter) => (
                        <span
                          key={letter}
                          className={`flex items-center gap-1 ${
                            q.correctAnswer === letter
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-500'
                          }`}
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

          {/* Export section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Export</h2>

            {config.templateFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800 flex items-center gap-2">
                📄 <strong>Template mode:</strong>&nbsp;Exporting with <em>{config.templateFileName}</em>
              </div>
            )}

            {tos && !isCompliant && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
                You have <strong>{questions.length}</strong> questions but the TOS requires{' '}
                <strong>{totalRequired}</strong>. You can still export.
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting || questions.length === 0}
              className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              {exporting ? 'Generating...' : 'Export as .docx'}
            </button>

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Nav */}
          <button
            onClick={() => navigate('/questions')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition"
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
