import { usePlayer } from "../../context/PlayerContext";
import { formatDuration } from "../../hooks/useMockData";

function WaveformBars({ isPlaying }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:2.5, height:18 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:3, background:"var(--violet-light)", borderRadius:2,
          animation: isPlaying ? `waveBar ${0.4+i*0.12}s ${i*0.08}s ease-in-out infinite alternate` : "none",
          height: isPlaying ? undefined : 3,
        }} />
      ))}
    </div>
  );
}

function VolumeIcon({ v }) {
  if (v === 0) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
  if (v < 0.5) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
}

export default function MiniPlayer() {
  const { current, isPlaying, progress, duration, volume, togglePlay, seek, changeVolume, playNext, playPrev, queue, currentIdx } = usePlayer();

  if (!current) return null;

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div style={{
      height:76, flexShrink:0,
      background:"var(--bg-surface)",
      borderTop:"1px solid var(--border)",
      display:"flex", alignItems:"center",
      padding:"0 24px", gap:24,
      position:"relative", zIndex:10,
    }}>

      {/* Progress bar (absolute top) */}
      <div
        style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"var(--bg-hover)", cursor:"pointer" }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * duration);
        }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,var(--violet),var(--violet-light))", borderRadius:2, transition:"width 0.5s linear" }} />
      </div>

      {/* Track info */}
      <div style={{ display:"flex", alignItems:"center", gap:12, width:260, flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:"var(--radius-sm)", background:"linear-gradient(135deg,var(--violet),#A78BFA44)",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <WaveformBars isPlaying={isPlaying} />
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {current.tagTitle || current.fileName}
          </p>
          <p style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {current.tagArtist || "Artiste inconnu"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>

          {/* Prev */}
          <button onClick={playPrev} disabled={currentIdx===0}
            style={{ background:"none", border:"none", color: currentIdx===0?"var(--text-muted)":"var(--text-secondary)", cursor: currentIdx===0?"default":"pointer" }}
            onMouseEnter={e=>{ if(currentIdx>0) e.currentTarget.style.color="var(--text-primary)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.color = currentIdx===0?"var(--text-muted)":"var(--text-secondary)"; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></svg>
          </button>

          {/* Play/Pause */}
          <button onClick={togglePlay}
            style={{ width:40, height:40, borderRadius:"50%", background:"var(--violet)", border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px var(--violet-glow)" }}
            onMouseEnter={e=>e.currentTarget.style.background="#6d28d9"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--violet)"}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none" style={{marginLeft:2}}><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>

          {/* Next */}
          <button onClick={playNext} disabled={currentIdx===queue.length-1}
            style={{ background:"none", border:"none", color: currentIdx===queue.length-1?"var(--text-muted)":"var(--text-secondary)", cursor: currentIdx===queue.length-1?"default":"pointer" }}
            onMouseEnter={e=>{ if(currentIdx<queue.length-1) e.currentTarget.style.color="var(--text-primary)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.color = currentIdx===queue.length-1?"var(--text-muted)":"var(--text-secondary)"; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        </div>

        {/* Time */}
        <div style={{ display:"flex", gap:6, alignItems:"center", fontSize:11, color:"var(--text-muted)", fontFamily:"monospace" }}>
          <span>{formatDuration(progress)}</span>
          <span style={{ color:"var(--bg-hover)" }}>·</span>
          <span>{formatDuration(duration)}</span>
          {queue.length > 1 && <span style={{ marginLeft:4, color:"var(--text-muted)" }}>({currentIdx+1}/{queue.length})</span>}
        </div>
      </div>

      {/* Volume */}
      <div style={{ display:"flex", alignItems:"center", gap:10, width:160, flexShrink:0, justifyContent:"flex-end" }}>
        <button onClick={()=>changeVolume(volume===0?0.8:0)}
          style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.color="var(--text-primary)"}
          onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>
          <VolumeIcon v={volume} />
        </button>
        <input type="range" min="0" max="1" step="0.01" value={volume}
          onChange={e=>changeVolume(parseFloat(e.target.value))}
          style={{ width:90, accentColor:"var(--violet)", cursor:"pointer" }} />
      </div>
    </div>
  );
}
