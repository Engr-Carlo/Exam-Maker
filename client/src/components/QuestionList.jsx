import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useExam } from '../context/ExamContext'
import QuestionForm from './QuestionForm'

function SortableItem({ question, index, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const correctText = question[`choice${question.correctAnswer}`]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-3 mb-2 flex items-start gap-3 hover:shadow-sm transition group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mt-1 select-none"
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Question number */}
      <span className="text-sm font-bold text-gray-400 mt-0.5 w-8 shrink-0">
        {index + 1}.
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug">{question.questionText}</p>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
          {['A', 'B', 'C', 'D'].map((letter) => (
            <span
              key={letter}
              className={
                question.correctAnswer === letter
                  ? 'text-red-600 font-medium'
                  : 'text-gray-500'
              }
            >
              {letter}) {question[`choice${letter}`]}
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2">
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
            {question.topic}
          </span>
          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
            {question.cognitiveLevel}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button
          onClick={() => onEdit(question)}
          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(question.id)}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function QuestionList() {
  const { questions, reorderQuestions, deleteQuestion, autoOrderQuestions, shuffleAllChoices } =
    useExam()
  const [editingId, setEditingId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)
    const reordered = arrayMove(questions, oldIndex, newIndex)
    reorderQuestions(reordered)
  }

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : null

  if (editingQuestion) {
    return (
      <QuestionForm
        editingQuestion={editingQuestion}
        onDone={() => setEditingId(null)}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-gray-700">
          Questions ({questions.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={autoOrderQuestions}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition"
            title="Sort questions by TOS topic order then cognitive level"
          >
            Auto-Order (TOS)
          </button>
          <button
            onClick={shuffleAllChoices}
            className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg transition"
            title="Randomly shuffle the choices (A,B,C,D) for all questions"
          >
            🔀 Shuffle Choices
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">
          No questions yet. Use the form above to add questions.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions.map((q, i) => (
              <SortableItem
                key={q.id}
                question={q}
                index={i}
                onEdit={(q) => setEditingId(q.id)}
                onDelete={deleteQuestion}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
