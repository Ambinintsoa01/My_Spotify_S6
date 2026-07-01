import { useState, useEffect } from "react";
import { Btn, Badge, Modal, Empty, Spinner, Toast, Field } from "../components/ui";
import { formatDuration, formatSize } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

const API_BASE_URL = "http://localhost:8080/api";

function UploadModal({ open, onClose, onRefresh }) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = [...e.dataTransfer.files].filter(f => f.name.endsWith(".mp3") || f.name.endsWith(".MP3"));
    setFiles(prev => [...prev, ...dropped]);
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    // On ajoute chaque fichier dans l'objet FormData avec la clé "files" attendue par Spring Boot
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/uploadFront`, {
        method: "POST",
        body: formData, // Le navigateur configure automatiquement le Content-Type en multipart/form-data
      });

      if (response.ok) {
        console.log("[Front-Upload] Fichiers téléversés avec succès vers l'inbox.");
        setFiles([]);
        onClose();
        // Optionnel : Déclencher un rafraîchissement si ton pipeline traite instantanément les fichiers
        if (onRefresh) onRefresh();
      } else {
        const errorText = await response.text();
        alert("Erreur lors de l'import : " + errorText);
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'upload:", error);
      alert("Impossible de joindre le serveur backend.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Importer des fichiers MP3 (Inbox)" width={500}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--violet)" : "var(--border)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "40px 20px",
          textAlign: "center",
          background: dragging ? "var(--violet-dim)" : "var(--bg-card)",
          transition: "all var(--transition)",
          marginBottom: 20
        }}
      >
        <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📥</span>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
          Glissez-déposez vos fichiers MP3 ici
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Ils seront directement transférés dans le dossier de traitement automatique.
        </p>

        <input
          type="file"
          multiple
          accept=".mp3, .MP3"
          id="fileInput"
          style={{ display: "none" }}
          onChange={(e) => {
            const selected = [...e.target.files].filter(f => f.name.endsWith(".mp3") || f.name.endsWith(".MP3"));
            setFiles(prev => [...prev, ...selected]);
          }}
        />
        <label
          htmlFor="fileInput"
          style={{
            display: "inline-block",
            marginTop: 16,
            padding: "6px 12px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            cursor: "pointer",
            color: "var(--text-primary)"
          }}
        >
          Parcourir les fichiers
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: 20, maxHeight: 150, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Fichiers prêts ({files.length}) :</p>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: "var(--text-primary)" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{f.name}</span>
              <span style={{ color: "var(--text-muted)" }}>{formatSize(f.size)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose} disabled={uploading}>Annuler</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={uploading || files.length === 0}>
          {uploading ? <Spinner size={14} color="white" /> : "Envoyer à l'inbox"}
        </Btn>
      </div>
    </Modal>
  );
}

function MetaModal({ mp3, open, onClose }) {
  if (!mp3) return null;
  const rows = [
    ["Titre", mp3.title], ["Artiste", mp3.artist], ["Album", mp3.album],
    ["Genre", mp3.genre], ["Année", mp3.year], ["Durée", formatDuration(mp3.durationSeconds)],
    ["Fichier", mp3.fileName], ["Chemin local", mp3.filePath]
  ];
  return (
    <Modal open={open} onClose={onClose} title="Métadonnées" width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
        {rows.filter(([, v]) => v).map(([k, v], i) => (
          <div key={k} style={{ display: "flex", padding: "10px 14px", background: i % 2 === 0 ? "var(--bg-elevated)" : "transparent" }}>
            <span style={{ width: 90, fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{k}</span>
            <span style={{ fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
      </div>
    </Modal>
  );
}

function EditModal({ mp3, open, onClose, onSave }) {
  const [form, setForm] = useState(mp3 || {});
  if (!mp3) return null;
  const fields = [["title", "Titre"], ["artist", "Artiste"], ["album", "Album"], ["genre", "Genre"], ["year", "Année"]];
  return (
    <Modal open={open} onClose={onClose} title="Modifier les tags">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <input value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
          </Field>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" onClick={() => { onSave(form); onClose(); }}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

export default function Mp3Library() {
  const { play } = usePlayer();
  const [mp3s, setMp3s] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [metaTrack, setMetaTrack] = useState(null);
  const [editTrack, setEditTrack] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const handlePlaySong = (index) => {
    if (!mp3s || !mp3s.length) return;

    // On crée la liste formatée avec les URL réelles de streaming
    const formattedMp3s = mp3s.map(m => {
      const streamUrl = `http://localhost:8080/api/mp3s/download/${m.id}`;
      return {
        ...m,
        url: streamUrl,
        src: streamUrl
      };
    });

    // On passe la liste formatée et l'index au contexte globale
    play(formattedMp3s, index);
  };

  // Charger la liste des MP3 depuis l'API MySQL du Backend
  const fetchMp3s = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/mp3s`);
      if (res.ok) {
        const data = await res.json();
        setMp3s(data);
        // console.log("[API] MP3s récupérés :", data);
      } else {
        setToast({ message: "Erreur lors de la récupération des MP3", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Impossible de contacter le serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMp3s();
  }, []);

  const genres = [...new Set(mp3s.map(m => m.genre).filter(Boolean))];

  const filtered = mp3s.filter(m => {
    const q = search.toLowerCase();
    return (!q || m.title?.toLowerCase().includes(q) || m.artist?.toLowerCase().includes(q) || m.album?.toLowerCase().includes(q))
      && (!genre || m.genre === genre);
  });

  // Action de suppression connectée à la base de données
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/mp3s/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMp3s(p => p.filter(m => m.id !== id));
        setToast({ message: "Fichier supprimé de la base de données", type: "success" });
      } else {
        setToast({ message: "Échec de la suppression sur le serveur", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur réseau lors de la suppression", type: "error" });
    }
  };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeIn 0.2s ease" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select value={genre} onChange={e => setGenre(e.target.value)} style={{ width: 160 }}>
          <option value="">Tous les genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <Btn variant="primary" onClick={() => setShowUpload(true)}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>}>
            Importer
          </Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Fichiers", value: mp3s.length },
          { label: "Durée totale", value: formatDuration(mp3s.reduce((a, m) => a + (m.durationSeconds || 0), 0)) },
          { label: "Genres", value: genres.length },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text-primary)" }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}><Spinner size={24} /> En cours de chargement...</div>
      ) : filtered.length === 0 ? (
        <Empty icon="🎵" title="Aucun fichier trouvé" subtitle="Les fichiers envoyés par le pipeline Java s'afficheront ici."
          action={<Btn variant="primary" onClick={fetchMp3s}>Actualiser</Btn>} />
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "40px 1fr 160px 120px 80px 80px 100px", gap: 0,
            padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)"
          }}>
            {["#", "Titre", "Artiste", "Album", "Genre", "Durée", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((m, idx) => (
            <div key={m.id}
              onMouseEnter={() => setHoverId(m.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                display: "grid", gridTemplateColumns: "40px 1fr 160px 120px 80px 80px 100px",
                padding: "11px 16px", borderBottom: "1px solid var(--border)",
                background: hoverId === m.id ? "var(--bg-hover)" : "transparent",
                transition: "background var(--transition)", alignItems: "center"
              }}>

              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                {hoverId === m.id
                  ? <button onClick={() => handlePlaySong(idx)} style={{ background: "none", color: "var(--violet-light)", fontSize: 14 }}>▶</button>
                  : idx + 1}
              </span>

              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{m.title || m.fileName}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.fileName}</p>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m.artist || "—"}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.album || "—"}</span>
              <span>{m.genre && m.genre !== "Inconnu" ? <Badge color="muted">{m.genre}</Badge> : <span style={{ color: "var(--text-muted)" }}>—</span>}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace" }}>{formatDuration(m.durationSeconds)}</span>

              <div style={{ display: "flex", gap: 4, opacity: hoverId === m.id ? 1 : 0, transition: "opacity var(--transition)" }}>
                <button title="Métadonnées" onClick={() => setMetaTrack(m)} style={{ background: "none", color: "var(--text-muted)", fontSize: 14, padding: "2px 4px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </button>
                <button title="Modifier" onClick={() => setEditTrack(m)} style={{ background: "none", color: "var(--text-muted)", fontSize: 14, padding: "2px 4px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--violet-light)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button title="Supprimer" onClick={() => handleDelete(m.id)} style={{ background: "none", color: "var(--text-muted)", fontSize: 14, padding: "2px 4px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modifie cette ligne à la fin du rendu de ton composant Mp3Library */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onRefresh={fetchMp3s} // Permet de rafraîchir la liste une fois l'upload terminé
      />
      <MetaModal mp3={metaTrack} open={!!metaTrack} onClose={() => setMetaTrack(null)} />
      <EditModal mp3={editTrack} open={!!editTrack} onClose={() => setEditTrack(null)}
        onSave={updated => { setMp3s(p => p.map(m => m.id === updated.id ? { ...m, ...updated } : m)); setToast({ message: "Tags mis à jour", type: "success" }); }} />
    </div>
  );
}