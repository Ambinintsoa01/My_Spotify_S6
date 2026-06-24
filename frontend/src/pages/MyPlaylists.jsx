import { useState } from "react";
import { Btn, Badge, Empty, Toast, Modal } from "../components/ui";
import { MOCK_PLAYLISTS, formatDuration } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

function PlaylistCard({ playlist, onOpen, onPlay, onDelete }) {
  const [hov, setHov]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalMin = Math.round(playlist.totalDurationSecs / 60);

  return (
    <>
      <div
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{ background:"var(--bg-card)", border:`1px solid ${hov?"rgba(124,58,237,0.35)":"var(--border)"}`,
          borderRadius:"var(--radius-lg)", padding:20, cursor:"pointer",
          transition:"all var(--transition)", transform: hov?"translateY(-3px)":"none",
          boxShadow: hov?"0 8px 32px rgba(124,58,237,0.12)":"none" }}>

        {/* Cover placeholder */}
        <div style={{ width:"100%", aspectRatio:"1", borderRadius:"var(--radius-md)", marginBottom:16,
          background:"linear-gradient(135deg,var(--violet)22,var(--violet)66)",
          display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#7C3AED44,#A78BFA22)" }} />
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/><path d="M12 9V5l4 1"/><circle cx="12" cy="12" r="9"/>
          </svg>
          {hov && (
            <button onClick={e=>{e.stopPropagation();onPlay(playlist);}}
              style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center",
                justifyContent:"center", border:"none", cursor:"pointer", borderRadius:"var(--radius-md)" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--green)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 20px rgba(16,185,129,0.5)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </button>
          )}
        </div>

        <div onClick={()=>onOpen(playlist.id)}>
          <p style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{playlist.name}</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            <Badge color="muted">{playlist.trackCount} pistes</Badge>
            <Badge color="violet">~{totalMin} min</Badge>
          </div>
          <p style={{ fontSize:11, color:"var(--text-muted)" }}>{new Date(playlist.createdAt).toLocaleDateString("fr")}</p>
        </div>

        <div style={{ display:"flex", gap:8, marginTop:14, opacity: hov?1:0, transition:"opacity var(--transition)" }}>
          <Btn variant="secondary" size="sm" style={{ flex:1 }} onClick={e=>{e.stopPropagation();onOpen(playlist.id);}}>Détails</Btn>
          <Btn variant="amber" size="sm" style={{ flex:1 }} onClick={e=>{e.stopPropagation();}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ZIP
          </Btn>
          <button onClick={e=>{e.stopPropagation();setConfirmDelete(true);}}
            title="Supprimer" style={{ background:"var(--red-dim)", border:"1px solid rgba(239,68,68,0.2)",
              color:"var(--red)", padding:"6px 10px", borderRadius:"var(--radius-sm)", cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.22)"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--red-dim)"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={()=>setConfirmDelete(false)} title="Supprimer la playlist" width={380}>
        <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>
          Voulez-vous vraiment supprimer <strong style={{color:"var(--text-primary)"}}>{playlist.name}</strong> ?<br/>
          Cette action est irréversible.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={()=>setConfirmDelete(false)}>Annuler</Btn>
          <Btn variant="danger" onClick={()=>{ setConfirmDelete(false); onDelete(playlist.id); }}>Supprimer</Btn>
        </div>
      </Modal>
    </>
  );
}

export default function MyPlaylists({ navigate }) {
  const { play } = usePlayer();
  const [playlists, setPlaylists] = useState(MOCK_PLAYLISTS);
  const [toast, setToast] = useState(null);

  const handleDelete = (id) => {
    setPlaylists(p=>p.filter(pl=>pl.id!==id));
    setToast({ message:"Playlist supprimée", type:"success" });
  };

  const total = playlists.reduce((a,p)=>a+p.totalDurationSecs,0);

  return (
    <div style={{ padding:"32px 36px", animation:"fadeIn 0.2s ease" }}>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 18px" }}>
            <p style={{ fontSize:18, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color:"var(--text-primary)" }}>{playlists.length}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Playlists</p>
          </div>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 18px" }}>
            <p style={{ fontSize:18, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color:"var(--text-primary)" }}>{formatDuration(total)}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Durée totale</p>
          </div>
        </div>
        <Btn variant="primary" onClick={()=>navigate("create")}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>}>
          Nouvelle playlist
        </Btn>
      </div>

      {playlists.length === 0 ? (
        <Empty icon="🎧" title="Aucune playlist" subtitle="Créez votre première playlist à partir de vos fichiers MP3."
          action={<Btn variant="primary" onClick={()=>navigate("create")}>Créer une playlist</Btn>} />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
          {playlists.map(pl=>(
            <PlaylistCard key={pl.id} playlist={pl}
              onOpen={id=>navigate("playlist",id)}
              onPlay={pl=>play(pl.tracks,0)}
              onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
