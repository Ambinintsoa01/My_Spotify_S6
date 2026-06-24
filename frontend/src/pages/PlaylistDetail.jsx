import { useState, useEffect, useRef } from "react";
import { Btn, Badge, Modal, Toast, Empty, Spinner } from "../components/ui";
import { formatDuration } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

function DraggableRow({ track, idx, onPlay, onRemove, dragState, onDragStart, onDragEnter, onDragEnd, isPlaying }) {
  const [hov, setHov] = useState(false);
  const isDragging = dragState.draggingIdx === idx;
  const isOver = dragState.overIdx === idx;

  const mp3 = track.mp3Metadata || {};

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
        display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        background: isDragging ? "var(--violet-dim)" : isOver ? "rgba(124,58,237,0.08)" : hov ? "var(--bg-hover)" : "transparent",
        opacity: isDragging ? 0.5 : 1,
        borderLeft: isOver ? "2px solid var(--violet)" : "2px solid transparent",
        cursor: "grab", transition: "all var(--transition)"
      }}
    >
      <span style={{ width: 28, fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
        {isPlaying ? (
          <span style={{ color: "var(--violet)" }}>🔊</span>
        ) : hov ? (
          <button onClick={onPlay} style={{ background: "none", border: "none", color: "var(--violet-light)", cursor: "pointer", padding: 0 }}>▶</button>
        ) : (
          idx + 1
        )}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: isPlaying ? "var(--violet-light)" : "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {mp3.title || mp3.fileName}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {mp3.artist || "Artiste inconnu"}
        </p>
      </div>

      <span style={{ width: 140, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {mp3.album || "—"}
      </span>

      <span style={{ width: 50, fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace", textAlign: "right" }}>
        {formatDuration(mp3.durationSeconds || 0)}
      </span>

      <div style={{ width: 40, display: "flex", justifyContent: "flex-end" }}>
        {hov && (
          <button
            onClick={onRemove}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            title="Retirer de la playlist"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function AddTracksModal({ open, onClose, existingIds, onAdd }) {
  const [allMp3s, setAllMp3s] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("http://localhost:8080/api/mp3s")
      .then(res => res.json())
      .then(data => {
        const available = data.filter(m => !existingIds.includes(m.id));
        setAllMp3s(available);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [open, existingIds]);

  const filtered = allMp3s.filter(m =>
    !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.artist?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleConfirm = () => {
    onAdd(selected);
    setSelected([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter des chansons">
      <input
        placeholder="Rechercher par titre ou artiste..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}><Spinner size={20} /></div>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>Aucun morceau disponible</p>
      ) : (
        <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 6 }}>
          {filtered.map(m => {
            const isSel = selected.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => toggleSelect(m.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: "var(--radius-sm)", cursor: "pointer",
                  background: isSel ? "var(--violet-dim)" : "transparent"
                }}
              >
                <input type="checkbox" checked={isSel} readOnly />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title || m.fileName}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.artist || "Inconnu"}</p>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{formatDuration(m.durationSeconds)}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" onClick={handleConfirm} disabled={selected.length === 0}>
          Ajouter ({selected.length})
        </Btn>
      </div>
    </Modal>
  );
}

export default function PlaylistDetail({ id, navigate }) {
  const { currentTrack, play } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [dragState, setDragState] = useState({ draggingIdx: null, overIdx: null });
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/api/playlists/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      } else {
        setToast({ message: "Playlist introuvable", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur lors du contact avec le serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPlaylist();
  }, [id]);

  const syncWithBackend = async (updatedTracks) => {
    const mp3Ids = updatedTracks.map(t => t.mp3Metadata?.id || t.id);
    try {
      const res = await fetch(`http://localhost:8080/api/playlists/${id}/tracks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mp3Ids)
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      } else {
        setToast({ message: "Erreur lors de la sauvegarde sur le serveur", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur réseau", type: "error" });
    }
  };

  const handlePlayPiste = (index) => {
    if (!playlist || !playlist.tracks.length) return;
    const listFlat = playlist.tracks.map(t => t.mp3Metadata);
    play(listFlat, index);
  };

  const handleRemoveTrack = (index) => {
    const updated = [...playlist.tracks];
    updated.splice(index, 1);
    setPlaylist(p => ({ ...p, tracks: updated }));
    syncWithBackend(updated);
    setToast({ message: "Morceau retiré", type: "success" });
  };

  const handleAddTracks = (newMp3Ids) => {
    const currentIds = playlist.tracks.map(t => t.mp3Metadata?.id);
    const finalIds = [...currentIds, ...newMp3Ids];

    fetch(`http://localhost:8080/api/playlists/${id}/tracks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalIds)
    })
      .then(res => res.json())
      .then(data => {
        setPlaylist(data);
        setToast({ message: `${newMp3Ids.length} titre(s) ajouté(s)`, type: "success" });
      })
      .catch(() => setToast({ message: "Échec de l'ajout", type: "error" }));
  };

  const handleDeletePlaylist = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/playlists/${id}`, { method: "DELETE" });
      if (res.ok) {
        navigate("my-playlists");
      }
    } catch (err) {
      setToast({ message: "Échec de la suppression de la playlist", type: "error" });
    }
  };

  const handleDragStart = (idx) => {
    dragItem.current = idx;
    setDragState(prev => ({ ...prev, draggingIdx: idx }));
  };

  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
    setDragState(prev => ({ ...prev, overIdx: idx }));
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const copy = [...playlist.tracks];
      const target = copy[dragItem.current];
      copy.splice(dragItem.current, 1);
      copy.splice(dragOverItem.current, 0, target);

      setPlaylist(p => ({ ...p, tracks: copy }));
      syncWithBackend(copy);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragState({ draggingIdx: null, overIdx: null });
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spinner size={24} /></div>;
  if (!playlist) return <div style={{ padding: 40, textAlign: "center" }}><Empty title="Playlist introuvable" /></div>;

  const totalSecs = playlist.totalDurationSecs || 0;

  return (
    <div style={{ padding: "32px 36px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", gap: 24, marginBottom: 32, alignItems: "flex-end" }}>
        <div style={{
          width: 140, aspectRatio: "1", borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, var(--violet) 0%, var(--violet-light) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, boxShadow: "0 12px 40px rgba(124,58,237,0.15)"
        }}>
          🎧
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <Badge color="primary">Playlist utilisateur</Badge>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
            {playlist.name}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            {playlist.description || "Aucune description fournie."}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Créée le {new Date(playlist.createdAt).toLocaleDateString()} · <strong style={{ color: "var(--text-secondary)" }}>{playlist.tracks?.length || 0} morceaux</strong>, {formatDuration(totalSecs)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={() => handlePlayPiste(0)} disabled={!playlist.tracks?.length}>Lire</Btn>
          <Btn variant="secondary" onClick={() => setShowAdd(true)}>Ajouter des titres</Btn>
          <Btn variant="danger" onClick={() => setShowDeleteConfirm(true)}>Supprimer</Btn>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{
          display: "flex", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)",
          fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em"
        }}>
          <span style={{ width: 28 }}>#</span>
          <span style={{ flex: 1 }}>Titre</span>
          <span style={{ width: 140 }}>Album</span>
          <span style={{ width: 50, textAlign: "right" }}>Durée</span>
          <span style={{ width: 40 }} />
        </div>

        {playlist.tracks?.length === 0 ? (
          <div style={{ padding: "40px 0" }}>
            <Empty title="Playlist vide" subtitle="Ajoutez des morceaux pour commencer à l'écouter." />
          </div>
        ) : (
          <div>
            {playlist.tracks.map((track, idx) => (
              <DraggableRow
                key={track.id || idx}
                track={track}
                idx={idx}
                isPlaying={currentTrack?.id === track.mp3Metadata?.id}
                onPlay={() => handlePlayPiste(idx)}
                onRemove={() => handleRemoveTrack(idx)}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}

        {playlist.tracks?.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Glissez les pistes pour réorganiser l'ordre</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
              {playlist.tracks.length} pistes · {formatDuration(totalSecs)}
            </span>
          </div>
        )}
      </div>

      <AddTracksModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        existingIds={playlist.tracks.map(t => t.mp3Metadata?.id).filter(Boolean)}
        onAdd={handleAddTracks}
      />

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer la playlist" width={380}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          Voulez-vous vraiment supprimer <strong style={{ color: "var(--text-primary)" }}>{playlist.name}</strong> ?<br />
          Cette action est irréversible.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Btn>
          <Btn variant="danger" onClick={handleDeletePlaylist}>Confirmer</Btn>
        </div>
      </Modal>
    </div>
  );
}