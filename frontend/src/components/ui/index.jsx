import { useEffect, useRef } from "react";

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, variant = "primary", size = "md", onClick, disabled, style = {}, icon }) {
  const variants = {
    primary:  { background:"var(--violet)", color:"white" },
    secondary:{ background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)" },
    ghost:    { background:"transparent", color:"var(--text-secondary)", border:"1px solid transparent" },
    danger:   { background:"var(--red-dim)", color:"var(--red)", border:"1px solid rgba(239,68,68,0.2)" },
    success:  { background:"var(--green-dim)", color:"var(--green)", border:"1px solid rgba(16,185,129,0.2)" },
    amber:    { background:"var(--amber-dim)", color:"var(--amber)", border:"1px solid rgba(245,158,11,0.2)" },
  };
  const sizes = {
    sm: { padding:"6px 12px", fontSize:12, borderRadius:"var(--radius-sm)", gap:6 },
    md: { padding:"9px 18px", fontSize:13, borderRadius:"var(--radius-md)", gap:8 },
    lg: { padding:"12px 24px", fontSize:15, borderRadius:"var(--radius-md)", gap:10 },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        ...variants[variant], ...sizes[size], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
    >
      {icon && icon}{children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "violet" }) {
  const colors = {
    violet: { background:"var(--violet-dim)", color:"var(--violet-light)" },
    green:  { background:"var(--green-dim)",  color:"var(--green)" },
    amber:  { background:"var(--amber-dim)",  color:"var(--amber)" },
    muted:  { background:"rgba(255,255,255,0.06)", color:"var(--text-muted)" },
  };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99,
      fontSize:11, fontWeight:600, letterSpacing:"0.02em", ...colors[color] }}>
      {children}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = "var(--violet)" }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,0.1)`,
      borderTop:`2px solid ${color}`, borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(6px)", animation:"fadeIn 0.15s ease" }}>
      <div ref={ref} style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
        borderRadius:"var(--radius-xl)", width, maxHeight:"85vh", overflowY:"auto",
        boxShadow:"0 24px 80px rgba(0,0,0,0.5)", animation:"fadeIn 0.2s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px", borderBottom:"1px solid var(--border)" }}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", color:"var(--text-muted)", fontSize:20, lineHeight:1 }}
            onMouseEnter={e=>e.currentTarget.style.color="var(--text-primary)"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>×</button>
        </div>
        <div style={{ padding:"24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle, action }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"64px 32px", gap:16, textAlign:"center" }}>
      <div style={{ fontSize:40, opacity:0.3 }}>{icon}</div>
      <div>
        <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:600, color:"var(--text-secondary)", marginBottom:6 }}>{title}</p>
        {subtitle && <p style={{ fontSize:13, color:"var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
      borderRadius:"var(--radius-lg)", padding:20, ...style,
      cursor: onClick ? "pointer" : "default", transition:"all var(--transition)" }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform="none"; }}}
    >
      {children}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function Field({ label, required, children, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)", display:"flex", gap:4 }}>
        {label}{required && <span style={{ color:"var(--violet-light)" }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize:11, color:"var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const colors = { success:"var(--green)", error:"var(--red)", info:"var(--violet)" };
  return (
    <div style={{ position:"fixed", bottom:100, right:24, zIndex:1000,
      background:"var(--bg-card)", border:`1px solid ${colors[type]}40`,
      borderLeft:`3px solid ${colors[type]}`, borderRadius:"var(--radius-md)",
      padding:"12px 20px", color:"var(--text-primary)", fontSize:13, fontWeight:500,
      boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideIn 0.2s ease",
      display:"flex", alignItems:"center", gap:12, maxWidth:320 }}>
      <span style={{ color:colors[type] }}>
        {type==="success"?"✓" : type==="error"?"✕" : "ℹ"}
      </span>
      {message}
      <button onClick={onClose} style={{ background:"none", color:"var(--text-muted)", marginLeft:"auto", fontSize:16 }}>×</button>
    </div>
  );
}
