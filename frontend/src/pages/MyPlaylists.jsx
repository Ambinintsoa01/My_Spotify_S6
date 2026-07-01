import { useState, useEffect } from "react";
import { Btn, Badge, Empty, Toast, Modal } from "../components/ui";
import { formatDuration } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

const API_BASE_URL = "http://localhost:8080/api/playlists";

function PlaylistCard({ playlist, selected, onToggleSelect, onOpen, onPlay, onDelete }) {
  const [hov, setHov] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalMin = Math.round((playlist.totalDurationSecs || 0) / 60);

  return (
    <>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${hov ? "rgba(124,58,237,0.35)" : "var(--border)"}`,
          borderRadius: "var(--radius-lg)",
          padding: 20,
          cursor: "pointer",
          transition: "all var(--transition)",
          transform: hov ? "translateY(-3px)" : "none",
          boxShadow: hov ? "0 8px 32px rgba(124,58,237,0.12)" : "none"
        }}
        onClick={onOpen}
      >
        <label
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            fontSize: 12,
            color: "var(--text-muted)",
            userSelect: "none"
          }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggleSelect(e.target.checked)}
          />
          Selectionner
        </label>

        {/* Cover placeholder */}
        <div style={{
          width: "100%", aspectRatio: "1", borderRadius: "var(--radius-md)", marginBottom: 16,
          background: "linear-gradient(135deg, var(--violet) 0%, var(--violet-light) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.05)" }} />
          <span style={{ fontSize: 42, transform: hov ? "scale(1.1)" : "none", transition: "transform var(--transition)" }}>🎧</span>

          {/* Hover play overlay */}
          {hov && (
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
              style={{
                position: "absolute", bottom: 12, right: 12, width: 42, height: 42,
                borderRadius: "50%", background: "var(--bg-primary)", color: "var(--violet)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 16, fontWeight: "bold", border: "none"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              ▶
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
              {playlist.name}
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              style={{ background: "none", color: "var(--text-muted)", border: "none", fontSize: 14, padding: "2px 4px", opacity: hov ? 1 : 0, transition: "opacity var(--transition)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              🗑️
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {playlist.description || "Aucune description"}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <Badge color="muted">{playlist.tracks?.length || 0} titres</Badge>
            <Badge color="primary">{totalMin} min</Badge>
          </div>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer la playlist" width={360}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
          Voulez-vous supprimer la playlist <strong>{playlist.name}</strong> ? Cette action est irréversible.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setConfirmDelete(false)}>Annuler</Btn>
          <Btn variant="danger" onClick={() => { onDelete(); setConfirmDelete(false); }}>Supprimer</Btn>
        </div>
      </Modal>
    </>
  );
}

export default function MyPlaylists({ navigate }) {
  const { play } = usePlayer();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeName, setMergeName] = useState("");
  const [mergeDescription, setMergeDescription] = useState("");
  const [merging, setMerging] = useState(false);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      } else {
        setToast({ message: "Erreur lors du chargement des playlists", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Impossible de contacter le serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlaylists(prev => prev.filter(p => p.id !== id));
        setSelectedPlaylistIds(prev => prev.filter(pid => pid !== id));
        setToast({ message: "Playlist supprimée avec succès", type: "success" });
      } else {
        setToast({ message: "Impossible de supprimer la playlist", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur réseau lors de la suppression", type: "error" });
    }
  };

  const togglePlaylistSelection = (playlistId, checked) => {
    setSelectedPlaylistIds(prev => {
      if (checked) {
        if (prev.includes(playlistId)) {
          return prev;
        }
        return [...prev, playlistId];
      }
      return prev.filter(id => id !== playlistId);
    });
  };

  const selectedPlaylists = playlists.filter(p => selectedPlaylistIds.includes(p.id));

  const handleMergePlaylists = async () => {
    if (selectedPlaylists.length < 2) {
      setToast({ message: "Selectionnez au moins 2 playlists a fusionner", type: "error" });
      return;
    }

    const cleanName = mergeName.trim() || `Fusion ${new Date().toLocaleString()}`;
    const mp3Ids = [];
    const seen = new Set();

    selectedPlaylists.forEach((pl) => {
      (pl.tracks || []).forEach((track) => {
        const mp3Id = track?.mp3Metadata?.id;
        if (mp3Id && !seen.has(mp3Id)) {
          seen.add(mp3Id);
          mp3Ids.push(mp3Id);
        }
      });
    });

    if (mp3Ids.length === 0) {
      setToast({ message: "Aucune chanson a fusionner dans les playlists selectionnees", type: "error" });
      return;
    }

    setMerging(true);
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          description: mergeDescription,
          mp3Ids,
        }),
      });

      if (!res.ok) {
        throw new Error("Echec de fusion");
      }

      setShowMergeModal(false);
      setMergeName("");
      setMergeDescription("");
      setSelectedPlaylistIds([]);
      setToast({ message: "Playlists fusionnees avec succes", type: "success" });
      await fetchPlaylists();
    } catch (err) {
      setToast({ message: "Erreur lors de la fusion des playlists", type: "error" });
    } finally {
      setMerging(false);
    }
  };

  const handlePlayPlaylist = (playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) {
      setToast({ message: "Cette playlist est vide !", type: "error" });
      return;
    }
    const tracksToPlay = playlist.tracks.map(t => t.mp3Metadata);
    play(tracksToPlay, 0);
  };

  const totalSecs = playlists.reduce((acc, p) => acc + (p.totalDurationSecs || 0), 0);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Chargement des playlists...</div>;
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 18px" }}>
            <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text-primary)" }}>{playlists.length}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Playlists</p>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 18px" }}>
            <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text-primary)" }}>{formatDuration(totalSecs)}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Durée totale</p>
          </div>
        </div>
        <Btn variant="primary" onClick={() => navigate("create")}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>}>
          Nouvelle playlist
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => setShowMergeModal(true)}
          disabled={selectedPlaylistIds.length < 2}
        >
          Fusionner ({selectedPlaylistIds.length})
        </Btn>
      </div>

      {playlists.length === 0 ? (
        <Empty icon="🎧" title="Aucune playlist" subtitle="Créez votre première playlist personnalisée dès maintenant."
          action={<Btn variant="primary" onClick={() => navigate("create")}>Créer une playlist</Btn>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {playlists.map(pl => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              selected={selectedPlaylistIds.includes(pl.id)}
              onToggleSelect={(checked) => togglePlaylistSelection(pl.id, checked)}
              onOpen={() => navigate("playlist", pl.id)}
              onPlay={() => handlePlayPlaylist(pl)}
              onDelete={() => handleDelete(pl.id)}
            />
          ))}
        </div>
      )}

      <Modal open={showMergeModal} onClose={() => !merging && setShowMergeModal(false)} title="Fusionner des playlists" width={460}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
          {selectedPlaylistIds.length} playlist(s) selectionnee(s)
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Nom de la playlist fusionnee"
            value={mergeName}
            onChange={(e) => setMergeName(e.target.value)}
          />
          <textarea
            placeholder="Description (optionnelle)"
            value={mergeDescription}
            onChange={(e) => setMergeDescription(e.target.value)}
            rows={4}
            style={{ resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setShowMergeModal(false)} disabled={merging}>Annuler</Btn>
          <Btn variant="primary" onClick={handleMergePlaylists} disabled={merging || selectedPlaylistIds.length < 2}>
            {merging ? "Fusion..." : "Fusionner"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}