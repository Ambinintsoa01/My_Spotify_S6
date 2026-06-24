import { useState } from "react";
import { Btn, Field, Spinner, Badge, Toast } from "../components/ui";
import { MOCK_MP3S, formatDuration, formatSize } from "../hooks/useMockData";
import { usePlayer } from "../context/PlayerContext";

const GENRES  = [...new Set(MOCK_MP3S.map(m=>m.tagGenre).filter(Boolean))];
const ARTISTS = [...new Set(MOCK_MP3S.map(m=>m.tagArtist).filter(Boolean))];
const YEARS   = [...new Set(MOCK_MP3S.map(m=>m.tagYear).filter(Boolean))].sort((a,b)=>b-a);
const ALBUMS  = [...new Set(MOCK_MP3S.map(m=>m.tagAlbum).filter(Boolean))];

function WaveformBars({ count = 5 }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:20 }}>
      {Array.from({length:count}).map((_,i)=>(
        <div key={i} style={{
          width:3, borderRadius:2, background:"var(--violet)",
          animation:`waveBar ${0.5+i*0.1}s ${i*0.12}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  );
}

function GeneratedTrackRow({ track, idx, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
        borderBottom:"1px solid var(--border)", background: hov?"var(--bg-hover)":"transparent",
        transition:"background var(--transition)" }}>
      <span style={{ width:24, fontSize:12, color:"var(--text-muted)", textAlign:"center" }}>{idx+1}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{track.tagTitle||track.fileName}</p>
        <p style={{ fontSize:11, color:"var(--text-muted)" }}>{track.tagArtist} {track.tagAlbum?`· ${track.tagAlbum}`:""}</p>
      </div>
      {track.tagGenre && <Badge color="muted">{track.tagGenre}</Badge>}
      <span style={{ fontSize:12, color:"var(--text-secondary)", fontFamily:"monospace", flexShrink:0 }}>{formatDuration(track.audioDurationSecs)}</span>
      <button onClick={()=>onRemove(track.id)} title="Retirer"
        style={{ background:"none", color: hov?"var(--red)":"transparent", fontSize:16, flexShrink:0, transition:"color var(--transition)" }}>×</button>
    </div>
  );
}

export default function CreatePlaylist({ navigate }) {
  const { play } = usePlayer();

  const [form, setForm] = useState({ duration:"", genre:"", artist:"", album:"", year:"", minBitrate:"", maxDuration:"" });
  const [loading, setLoading]       = useState(false);
  const [generated, setGenerated]   = useState(null);
  const [playlistName, setPlaylistName] = useState("");
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleGenerate = async () => {
    if (!form.duration) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,1400));

    const targetSecs = parseInt(form.duration)*60;
    let pool = [...MOCK_MP3S];
    if (form.genre)   pool = pool.filter(m=>m.tagGenre===form.genre);
    if (form.artist)  pool = pool.filter(m=>m.tagArtist===form.artist);
    if (form.album)   pool = pool.filter(m=>m.tagAlbum===form.album);
    if (form.year)    pool = pool.filter(m=>m.tagYear===form.year);
    if (form.minBitrate) pool = pool.filter(m=>m.audioBitrate>=parseInt(form.minBitrate));
    pool = pool.sort(()=>Math.random()-0.5);

    const selected = [];
    let total = 0;
    for (const track of pool) {
      if (total + track.audioDurationSecs <= targetSecs + 60) {
        selected.push(track);
        total += track.audioDurationSecs;
      }
      if (total >= targetSecs - 30) break;
    }

    setGenerated({ tracks: selected, totalSecs: total, targetSecs });
    setPlaylistName(`Playlist ${new Date().toLocaleDateString("fr")}`);
    setLoading(false);
  };

  const handleRemoveTrack = (id) => {
    setGenerated(p => {
      const tracks = p.tracks.filter(t=>t.id!==id);
      return { ...p, tracks, totalSecs: tracks.reduce((a,t)=>a+t.audioDurationSecs,0) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,900));
    setSaving(false);
    setToast({ message:"Playlist enregistrée !", type:"success" });
    setTimeout(()=>navigate("my-playlists"), 800);
  };

  const handleDownload = () => {
    setToast({ message:"Téléchargement du ZIP en cours…", type:"info" });
  };

  const margin = generated ? Math.abs(generated.totalSecs - generated.targetSecs) : 0;
  const marginPct = generated ? Math.round((margin / generated.targetSecs)*100) : 0;

  return (
    <div style={{ padding:"32px 36px", animation:"fadeIn 0.2s ease" }}>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      <div style={{ display:"flex", gap:32, alignItems:"flex-start" }}>

        {/* ── Left: Form ─────────────────────────────────────────────────── */}
        <div style={{ width:340, flexShrink:0 }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:24 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Critères de génération</h2>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Field label="Durée cible" required hint="Durée approximative souhaitée en minutes">
                <input type="number" min="1" max="480" placeholder="ex: 60" value={form.duration} onChange={e=>set("duration",e.target.value)} />
              </Field>

              <Field label="Genre musical">
                <select value={form.genre} onChange={e=>set("genre",e.target.value)}>
                  <option value="">Tous les genres</option>
                  {GENRES.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              <Field label="Artiste">
                <select value={form.artist} onChange={e=>set("artist",e.target.value)}>
                  <option value="">Tous les artistes</option>
                  {ARTISTS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </Field>

              <Field label="Album">
                <select value={form.album} onChange={e=>set("album",e.target.value)}>
                  <option value="">Tous les albums</option>
                  {ALBUMS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </Field>

              <Field label="Année">
                <select value={form.year} onChange={e=>set("year",e.target.value)}>
                  <option value="">Toutes les années</option>
                  {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </Field>

              <Field label="Bitrate minimum (kbps)">
                <select value={form.minBitrate} onChange={e=>set("minBitrate",e.target.value)}>
                  <option value="">Pas de minimum</option>
                  <option value="128">128 kbps</option>
                  <option value="192">192 kbps</option>
                  <option value="256">256 kbps</option>
                  <option value="320">320 kbps</option>
                </select>
              </Field>

              <Btn variant="primary" size="lg" style={{ width:"100%", marginTop:4 }}
                onClick={handleGenerate} disabled={!form.duration||loading}
                icon={loading ? <Spinner size={16} color="white" /> : null}>
                {loading ? "Génération en cours…" : "Générer la playlist"}
              </Btn>
            </div>
          </div>

          {/* Tips */}
          <div style={{ marginTop:16, padding:"14px 16px", background:"var(--violet-dim)", border:"1px solid var(--border-active)", borderRadius:"var(--radius-md)" }}>
            <p style={{ fontSize:12, color:"var(--violet-light)", fontWeight:500, marginBottom:6 }}>💡 Astuce</p>
            <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.6 }}>
              L'algorithme remplit la durée cible avec une marge maximale de ±60 secondes pour éviter de tronquer une piste.
            </p>
          </div>
        </div>

        {/* ── Right: Result ───────────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:0 }}>
          {!generated && !loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              height:400, gap:20, textAlign:"center" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🎧</div>
              <div>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:600, color:"var(--text-secondary)" }}>Playlist vide</p>
                <p style={{ fontSize:13, color:"var(--text-muted)", marginTop:4 }}>Renseignez les critères et cliquez sur Générer</p>
              </div>
            </div>
          )}

          {generated && (
            <div style={{ animation:"fadeIn 0.25s ease" }}>
              {/* Header result */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
                    <WaveformBars />
                    <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:"var(--text-primary)" }}>
                      Playlist générée
                    </h2>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <Badge color={marginPct<=5?"green":"amber"}>
                      {formatDuration(generated.totalSecs)} / {form.duration} min
                    </Badge>
                    <Badge color="muted">{generated.tracks.length} pistes</Badge>
                    {marginPct<=5
                      ? <Badge color="green">✓ Marge {margin}s</Badge>
                      : <Badge color="amber">Δ {margin}s ({marginPct}%)</Badge>}
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <Btn variant="success" onClick={()=>play(generated.tracks,0)}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--green)" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>}>
                    Écouter
                  </Btn>
                  <Btn variant="amber" onClick={handleDownload}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                    Télécharger .zip
                  </Btn>
                </div>
              </div>

              {/* Name + Save */}
              <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                <input value={playlistName} onChange={e=>setPlaylistName(e.target.value)} placeholder="Nom de la playlist…" style={{ flex:1 }} />
                <Btn variant="primary" onClick={handleSave} disabled={!playlistName||saving}
                  icon={saving ? <Spinner size={14} color="white" /> : null}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Btn>
              </div>

              {/* Track list */}
              {generated.tracks.length === 0 ? (
                <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)", fontSize:14 }}>Aucune piste ne correspond aux critères.</div>
              ) : (
                <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)", background:"var(--bg-elevated)", display:"flex" }}>
                    {["#","Titre","Genre","Durée",""].map((h,i)=>(
                      <span key={i} style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em",
                        flex:i===1?1:i===0?"0 0 24px":i===4?"0 0 24px":"0 0 80px" }}>{h}</span>
                    ))}
                  </div>
                  {generated.tracks.map((t,i)=>(
                    <GeneratedTrackRow key={t.id} track={t} idx={i} onRemove={handleRemoveTrack} />
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
