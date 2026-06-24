import { useState, useRef } from "react";
import { Btn, Badge, Modal, Toast, Empty, Spinner, Field } from "../components/ui";
import { MOCK_PLAYLISTS, MOCK_MP3S, formatDuration, formatSize } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

// ── Drag-and-drop row ─────────────────────────────────────────────────────────
function DraggableRow({ track, idx, total, onPlay, onRemove, dragState, onDragStart, onDragEnter, onDragEnd, isPlaying }) {
  const [hov, setHov] = useState(false);
  const isDragging = dragState.draggingIdx === idx;
  const isOver     = dragState.overIdx === idx;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragEnter={() => onDragEnter(idx)}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
        borderBottom:"1px solid var(--border)",
        background: isDragging ? "var(--violet-dim)" : isOver ? "rgba(124,58,237,0.08)" : hov ? "var(--bg-hover)" : "transparent",
        opacity: isDragging ? 0.5 : 1,
        borderLeft: isOver ? "2px solid var(--violet)" : "2px solid transparent",
        transition:"background var(--transition), border-color var(--transition)",
        cursor:"grab",
        userSelect:"none",
      }}
    >
      {/* Drag handle */}
      <div style={{ color: hov ? "var(--text-muted)" : "transparent", flexShrink:0, cursor:"grab", transition:"color var(--transition)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </div>

      {/* Index / Play button */}
      <div style={{ width:24, textAlign:"center", flexShrink:0 }}>
        {hov ? (
          <button onClick={() => onPlay(idx)}
            style={{ background:"none", color:"var(--violet-light)", border:"none", cursor:"pointer", fontSize:14, padding:0 }}>▶</button>
        ) : isPlaying ? (
          <div style={{ display:"flex", gap:2, justifyContent:"center", alignItems:"flex-end", height:16 }}>
            {[0,1,2].map(i=>(
              <div key={i} style={{ width:2.5, borderRadius:2, background:"var(--green)",
                animation:`waveBar ${0.4+i*0.15}s ${i*0.1}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        ) : (
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>{idx+1}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight: isPlaying?700:600, color: isPlaying?"var(--green)":"var(--text-primary)",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {track.tagTitle || track.fileName}
        </p>
        <p style={{ fontSize:11, color:"var(--text-muted)" }}>
          {track.tagArtist}{track.tagAlbum ? ` · ${track.tagAlbum}` : ""}
        </p>
      </div>

      {track.tagGenre && <Badge color="muted">{track.tagGenre}</Badge>}
      <span style={{ fontSize:12, color:"var(--text-secondary)", fontFamily:"monospace", flexShrink:0 }}>{formatDuration(track.audioDurationSecs)}</span>
      <span style={{ fontSize:11, color:"var(--text-muted)", flexShrink:0 }}>{formatSize(track.fileSizeBytes)}</span>

      {/* Remove */}
      <button onClick={() => onRemove(track.id)}
        title="Retirer de la playlist"
        style={{ background:"none", border:"none", color: hov ? "var(--red)" : "transparent",
          cursor:"pointer", padding:"2px 4px", flexShrink:0, transition:"color var(--transition)", fontSize:18, lineHeight:1 }}>
        ×
      </button>
    </div>
  );
}

// ── Add tracks modal ──────────────────────────────────────────────────────────
function AddTracksModal({ open, onClose, existingIds, onAdd }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const available = MOCK_MP3S.filter(m =>
    !existingIds.includes(m.id) &&
    (!search || m.tagTitle?.toLowerCase().includes(search.toLowerCase()) ||
      m.tagArtist?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const handleConfirm = () => {
    const tracks = MOCK_MP3S.filter(m => selected.includes(m.id));
    onAdd(tracks);
    setSelected([]);
    setSearch("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter des pistes" width={560}>
      <div style={{ marginBottom:14 }}>
        <input placeholder="Rechercher titre, artiste…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div style={{ maxHeight:340, overflowY:"auto", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", marginBottom:16 }}>
        {available.length === 0 ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>Aucun fichier disponible</div>
        ) : available.map(m => {
          const sel = selected.includes(m.id);
          return (
            <div key={m.id} onClick={()=>toggle(m.id)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                borderBottom:"1px solid var(--border)", cursor:"pointer",
                background: sel ? "var(--violet-dim)" : "transparent",
                transition:"background var(--transition)" }}
              onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background="var(--bg-hover)"; }}
              onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background="transparent"; }}>

              <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${sel?"var(--violet)":"var(--border)"}`,
                background: sel?"var(--violet)":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.tagTitle||m.fileName}</p>
                <p style={{ fontSize:11, color:"var(--text-muted)" }}>{m.tagArtist}</p>
              </div>
              {m.tagGenre && <Badge color="muted">{m.tagGenre}</Badge>}
              <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"monospace" }}>{formatDuration(m.audioDurationSecs)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:13, color:"var(--text-muted)" }}>
          {selected.length > 0 ? `${selected.length} piste(s) sélectionnée(s)` : "Sélectionnez des pistes"}
        </span>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={handleConfirm} disabled={selected.length===0}>
            Ajouter ({selected.length})
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Main PlaylistDetail ───────────────────────────────────────────────────────
export default function PlaylistDetail({ id, navigate }) {
  const { play, current, isPlaying } = usePlayer();

  // Find playlist from mock (in prod: fetch by id)
  const found = MOCK_PLAYLISTS.find(p => p.id === id) || MOCK_PLAYLISTS[0];
  const [playlist, setPlaylist] = useState({ ...found, tracks: [...found.tracks] });
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]         = useState(playlist.name);
  const [showAdd, setShowAdd]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast]             = useState(null);
  const [saving, setSaving]           = useState(false);

  // Drag state
  const [dragState, setDragState] = useState({ draggingIdx: null, overIdx: null });
  const dragOrder = useRef([...playlist.tracks]);

  const totalSecs = playlist.tracks.reduce((a,t)=>a+t.audioDurationSecs,0);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (idx) => {
    dragOrder.current = [...playlist.tracks];
    setDragState({ draggingIdx: idx, overIdx: idx });
  };

  const handleDragEnter = (idx) => {
    setDragState(p => ({ ...p, overIdx: idx }));
  };

  const handleDragEnd = () => {
    const { draggingIdx, overIdx } = dragState;
    if (draggingIdx === null || overIdx === null || draggingIdx === overIdx) {
      setDragState({ draggingIdx:null, overIdx:null });
      return;
    }
    const reordered = [...playlist.tracks];
    const [moved] = reordered.splice(draggingIdx, 1);
    reordered.splice(overIdx, 0, moved);
    setPlaylist(p => ({ ...p, tracks: reordered }));
    setDragState({ draggingIdx:null, overIdx:null });
    setToast({ message:"Ordre mis à jour", type:"success" });
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleRemove = (trackId) => {
    setPlaylist(p => ({ ...p, tracks: p.tracks.filter(t=>t.id!==trackId) }));
    setToast({ message:"Piste retirée", type:"success" });
  };

  const handleAddTracks = (newTracks) => {
    setPlaylist(p => ({ ...p, tracks: [...p.tracks, ...newTracks] }));
    setToast({ message:`${newTracks.length} piste(s) ajoutée(s)`, type:"success" });
  };

  const handleSaveName = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    setPlaylist(p=>({...p,name:nameVal}));
    setEditingName(false); setSaving(false);
    setToast({ message:"Nom mis à jour", type:"success" });
  };

  const handleDelete = async () => {
    await new Promise(r=>setTimeout(r,600));
    navigate("my-playlists");
  };

  const handleDownload = () => {
    setToast({ message:"Préparation du ZIP…", type:"info" });
  };

  return (
    <div style={{ padding:"32px 36px", animation:"fadeIn 0.2s ease" }}>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      {/* ── Back ── */}
      <button onClick={()=>navigate("my-playlists")}
        style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:13, cursor:"pointer",
          display:"flex", alignItems:"center", gap:6, marginBottom:24, padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color="var(--text-primary)"}
        onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Mes playlists
      </button>

      {/* ── Header ── */}
      <div style={{ display:"flex", gap:28, alignItems:"flex-start", marginBottom:28 }}>

        {/* Cover art */}
        <div style={{ width:160, height:160, flexShrink:0, borderRadius:"var(--radius-lg)",
          background:"linear-gradient(135deg,var(--violet),#A78BFA88)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 8px 40px var(--violet-glow)" }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/><path d="M12 9V5l4 1"/><circle cx="12" cy="12" r="9"/>
          </svg>
        </div>

        {/* Meta */}
        <div style={{ flex:1 }}>
          <p style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Playlist</p>

          {/* Editable name */}
          {editingName ? (
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <input value={nameVal} onChange={e=>setNameVal(e.target.value)}
                autoFocus onKeyDown={e=>{ if(e.key==="Enter") handleSaveName(); if(e.key==="Escape") setEditingName(false); }}
                style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:700, padding:"6px 12px", width:"auto", minWidth:300 }} />
              <Btn variant="primary" size="sm" onClick={handleSaveName} disabled={saving}
                icon={saving?<Spinner size={12} color="white"/>:null}>{saving?"…":"OK"}</Btn>
              <Btn variant="ghost" size="sm" onClick={()=>setEditingName(false)}>Annuler</Btn>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:700, color:"var(--text-primary)", lineHeight:1.1 }}>
                {playlist.name}
              </h1>
              <button onClick={()=>setEditingName(true)} title="Renommer"
                style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"4px" }}
                onMouseEnter={e=>e.currentTarget.style.color="var(--violet-light)"}
                onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          )}

          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
            <Badge color="violet">{playlist.tracks.length} pistes</Badge>
            <Badge color="muted">{formatDuration(totalSecs)}</Badge>
            <Badge color="muted">Créée le {new Date(playlist.createdAt).toLocaleDateString("fr")}</Badge>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Btn variant="success" size="lg" onClick={()=>play(playlist.tracks,0)}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--green)" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>}>
              Lire
            </Btn>
            <Btn variant="amber" onClick={handleDownload}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
              Télécharger .zip
            </Btn>
            <Btn variant="secondary" onClick={()=>setShowAdd(true)}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>}>
              Ajouter des pistes
            </Btn>
            <Btn variant="danger" onClick={()=>setShowDeleteConfirm(true)}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>}>
              Supprimer
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Track list ── */}
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {/* Column header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
          borderBottom:"1px solid var(--border)", background:"var(--bg-elevated)" }}>
          <div style={{ width:14 }} />
          <div style={{ width:24 }} />
          <span style={{ flex:1, fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Titre</span>
          <span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", width:80 }}>Genre</span>
          <span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", width:60, fontFamily:"monospace" }}>Durée</span>
          <span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", width:70 }}>Taille</span>
          <div style={{ width:20 }} />
        </div>

        {playlist.tracks.length === 0 ? (
          <Empty icon="🎵" title="Playlist vide"
            subtitle="Ajoutez des pistes à cette playlist."
            action={<Btn variant="primary" onClick={()=>setShowAdd(true)}>Ajouter des pistes</Btn>} />
        ) : (
          playlist.tracks.map((track, idx) => (
            <DraggableRow
              key={track.id}
              track={track}
              idx={idx}
              total={playlist.tracks.length}
              isPlaying={current?.id === track.id && isPlaying}
              onPlay={(i) => play(playlist.tracks, i)}
              onRemove={handleRemove}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
            />
          ))
        )}

        {/* Footer */}
        {playlist.tracks.length > 0 && (
          <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", background:"var(--bg-elevated)",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Glissez les pistes pour réorganiser</span>
            </div>
            <span style={{ fontSize:12, color:"var(--text-secondary)", fontFamily:"monospace" }}>
              {playlist.tracks.length} pistes · {formatDuration(totalSecs)}
            </span>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AddTracksModal
        open={showAdd}
        onClose={()=>setShowAdd(false)}
        existingIds={playlist.tracks.map(t=>t.id)}
        onAdd={handleAddTracks}
      />

      <Modal open={showDeleteConfirm} onClose={()=>setShowDeleteConfirm(false)} title="Supprimer la playlist" width={380}>
        <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>
          Voulez-vous vraiment supprimer <strong style={{color:"var(--text-primary)"}}>{playlist.name}</strong> ?<br/>
          Cette action est irréversible.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={()=>setShowDeleteConfirm(false)}>Annuler</Btn>
          <Btn variant="danger" onClick={handleDelete}>Supprimer la playlist</Btn>
        </div>
      </Modal>
    </div>
  );
}
