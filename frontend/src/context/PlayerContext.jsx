import { createContext, useContext, useRef, useState, useCallback } from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const current = queue[currentIdx] || null;

  const play = useCallback((tracks, startIdx = 0) => {
    const a = audioRef.current;
    setQueue(tracks);
    setCurrentIdx(startIdx);

    // CORRECTION : Utilisation de l'URL réelle de notre API Spring Boot
    const trackId = tracks[startIdx]?.id;
    if (trackId) {
      a.src = `http://localhost:8080/api/mp3s/download/${trackId}`;
      a.volume = volume;

      // Sécurité : Forcer le chargement du nouveau flux audio binaire
      a.load();

      a.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Erreur de lecture binaire:", err));
    }

    a.ontimeupdate = () => setProgress(a.currentTime);
    a.ondurationchange = () => setDuration(a.duration);

    // Gestion de la transition automatique à la fin du morceau
    a.onended = () => {
      if (startIdx < tracks.length - 1) {
        const next = startIdx + 1;
        setCurrentIdx(next);
        const nextId = tracks[next]?.id;
        if (nextId) {
          a.src = `http://localhost:8080/api/mp3s/download/${nextId}`;
          a.load();
          a.play().catch(() => { });
        }
      } else {
        setIsPlaying(false);
      }
    };
  }, [volume]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      if (a.src) {
        a.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error(err));
      }
    }
  }, [isPlaying]);

  const seek = useCallback((t) => {
    if (audioRef.current.src) {
      audioRef.current.currentTime = t;
      setProgress(t);
    }
  }, []);

  const changeVolume = useCallback((v) => {
    audioRef.current.volume = v;
    setVolume(v);
  }, []);

  const playNext = useCallback(() => {
    if (currentIdx < queue.length - 1) {
      play(queue, currentIdx + 1);
    }
  }, [currentIdx, queue, play]);

  const playPrev = useCallback(() => {
    if (currentIdx > 0) {
      play(queue, currentIdx - 1);
    }
  }, [currentIdx, queue, play]);

  return (
    <PlayerContext.Provider value={{
      queue, currentIdx, current, isPlaying, progress, duration, volume,
      play, togglePlay, seek, changeVolume, playNext, playPrev
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);