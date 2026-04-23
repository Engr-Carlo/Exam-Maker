/**
 * TableEditor – inline table builder for question forms.
 * Props:
 *   value:    { headers: string[], rows: string[][] } | null
 *   onChange: (newValue) => void
 */
export default function TableEditor({ value, onChange }) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() =>
          onChange({ headers: ['Column 1', 'Column 2'], rows: [['', '']] })
        }
        className="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-medium hover:bg-indigo-100 transition"
      >
        + Add Table
      </button>
    )
  }

  const { headers, rows } = value

  const update = (newHeaders, newRows) =>
    onChange({ headers: newHeaders, rows: newRows })

  const setHeader = (ci, val) => {
    const h = [...headers]
    h[ci] = val
    update(h, rows)
  }

  const setCell = (ri, ci, val) => {
    const newRows = rows.map((row, i) =>
      i === ri ? row.map((c, j) => (j === ci ? val : c)) : row
    )
    update(headers, newRows)
  }

  const addRow = () => update(headers, [...rows, headers.map(() => '')])

  const removeRow = (ri) => update(headers, rows.filter((_, i) => i !== ri))

  const addCol = () =>
    update(
      [...headers, `Column ${headers.length + 1}`],
      rows.map((r) => [...r, ''])
    )

  const removeCol = (ci) => {
    if (headers.length <= 1) return
    update(
      headers.filter((_, i) => i !== ci),
      rows.map((r) => r.filter((_, i) => i !== ci))
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Table
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition"
        >
          Remove Table
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {headers.map((h, ci) => (
                <th key={ci} className="border border-gray-200 p-0 relative group">
                  <input
                    value={h}
                    onChange={(e) => setHeader(ci, e.target.value)}
                    className="w-full px-2 py-1.5 bg-transparent font-semibold text-gray-700 focus:outline-none focus:bg-indigo-50 min-w-[80px]"
                    placeholder={`Col ${ci + 1}`}
                  />
                  {headers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCol(ci)}
                      className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none z-10"
                      title="Remove column"
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
              {/* row actions header */}
              <th className="border border-gray-200 w-6 bg-gray-50" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50">
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-200 p-0">
                    <input
                      value={cell}
                      onChange={(e) => setCell(ri, ci, e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent text-gray-700 focus:outline-none focus:bg-indigo-50 min-w-[80px]"
                      placeholder="—"
                    />
                  </td>
                ))}
                <td className="border border-gray-200 text-center">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      className="text-red-400 hover:text-red-600 px-1 font-bold"
                      title="Remove row"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addRow}
          className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition"
        >
          + Add Row
        </button>
        <button
          type="button"
          onClick={addCol}
          className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition"
        >
          + Add Column
        </button>
      </div>
    </div>
  )
}
