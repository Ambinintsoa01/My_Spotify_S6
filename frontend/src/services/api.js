const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function request(method, path, body, isFormData = false) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";

  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

// ── MP3 Files ─────────────────────────────────────────────────────────────────

export const mp3Api = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/mp3?${q}`);
  },
  getById: (id) => request("GET", `/mp3/${id}`),
  upload: (formData) => request("POST", "/mp3/upload", formData, true),
  update: (id, data) => request("PUT", `/mp3/${id}`, data),
  delete: (id) => request("DELETE", `/mp3/${id}`),
  getMetadata: (id) => request("GET", `/mp3/${id}/metadata`),
  stream: (id) => `${BASE}/mp3/${id}/stream`,
  download: (id) => `${BASE}/mp3/${id}/download`,
};

// ── Playlists ─────────────────────────────────────────────────────────────────

export const playlistApi = {
  generate: (criteria) => request("POST", "/playlists/generate", criteria),
  list: () => request("GET", "/playlists/mine"),
  getById: (id) => request("GET", `/playlists/${id}`),
  save: (playlist) => request("POST", "/playlists", playlist),
  delete: (id) => request("DELETE", `/playlists/${id}`),
  addTrack: (id, mp3Id) => request("POST", `/playlists/${id}/tracks`, { mp3Id }),
  removeTrack: (id, mp3Id) => request("DELETE", `/playlists/${id}/tracks/${mp3Id}`),
  reorder: (id, orderedIds) => request("PUT", `/playlists/${id}/order`, { trackIds: orderedIds }),
  downloadZip: (id) => `${BASE}/playlists/${id}/download`,
};

// ── Metadata options (for filters) ───────────────────────────────────────────

export const metaApi = {
  genres: () => request("GET", "/metadata/genres"),
  artists: () => request("GET", "/metadata/artists"),
  albums: () => request("GET", "/metadata/albums"),
  years: () => request("GET", "/metadata/years"),
};
