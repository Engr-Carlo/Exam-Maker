import { useState, useRef } from 'react'
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
  correctAnswer: '',
}

// Parse pasted choices text into A/B/C/D
function parseChoicesFromText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const choices = { A: '', B: '', C: '', D: '' }
  const letters = ['A', 'B', 'C', 'D']

  for (let i = 0; i < lines.length && i < 4; i++) {
    // Strip leading letter+delimiter like "A.", "A)", "a.", "a)", "A -", etc.
    let cleaned = lines[i].replace(/^[a-dA-D][.):\-\s]+\s*/, '')
    choices[letters[i]] = cleaned || lines[i]
  }
  return choices
}

export default function QuestionForm({ editingQuestion, onDone }) {
  const { tos, addQuestion, updateQuestion } = useExam()
  const [form, setForm] = useState(editingQuestion || EMPTY_FORM)
  const [error, setError] = useState('')
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const questionRef = useRef(null)

  const topics = tos?.topics?.map((t) => t.name) || []

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePasteApply = () => {
    const parsed = parseChoicesFromText(pasteText)
    setForm(prev => ({
      ...prev,
      choiceA: parsed.A,
      choiceB: parsed.B,
      choiceC: parsed.C,
      choiceD: parsed.D,
      correctAnswer: '',
    }))
    setPasteMode(false)
    setPasteText('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.topic) return setError('Select a topic.')
    if (!form.cognitiveLevel) return setError('Select a cognitive level.')
    if (!form.questionText.trim()) return setError('Enter the question text.')
    if (!form.choiceA.trim() || !form.choiceB.trim() || !form.choiceC.trim() || !form.choiceD.trim())
      return setError('All four choices are required.')
    if (!form.correctAnswer) return setError('Click a letter to select the correct answer.')

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, form)
      onDone?.()
    } else {
      addQuestion(form)
      // Keep topic + cognitive level, clear everything else
      setForm(prev => ({
        ...EMPTY_FORM,
        topic: prev.topic,
        cognitiveLevel: prev.cognitiveLevel,
      }))
      // Focus back on question text for quick entry
      setTimeout(() => questionRef.current?.focus(), 50)
    }
  }

  const hasChoices = form.choiceA || form.choiceB || form.choiceC || form.choiceD

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-gray-800">
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </h3>
        {form.topic && form.cognitiveLevel && !editingQuestion && (
          <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
            {form.topic} / {form.cognitiveLevel}
          </span>
        )}
      </div>

      {/* Topic + Cognitive Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Topic</label>
          <select
            value={form.topic}
            onChange={(e) => update('topic', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
          >
            <option value="">— Select Topic —</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cognitive Level</label>
          <select
            value={form.cognitiveLevel}
            onChange={(e) => update('cognitiveLevel', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
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
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Question</label>
        <textarea
          ref={questionRef}
          rows={3}
          value={form.questionText}
          onChange={(e) => update('questionText', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition resize-none"
          placeholder="Enter the question..."
        />
      </div>

      {/* Choices section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choices</label>
          <button
            type="button"
            onClick={() => setPasteMode(!pasteMode)}
            className="text-xs text-green-700 hover:text-green-800 font-medium transition"
          >
            {pasteMode ? 'Cancel Paste' : 'Paste All Choices'}
          </button>
        </div>

        {pasteMode ? (
          <div className="space-y-2">
            <textarea
              rows={5}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full border border-green-200 rounded-xl px-3.5 py-2.5 text-sm bg-green-50 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
              placeholder={"Paste your choices here (one per line):\nA) First choice\nB) Second choice\nC) Third choice\nD) Fourth choice"}
              autoFocus
            />
            <button
              type="button"
              onClick={handlePasteApply}
              disabled={!pasteText.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              Apply Choices
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <button
                  type="button"
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold cursor-pointer transition-all ${
                    form.correctAnswer === letter
                      ? 'bg-green-600 text-white shadow-md ring-2 ring-green-300'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  }`}
                  title={`Click to set ${letter} as correct answer`}
                  onClick={() => update('correctAnswer', letter)}
                >
                  {letter}
                </button>
                <input
                  type="text"
                  value={form[`choice${letter}`]}
                  onChange={(e) => update(`choice${letter}`, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition"
                  placeholder={`Choice ${letter}`}
                />
              </div>
            ))}
          </div>
        )}

        {hasChoices && !form.correctAnswer && (
          <p className="text-xs text-amber-600 mt-2">Click a letter to mark the correct answer.</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          {editingQuestion ? 'Update Question' : 'Add Question'}
        </button>
        {editingQuestion && (
          <button
            type="button"
            onClick={onDone}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
