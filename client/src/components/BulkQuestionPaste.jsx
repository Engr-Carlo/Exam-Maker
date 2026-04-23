import { useState } from 'react'
import { useExam } from '../context/ExamContext'

const COGNITIVE_LEVELS = [
  'Remembering',
  'Understanding',
  'Applying',
  'Analyzing',
  'Evaluating',
  'Creating',
]

function normalizeLevel(str) {
  if (!str) return ''
  const lower = str.trim().toLowerCase()
  return COGNITIVE_LEVELS.find((l) => l.toLowerCase() === lower) || ''
}

function parseBulkText(text) {
  const lines = text.split('\n')
  const questions = []
  let current = null

  for (const rawLine of lines) {
    const line = rawLine.trim()

    const qMatch = line.match(/^\d+\.\s+(.+)/)
    const choiceMatch = line.match(/^([A-Da-d])[.)]\s+(.+)/)
    const answerMatch = line.match(/^answer\s*:\s*([A-Da-d])/i)
    const cogMatch = line.match(/^cognitive\s*:\s*(.+)/i)

    if (qMatch) {
      if (current) questions.push(current)
      current = {
        question: qMatch[1].trim(),
        choices: ['', '', '', ''],
        answer: '',
        cognitiveLevel: '',
      }
    } else if (choiceMatch && current) {
      const idx = choiceMatch[1].toUpperCase().charCodeAt(0) - 65
      if (idx >= 0 && idx <= 3) current.choices[idx] = choiceMatch[2].trim()
    } else if (answerMatch && current) {
      current.answer = answerMatch[1].toUpperCase()
    } else if (cogMatch && current) {
      current.cognitiveLevel = normalizeLevel(cogMatch[1])
    }
  }

  if (current) questions.push(current)
  return questions
}

export default function BulkQuestionPaste() {
  const { tos, addQuestion } = useExam()
  const topics = tos?.topics?.map((t) => t.name) || []

  const [topic, setTopic] = useState('')
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseErrors, setParseErrors] = useState([])
  const [success, setSuccess] = useState('')

  const handleParse = () => {
    setSuccess('')
    const items = parseBulkText(text)
    const errs = []

    if (items.length === 0) {
      errs.push('No questions detected. Make sure each question starts with a number (e.g. "1. Question text").')
    }

    items.forEach((item, i) => {
      const num = i + 1
      if (!item.question) errs.push(`Q${num}: missing question text.`)
      const missingChoices = item.choices.map((c, ci) => (!c ? String.fromCharCode(65 + ci) : null)).filter(Boolean)
      if (missingChoices.length) errs.push(`Q${num}: missing choice(s): ${missingChoices.join(', ')}.`)
      if (!item.answer) errs.push(`Q${num}: missing answer line (e.g. "answer: c").`)
      if (!item.cognitiveLevel) errs.push(`Q${num}: unrecognized cognitive level. Use one of: ${COGNITIVE_LEVELS.join(', ')}.`)
    })

    setParseErrors(errs)
    setParsed(items.length > 0 ? items : null)
  }

  const handleAddAll = () => {
    if (!topic || parseErrors.length > 0 || !parsed) return
    parsed.forEach((item) => {
      addQuestion({ ...item, topic, image: '' })
    })
    setSuccess(`${parsed.length} question(s) added to the bank!`)
    setParsed(null)
    setText('')
    setParseErrors([])
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    setParsed(null)
    setParseErrors([])
    setSuccess('')
  }

  const placeholder = `1. What is the solar system?
A. A star
B. A galaxy
C. A planetary system
D. A nebula

answer: c
cognitive: remembering

2. What is the solar moon?
A. A star
B. A natural satellite
C. A comet
D. An asteroid

answer: b
cognitive: understanding`

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Paste Multiple Questions</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Paste all your questions at once using the format below, then click Parse.
        </p>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Topic <span className="text-red-400">(applies to all pasted questions)</span>
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">— Select Topic —</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Format hint */}
      <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 font-mono leading-relaxed">
        <p className="font-semibold text-blue-800 mb-1 font-sans">Expected format:</p>
        <p>1. Question text here</p>
        <p>A. Choice one</p>
        <p>B. Choice two</p>
        <p>C. Choice three</p>
        <p>D. Choice four</p>
        <p className="mt-1">answer: c</p>
        <p>cognitive: remembering</p>
      </div>

      {/* Paste area */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Questions
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={16}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <button
        onClick={handleParse}
        disabled={!text.trim()}
        className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Parse Questions
      </button>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-red-700 mb-1">Issues found:</p>
          {parseErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              • {err}
            </p>
          ))}
        </div>
      )}

      {/* Preview */}
      {parsed && parsed.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            {parsed.length} question(s) detected — preview:
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {parsed.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700">
                <p className="font-semibold mb-1">
                  {i + 1}. {item.question}
                </p>
                {item.choices.map((c, ci) => {
                  const letter = String.fromCharCode(65 + ci)
                  const isAnswer = letter === item.answer
                  return (
                    <p
                      key={ci}
                      className={`ml-3 ${isAnswer ? 'text-green-700 font-semibold' : ''}`}
                    >
                      {letter}. {c || <span className="text-red-400 italic">missing</span>}
                    </p>
                  )
                })}
                <p className="mt-1.5 text-gray-500">
                  Answer:{' '}
                  <span className="font-semibold text-green-700">
                    {item.answer || <span className="text-red-500">none</span>}
                  </span>{' '}
                  &middot;{' '}
                  {item.cognitiveLevel || (
                    <span className="text-red-500 italic">unknown cognitive level</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {!topic && (
            <p className="text-xs text-red-500 font-medium">⚠ Select a topic before adding.</p>
          )}

          {parseErrors.length > 0 && (
            <p className="text-xs text-red-500 font-medium">
              ⚠ Fix the issues above before adding.
            </p>
          )}

          <button
            onClick={handleAddAll}
            disabled={!topic || parseErrors.length > 0}
            className="px-5 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            Add All {parsed.length} Question(s) →
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <p className="text-sm font-semibold text-green-700 bg-green-50 rounded-xl px-4 py-2.5">
          ✓ {success}
        </p>
      )}
    </div>
  )
}
