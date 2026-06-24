import { useState, useEffect } from "react";
import { Btn, Field, Spinner, Badge, Toast } from "../components/ui";
import { formatDuration } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

function WaveformBars({ count = 5 }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: "var(--violet)",
          animation: `waveBar ${0.5 + i * 0.1}s ${i * 0.12}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  );
}

function GeneratedTrackRow({ track, idx, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: hov ? "var(--bg-hover)" : "transparent", transition: "background var(--transition)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", flex: "0 0 24px" }}>{idx + 1}</span>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title || track.fileName}</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist || "Artiste inconnu"}</p>
      </div>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: "0 0 80px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.genre || "—"}</span>
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", flex: "0 0 80px", textAlign: "right" }}>{formatDuration(track.durationSeconds || 0)}</span>
      <span style={{ flex: "0 0 24px", textAlign: "right" }}>
        {hov && <button onClick={() => onRemove(idx)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.color = "var(--red)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>×</button>}
      </span>
    </div>
  );
}

export default function CreatePlaylist({ navigate }) {
  const { play } = usePlayer();

  // Liste globale de tous les MP3 récupérés de la BDD
  const [allMp3s, setAllMp3s] = useState([]);
  const [loadingMp3s, setLoadingMp3s] = useState(true);

  // Listes dynamiques pour les filtres
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [years, setYears] = useState([]);
  const [albums, setAlbums] = useState([]);

  // États du formulaire
  const [playlistName, setPlaylistName] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState({ genre: "", artist: "", album: "", year: "", maxTracks: 20 });
  const [generated, setGenerated] = useState(null);

  // UI États
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // 1. Charger tous les MP3 existants en BDD pour extraire dynamiquement les filtres possibles
  useEffect(() => {
    fetch("http://localhost:8080/api/mp3s")
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setAllMp3s(data);
        
        // Extraction des valeurs uniques à partir des métadonnées réelles
        setGenres([...new Set(data.map(m => m.genre).filter(Boolean))]);
        setArtists([...new Set(data.map(m => m.artist).filter(Boolean))]);
        setAlbums([...new Set(data.map(m => m.album).filter(Boolean))]);
        setYears([...new Set(data.map(m => m.year).filter(Boolean))].sort((a, b) => b - a));
        
        setLoadingMp3s(false);
      })
      .catch(() => {
        setToast({ message: "Erreur lors du chargement de la bibliothèque musicale", type: "error" });
        setLoadingMp3s(false);
      });
  }, []);

  // Générer la liste temporaire basée sur les critères choisis
  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 800)); // Petit effet de chargement sympa

    // Filtrer localement les MP3 qui correspondent aux critères
    let pool = allMp3s.filter(m => {
      if (criteria.genre && m.genre !== criteria.genre) return false;
      if (criteria.artist && m.artist !== criteria.artist) return false;
      if (criteria.album && m.album !== criteria.album) return false;
      if (criteria.year && String(m.year) !== String(criteria.year)) return false;
      return true;
    });

    // Mélanger aléatoirement le résultat
    pool = pool.sort(() => 0.5 - Math.random());

    // Appliquer la limite du nombre de pistes maximum
    const limit = parseInt(criteria.maxTracks) || 20;
    const finalTracks = pool.slice(0, limit);

    const totalDur = finalTracks.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);

    setGenerated({
      tracks: finalTracks,
      totalDuration: totalDur
    });
    setGenerating(false);
  };

  const handleRemoveTrack = (index) => {
    if (!generated) return;
    const updated = [...generated.tracks];
    const removed = updated.splice(index, 1)[0];
    setGenerated({
      tracks: updated,
      totalDuration: generated.totalDuration - (removed.durationSeconds || 0)
    });
  };

  // 2. Sauvegarde réelle vers l'API Backend Spring Boot
  const handleSave = async () => {
    if (!playlistName.trim() || !generated) return;
    setSaving(true);

    // Préparer la liste ordonnée des IDs de MP3 à enregistrer
    const mp3Ids = generated.tracks.map(t => t.id);

    try {
      const res = await fetch("http://localhost:8080/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playlistName,
          description: description,
          mp3Ids: mp3Ids // Tableau d'entiers envoyé au contrôleur
        })
      });

      if (res.ok) {
        setToast({ message: "Playlist enregistrée avec succès !", type: "success" });
        setTimeout(() => {
          navigate("my-playlists"); // Redirection automatique vers tes playlists
        }, 1000);
      } else {
        setToast({ message: "Erreur serveur lors de la création de la playlist", type: "error" });
        setSaving(false);
      }
    } catch (err) {
      setToast({ message: "Impossible de joindre le serveur", type: "error" });
      setSaving(false);
    }
  };

  const handlePlayPreview = () => {
    if (!generated || generated.tracks.length === 0) return;
    play(generated.tracks, 0);
  };

  if (loadingMp3s) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Préparation du générateur intelligent...</div>;
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1000, margin: "0 auto" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text-primary)", marginBottom: 6 }}>
          Générateur Intelligent de Playlist
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Définissez vos critères et laissez l'algorithme assembler une sélection sur mesure depuis votre base de données.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, alignItems: "flex-start" }}>
        
        {/* Panneau de configuration des filtres */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--violet-light)", marginBottom: 4 }}>Configuration</h2>

          <Field label="Nom de la playlist">
            <input placeholder="Ex: Ma Sélection Rock / Mix Été" value={playlistName} onChange={e => setPlaylistName(e.target.value)} />
          </Field>

          <Field label="Description (optionnelle)">
            <textarea placeholder="Brève description de l'ambiance..." rows={2} value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, resize: "none", fontFamily: "inherit" }} />
          </Field>

          <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

          <Field label="Genre musical">
            <select value={criteria.genre} onChange={e => setCriteria({ ...criteria, genre: e.target.value })} style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="">Tous les genres ({genres.length})</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>

          <Field label="Artiste">
            <select value={criteria.artist} onChange={e => setCriteria({ ...criteria, artist: e.target.value })} style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="">Tous les artistes ({artists.length})</option>
              {artists.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>

          <Field label="Album">
            <select value={criteria.album} onChange={e => setCriteria({ ...criteria, album: e.target.value })} style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="">Tous les albums ({albums.length})</option>
              {albums.map(al => <option key={al} value={al}>{al}</option>)}
            </select>
          </Field>

          <Field label="Année de sortie">
            <select value={criteria.year} onChange={e => setCriteria({ ...criteria, year: e.target.value })} style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="">Toutes les années ({years.length})</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>

          <Field label="Nombre maximal de pistes">
            <input type="number" min="1" max="100" value={criteria.maxTracks} onChange={e => setCriteria({ ...criteria, maxTracks: e.target.value })} />
          </Field>

          <Btn variant="secondary" onClick={handleGenerate} disabled={generating} style={{ marginTop: 8 }} icon={generating ? <Spinner size={14} /> : null}>
            {generating ? "Calcul en cours…" : "Générer la sélection"}
          </Btn>
        </div>

        {/* Panneau de prévisualisation de la liste générée */}
        <div style={{ flex: 1 }}>
          {!generated ? (
            <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", padding: 24, textAlign: "center" }}>
              <span style={{ fontSize: 32, marginBottom: 12 }}>⚡</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Aucune sélection générée</p>
              <p style={{ fontSize: 12, maxWidth: 300 }}>Ajustez vos filtres à gauche puis cliquez sur "Générer" pour visualiser le résultat.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Header Récapitulatif */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <WaveformBars count={6} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{generated.tracks.length} titres trouvés</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Durée estimée : {formatDuration(generated.totalDuration)}</p>
                </div>
                <div style={{ flex: 1 }} />
                <Btn variant="secondary" onClick={handlePlayPreview} disabled={generated.tracks.length === 0}>Écouter l'aperçu</Btn>
                <Btn variant="primary" onClick={handleSave} disabled={!playlistName.trim() || generated.tracks.length === 0 || saving} icon={saving ? <Spinner size={14} color="white" /> : null}>
                  {saving ? "Enregistrement…" : "Enregistrer la Playlist"}
                </Btn>
              </div>

              {/* Liste des morceaux générés */}
              {generated.tracks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                  Aucune piste ne correspond à ces critères dans votre base de données.
                </div>
              ) : (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex" }}>
                    {["#", "Titre", "Genre", "Durée", ""].map((h, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
                        flex: i === 1 ? 1 : i === 0 ? "0 0 24px" : i === 4 ? "0 0 24px" : "0 0 80px",
                        textAlign: i === 3 ? "right" : "left"
                      }}>{h}</span>
                    ))}
                  </div>
                  {generated.tracks.map((t, i) => (
                    <GeneratedTrackRow key={t.id || i} track={t} idx={i} onRemove={handleRemoveTrack} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}