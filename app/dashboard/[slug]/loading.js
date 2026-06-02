export default function Loading() {
  return (
    <main className="dash">
      <div className="skel sk-back" />
      <div className="skel sk-h1" />
      <div className="sk-grid-home">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel sk-domain" />)}
      </div>
    </main>
  )
}
