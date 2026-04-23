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

function parseTable(tableLines) {
  // Filter out pure separator lines like |---|---|
  const dataLines = tableLines.filter((l) => !/^\|?[\s\-|]+\|?$/.test(l))
  if (dataLines.length === 0) return null

  const parseRow = (line) =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 || arr[0] !== '') // strip empty leading/trailing from pipe edges
      .filter((c, i, arr) => !(i === arr.length - 1 && c === ''))

  const headers = parseRow(dataLines[0])
  const rows = dataLines.slice(1).map(parseRow)
  // Normalise row lengths
  const cols = headers.length
  const normRows = rows.map((r) => {
    const out = [...r]
    while (out.length < cols) out.push('')
    return out.slice(0, cols)
  })
  return { headers, rows: normRows }
}

function parseBulkText(text) {
  const lines = text.split('\n')
  const questions = []
  let current = null
  let tableLines = []
  let collectingTable = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    const qMatch = line.match(/^\d+\.\s+(.+)/)
    const choiceMatch = line.match(/^([A-Da-d])[.)\-\s]+\s*(.+)/)
    const answerMatch = line.match(/^answer\s*:\s*([A-Da-d])/i)
    const cogMatch = line.match(/^cognitive\s*:\s*(.+)/i)
    const isPipeLine = line.includes('|')

    if (qMatch) {
      if (current) {
        if (collectingTable && tableLines.length) {
          current.table = parseTable(tableLines)
        }
        questions.push(current)
      }
      tableLines = []
      collectingTable = false
      current = {
        questionText: qMatch[1].trim(),
        table: null,
        choiceA: '',
        choiceB: '',
        choiceC: '',
        choiceD: '',
        correctAnswer: '',
        cognitiveLevel: '',
        image: '',
      }
    } else if (isPipeLine && current && !current.choiceA) {
      // Table lines come before choices
      tableLines.push(line)
      collectingTable = true
    } else if (choiceMatch && current) {
      // First choice encountered — finalise table if collecting
      if (collectingTable && tableLines.length) {
        current.table = parseTable(tableLines)
        collectingTable = false
      }
      const letter = choiceMatch[1].toUpperCase()
      const key = `choice${letter}`
      if (key in current) current[key] = choiceMatch[2].trim()
    } else if (answerMatch && current) {
      current.correctAnswer = answerMatch[1].toUpperCase()
    } else if (cogMatch && current) {
      current.cognitiveLevel = normalizeLevel(cogMatch[1])
    }
  }

  if (current) {
    if (collectingTable && tableLines.length) {
      current.table = parseTable(tableLines)
    }
    questions.push(current)
  }
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
      if (!item.questionText) errs.push(`Q${num}: missing question text.`)
      const missingChoices = ['A','B','C','D'].filter((l) => !item[`choice${l}`])
      if (missingChoices.length) errs.push(`Q${num}: missing choice(s): ${missingChoices.join(', ')}.`)
      if (!item.correctAnswer) errs.push(`Q${num}: missing answer line (e.g. "answer: c").`)
      if (!item.cognitiveLevel) errs.push(`Q${num}: unrecognized cognitive level. Use one of: ${COGNITIVE_LEVELS.join(', ')}.`)
    })

    setParseErrors(errs)
    setParsed(items.length > 0 ? items : null)
  }

  const handleAddAll = () => {
    if (!topic || parseErrors.length > 0 || !parsed) return
    parsed.forEach((item) => {
      addQuestion({ ...item, topic })
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
        <p className="font-semibold text-blue-800 mb-1 font-sans">Expected format (table is optional):</p>
        <p>1. Question text here</p>
        <p className="text-blue-500">Col A  | Col B  | Col C</p>
        <p className="text-blue-500">val 1  | val 2  | val 3</p>
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
                  {i + 1}. {item.questionText}
                </p>
                {item.table && (
                  <div className="overflow-x-auto my-2">
                    <table className="text-xs border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          {item.table.headers.map((h, ci) => (
                            <th key={ci} className="border border-gray-300 px-2 py-1 bg-gray-200 font-semibold text-gray-700">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {item.table.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="border border-gray-300 px-2 py-1 text-gray-600">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {['A','B','C','D'].map((letter) => {
                  const isAnswer = letter === item.correctAnswer
                  return (
                    <p
                      key={letter}
                      className={`ml-3 ${isAnswer ? 'text-green-700 font-semibold' : ''}`}
                    >
                      {letter}. {item[`choice${letter}`] || <span className="text-red-400 italic">missing</span>}
                    </p>
                  )
                })}
                <p className="mt-1.5 text-gray-500">
                  Answer:{' '}
                  <span className="font-semibold text-green-700">
                    {item.correctAnswer || <span className="text-red-500">none</span>}
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
