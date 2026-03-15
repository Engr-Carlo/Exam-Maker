import { useExam } from '../context/ExamContext'

const COG_LEVELS = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating']

export default function TosComplianceDashboard() {
  const { tos, questions } = useExam()

  if (!tos) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        No TOS uploaded. Upload a TOS file in Step 1 to see compliance tracking.
      </div>
    )
  }

  // Count questions per topic × cognitive level
  const counts = {}
  for (const topic of tos.topics) {
    counts[topic.name] = {}
    for (const level of COG_LEVELS) {
      counts[topic.name][level] = 0
    }
  }
  for (const q of questions) {
    if (counts[q.topic] && q.cognitiveLevel) {
      counts[q.topic][q.cognitiveLevel] = (counts[q.topic][q.cognitiveLevel] || 0) + 1
    }
  }

  // Compute issues
  let totalIssues = 0
  const totalCurrent = questions.length
  const totalRequired = tos.totals.grandTotal

  function cellClass(current, required) {
    if (required === 0 && current === 0) return 'bg-gray-50 text-gray-400'
    if (current === required) return 'bg-green-100 text-green-800'
    if (current > required) return 'bg-red-100 text-red-700'
    if (current > 0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-50 text-red-600'
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">TOS Compliance</h3>
        <span
          className={`text-xs px-2 py-1 rounded font-medium ${
            totalCurrent === totalRequired
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {totalCurrent} / {totalRequired} items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-1 text-left">Topic</th>
              {COG_LEVELS.map((l) => (
                <th key={l} className="border px-2 py-1 text-center" title={l}>
                  {l.substring(0, 3)}
                </th>
              ))}
              <th className="border px-2 py-1 text-center font-bold">Tot</th>
            </tr>
          </thead>
          <tbody>
            {tos.topics.map((topic) => {
              const topicCurrent = COG_LEVELS.reduce(
                (sum, l) => sum + (counts[topic.name]?.[l] || 0),
                0
              )
              return (
                <tr key={topic.name}>
                  <td className="border px-2 py-1 text-xs max-w-[120px] truncate" title={topic.name}>
                    {topic.name}
                  </td>
                  {COG_LEVELS.map((l) => {
                    const current = counts[topic.name]?.[l] || 0
                    const required = topic[l.toLowerCase()] || 0
                    if (current !== required && required > 0) totalIssues++
                    return (
                      <td
                        key={l}
                        className={`border px-2 py-1 text-center font-medium ${cellClass(current, required)}`}
                        title={`${l}: ${current}/${required}`}
                      >
                        {current}/{required}
                      </td>
                    )
                  })}
                  <td
                    className={`border px-2 py-1 text-center font-bold ${cellClass(topicCurrent, topic.total)}`}
                  >
                    {topicCurrent}/{topic.total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <span className="inline-block w-3 h-3 bg-green-100 border rounded"></span> Met
        <span className="inline-block w-3 h-3 bg-yellow-100 border rounded ml-2"></span> Under
        <span className="inline-block w-3 h-3 bg-red-100 border rounded ml-2"></span> Over/Missing
      </div>
    </div>
  )
}
