import { createContext, useContext, useRef, useState, useCallback } from "react";
import { mp3Api } from "../services/api";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [queue, setQueue]           = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(0.8);

  const current = queue[currentIdx] || null;

  const play = useCallback((tracks, startIdx = 0) => {
    const a = audioRef.current;
    setQueue(tracks);
    setCurrentIdx(startIdx);
    a.src = mp3Api.stream(tracks[startIdx].id);
    a.volume = volume;
    a.play().then(() => setIsPlaying(true)).catch(() => {});

    a.ontimeupdate = () => setProgress(a.currentTime);
    a.ondurationchange = () => setDuration(a.duration);
    a.onended = () => {
      if (startIdx < tracks.length - 1) {
        const next = startIdx + 1;
        setCurrentIdx(next);
        a.src = mp3Api.stream(tracks[next].id);
        a.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };
  }, [volume]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else           { a.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [isPlaying]);

  const seek = useCallback((t) => {
    audioRef.current.currentTime = t;
    setProgress(t);
  }, []);

  const changeVolume = useCallback((v) => {
    audioRef.current.volume = v;
    setVolume(v);
  }, []);

  const playNext = useCallback(() => {
    if (currentIdx < queue.length - 1) play(queue, currentIdx + 1);
  }, [currentIdx, queue, play]);

  const playPrev = useCallback(() => {
    if (currentIdx > 0) play(queue, currentIdx - 1);
  }, [currentIdx, queue, play]);

  return (
    <PlayerContext.Provider value={{ current, queue, currentIdx, isPlaying, progress, duration, volume, play, togglePlay, seek, changeVolume, playNext, playPrev }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
