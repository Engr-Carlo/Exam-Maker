import { createContext, useContext, useState, useEffect } from 'react'

const ExamContext = createContext()

const DEFAULT_CONFIG = {
  universityName: 'University of Cabuyao',
  college: 'College of Engineering',
  address: 'Katapatan Mutual Homes, Brgy. Banay-banay, City of Cabuyao, Laguna 4025',
  courseCode: '',
  courseTitle: '',
  semester: '2nd',
  academicYear: '2025-2026',
  examType: 'Preliminary',
  instructorName: '',
  instructions:
    'INSTRUCTIONS:\n1. Read the instructions for each type of exam carefully. you have one and a half (1.5) hours to answer this exam.\nIf you have questions, please raise them to the proctor only.\n\nMultiple Choice: Shade the circle corresponding to the letter of your answer in the test paper. Use only a black or blue ballpoint pen for shading. Refrain from using pencils and erasers, as any corrections or unshaded answers will be considered incorrect.',
  templateFile: null,
  templateFileName: null,
}

const STORAGE_KEY = 'exam-maker-state'

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch {
    // ignore
  }
  return null
}

export function ExamProvider({ children }) {
  const saved = loadFromStorage()

  const [tos, setTos] = useState(saved?.tos || null)
  const [config, setConfig] = useState(saved?.config || DEFAULT_CONFIG)
  const [questions, setQuestions] = useState(saved?.questions || [])
  const [currentStep, setCurrentStep] = useState(saved?.currentStep || 0)

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tos, config, questions, currentStep })
    )
  }, [tos, config, questions, currentStep])

  // When TOS is uploaded, prefill config
  const setTosAndPrefill = (tosData) => {
    setTos(tosData)
    if (tosData) {
      setConfig((prev) => ({
        ...prev,
        courseCode: tosData.courseCode || prev.courseCode,
        courseTitle: tosData.courseTitle || prev.courseTitle,
        semester: tosData.semester || prev.semester,
        academicYear: tosData.academicYear || prev.academicYear,
      }))
    }
  }

  const addQuestion = (q) => {
    setQuestions((prev) => [...prev, { ...q, id: Date.now().toString() }])
  }

  const updateQuestion = (id, updated) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updated } : q))
    )
  }

  const deleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const reorderQuestions = (newOrder) => {
    setQuestions(newOrder)
  }

  const autoOrderQuestions = () => {
    if (!tos) return
    const topicOrder = tos.topics.map((t) => t.name)
    const cogOrder = [
      'Remembering',
      'Understanding',
      'Applying',
      'Analyzing',
      'Evaluating',
      'Creating',
    ]
    const sorted = [...questions].sort((a, b) => {
      const tA = topicOrder.indexOf(a.topic)
      const tB = topicOrder.indexOf(b.topic)
      if (tA !== tB) return tA - tB
      return cogOrder.indexOf(a.cognitiveLevel) - cogOrder.indexOf(b.cognitiveLevel)
    })
    setQuestions(sorted)
  }

  const shuffleAllChoices = () => {
    setQuestions((prev) =>
      prev.map((q) => {
        const choices = [
          { letter: 'A', text: q.choiceA },
          { letter: 'B', text: q.choiceB },
          { letter: 'C', text: q.choiceC },
          { letter: 'D', text: q.choiceD },
        ]
        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[choices[i], choices[j]] = [choices[j], choices[i]]
        }
        const correctOriginal = q.correctAnswer
        const originalText = q[`choice${correctOriginal}`]
        const newCorrectIndex = choices.findIndex((c) => c.text === originalText)
        const newLetters = ['A', 'B', 'C', 'D']

        return {
          ...q,
          choiceA: choices[0].text,
          choiceB: choices[1].text,
          choiceC: choices[2].text,
          choiceD: choices[3].text,
          correctAnswer: newLetters[newCorrectIndex],
        }
      })
    )
  }

  const resetAll = () => {
    setTos(null)
    setConfig(DEFAULT_CONFIG)
    setQuestions([])
    setCurrentStep(0)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <ExamContext.Provider
      value={{
        tos,
        setTos: setTosAndPrefill,
        config,
        setConfig,
        questions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,
        autoOrderQuestions,
        shuffleAllChoices,
        currentStep,
        setCurrentStep,
        resetAll,
      }}
    >
      {children}
    </ExamContext.Provider>
  )
}

export function useExam() {
  const ctx = useContext(ExamContext)
  if (!ctx) throw new Error('useExam must be used within ExamProvider')
  return ctx
}
