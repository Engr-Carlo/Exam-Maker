import { useState } from 'react'
import axios from 'axios'
import { useExam } from '../context/ExamContext'
import { useNavigate } from 'react-router-dom'

export default function TosUpload() {
  const { tos, setTos } = useExam()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.')
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post('/api/tos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTos(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse TOS file.')
    } finally {
      setLoading(false)
    }
  }

  const cogLevels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Step 1: Upload Table of Specifications (TOS)</h1>
      <p className="text-gray-600 mb-6">
        Upload your TOS Excel file (.xlsx). The system will parse topics, cognitive levels, and item distribution.
      </p>

      {/* Upload area */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files[0])
              setError('')
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            {loading ? 'Parsing...' : 'Upload & Parse'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      {/* Parsed TOS display */}
      {tos && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-1">Parsed TOS</h2>
          <p className="text-sm text-gray-500 mb-4">
            {tos.courseCode} — {tos.courseTitle} | {tos.semester} | AY {tos.academicYear} | {tos.term}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="border px-3 py-2 text-left">Topic</th>
                  {cogLevels.map((l) => (
                    <th key={l} className="border px-3 py-2 text-center capitalize">{l}</th>
                  ))}
                  <th className="border px-3 py-2 text-center font-bold">Total</th>
                  <th className="border px-3 py-2 text-center">Hours</th>
                </tr>
              </thead>
              <tbody>
                {tos.topics.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{t.name}</td>
                    {cogLevels.map((l) => (
                      <td key={l} className="border px-3 py-2 text-center">
                        {t[l] || '-'}
                      </td>
                    ))}
                    <td className="border px-3 py-2 text-center font-bold">{t.total}</td>
                    <td className="border px-3 py-2 text-center">{t.teachingHours}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-green-50 font-bold">
                  <td className="border px-3 py-2">TOTAL</td>
                  {cogLevels.map((l) => (
                    <td key={l} className="border px-3 py-2 text-center">{tos.totals[l]}</td>
                  ))}
                  <td className="border px-3 py-2 text-center">{tos.totals.grandTotal}</td>
                  <td className="border px-3 py-2 text-center">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* LOTS/HOTS summary */}
          <div className="mt-4 flex gap-6 text-sm">
            <span className="bg-blue-50 px-3 py-1 rounded">
              <strong>LOTS (60%):</strong>{' '}
              {tos.totals.remembering + tos.totals.understanding + tos.totals.applying}
            </span>
            <span className="bg-orange-50 px-3 py-1 rounded">
              <strong>HOTS (40%):</strong>{' '}
              {tos.totals.analyzing + tos.totals.evaluating + tos.totals.creating}
            </span>
          </div>

          <button
            onClick={() => navigate('/config')}
            className="mt-6 bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Next: Configure Exam →
          </button>
        </div>
      )}
    </div>
  )
}
