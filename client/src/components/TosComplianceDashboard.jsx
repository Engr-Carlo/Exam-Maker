import { useExam } from '../context/ExamContext'

const COG_LEVELS = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating']

export default function TosComplianceDashboard() {
  const { tos, questions } = useExam()

  if (!tos) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        No TOS uploaded. Upload a TOS file in Step 1 to see compliance tracking.
      </div>
    )
  }

  const totalCurrent = questions.length
  const totalRequired = tos.totals.grandTotal
  const isFullyCompliant = totalCurrent === totalRequired

  // Detect if TOS has per-cognitive-level data or just topic totals
  const hasLevelBreakdown = tos.topics.some(t =>
    (t.remembering || 0) + (t.understanding || 0) + (t.applying || 0) +
    (t.analyzing || 0) + (t.evaluating || 0) + (t.creating || 0) > 0
  )

  // Count questions per topic
  const topicCounts = {}
  for (const topic of tos.topics) topicCounts[topic.name] = 0
  for (const q of questions) {
    if (topicCounts[q.topic] !== undefined) topicCounts[q.topic]++
  }

  // Count questions per topic × cognitive level (only used in full mode)
  const levelCounts = {}
  if (hasLevelBreakdown) {
    for (const topic of tos.topics) {
      levelCounts[topic.name] = {}
      for (const level of COG_LEVELS) levelCounts[topic.name][level] = 0
    }
    for (const q of questions) {
      if (levelCounts[q.topic] && q.cognitiveLevel) {
        levelCounts[q.topic][q.cognitiveLevel] = (levelCounts[q.topic][q.cognitiveLevel] || 0) + 1
      }
    }
  }

  function cellClass(current, required) {
    if (required === 0 && current === 0) return 'bg-gray-50 text-gray-300'
    if (current === required) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (current > required) return 'bg-red-100 text-red-700 font-semibold'
    if (current > 0) return 'bg-amber-100 text-amber-800'
    return 'bg-red-50 text-red-500'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-800">TOS Compliance</h3>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            isFullyCompliant
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {totalCurrent} / {totalRequired} items
        </span>
      </div>

      {hasLevelBreakdown ? (
        // Full grid: topic × cognitive level
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600">Topic</th>
                {COG_LEVELS.map((l) => (
                  <th key={l} className="border border-gray-200 px-1.5 py-1.5 text-center font-semibold text-gray-600" title={l}>
                    {l.substring(0, 3)}
                  </th>
                ))}
                <th className="border border-gray-200 px-2 py-1.5 text-center font-bold text-gray-700">Tot</th>
              </tr>
            </thead>
            <tbody>
              {tos.topics.map((topic) => {
                const topicCurrent = COG_LEVELS.reduce((sum, l) => sum + (levelCounts[topic.name]?.[l] || 0), 0)
                return (
                  <tr key={topic.name}>
                    <td className="border border-gray-200 px-2 py-1.5 text-xs max-w-[120px] truncate text-gray-700" title={topic.name}>
                      {topic.name}
                    </td>
                    {COG_LEVELS.map((l) => {
                      const current = levelCounts[topic.name]?.[l] || 0
                      const required = topic[l.toLowerCase()] || 0
                      return (
                        <td key={l} className={`border border-gray-200 px-1.5 py-1.5 text-center text-xs ${cellClass(current, required)}`}
                          title={`${l}: ${current}/${required}`}>
                          {current}/{required}
                        </td>
                      )
                    })}
                    <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold text-xs ${
                      topicCurrent === topic.total ? 'bg-emerald-100 text-emerald-800'
                        : topicCurrent > topic.total ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {topicCurrent}/{topic.total}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Simplified view: just topic totals
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600">Topic</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600">Current</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600">Required</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {tos.topics.map((topic) => {
                const current = topicCounts[topic.name] || 0
                const required = topic.total || 0
                const cls = cellClass(current, required)
                return (
                  <tr key={topic.name}>
                    <td className="border border-gray-200 px-2 py-1.5 text-gray-700 max-w-[160px] truncate" title={topic.name}>
                      {topic.name}
                    </td>
                    <td className={`border border-gray-200 px-2 py-1.5 text-center font-semibold ${cls}`}>{current}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-600">{required}</td>
                    <td className={`border border-gray-200 px-2 py-1.5 text-center ${cls}`}>
                      {current === required ? '✓' : current > required ? 'Over' : `${required - current} left`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></span> Met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded"></span> Under
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Over/Missing
        </span>
      </div>
    </div>
  )
}
