import { useState } from 'react'
import { useExam } from '../context/ExamContext'

const COG_LEVELS = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating']

const EMPTY_FORM = {
  topic: '',
  cognitiveLevel: '',
  questionText: '',
  choiceA: '',
  choiceB: '',
  choiceC: '',
  choiceD: '',
  correctAnswer: 'A',
}

export default function QuestionForm({ editingQuestion, onDone }) {
  const { tos, addQuestion, updateQuestion } = useExam()
  const [form, setForm] = useState(editingQuestion || EMPTY_FORM)
  const [error, setError] = useState('')

  const topics = tos?.topics?.map((t) => t.name) || []

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validate
    if (!form.topic) return setError('Select a topic.')
    if (!form.cognitiveLevel) return setError('Select a cognitive level.')
    if (!form.questionText.trim()) return setError('Enter the question text.')
    if (!form.choiceA.trim() || !form.choiceB.trim() || !form.choiceC.trim() || !form.choiceD.trim())
      return setError('All four choices are required.')

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, form)
      onDone?.()
    } else {
      addQuestion(form)
      setForm(EMPTY_FORM)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 space-y-4">
      <h3 className="font-bold text-sm text-gray-700">
        {editingQuestion ? 'Edit Question' : 'Add New Question'}
      </h3>

      {/* Topic + Cognitive Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Topic</label>
          <select
            value={form.topic}
            onChange={(e) => update('topic', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">— Select Topic —</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cognitive Level</label>
          <select
            value={form.cognitiveLevel}
            onChange={(e) => update('cognitiveLevel', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">— Select Level —</option>
            {COG_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Question text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
        <textarea
          rows={3}
          value={form.questionText}
          onChange={(e) => update('questionText', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          placeholder="Enter the question..."
        />
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {['A', 'B', 'C', 'D'].map((letter) => (
          <div key={letter} className="flex items-start gap-2">
            <label
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1 cursor-pointer transition ${
                form.correctAnswer === letter
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Click to set ${letter} as correct answer`}
              onClick={() => update('correctAnswer', letter)}
            >
              {letter}
            </label>
            <input
              type="text"
              value={form[`choice${letter}`]}
              onChange={(e) => update(`choice${letter}`, e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder={`Choice ${letter}`}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">Click the letter circle to mark the correct answer (green = correct).</p>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
        >
          {editingQuestion ? 'Update Question' : 'Add Question'}
        </button>
        {editingQuestion && (
          <button
            type="button"
            onClick={onDone}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
