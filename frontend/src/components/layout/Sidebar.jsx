import { useState } from "react";

const Logo = () => (
  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"28px 24px 24px", borderBottom:"1px solid var(--border)" }}>
    <div style={{ width:34, height:34, borderRadius:10, background:"var(--violet)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 9V5l4 1"/><circle cx="12" cy="12" r="9"/>
      </svg>
    </div>
    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:17, color:"var(--text-primary)", letterSpacing:"-0.3px" }}>SoundVault</span>
  </div>
);

const navItems = [
  { id:"library",      label:"Bibliothèque",    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg> },
];

const playlistItems = [
  { id:"create",       label:"Créer une playlist", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg> },
  { id:"my-playlists", label:"Mes playlists",      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
];

function NavItem({ item, active, onClick }) {
  const isActive = active === item.id;
  return (
    <button onClick={() => onClick(item.id)} style={{
      display:"flex", alignItems:"center", gap:12, width:"100%",
      padding:"10px 16px", borderRadius:"var(--radius-md)",
      background: isActive ? "var(--violet-dim)" : "transparent",
      color: isActive ? "var(--violet-light)" : "var(--text-secondary)",
      fontSize:14, fontWeight: isActive ? 600 : 400,
      border: isActive ? "1px solid var(--border-active)" : "1px solid transparent",
      textAlign:"left", transition:"all var(--transition)",
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isActive ? "var(--violet-light)" : "var(--text-secondary)"; }}
    >
      {item.icon}
      {item.label}
      {isActive && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"var(--violet)" }} />}
    </button>
  );
}

export default function Sidebar({ activePage, navigate }) {
  return (
    <aside style={{
      width:240, flexShrink:0, background:"var(--bg-surface)",
      borderRight:"1px solid var(--border)", display:"flex",
      flexDirection:"column", height:"100vh",
    }}>
      <Logo />

      <nav style={{ padding:"16px 12px", flex:1, overflowY:"auto" }}>
        <p style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", padding:"0 8px", marginBottom:8 }}>Musique</p>
        {navItems.map(item => <NavItem key={item.id} item={item} active={activePage} onClick={navigate} />)}

        <p style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", padding:"0 8px", margin:"24px 0 8px" }}>Playlists</p>
        {playlistItems.map(item => <NavItem key={item.id} item={item} active={activePage} onClick={navigate} />)}
      </nav>

      <div style={{ padding:"16px 20px", borderTop:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,var(--violet),var(--violet-light))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"white" }}>U</div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>Utilisateur</p>
            <p style={{ fontSize:11, color:"var(--text-muted)" }}>Connecté</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
