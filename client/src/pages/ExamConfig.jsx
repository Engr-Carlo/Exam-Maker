import { useExam } from '../context/ExamContext'
import { useNavigate } from 'react-router-dom'

export default function ExamConfig() {
  const { config, setConfig } = useExam()
  const navigate = useNavigate()

  const update = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Step 2: Exam Configuration</h1>
      <p className="text-gray-600 mb-6">
        Configure the exam header information. These will appear on the exported document.
      </p>

      <div className="bg-white rounded-xl shadow p-6 space-y-5 max-w-3xl">
        {/* University info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
            <input
              type="text"
              value={config.universityName}
              onChange={(e) => update('universityName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
            <input
              type="text"
              value={config.college}
              onChange={(e) => update('college', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Course info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
            <input
              type="text"
              value={config.courseCode}
              onChange={(e) => update('courseCode', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="CPE101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
            <input
              type="text"
              value={config.courseTitle}
              onChange={(e) => update('courseTitle', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Machine Learning"
            />
          </div>
        </div>

        {/* Semester / AY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={config.semester}
              onChange={(e) => update('semester', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              value={config.academicYear}
              onChange={(e) => update('academicYear', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="2025-2026"
            />
          </div>
        </div>

        {/* Exam type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
          <div className="flex gap-6">
            {['Preliminary', 'Midterm', 'Final'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="examType"
                  value={type}
                  checked={config.examType === type}
                  onChange={() => update('examType', type)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Instructor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
          <input
            type="text"
            value={config.instructorName}
            onChange={(e) => update('instructorName', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none max-w-md"
            placeholder="Engr. Juan Dela Cruz"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Instructions</label>
          <textarea
            rows={5}
            value={config.instructions}
            onChange={(e) => update('instructions', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate('/tos')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/questions')}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Next: Add Questions →
          </button>
        </div>
      </div>
    </div>
  )
}
