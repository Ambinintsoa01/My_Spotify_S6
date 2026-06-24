import { createRoot } from "react-dom/client";
import App from "./App";

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base:       #0B0B10;
    --bg-surface:    #12121A;
    --bg-elevated:   #1A1A27;
    --bg-card:       #1E1E2E;
    --bg-hover:      #252535;
    --border:        rgba(255,255,255,0.06);
    --border-active: rgba(124,58,237,0.5);

    --violet:        #7C3AED;
    --violet-light:  #A78BFA;
    --violet-dim:    rgba(124,58,237,0.15);
    --violet-glow:   rgba(124,58,237,0.3);
    --green:         #10B981;
    --green-dim:     rgba(16,185,129,0.15);
    --amber:         #F59E0B;
    --amber-dim:     rgba(245,158,11,0.15);
    --red:           #EF4444;
    --red-dim:       rgba(239,68,68,0.12);

    --text-primary:  #F1F5F9;
    --text-secondary:#94A3B8;
    --text-muted:    #4A5568;

    --radius-sm:  6px;
    --radius-md:  10px;
    --radius-lg:  16px;
    --radius-xl:  24px;

    --transition: 0.18s cubic-bezier(0.4,0,0.2,1);
  }

  html, body, #root { height: 100%; }
  body { background: var(--bg-base); overflow: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--violet); }

  input, select, textarea {
    font-family: 'Inter', sans-serif;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-size: 14px;
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
    width: 100%;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--violet);
    box-shadow: 0 0 0 3px var(--violet-glow);
  }
  select option { background: var(--bg-card); }

  button { cursor: pointer; font-family: 'Inter', sans-serif; border: none; outline: none; transition: all var(--transition); }

  .page-content { padding: 32px 36px; max-width: 1200px; }

  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes waveBar {
    0%,100%{height:4px} 50%{height:18px}
  }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(<App />);
