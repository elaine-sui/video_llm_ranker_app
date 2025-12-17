type Output = { id: string; model?: string; text: string }

export default function Ranking({
  outputs,
  onChange,
  maxItems = 6,
}: {
  outputs: Output[]
  onChange: (o: Output[]) => void
  maxItems?: number
}) {
  function move(index: number, delta: number) {
    const to = index + delta
    if (to < 0 || to >= outputs.length) return
    const next = outputs.slice()
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  function setAsRank(index: number, newIndex: number) {
    if (newIndex < 0 || newIndex >= outputs.length) return
    move(index, newIndex - index)
  }

  return (
    <div className="ranking-root">
      <h2>Rank Responses</h2>
      <p className="muted">Rank the responses from most to least preferred.</p>
      <ol className="rank-list">
        {outputs.map((o, i) => (
          <li key={o.id} className="rank-item">
            <div className="rank-pos">{i + 1}</div>
            <div className="rank-body">
              <div className="rank-meta">Response {String.fromCharCode(65 + i)}</div>
              <div className="rank-text">{o.text || <em className="muted">(empty)</em>}</div>
            </div>
            <div className="rank-actions">
              <button onClick={() => move(i, -1)} className="btn small">▲</button>
              <button onClick={() => move(i, 1)} className="btn small">▼</button>
              <button onClick={() => setAsRank(i, 0)} className="btn tiny">Top</button>
              <button onClick={() => setAsRank(i, outputs.length - 1)} className="btn tiny">Bottom</button>
            </div>
          </li>
        ))}
      </ol>
      <div className="foot">
        <div className="muted">Showing {outputs.length} of {maxItems} responses.</div>
      </div>
    </div>
  )
}
