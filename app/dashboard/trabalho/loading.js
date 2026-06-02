export default function Loading() {
  return (
    <main className="dash wide">
      <div className="skel sk-back" />
      <div className="skel sk-h1" />
      <div className="sk-kanban">
        {[0, 1, 2, 3].map(c => (
          <div key={c} className="sk-col">
            <div className="skel sk-coltitle" />
            {[0, 1, 2].map(i => <div key={i} className="skel sk-card" />)}
          </div>
        ))}
      </div>
    </main>
  )
}
