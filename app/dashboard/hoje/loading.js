export default function Loading() {
  return (
    <main className="dash">
      <div className="skel sk-h1" />
      <div className="skel sk-toolbar" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="skel sk-card" />)}
      </div>
    </main>
  )
}
