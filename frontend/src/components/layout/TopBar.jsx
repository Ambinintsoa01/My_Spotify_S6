const titles = {
  library:      "Bibliothèque MP3",
  create:       "Créer une playlist",
  "my-playlists": "Mes playlists",
  playlist:     "Détail playlist",
};

export default function TopBar({ activePage }) {
  return (
    <header style={{
      height:60, borderBottom:"1px solid var(--border)",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 36px", background:"var(--bg-surface)", flexShrink:0,
    }}>
      <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.3px" }}>
        {titles[activePage] || "SoundVault"}
      </h1>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 8px var(--green)" }} />
        <span style={{ fontSize:12, color:"var(--text-secondary)" }}>API connectée</span>
      </div>
    </header>
  );
}
