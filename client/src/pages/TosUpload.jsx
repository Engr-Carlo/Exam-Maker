import { useState, useRef } from 'react'
import axios from 'axios'
import { useExam } from '../context/ExamContext'
import { useNavigate } from 'react-router-dom'

export default function TosUpload() {
  const { tos, setTos } = useExam()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)
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

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setError('')
    }
  }

  const cogLevels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating']

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Table of Specifications</h1>
        <p className="text-gray-500 mt-1">
          Upload your TOS Excel file (.xlsx) to extract topics, cognitive levels, and item distribution.
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`bg-white rounded-2xl border-2 border-dashed p-8 mb-8 transition-all text-center ${
          dragActive ? 'border-green-500 bg-green-50' : file ? 'border-green-300 bg-green-50/50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { setFile(e.target.files[0]); setError('') }}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
            file ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {file ? '✓' : '📋'}
          </div>

          {file ? (
            <div>
              <p className="font-semibold text-green-800">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-700">Drag & drop your TOS file here</p>
              <p className="text-sm text-gray-400 mt-0.5">or click to browse</p>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition"
            >
              {file ? 'Change File' : 'Browse Files'}
            </button>
            {file && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="text-sm bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-medium transition"
              >
                {loading ? 'Parsing...' : 'Upload & Parse'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 inline-block">
            {error}
          </div>
        )}
      </div>

      {/* Parsed TOS display */}
      {tos && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Parsed TOS</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {tos.courseCode} — {tos.courseTitle} | {tos.semester} | AY {tos.academicYear}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-50/80">
                  <th className="border-b border-r border-gray-200 px-3 py-2.5 text-left font-semibold text-gray-700">Topic</th>
                  {cogLevels.map((l) => (
                    <th key={l} className="border-b border-r border-gray-200 px-3 py-2.5 text-center capitalize font-semibold text-gray-700">{l}</th>
                  ))}
                  <th className="border-b border-r border-gray-200 px-3 py-2.5 text-center font-bold text-gray-800">Total</th>
                  <th className="border-b border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-700">Hours</th>
                </tr>
              </thead>
              <tbody>
                {tos.topics.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="border-b border-r border-gray-100 px-3 py-2 font-medium text-gray-800">{t.name}</td>
                    {cogLevels.map((l) => (
                      <td key={l} className={`border-b border-r border-gray-100 px-3 py-2 text-center ${
                        t[l] > 0 ? 'text-gray-800 font-medium' : 'text-gray-300'
                      }`}>
                        {t[l] || '-'}
                      </td>
                    ))}
                    <td className="border-b border-r border-gray-100 px-3 py-2 text-center font-bold text-gray-900">{t.total}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-600">{t.teachingHours}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-green-50/80 font-bold">
                  <td className="border-r border-gray-200 px-3 py-2.5 text-gray-800">TOTAL</td>
                  {cogLevels.map((l) => (
                    <td key={l} className="border-r border-gray-200 px-3 py-2.5 text-center text-gray-800">{tos.totals[l]}</td>
                  ))}
                  <td className="border-r border-gray-200 px-3 py-2.5 text-center text-green-800 text-lg">{tos.totals.grandTotal}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* LOTS/HOTS summary */}
          <div className="mt-5 flex gap-4">
            <div className="flex-1 bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">LOTS (60%)</p>
              <p className="text-2xl font-bold text-blue-800 mt-0.5">
                {(() => {
                  const lots = tos.totals.remembering + tos.totals.understanding + tos.totals.applying
                  return lots > 0 ? lots : Math.round(tos.totals.grandTotal * 0.6)
                })()}
              </p>
            </div>
            <div className="flex-1 bg-orange-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">HOTS (40%)</p>
              <p className="text-2xl font-bold text-orange-800 mt-0.5">
                {(() => {
                  const hots = tos.totals.analyzing + tos.totals.evaluating + tos.totals.creating
                  return hots > 0 ? hots : Math.round(tos.totals.grandTotal * 0.4)
                })()}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/config')}
            className="mt-6 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            Next: Configure Exam →
          </button>
        </div>
      )}
    </div>
  )
}
