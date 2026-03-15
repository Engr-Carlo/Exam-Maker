import { useRef } from 'react'
import { useExam } from '../context/ExamContext'
import { useNavigate } from 'react-router-dom'

export default function ExamConfig() {
  const { config, setConfig } = useExam()
  const navigate = useNavigate()
  const sigInputRef = useRef(null)
  const templateInputRef = useRef(null)

  const update = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      update('signatureImage', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setConfig((prev) => ({
        ...prev,
        templateFile: ev.target.result,
        templateFileName: file.name,
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeTemplate = () => {
    setConfig((prev) => ({
      ...prev,
      templateFile: null,
      templateFileName: null,
    }))
    if (templateInputRef.current) templateInputRef.current.value = ''
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Exam Configuration</h1>
        <p className="text-gray-500 mt-1">Configure the exam header information for the exported document.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-3xl">
        {/* University info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">University Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">University Name</label>
              <input
                type="text"
                value={config.universityName}
                onChange={(e) => update('universityName', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">College</label>
              <input
                type="text"
                value={config.college}
                onChange={(e) => update('college', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Course info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Course Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Code</label>
              <input
                type="text"
                value={config.courseCode}
                onChange={(e) => update('courseCode', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
                placeholder="CPE101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title</label>
              <input
                type="text"
                value={config.courseTitle}
                onChange={(e) => update('courseTitle', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
                placeholder="Machine Learning"
              />
            </div>
          </div>
        </div>

        {/* Semester / AY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
            <select
              value={config.semester}
              onChange={(e) => update('semester', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
            >
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
            <input
              type="text"
              value={config.academicYear}
              onChange={(e) => update('academicYear', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
              placeholder="2025-2026"
            />
          </div>
        </div>

        {/* Exam type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2.5">Exam Type</label>
          <div className="flex gap-3">
            {['Preliminary', 'Midterm', 'Final'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update('examType', type)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  config.examType === type
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Instructor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructor Name</label>
          <input
            type="text"
            value={config.instructorName}
            onChange={(e) => update('instructorName', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition max-w-md"
            placeholder="Engr. Juan Dela Cruz"
          />
        </div>

        {/* Signature image upload */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Signature (Footer)</h3>
          <p className="text-xs text-gray-500 mb-2">Upload your signature image. It will appear in the "Prepared by" section of the document footer.</p>
          <input
            ref={sigInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleSignatureUpload}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => sigInputRef.current?.click()}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition"
            >
              {config.signatureImage ? 'Change Signature' : 'Upload Signature'}
            </button>
            {config.signatureImage && (
              <>
                <img
                  src={config.signatureImage}
                  alt="Signature preview"
                  className="h-12 border border-gray-200 rounded-lg bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => update('signatureImage', null)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Template upload */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Exam Template (Optional)</h3>
          <p className="text-xs text-gray-500 mb-2">
            Upload a <strong>.docx</strong> template with the placeholder <code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-700 font-mono text-[11px]">{'{{QUESTIONS}}'}</code> where exam items should be inserted. The system will keep your template's format and inject the questions at the placeholder location.
          </p>
          <input
            ref={templateInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleTemplateUpload}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => templateInputRef.current?.click()}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition"
            >
              {config.templateFile ? 'Change Template' : 'Upload Template'}
            </button>
            {config.templateFile && (
              <>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  <span className="text-green-700 text-sm">📄</span>
                  <span className="text-sm text-green-800 font-medium">{config.templateFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={removeTemplate}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </>
            )}
          </div>
          {config.templateFile && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700">
              <strong>Template mode active.</strong> The export will use your uploaded template instead of the default format. Signature, university details, and instructions from above will be ignored — they should already be in your template.
            </div>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Instructions</label>
          <p className="text-xs text-gray-400 mb-2">These instructions are only used when exporting <strong>without</strong> a template.</p>
          <textarea
            rows={5}
            value={config.instructions}
            onChange={(e) => update('instructions', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition resize-none"
          />
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate('/tos')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/questions')}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            Next: Add Questions →
          </button>
        </div>
      </div>
    </div>
  )
}
