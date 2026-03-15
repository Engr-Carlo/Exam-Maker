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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-100 rounded-xl p-4 mb-2 flex items-start gap-3 hover:shadow-sm hover:border-gray-200 transition-all group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 mt-0.5 select-none text-lg"
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Question number */}
      <span className="text-sm font-bold text-green-700 bg-green-50 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug">{question.questionText}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {['A', 'B', 'C', 'D'].map((letter) => (
            <span
              key={letter}
              className={`flex items-center gap-1 ${
                question.correctAnswer === letter
                  ? 'text-red-600 font-semibold'
                  : 'text-gray-500'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                question.correctAnswer === letter
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>{letter}</span>
              <span className="truncate">{question[`choice${letter}`]}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {question.topic}
          </span>
          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            {question.cognitiveLevel}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button
          onClick={() => onEdit(question)}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(question.id)}
          className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg transition font-medium"
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
        <h3 className="font-semibold text-sm text-gray-800">
          Questions ({questions.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={autoOrderQuestions}
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition font-medium"
            title="Sort questions by TOS topic order then cognitive level"
          >
            Auto-Order
          </button>
          <button
            onClick={shuffleAllChoices}
            className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg transition font-medium"
            title="Randomly shuffle the choices (A,B,C,D) for all questions"
          >
            Shuffle Choices
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-400 text-sm">No questions yet. Use the form above to add questions.</p>
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
